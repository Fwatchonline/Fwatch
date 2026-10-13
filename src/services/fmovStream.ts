import { StreamResult, SubtitleTrack, StreamQuality } from '../types';
import { formatSubtitleFullLabel } from '../utils/languages';

export interface FmovSubtitleItem {
  id?: string;
  url: string;
  lang?: string;
  label?: string;
}

export interface FmovStreamItem {
  id: string;
  name: string;
  title?: string;
  url: string;
  quality?: string;
  provider: string;
  headers?: Record<string, string>;
  subtitles?: FmovSubtitleItem[];
  format: 'hls' | 'mp4' | 'embed';
}

export interface FmovStreamsResponse {
  success: boolean;
  tmdbId?: string;
  imdbId?: string;
  count: number;
  providerTimings?: Record<string, number>;
  streams: FmovStreamItem[];
  error?: string;
}

export interface FmovProvider {
  name: string;
  enabled: boolean;
}

const DEFAULT_BASE_URL = 'https://api.fmov.my';

export function getFmovApiBaseUrl(): string {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_STREAM_API_BASE_URL) {
    return import.meta.env.VITE_STREAM_API_BASE_URL.replace(/\/+$/, '');
  }
  return DEFAULT_BASE_URL;
}

/**
 * Intelligent format detection for streams returned by providers
 */
export function detectStreamFormat(url: string): 'hls' | 'mp4' | 'embed' {
  if (!url) return 'embed';
  const clean = url.trim().toLowerCase();

  // HLS Manifests
  if (
    clean.includes('.m3u8') ||
    clean.includes('/hls/') ||
    clean.includes('/hls_mps/') ||
    clean.includes('application/x-mpegurl') ||
    clean.includes('vnd.apple.mpegurl')
  ) {
    return 'hls';
  }

  // Direct Video Files
  if (
    clean.endsWith('.mp4') ||
    clean.includes('.mp4?') ||
    clean.endsWith('.webm') ||
    clean.includes('.webm?') ||
    clean.endsWith('.mkv') ||
    clean.includes('.mkv?') ||
    clean.includes('video-downloads.googleusercontent.com')
  ) {
    return 'mp4';
  }

  // Web Embeds and Players
  if (
    clean.includes('.pages.dev') ||
    clean.includes('/embed') ||
    clean.includes('/player') ||
    clean.includes('vidsrc') ||
    clean.includes('streamtape') ||
    clean.includes('dood') ||
    clean.includes('superembed')
  ) {
    return 'embed';
  }

  // Direct storage / drive links
  if (clean.includes('googleusercontent.com') || clean.includes('pixeldrain.dev')) {
    return 'mp4';
  }

  return 'embed';
}

/**
 * Deduplicate identical URLs without removing genuinely different qualities or sources
 */
export function deduplicateStreams(streams: FmovStreamItem[]): FmovStreamItem[] {
  const seen = new Set<string>();
  const result: FmovStreamItem[] = [];

  for (const item of streams) {
    if (!item || !item.url) continue;
    const urlKey = item.url.trim().toLowerCase();
    if (seen.has(urlKey)) {
      continue;
    }
    seen.add(urlKey);
    result.push(item);
  }

  return result;
}

// In-memory cache to prevent duplicate requests on React re-renders
const streamsCache = new Map<string, { data: FmovStreamsResponse; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// In-flight request deduplication map
const inFlightRequests = new Map<string, Promise<FmovStreamsResponse>>();

/**
 * Common fetch helper: attempts direct API call, seamlessly falls back to app proxy on CORS/network errors
 */
async function fetchFmovEndpoint(
  directUrl: string,
  proxyUrl: string,
  signal?: AbortSignal,
  timeoutMs = 18000
): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const effectiveSignal = signal
    ? (AbortSignal as any).any
      ? (AbortSignal as any).any([signal, controller.signal])
      : controller.signal
    : controller.signal;

  try {
    // 1. Try Direct API URL first (e.g. https://api.fmov.my/...)
    try {
      const directRes = await fetch(directUrl, {
        signal: effectiveSignal,
        headers: { Accept: 'application/json' },
      });
      if (directRes.ok) {
        clearTimeout(timeoutId);
        return await directRes.json();
      }
    } catch (directErr: any) {
      if (directErr.name === 'AbortError') {
        throw directErr;
      }
      // Report exact origin if browser blocked request due to CORS
      if (typeof window !== 'undefined') {
        console.warn(
          `[FMOV Stream API] Direct request to ${directUrl} could not be completed from origin "${window.location.origin}" (${directErr.message}). Ensure https://api.fmov.my allowlists this origin. Routing through internal proxy fallback.`
        );
      }
    }

    // 2. Fallback to server-side proxy
    const proxyRes = await fetch(proxyUrl, {
      signal: effectiveSignal,
      headers: { Accept: 'application/json' },
    });

    clearTimeout(timeoutId);

    if (!proxyRes.ok) {
      throw new Error(`FMOV proxy request failed with HTTP ${proxyRes.status}`);
    }

    return await proxyRes.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Health check endpoint: GET https://api.fmov.my/api/health
 */
export async function checkFmovHealth(): Promise<{ ok: boolean; service?: string; time?: string }> {
  const baseUrl = getFmovApiBaseUrl();
  try {
    return await fetchFmovEndpoint(`${baseUrl}/api/health`, '/api/fmov/health', undefined, 6000);
  } catch (err: any) {
    return { ok: false, service: String(err?.message || 'Offline') };
  }
}

/**
 * List available providers: GET https://api.fmov.my/api/providers
 */
export async function getFmovProviders(): Promise<FmovProvider[]> {
  const baseUrl = getFmovApiBaseUrl();
  try {
    const data = await fetchFmovEndpoint(`${baseUrl}/api/providers`, '/api/fmov/providers', undefined, 8000);
    return data.providers || [];
  } catch (err) {
    console.warn('[FMOV Stream API] Failed to fetch providers:', err);
    return [];
  }
}

/**
 * Retrieve movie streams: GET https://api.fmov.my/api/streams/movie/{tmdbId}
 */
export async function getFmovMovieStreams(
  tmdbId: number,
  options?: { signal?: AbortSignal; forceRefresh?: boolean }
): Promise<FmovStreamsResponse> {
  const cacheKey = `movie:${tmdbId}`;

  // Check cache
  if (!options?.forceRefresh) {
    const cached = streamsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  // Check in-flight request
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey)!;
  }

  const baseUrl = getFmovApiBaseUrl();
  const directUrl = `${baseUrl}/api/streams/movie/${tmdbId}`;
  const proxyUrl = `/api/fmov/streams/movie/${tmdbId}`;

  const requestPromise = (async () => {
    try {
      const rawData = await fetchFmovEndpoint(directUrl, proxyUrl, options?.signal);

      const rawStreams: any[] = Array.isArray(rawData.streams) ? rawData.streams : [];
      const parsedStreams: FmovStreamItem[] = rawStreams.map((s, idx) => {
        const format = detectStreamFormat(s.url);
        return {
          id: `fmov-${s.provider || 'stream'}-${idx}-${s.quality || 'auto'}`,
          name: s.name || `${s.provider || 'Stream'} ${s.quality ? `(${s.quality})` : ''}`,
          title: s.title || s.name,
          url: s.url,
          quality: s.quality || (format === 'hls' ? 'Auto' : '1080p'),
          provider: s.provider || 'FMOV Stream',
          headers: s.headers,
          subtitles: Array.isArray(s.subtitles) ? s.subtitles : undefined,
          format,
        };
      });

      const uniqueStreams = deduplicateStreams(parsedStreams);

      const response: FmovStreamsResponse = {
        success: Boolean(rawData.success ?? uniqueStreams.length > 0),
        tmdbId: String(tmdbId),
        imdbId: rawData.imdbId,
        count: uniqueStreams.length,
        providerTimings: rawData.providerTimings,
        streams: uniqueStreams,
      };

      streamsCache.set(cacheKey, { data: response, timestamp: Date.now() });
      return response;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw err;
      }
      return {
        success: false,
        tmdbId: String(tmdbId),
        count: 0,
        streams: [],
        error: String(err?.message || 'Failed to fetch streams from FMOV API'),
      };
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, requestPromise);
  return requestPromise;
}

/**
 * Retrieve TV series streams: GET https://api.fmov.my/api/streams/series/{tmdbId}?season={seasonNumber}&episode={episodeNumber}
 */
export async function getFmovSeriesStreams(
  tmdbId: number,
  season: number,
  episode: number,
  options?: { signal?: AbortSignal; forceRefresh?: boolean }
): Promise<FmovStreamsResponse> {
  const cacheKey = `tv:${tmdbId}:s${season}:e${episode}`;

  // Check cache
  if (!options?.forceRefresh) {
    const cached = streamsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  // Check in-flight request
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey)!;
  }

  const baseUrl = getFmovApiBaseUrl();
  const directUrl = `${baseUrl}/api/streams/series/${tmdbId}?season=${season}&episode=${episode}`;
  const proxyUrl = `/api/fmov/streams/series/${tmdbId}?season=${season}&episode=${episode}`;

  const requestPromise = (async () => {
    try {
      const rawData = await fetchFmovEndpoint(directUrl, proxyUrl, options?.signal);

      const rawStreams: any[] = Array.isArray(rawData.streams) ? rawData.streams : [];
      const parsedStreams: FmovStreamItem[] = rawStreams.map((s, idx) => {
        const format = detectStreamFormat(s.url);
        return {
          id: `fmov-${s.provider || 'stream'}-${idx}-${s.quality || 'auto'}`,
          name: s.name || `${s.provider || 'Stream'} ${s.quality ? `(${s.quality})` : ''}`,
          title: s.title || s.name,
          url: s.url,
          quality: s.quality || (format === 'hls' ? 'Auto' : '1080p'),
          provider: s.provider || 'FMOV Stream',
          headers: s.headers,
          subtitles: Array.isArray(s.subtitles) ? s.subtitles : undefined,
          format,
        };
      });

      const uniqueStreams = deduplicateStreams(parsedStreams);

      const response: FmovStreamsResponse = {
        success: Boolean(rawData.success ?? uniqueStreams.length > 0),
        tmdbId: String(tmdbId),
        imdbId: rawData.imdbId,
        count: uniqueStreams.length,
        providerTimings: rawData.providerTimings,
        streams: uniqueStreams,
      };

      streamsCache.set(cacheKey, { data: response, timestamp: Date.now() });
      return response;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw err;
      }
      return {
        success: false,
        tmdbId: String(tmdbId),
        count: 0,
        streams: [],
        error: String(err?.message || 'Failed to fetch series streams from FMOV API'),
      };
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, requestPromise);
  return requestPromise;
}

/**
 * Group streams by provider name
 */
export function groupStreamsByProvider(streams: FmovStreamItem[]): Record<string, FmovStreamItem[]> {
  const groups: Record<string, FmovStreamItem[]> = {};
  for (const s of streams) {
    const prov = s.provider || 'Other';
    if (!groups[prov]) {
      groups[prov] = [];
    }
    groups[prov].push(s);
  }
  return groups;
}

const COMMON_QUALITIES: StreamQuality[] = [
  { label: 'Auto (Adaptive)', value: 'auto' },
  { label: '4K Ultra HD (2160p)', value: '4k', bitrate: 18000 },
  { label: 'Full HD (1080p)', value: '1080', bitrate: 6000 },
  { label: 'HD (720p)', value: '720', bitrate: 3000 },
  { label: 'SD (480p)', value: '480', bitrate: 1200 },
];

/**
 * Convert an FmovStreamItem into the player's StreamResult format
 */
export function convertFmovStreamToStreamResult(
  stream: FmovStreamItem,
  tmdbId: number,
  type: 'movie' | 'tv'
): StreamResult {
  const subtitles: SubtitleTrack[] = (stream.subtitles || []).map((s, idx) => {
    const formatted = formatSubtitleFullLabel(s.label || s.lang || 'Subtitle', s.lang);
    return {
      id: s.id || `sub-fmov-${idx}-${formatted.langCode}`,
      label: formatted.fullTitle,
      language: formatted.langCode || s.lang || 'en',
      url: s.url,
      isDefault: idx === 0,
    };
  });

  return {
    serverId: stream.id,
    serverName: `${stream.provider} - ${stream.quality || stream.name}`,
    sources: [
      {
        url: stream.url,
        format: stream.format,
        quality: stream.quality || 'Auto',
        serverName: stream.name,
      },
    ],
    qualities: COMMON_QUALITIES,
    subtitles,
    audioTracks: [],
  };
}
