import VylaSDK from '@vyla-entertainment/sdk';
import { formatSubtitleFullLabel } from '../src/utils/languages.ts';

export interface VylaStreamResult {
  ok: boolean;
  server: string;
  masterUrl: string;
  proxiedUrl: string;
  allStreams?: Array<{
    url: string;
    label: string;
    quality: string;
    type: string;
    proxiedUrl: string;
  }>;
  subtitles?: Array<{ language: string; label: string; url: string }>;
  audioTracks?: Array<{ language: string; label: string }>;
  error?: string;
}

let _vylaInstance: any = null;

export function getVylaInstance() {
  if (!_vylaInstance) {
    const key = process.env.TMDB_API_KEY || '4e44d9029b1270a757cddc766a1bcb63';
    _vylaInstance = new (VylaSDK as any)({ tmdbApiKey: key });
  }
  return _vylaInstance;
}

const STREAM_CACHE = new Map<string, { data: VylaStreamResult; expires: number }>();
const SUBTITLES_CACHE = new Map<string, { data: any[]; expires: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 mins

// Supported Vyla HLS stream providers
export const VYLA_HLS_PROVIDERS = [
  { id: 'rivestream', name: 'RiveStream (Direct HLS - 4K/1080p)' },
  { id: 'movy', name: 'Movy CDN (Direct HLS - 4K/1080p)' },
  { id: 'cinesrc', name: 'CineSrc (Direct Master HLS)' },
  { id: 'vidrock', name: 'VidRock (Edge CDN HLS)' },
  { id: 'vidzee', name: 'VidZee (Fast Cloud HLS)' },
  { id: 'vidfast', name: 'VidFast (vRapid HLS)' },
  { id: 'vidup', name: 'VidUp (Multi-Worker VM HLS)' },
  { id: 'hexa', name: 'Hexa (High Speed HLS)' },
] as const;

export async function resolveVylaHls(
  tmdbId: number,
  type: 'movie' | 'tv' = 'movie',
  season: number = 1,
  episode: number = 1,
  requestedServer: string = 'default'
): Promise<VylaStreamResult> {
  const cacheKey = `${requestedServer}:${type}:${tmdbId}:${season}:${episode}`;
  const cached = STREAM_CACHE.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  // Normalize requested server key
  const norm = requestedServer.toLowerCase().replace(/[^a-z0-9]/g, '');
  let primaryKey = 'rivestream';

  if (norm.includes('movy')) primaryKey = 'movy';
  else if (norm.includes('cinesrc')) primaryKey = 'cinesrc';
  else if (norm.includes('vidrock')) primaryKey = 'vidrock';
  else if (norm.includes('vidzee')) primaryKey = 'vidzee';
  else if (norm.includes('vidfast')) primaryKey = 'vidfast';
  else if (norm.includes('vidup')) primaryKey = 'vidup';
  else if (norm.includes('hexa')) primaryKey = 'hexa';
  else if (norm.includes('rive')) primaryKey = 'rivestream';

  // Provider cascade: start with requested provider, then try fallbacks
  const fallbackList = ['rivestream', 'movy', 'cinesrc', 'vidrock', 'vidzee', 'vidfast', 'vidup', 'hexa'];
  const providerCandidates = [
    primaryKey,
    ...fallbackList.filter((k) => k !== primaryKey),
  ];

  const s = type === 'tv' ? season : null;
  const e = type === 'tv' ? episode : null;

  // 1. Fetch subtitles in background
  const subKey = `${type}:${tmdbId}:${season}:${episode}`;
  let rawSubs: any[] = [];
  const cachedSubs = SUBTITLES_CACHE.get(subKey);

  if (cachedSubs && cachedSubs.expires > Date.now()) {
    rawSubs = cachedSubs.data;
  } else {
    try {
      rawSubs = await getVylaInstance().getSubtitles(tmdbId, s, e).catch(() => []);
      SUBTITLES_CACHE.set(subKey, { data: rawSubs, expires: Date.now() + CACHE_TTL });
    } catch {
      rawSubs = [];
    }
  }

  const subtitles: Array<{ language: string; label: string; url: string }> = (
    rawSubs || []
  )
    .filter((sub) => sub?.file)
    .slice(0, 50)
    .map((sub, idx) => {
      const rawLabel = sub.label || `Subtitle ${idx + 1}`;
      const rawLang = sub.language || rawLabel.toLowerCase().slice(0, 3);
      const formatted = formatSubtitleFullLabel(rawLabel, rawLang);
      return {
        language: formatted.langCode || 'en',
        label: formatted.fullTitle,
        url: `/api/hls?url=${encodeURIComponent(sub.file)}`,
      };
    });

  // 2. Fetch stream from provider cascade
  for (const providerKey of providerCandidates) {
    try {
      const streamRes = await Promise.race([
        getVylaInstance().getStream(providerKey, tmdbId, s, e),
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('Provider timeout')), 7000)
        ),
      ]);

      if (!streamRes) continue;

      let rawUrls: any[] = [];
      if (Array.isArray(streamRes)) {
        rawUrls = streamRes;
      } else if (streamRes && typeof streamRes === 'object') {
        if (Array.isArray((streamRes as any).allUrls)) rawUrls = (streamRes as any).allUrls;
        else if (Array.isArray((streamRes as any).streams)) rawUrls = (streamRes as any).streams;
        else if (Array.isArray((streamRes as any).sources)) rawUrls = (streamRes as any).sources;
        else if ((streamRes as any).url) rawUrls = [streamRes];
      }

      if (rawUrls.length === 0) continue;

      // Filter and map direct playable streams
      const validStreams = rawUrls
        .map((item: any) => {
          const streamUrl = (item?.url || item?.file || item?.stream) as string;
          if (!streamUrl) return null;
          const label = item.label || item.server || item.name || item.quality || 'Auto';
          const quality = item.quality || label;
          const proxiedUrl = `/api/hls?url=${encodeURIComponent(streamUrl)}`;

          return {
            url: streamUrl,
            label,
            quality,
            type: (item.type as string) || (streamUrl.includes('.m3u8') ? 'hls' : 'mp4'),
            proxiedUrl,
          };
        })
        .filter(Boolean) as Array<{
          url: string;
          label: string;
          quality: string;
          type: string;
          proxiedUrl: string;
        }>;

      if (validStreams.length === 0) continue;

      // Pick best stream (prefer 1080p or first stream)
      const primaryStream =
        validStreams.find((s: any) => s.quality?.includes('1080') || s.label?.includes('1080')) ||
        validStreams[0];

      const matchedProviderConfig = VYLA_HLS_PROVIDERS.find((p) => p.id === providerKey);
      const serverLabel = matchedProviderConfig ? matchedProviderConfig.name : `HLS (${providerKey})`;

      const result: VylaStreamResult = {
        ok: true,
        server: serverLabel,
        masterUrl: primaryStream.url,
        proxiedUrl: primaryStream.proxiedUrl,
        allStreams: validStreams,
        subtitles,
        audioTracks: [],
      };

      STREAM_CACHE.set(cacheKey, { data: result, expires: Date.now() + CACHE_TTL });
      return result;
    } catch (err: any) {
      console.warn(`[vylaSolver] Provider ${providerKey} notice for ${cacheKey}:`, err?.message);
    }
  }

  return {
    ok: false,
    server: requestedServer,
    masterUrl: '',
    proxiedUrl: '',
    error: 'No active direct HLS streams found from providers',
  };
}

export async function getVylaSubtitles(
  tmdbId: number,
  type: 'movie' | 'tv' = 'movie',
  season?: number,
  episode?: number
) {
  const s = type === 'tv' ? season || 1 : null;
  const e = type === 'tv' ? episode || 1 : null;
  const subKey = `${type}:${tmdbId}:${s}:${e}`;

  const cached = SUBTITLES_CACHE.get(subKey);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  try {
    const rawSubs = await Promise.race([
      getVylaInstance().getSubtitles(tmdbId, s, e),
      new Promise<any[]>((_, reject) =>
        setTimeout(() => reject(new Error('Subtitles timeout')), 8000)
      ),
    ]).catch(() => []);

    const mapped = (rawSubs || [])
      .filter((sub: any) => sub?.file)
      .slice(0, 100)
      .map((sub: any, idx: number) => {
        const rawLabel = sub.label || `Subtitle ${idx + 1}`;
        const rawLang = sub.language || rawLabel.toLowerCase().slice(0, 3);
        const formatted = formatSubtitleFullLabel(rawLabel, rawLang);
        return {
          id: `vyla-sub-${idx}`,
          language: formatted.langCode || 'en',
          label: formatted.fullTitle,
          type: sub.type || 'vtt',
          source: sub.source || 'vyla',
          url: `/api/hls?url=${encodeURIComponent(sub.file)}`,
          originalUrl: sub.file,
        };
      });

    SUBTITLES_CACHE.set(subKey, { data: mapped, expires: Date.now() + CACHE_TTL });
    return mapped;
  } catch {
    return [];
  }
}

export async function getVylaDownloads(
  tmdbId: number,
  type: 'movie' | 'tv' = 'movie',
  season?: number,
  episode?: number
) {
  const s = type === 'tv' ? season || 1 : null;
  const e = type === 'tv' ? episode || 1 : null;

  try {
    const rawDownloads = await Promise.race([
      getVylaInstance().getDownloads(tmdbId, s, e),
      new Promise<any[]>((_, reject) =>
        setTimeout(() => reject(new Error('Downloads timeout')), 8000)
      ),
    ]).catch(() => []);

    return (rawDownloads || [])
      .filter((dl: any) => dl?.url)
      .map((dl: any, idx: number) => ({
        id: `dl-${idx}`,
        source: dl.source || dl.server || 'Vyla Edge',
        label: dl.label || `${dl.quality || '1080p'} Direct Download`,
        quality: dl.quality || '1080p',
        size: dl.size || null,
        url: dl.url,
      }));
  } catch {
    return [];
  }
}

export function getVylaSourcesList() {
  try {
    const sources = getVylaInstance().getSources(true);
    return sources.map((s: any) => ({
      id: s.key,
      name: s.label,
      timeout: s.timeout,
      multiUrl: s.multiUrl,
      skipProxy: Boolean(s.skipProxy),
    }));
  } catch {
    return [];
  }
}

export async function probeVylaHealth() {
  try {
    return await getVylaInstance().probeAllSources();
  } catch (err: any) {
    return { error: String(err?.message || err) };
  }
}
