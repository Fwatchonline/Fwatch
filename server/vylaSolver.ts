import VylaSDK from '@vyla-entertainment/sdk';

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

const TMDB_API_KEY = process.env.TMDB_API_KEY || '4ff5a77cb540ca70b284e9089228fe00';
const vylaInstance = new VylaSDK({ tmdbApiKey: TMDB_API_KEY });

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
      rawSubs = await vylaInstance.getSubtitles(tmdbId, s, e).catch(() => []);
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
      const label = sub.label || `Subtitle ${idx + 1}`;
      const lang = label.toLowerCase().slice(0, 2);
      return {
        language: lang,
        label,
        url: `/api/hls?url=${encodeURIComponent(sub.file)}`,
      };
    });

  // 2. Fetch stream from provider cascade
  for (const providerKey of providerCandidates) {
    try {
      const streamRes = await Promise.race([
        vylaInstance.getStream(providerKey, tmdbId, s, e),
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
