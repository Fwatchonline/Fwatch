import { StreamingProvider, StreamResult, SubtitleTrack, AudioTrack, StreamQuality } from '../types';

const COMMON_QUALITIES: StreamQuality[] = [
  { label: 'Auto (Adaptive)', value: 'auto' },
  { label: '4K Ultra HD (2160p)', value: '4k', bitrate: 18000 },
  { label: 'Full HD (1080p)', value: '1080', bitrate: 6000 },
  { label: 'HD (720p)', value: '720', bitrate: 3000 },
  { label: 'SD (480p)', value: '480', bitrate: 1200 },
];

async function fetchDirectStream(
  tmdbId: number,
  type: 'movie' | 'tv',
  season?: number,
  episode?: number,
  serverId?: string,
  preferProxy = false
): Promise<{
  hlsUrl: string;
  subtitles: SubtitleTrack[];
  audioTracks: AudioTrack[];
}> {
  const q = new URLSearchParams({
    id: String(tmdbId),
    type,
    ...(season ? { season: String(season) } : {}),
    ...(episode ? { episode: String(episode) } : {}),
    ...(serverId ? { server: serverId } : {}),
  });

  const apiPath = `/api/stream/resolve?${q.toString()}`;
  const fetchUrl = typeof window !== 'undefined' ? apiPath : `http://localhost:${process.env.PORT || 3000}${apiPath}`;
  const res = await fetch(fetchUrl);
  if (!res.ok) {
    throw new Error(`Direct HLS stream resolution failed with status ${res.status}`);
  }

  const data = await res.json();
  // Always use proxied HLS URL first to ensure AES-128 keys (/storage/enc.key), CORS, and TS segments load without browser blocks
  const chosenUrl = data.proxiedHlsUrl || data.primaryHlsUrl;

  if (!chosenUrl) {
    throw new Error('No playable direct HLS URL returned by solver');
  }

  const subtitles: SubtitleTrack[] = (data.subtitles || []).map((s: any, idx: number) => ({
    id: `sub-${idx}-${s.language || 'en'}`,
    label: s.label || s.language || `Subtitle ${idx + 1}`,
    language: s.language || 'en',
    url: s.url,
    isDefault: idx === 0,
  }));

  const audioTracks: AudioTrack[] = (data.audioTracks || []).map((a: any, idx: number) => ({
    id: `aud-${idx}-${a.language || 'en'}`,
    label: a.label || a.language || `Audio ${idx + 1}`,
    language: a.language || 'en',
  }));

  return {
    hlsUrl: chosenUrl,
    subtitles,
    audioTracks,
  };
}

/**
 * Pure Direct HLS Streaming Server Providers
 * Powered by @vyla-entertainment/sdk & Multi-CDN HLS Edge Architecture
 * 100% direct m3u8 streams in native HLS player (NO embed iframes).
 */
export const STREAMING_SERVERS: StreamingProvider[] = [
  {
    id: 'server-rive',
    name: 'RiveStream (Direct HLS - 4K/1080p)',
    region: 'Ultra Fast Edge CDN',
    priority: 1,
    type: 'both',
    isAvailable: true,
    latencyMs: 11,
    async getStream({ tmdbId, type, season, episode }) {
      const { hlsUrl, subtitles, audioTracks } = await fetchDirectStream(
        tmdbId,
        type,
        season,
        episode,
        'rivestream',
        false
      );
      return {
        serverId: 'server-rive',
        serverName: 'RiveStream (Direct HLS - 4K/1080p)',
        sources: [{ url: hlsUrl, format: 'hls', quality: '1080p' }],
        qualities: COMMON_QUALITIES,
        subtitles,
        audioTracks,
      };
    },
  },
  {
    id: 'server-movy',
    name: 'Movy CDN (Direct HLS - 4K/1080p)',
    region: 'Global Anycast CDN',
    priority: 2,
    type: 'both',
    isAvailable: true,
    latencyMs: 14,
    async getStream({ tmdbId, type, season, episode }) {
      const { hlsUrl, subtitles, audioTracks } = await fetchDirectStream(
        tmdbId,
        type,
        season,
        episode,
        'movy',
        false
      );
      return {
        serverId: 'server-movy',
        serverName: 'Movy CDN (Direct HLS - 4K/1080p)',
        sources: [{ url: hlsUrl, format: 'hls', quality: '1080p' }],
        qualities: COMMON_QUALITIES,
        subtitles,
        audioTracks,
      };
    },
  },
  {
    id: 'server-cinesrc',
    name: 'CineSrc (Direct Master HLS)',
    region: 'High Bitrate Master CDN',
    priority: 3,
    type: 'both',
    isAvailable: true,
    latencyMs: 18,
    async getStream({ tmdbId, type, season, episode }) {
      const { hlsUrl, subtitles, audioTracks } = await fetchDirectStream(
        tmdbId,
        type,
        season,
        episode,
        'cinesrc',
        false
      );
      return {
        serverId: 'server-cinesrc',
        serverName: 'CineSrc (Direct Master HLS)',
        sources: [{ url: hlsUrl, format: 'hls', quality: 'auto' }],
        qualities: COMMON_QUALITIES,
        subtitles,
        audioTracks,
      };
    },
  },
  {
    id: 'server-vidfast',
    name: 'VidFast Pro (Direct HLS - 1080p)',
    region: 'Low-Latency ABR Edge',
    priority: 4,
    type: 'both',
    isAvailable: true,
    latencyMs: 16,
    async getStream({ tmdbId, type, season, episode }) {
      const { hlsUrl, subtitles, audioTracks } = await fetchDirectStream(
        tmdbId,
        type,
        season,
        episode,
        'vidfast',
        false
      );
      return {
        serverId: 'server-vidfast',
        serverName: 'VidFast Pro (Direct HLS - 1080p)',
        sources: [{ url: hlsUrl, format: 'hls', quality: 'auto' }],
        qualities: COMMON_QUALITIES,
        subtitles,
        audioTracks,
      };
    },
  },
  {
    id: 'server-vidup',
    name: 'VidUP (Multi-Worker VM HLS)',
    region: 'Distributed VM Nodes',
    priority: 5,
    type: 'both',
    isAvailable: true,
    latencyMs: 20,
    async getStream({ tmdbId, type, season, episode }) {
      const { hlsUrl, subtitles, audioTracks } = await fetchDirectStream(
        tmdbId,
        type,
        season,
        episode,
        'vidup',
        false
      );
      return {
        serverId: 'server-vidup',
        serverName: 'VidUP (Multi-Worker VM HLS)',
        sources: [{ url: hlsUrl, format: 'hls', quality: 'auto' }],
        qualities: COMMON_QUALITIES,
        subtitles,
        audioTracks,
      };
    },
  },
  {
    id: 'server-vidrock',
    name: 'VidRock (Edge CDN HLS)',
    region: 'Cloud Edge Fast',
    priority: 6,
    type: 'both',
    isAvailable: true,
    latencyMs: 19,
    async getStream({ tmdbId, type, season, episode }) {
      const { hlsUrl, subtitles, audioTracks } = await fetchDirectStream(
        tmdbId,
        type,
        season,
        episode,
        'vidrock',
        false
      );
      return {
        serverId: 'server-vidrock',
        serverName: 'VidRock (Edge CDN HLS)',
        sources: [{ url: hlsUrl, format: 'hls', quality: 'auto' }],
        qualities: COMMON_QUALITIES,
        subtitles,
        audioTracks,
      };
    },
  },
  {
    id: 'server-vidzee',
    name: 'VidZee (Fast Cloud HLS)',
    region: 'Distributed CDN HLS',
    priority: 7,
    type: 'both',
    isAvailable: true,
    latencyMs: 17,
    async getStream({ tmdbId, type, season, episode }) {
      const { hlsUrl, subtitles, audioTracks } = await fetchDirectStream(
        tmdbId,
        type,
        season,
        episode,
        'vidzee',
        false
      );
      return {
        serverId: 'server-vidzee',
        serverName: 'VidZee (Fast Cloud HLS)',
        sources: [{ url: hlsUrl, format: 'hls', quality: 'auto' }],
        qualities: COMMON_QUALITIES,
        subtitles,
        audioTracks,
      };
    },
  },
  {
    id: 'server-hexa',
    name: 'Hexa Stream (Direct HLS)',
    region: 'High-Speed Cloud Mesh',
    priority: 8,
    type: 'both',
    isAvailable: true,
    latencyMs: 22,
    async getStream({ tmdbId, type, season, episode }) {
      const { hlsUrl, subtitles, audioTracks } = await fetchDirectStream(
        tmdbId,
        type,
        season,
        episode,
        'hexa',
        false
      );
      return {
        serverId: 'server-hexa',
        serverName: 'Hexa Stream (Direct HLS)',
        sources: [{ url: hlsUrl, format: 'hls', quality: 'auto' }],
        qualities: COMMON_QUALITIES,
        subtitles,
        audioTracks,
      };
    },
  },
];

const PREFERRED_SERVER_KEY = 'tmovie_preferred_server_id';

export function getPreferredServerId(): string {
  try {
    return localStorage.getItem(PREFERRED_SERVER_KEY) || STREAMING_SERVERS[0].id;
  } catch {
    return STREAMING_SERVERS[0].id;
  }
}

export function setPreferredServerId(id: string): void {
  try {
    localStorage.setItem(PREFERRED_SERVER_KEY, id);
  } catch {
    // Ignore localStorage errors
  }
}

export interface BestWorkingServerOptions {
  tmdbId: number;
  type: 'movie' | 'tv';
  season?: number;
  episode?: number;
  preferredServerId?: string;
  failedServerIds?: string[];
}

export interface WorkingServerResult {
  provider: StreamingProvider;
  stream: StreamResult;
}

export async function getBestWorkingServer(
  optionsOrFailedIds?: BestWorkingServerOptions | string[],
  preferredServerId?: string
): Promise<any> {
  // Case 1: Called with options object { tmdbId, type, season?, episode?, ... }
  if (
    optionsOrFailedIds &&
    typeof optionsOrFailedIds === 'object' &&
    !Array.isArray(optionsOrFailedIds) &&
    'tmdbId' in optionsOrFailedIds
  ) {
    const opts = optionsOrFailedIds as BestWorkingServerOptions;
    const safeFailed = Array.isArray(opts.failedServerIds) ? opts.failedServerIds : [];
    const targetPref = opts.preferredServerId || getPreferredServerId();

    // Order candidates: preferred server first if available, then remaining by priority
    const candidates = [...STREAMING_SERVERS].sort((a, b) => {
      if (a.id === targetPref && !safeFailed.includes(a.id)) return -1;
      if (b.id === targetPref && !safeFailed.includes(b.id)) return 1;
      return a.priority - b.priority;
    });

    for (const server of candidates) {
      if (safeFailed.includes(server.id)) continue;
      try {
        const stream = await server.getStream({
          tmdbId: opts.tmdbId,
          type: opts.type,
          season: opts.season,
          episode: opts.episode,
        });
        if (stream && stream.sources && stream.sources.length > 0) {
          return { provider: server, stream };
        }
      } catch (err) {
        console.warn(`[getBestWorkingServer] Candidate ${server.id} error:`, err);
      }
    }

    // Try primary server as last direct HLS attempt
    const primaryFallback = STREAMING_SERVERS[0];
    const stream = await primaryFallback.getStream({
      tmdbId: opts.tmdbId,
      type: opts.type,
      season: opts.season,
      episode: opts.episode,
    });
    return { provider: primaryFallback, stream };
  }

  // Case 2: Called with array or undefined: getBestWorkingServer(failedServerIds, preferredServerId)
  const safeFailedIds = Array.isArray(optionsOrFailedIds) ? optionsOrFailedIds : [];
  const targetPref = preferredServerId || getPreferredServerId();

  if (targetPref && !safeFailedIds.includes(targetPref)) {
    const pref = STREAMING_SERVERS.find((s) => s.id === targetPref && s.isAvailable);
    if (pref) return pref;
  }

  const storedPrefId = getPreferredServerId();
  if (storedPrefId && !safeFailedIds.includes(storedPrefId)) {
    const stored = STREAMING_SERVERS.find((s) => s.id === storedPrefId && s.isAvailable);
    if (stored) return stored;
  }

  const availableServers = STREAMING_SERVERS.filter(
    (s) => s.isAvailable && !safeFailedIds.includes(s.id)
  );

  if (availableServers.length > 0) {
    return availableServers.sort((a, b) => a.priority - b.priority)[0];
  }

  return STREAMING_SERVERS[0];
}
