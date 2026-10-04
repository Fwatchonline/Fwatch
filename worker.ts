import {
  CURATED_MOVIES,
  CURATED_TV_SHOWS,
  CURATED_EPISODES,
  CURATED_ACTORS,
  GENRES_LIST,
} from './src/services/curatedData';
import { generateMediaSlug } from './src/utils/slugify';
import {
  resolveVylaHls,
  getVylaSubtitles,
  getVylaDownloads,
  getVylaSourcesList,
  probeVylaHealth,
} from './server/vylaSolver.ts';
import { proxyHls } from './server/vidup/src/hls/proxy.js';

export interface Env {
  ASSETS?: {
    fetch: (request: Request) => Promise<Response>;
  };
  TMDB_API_KEY?: string;
  TMDB_READ_ACCESS_TOKEN?: string;
  APP_URL?: string;
  [key: string]: any;
}

// In-memory cache per Worker instance
const workerCache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 mins
const imdbRatingsCache = new Map<string, number>();

// Pre-seeded authentic IMDb ratings
const PRESEEDED_IMDB_RATINGS: Record<string, number> = {
  'movie:24428': 8.0,
  'movie:299536': 8.4,
  'movie:299534': 8.4,
  'movie:99861': 7.3,
  'movie:1726': 7.9,
  'movie:10138': 7.0,
  'movie:68721': 7.1,
  'movie:284054': 7.9,
  'movie:284053': 7.9,
  'movie:283995': 8.0,
  'movie:118340': 7.7,
  'movie:447365': 7.9,
  'movie:271110': 7.8,
  'movie:100402': 7.7,
  'movie:1930': 7.3,
  'movie:634649': 8.2,
  'movie:569094': 8.6,
  'movie:324857': 8.4,
  'movie:533535': 7.7,
  'movie:293660': 8.0,
  'movie:383498': 7.7,
  'movie:315635': 8.0,
  'movie:155': 9.0,
  'movie:272': 8.2,
  'movie:49026': 8.4,
  'movie:414906': 7.8,
  'movie:475557': 8.4,
  'movie:278': 9.3,
  'movie:238': 9.2,
  'movie:240': 9.0,
  'movie:424': 9.0,
  'movie:389': 9.0,
  'movie:122': 9.0,
  'movie:680': 8.9,
  'movie:120': 8.9,
  'movie:550': 8.8,
  'movie:121': 8.8,
  'movie:13': 8.8,
  'movie:27205': 8.8,
  'movie:872585': 8.8,
  'movie:157336': 8.7,
  'movie:603': 8.7,
  'movie:769': 8.7,
  'movie:807': 8.6,
  'movie:274': 8.6,
  'movie:129': 8.6,
  'movie:857': 8.6,
  'movie:497': 8.6,
  'movie:496243': 8.5,
  'movie:244786': 8.5,
  'movie:98': 8.5,
  'movie:1124': 8.5,
  'movie:693134': 8.5,
  'movie:438631': 8.0,
  'movie:1022789': 7.6,
  'movie:558449': 6.8,
  'movie:402431': 7.8,
  'movie:1241982': 6.8,
  'movie:912649': 6.1,
  'movie:945961': 7.2,
  'movie:917496': 6.7,
  'movie:718821': 6.6,
  'movie:671': 7.6,
  'movie:105': 8.5,
  'movie:1891': 8.7,
  'movie:11': 8.6,
  'movie:862': 8.3,
  'tv:1396': 9.5,
  'tv:1399': 9.2,
  'tv:87108': 9.3,
  'tv:3297': 9.3,
  'tv:1398': 9.2,
  'tv:387': 9.3,
  'tv:4613': 9.4,
  'tv:19885': 9.1,
  'tv:94605': 9.0,
  'tv:76331': 8.9,
  'tv:60059': 9.0,
  'tv:100088': 8.8,
  'tv:66732': 8.7,
  'tv:126308': 8.7,
  'tv:76479': 8.7,
  'tv:118956': 8.8,
  'tv:94997': 8.4,
  'tv:93405': 8.7,
  'tv:106379': 8.4,
  'tv:46648': 8.9,
  'tv:60622': 8.9,
  'tv:70523': 8.7,
  'tv:67744': 8.6,
  'tv:109445': 8.0,
  'tv:1668': 8.9,
  'tv:2316': 9.0,
  'tv:60625': 9.1,
  'tv:13916': 8.9,
  'tv:1429': 9.1,
  'tv:84958': 8.2,
  'tv:85937': 7.6,
  'tv:110492': 8.2,
  'tv:60574': 8.8,
};

for (const [key, rating] of Object.entries(PRESEEDED_IMDB_RATINGS)) {
  imdbRatingsCache.set(key, rating);
}

// TMDB Fetcher
async function tmdbFetch(endpoint: string, params: Record<string, string> = {}, env: Env) {
  const cacheKey = `${endpoint}?${new URLSearchParams(params).toString()}`;
  const cached = workerCache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  const apiKey = env.TMDB_API_KEY || (typeof process !== 'undefined' ? process.env?.TMDB_API_KEY : '') || '4ff5a77cb540ca70b284e9089228fe00';
  const readToken = env.TMDB_READ_ACCESS_TOKEN || (typeof process !== 'undefined' ? process.env?.TMDB_READ_ACCESS_TOKEN : '');

  const queryParams = new URLSearchParams(params);
  if (apiKey) {
    queryParams.set('api_key', apiKey);
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (readToken) {
    headers['Authorization'] = `Bearer ${readToken}`;
  }

  try {
    const url = `https://api.themoviedb.org/3${endpoint}?${queryParams.toString()}`;
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    workerCache.set(cacheKey, { data, expiry: Date.now() + CACHE_TTL_MS });
    return data;
  } catch {
    return null;
  }
}

// Authoritative IMDb Rating Resolver
async function resolveImdbRating(
  tmdbId: number,
  type: 'movie' | 'tv',
  knownImdbId?: string,
  env?: Env
): Promise<number | null> {
  const key = `${type}:${tmdbId}`;
  if (imdbRatingsCache.has(key)) return imdbRatingsCache.get(key)!;
  if (knownImdbId && imdbRatingsCache.has(knownImdbId)) return imdbRatingsCache.get(knownImdbId)!;

  try {
    let imdbId = knownImdbId;
    if (!imdbId && env) {
      const extRaw = await tmdbFetch(`/${type}/${tmdbId}/external_ids`, {}, env);
      imdbId = extRaw?.imdb_id;
    }
    if (!imdbId) return null;

    const cinemetaType = type === 'movie' ? 'movie' : 'series';
    const cRes = await fetch(`https://v3-cinemeta.strem.io/meta/${cinemetaType}/${imdbId}.json`, {
      signal: AbortSignal.timeout(3000),
    });

    if (cRes.ok) {
      const cData: any = await cRes.json();
      const rating = cData?.meta?.imdbRating ? parseFloat(cData.meta.imdbRating) : null;
      if (rating && !isNaN(rating) && rating > 0) {
        imdbRatingsCache.set(key, rating);
        imdbRatingsCache.set(imdbId, rating);
        return rating;
      }
    }
  } catch {}

  return null;
}

async function enrichWithImdbRatings(items: any[], defaultType?: 'movie' | 'tv', env?: Env): Promise<any[]> {
  if (!items || items.length === 0) return items;
  await Promise.allSettled(
    items.map(async (item) => {
      const itemType = item.type === 'tv' || item.type === 'movie' ? item.type : defaultType || 'movie';
      const rating = await resolveImdbRating(item.tmdbId, itemType, item.imdbId, env);
      if (rating) {
        item.voteAverage = rating;
        item.imdbRating = rating;
      }
    })
  );
  return items;
}

function formatMediaItem(raw: any, type: 'movie' | 'tv') {
  const isMovie = type === 'movie';
  const title = isMovie ? raw.title : raw.name;
  const originalTitle = isMovie ? raw.original_title : raw.original_name;
  const releaseDate = isMovie ? raw.release_date || '' : raw.first_air_date || '';
  const tmdbId = raw.id;
  const imdbId = raw.imdb_id || raw.external_ids?.imdb_id;

  const key = `${type}:${tmdbId}`;
  const preseededOrCached = imdbRatingsCache.get(key) || (imdbId ? imdbRatingsCache.get(imdbId) : undefined);
  const voteAverage = preseededOrCached !== undefined ? preseededOrCached : Number(raw.vote_average || 0);

  return {
    id: `${type}:${tmdbId}`,
    type,
    tmdbId,
    title: title || 'Untitled',
    originalTitle,
    slug: generateMediaSlug(tmdbId, title || 'item'),
    overview: raw.overview || '',
    tagline: raw.tagline || '',
    posterPath: raw.poster_path || null,
    backdropPath: raw.backdrop_path || null,
    releaseDate,
    voteAverage,
    voteCount: Number(raw.vote_count || 0),
    imdbId,
    imdbRating: preseededOrCached,
    genres:
      raw.genres?.map((g: any) => ({
        id: g.id,
        name: g.name,
        slug: g.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      })) || [],
    runtime: isMovie ? raw.runtime : undefined,
    numberOfSeasons: !isMovie ? raw.number_of_seasons : undefined,
    numberOfEpisodes: !isMovie ? raw.number_of_episodes : undefined,
    status: raw.status || 'Released',
    country: raw.production_countries?.[0]?.name || 'United States',
    quality: '4K',
    trailerKey: raw.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube')?.key,
    cast: raw.credits?.cast?.slice(0, 10).map((c: any) => ({
      id: c.id,
      name: c.name,
      character: c.character,
      profilePath: c.profile_path,
      order: c.order,
    })),
  };
}

function formatPerson(raw: any) {
  return {
    id: raw.id,
    tmdbId: raw.id,
    name: raw.name,
    slug: generateMediaSlug(raw.id, raw.name),
    profilePath: raw.profile_path || null,
    biography: raw.biography || '',
    birthday: raw.birthday || undefined,
    deathday: raw.deathday || undefined,
    placeOfBirth: raw.place_of_birth || undefined,
    knownForDepartment: raw.known_for_department || 'Acting',
    popularity: raw.popularity || 0,
    knownFor: (raw.known_for || []).map((item: any) =>
      formatMediaItem(item, item.media_type === 'tv' ? 'tv' : 'movie')
    ),
    movieCredits: (raw.combined_credits?.cast || [])
      .filter((c: any) => c.media_type === 'movie')
      .slice(0, 20)
      .map((c: any) => formatMediaItem(c, 'movie')),
    tvCredits: (raw.combined_credits?.cast || [])
      .filter((c: any) => c.media_type === 'tv')
      .slice(0, 20)
      .map((c: any) => formatMediaItem(c, 'tv')),
  };
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname, searchParams } = url;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // -------------------------------------------------------------
    // 1. HEALTH CHECK
    // -------------------------------------------------------------
    if (pathname === '/api/health') {
      return Response.json(
        { status: 'ok', runtime: 'cloudflare-workers', timestamp: Date.now() },
        { headers: CORS_HEADERS }
      );
    }

    // -------------------------------------------------------------
    // 2. AES-128 ENCRYPTION KEY PROXY
    // -------------------------------------------------------------
    if (pathname === '/storage/enc.key') {
      try {
        const keyRes = await fetch('https://vixsrc.to/storage/enc.key', {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Referer: 'https://vixsrc.to/',
          },
        });
        if (keyRes.ok) {
          const body = await keyRes.arrayBuffer();
          return new Response(body, {
            status: 200,
            headers: {
              'Content-Type': 'application/octet-stream',
              'Cache-Control': 'public, max-age=86400',
              ...CORS_HEADERS,
            },
          });
        }
      } catch {}
      return new Response('Not found', { status: 404 });
    }

    // -------------------------------------------------------------
    // 3. HLS STREAM & SEGMENT PROXY
    // -------------------------------------------------------------
    if (pathname === '/api/hls') {
      const target = searchParams.get('url');
      if (!target) {
        return Response.json({ error: 'url query parameter is required' }, { status: 400 });
      }
      try {
        const queryRecord: Record<string, string> = {};
        searchParams.forEach((v, k) => {
          queryRecord[k] = v;
        });

        const proxied = await proxyHls(target, queryRecord);
        return new Response(proxied.body, {
          status: proxied.status,
          headers: {
            ...proxied.headers,
            ...CORS_HEADERS,
          },
        });
      } catch (err: any) {
        return new Response('upstream error', {
          status: err?.message?.includes('404') ? 404 : 502,
          headers: CORS_HEADERS,
        });
      }
    }

    // -------------------------------------------------------------
    // 4. DIRECT HLS STREAM RESOLVER (Powered by @vyla-entertainment/sdk)
    // -------------------------------------------------------------
    if (pathname === '/api/stream/resolve') {
      const tmdbId = Number(searchParams.get('id'));
      const type = searchParams.get('type') === 'tv' ? 'tv' : 'movie';
      const season = Number(searchParams.get('season')) || 1;
      const episode = Number(searchParams.get('episode')) || 1;
      const serverName = searchParams.get('server') || 'default';

      if (!tmdbId) {
        return Response.json({ error: 'id parameter is required' }, { status: 400, headers: CORS_HEADERS });
      }

      try {
        const vylaResult = await resolveVylaHls(tmdbId, type, season, episode, serverName);
        if (vylaResult.ok && vylaResult.masterUrl) {
          return Response.json(
            {
              ok: true,
              type,
              id: tmdbId,
              server: vylaResult.server,
              primaryHlsUrl: vylaResult.masterUrl,
              proxiedHlsUrl: vylaResult.proxiedUrl,
              allStreams: vylaResult.allStreams || [],
              subtitles: vylaResult.subtitles || [],
              audioTracks: vylaResult.audioTracks || [],
            },
            { headers: CORS_HEADERS }
          );
        }
      } catch {}

      return Response.json(
        { ok: false, error: 'No direct HLS stream found for this title' },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    // -------------------------------------------------------------
    // 5. VYLA SDK MULTI-LANGUAGE SUBTITLES
    // -------------------------------------------------------------
    if (pathname === '/api/vyla/subtitles') {
      const tmdbId = Number(searchParams.get('id'));
      const type = searchParams.get('type') === 'tv' ? 'tv' : 'movie';
      const season = searchParams.get('season') ? Number(searchParams.get('season')) : undefined;
      const episode = searchParams.get('episode') ? Number(searchParams.get('episode')) : undefined;

      if (!tmdbId) {
        return Response.json({ error: 'id parameter is required' }, { status: 400, headers: CORS_HEADERS });
      }

      try {
        const subtitles = await getVylaSubtitles(tmdbId, type, season, episode);
        return Response.json({ ok: true, subtitles }, { headers: CORS_HEADERS });
      } catch (err: any) {
        return Response.json({ ok: false, error: String(err?.message || err) }, { status: 500, headers: CORS_HEADERS });
      }
    }

    // -------------------------------------------------------------
    // 6. VYLA SDK DIRECT HIGH SPEED DOWNLOADS
    // -------------------------------------------------------------
    if (pathname === '/api/vyla/downloads') {
      const tmdbId = Number(searchParams.get('id'));
      const type = searchParams.get('type') === 'tv' ? 'tv' : 'movie';
      const season = searchParams.get('season') ? Number(searchParams.get('season')) : undefined;
      const episode = searchParams.get('episode') ? Number(searchParams.get('episode')) : undefined;

      if (!tmdbId) {
        return Response.json({ error: 'id parameter is required' }, { status: 400, headers: CORS_HEADERS });
      }

      try {
        const downloads = await getVylaDownloads(tmdbId, type, season, episode);
        return Response.json({ ok: true, downloads }, { headers: CORS_HEADERS });
      } catch (err: any) {
        return Response.json({ ok: false, error: String(err?.message || err) }, { status: 500, headers: CORS_HEADERS });
      }
    }

    // -------------------------------------------------------------
    // 7. VYLA SDK SOURCES & HEALTH
    // -------------------------------------------------------------
    if (pathname === '/api/vyla/sources') {
      try {
        const sources = getVylaSourcesList();
        return Response.json({ ok: true, sources }, { headers: CORS_HEADERS });
      } catch (err: any) {
        return Response.json({ ok: false, error: String(err?.message || err) }, { status: 500, headers: CORS_HEADERS });
      }
    }

    if (pathname === '/api/vyla/probe') {
      try {
        const results = await probeVylaHealth();
        return Response.json({ ok: true, results }, { headers: CORS_HEADERS });
      } catch (err: any) {
        return Response.json({ ok: false, error: String(err?.message || err) }, { status: 500, headers: CORS_HEADERS });
      }
    }

    // -------------------------------------------------------------
    // 8. ANILIST GRAPHQL PROXY
    // -------------------------------------------------------------
    if (pathname === '/api/anilist' && request.method === 'POST') {
      try {
        const body: any = await request.json().catch(() => ({}));
        const { query, variables } = body;
        if (!query) {
          return Response.json({ error: 'Query is required' }, { status: 400, headers: CORS_HEADERS });
        }

        const cacheKey = `anilist:${JSON.stringify({ query, variables })}`;
        const cached = workerCache.get(cacheKey);
        if (cached && cached.expiry > Date.now()) {
          return Response.json(cached.data, { headers: CORS_HEADERS });
        }

        const response = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          },
          body: JSON.stringify({ query, variables }),
        });

        if (!response.ok) {
          const errText = await response.text();
          return new Response(errText, { status: response.status, headers: CORS_HEADERS });
        }

        const data = await response.json();
        workerCache.set(cacheKey, { data, expiry: Date.now() + CACHE_TTL_MS });
        return Response.json(data, { headers: CORS_HEADERS });
      } catch (err: any) {
        return Response.json({ error: err?.message || 'AniList proxy failed' }, { status: 500, headers: CORS_HEADERS });
      }
    }

    // -------------------------------------------------------------
    // 9. IMDB RATINGS
    // -------------------------------------------------------------
    const imdbMatch = pathname.match(/^\/api\/imdb\/rating\/(movie|tv)\/(\d+)$/);
    if (imdbMatch) {
      const type = imdbMatch[1] as 'movie' | 'tv';
      const tmdbId = Number(imdbMatch[2]);
      const key = `${type}:${tmdbId}`;

      let rating: number | null = imdbRatingsCache.get(key) || null;
      if (!rating) {
        rating = await resolveImdbRating(tmdbId, type, undefined, env);
      }
      return Response.json({ tmdbId, type, imdbRating: rating }, { headers: CORS_HEADERS });
    }

    // -------------------------------------------------------------
    // 10. TMDB PROXY ROUTES
    // -------------------------------------------------------------
    if (pathname === '/api/tmdb/person/popular') {
      const data = await tmdbFetch('/person/popular', { page: searchParams.get('page') || '1' }, env);
      if (data?.results) {
        return Response.json(data.results.map(formatPerson), { headers: CORS_HEADERS });
      }
      return Response.json(CURATED_ACTORS, { headers: CORS_HEADERS });
    }

    if (pathname === '/api/tmdb/search/person') {
      const q = searchParams.get('query') || '';
      if (!q) return Response.json([], { headers: CORS_HEADERS });
      const data = await tmdbFetch('/search/person', { query: q, page: searchParams.get('page') || '1' }, env);
      if (data?.results) {
        return Response.json(data.results.map(formatPerson), { headers: CORS_HEADERS });
      }
      const filtered = CURATED_ACTORS.filter((a) => a.name.toLowerCase().includes(q.toLowerCase()));
      return Response.json(filtered, { headers: CORS_HEADERS });
    }

    const trendingMatch = pathname.match(/^\/api\/tmdb\/trending\/(all|movie|tv)\/(day|week)$/);
    if (trendingMatch) {
      const type = trendingMatch[1];
      const timeWindow = trendingMatch[2];
      const data = await tmdbFetch(`/trending/${type}/${timeWindow}`, {}, env);
      if (data?.results) {
        const formatted = data.results.map((item: any) =>
          formatMediaItem(item, item.media_type === 'tv' ? 'tv' : 'movie')
        );
        const enriched = await enrichWithImdbRatings(formatted, 'movie', env);
        return Response.json(enriched, { headers: CORS_HEADERS });
      }
      const fallback = type === 'tv' ? CURATED_TV_SHOWS : CURATED_MOVIES;
      return Response.json(fallback, { headers: CORS_HEADERS });
    }

    const popularMatch = pathname.match(/^\/api\/tmdb\/(movie|tv)\/popular$/);
    if (popularMatch) {
      const type = popularMatch[1] as 'movie' | 'tv';
      const page = searchParams.get('page') || '1';
      const data = await tmdbFetch(`/${type}/popular`, { page }, env);
      if (data?.results) {
        const formatted = data.results.map((item: any) => formatMediaItem(item, type));
        const enriched = await enrichWithImdbRatings(formatted, type, env);
        return Response.json(enriched, { headers: CORS_HEADERS });
      }
      return Response.json(type === 'tv' ? CURATED_TV_SHOWS : CURATED_MOVIES, { headers: CORS_HEADERS });
    }

    const topRatedMatch = pathname.match(/^\/api\/tmdb\/(movie|tv)\/top_rated$/);
    if (topRatedMatch) {
      const type = topRatedMatch[1] as 'movie' | 'tv';
      const page = searchParams.get('page') || '1';
      const data = await tmdbFetch(`/${type}/top_rated`, { page }, env);
      if (data?.results) {
        const formatted = data.results.map((item: any) => formatMediaItem(item, type));
        const enriched = await enrichWithImdbRatings(formatted, type, env);
        return Response.json(enriched, { headers: CORS_HEADERS });
      }
      return Response.json(type === 'tv' ? CURATED_TV_SHOWS : CURATED_MOVIES, { headers: CORS_HEADERS });
    }

    const nowPlayingMatch = pathname.match(/^\/api\/tmdb\/(movie|tv)\/(now_playing|on_the_air)$/);
    if (nowPlayingMatch) {
      const type = nowPlayingMatch[1] as 'movie' | 'tv';
      const endpoint = type === 'movie' ? 'now_playing' : 'on_the_air';
      const page = searchParams.get('page') || '1';
      const data = await tmdbFetch(`/${type}/${endpoint}`, { page }, env);
      if (data?.results) {
        const formatted = data.results.map((item: any) => formatMediaItem(item, type));
        const enriched = await enrichWithImdbRatings(formatted, type, env);
        return Response.json(enriched, { headers: CORS_HEADERS });
      }
      return Response.json(type === 'tv' ? CURATED_TV_SHOWS : CURATED_MOVIES, { headers: CORS_HEADERS });
    }

    if (pathname === '/api/tmdb/tv/new_episodes') {
      const page = searchParams.get('page') || '1';
      const cacheKey = `new_episodes_v2_p${page}`;
      const cached = workerCache.get(cacheKey);
      if (cached && cached.expiry > Date.now()) {
        return Response.json(cached.data, { headers: CORS_HEADERS });
      }

      try {
        const raw = await tmdbFetch('/tv/on_the_air', { page }, env);
        if (raw?.results && raw.results.length > 0) {
          const shows = raw.results.slice(0, 16);
          const episodePromises = shows.map(async (s: any) => {
            try {
              const showDetails = await tmdbFetch(`/tv/${s.id}`, {}, env);
              const ep = showDetails?.last_episode_to_air;
              if (!ep) {
                return {
                  id: `tv:${s.id}:s1:e1`,
                  tmdbId: s.id * 100 + 1,
                  showTmdbId: s.id,
                  showTitle: s.name,
                  showSlug: generateMediaSlug(s.id, s.name),
                  seasonNumber: 1,
                  episodeNumber: 1,
                  name: `${s.name} - Latest Episode`,
                  overview: s.overview || 'Fresh episode from current broadcast season.',
                  stillPath: s.backdrop_path || null,
                  airDate: s.first_air_date || new Date().toISOString().split('T')[0],
                  voteAverage: Number(s.vote_average || 8.0),
                  runtime: 45,
                };
              }

              return {
                id: `tv:${s.id}:s${ep.season_number}:e${ep.episode_number}`,
                tmdbId: ep.id,
                showTmdbId: s.id,
                showTitle: s.name,
                showSlug: generateMediaSlug(s.id, s.name),
                seasonNumber: ep.season_number,
                episodeNumber: ep.episode_number,
                name: ep.name || `Episode ${ep.episode_number}`,
                overview: ep.overview || s.overview || 'Fresh episode from current broadcast season.',
                stillPath: ep.still_path || s.backdrop_path || null,
                airDate: ep.air_date || new Date().toISOString().split('T')[0],
                voteAverage: Number(ep.vote_average || s.vote_average || 8.0),
                runtime: ep.runtime || 45,
              };
            } catch {
              return null;
            }
          });

          const episodes = (await Promise.all(episodePromises)).filter(Boolean);
          if (episodes.length > 0) {
            const payload = {
              results: episodes,
              page: Number(page),
              total_pages: Math.min(raw.total_pages || 10, 10),
              total_results: raw.total_results || 100,
            };
            workerCache.set(cacheKey, { data: payload, expiry: Date.now() + CACHE_TTL_MS });
            return Response.json(payload, { headers: CORS_HEADERS });
          }
        }
      } catch {}

      return Response.json(
        {
          results: CURATED_EPISODES,
          page: 1,
          total_pages: 1,
          total_results: CURATED_EPISODES.length,
        },
        { headers: CORS_HEADERS }
      );
    }

    const movieDetailsMatch = pathname.match(/^\/api\/tmdb\/movie\/(\d+)$/);
    if (movieDetailsMatch) {
      const id = movieDetailsMatch[1];
      const data = await tmdbFetch(`/movie/${id}`, { append_to_response: 'credits,videos,external_ids' }, env);
      if (data) {
        const formatted = formatMediaItem(data, 'movie');
        const enriched = await enrichWithImdbRatings([formatted], 'movie', env);
        return Response.json(enriched[0], { headers: CORS_HEADERS });
      }
      const curated = CURATED_MOVIES.find((m) => String(m.tmdbId) === id);
      if (curated) return Response.json(curated, { headers: CORS_HEADERS });
      return Response.json({ error: 'Movie not found' }, { status: 404, headers: CORS_HEADERS });
    }

    const tvDetailsMatch = pathname.match(/^\/api\/tmdb\/tv\/(\d+)$/);
    if (tvDetailsMatch) {
      const id = tvDetailsMatch[1];
      const data = await tmdbFetch(`/tv/${id}`, { append_to_response: 'credits,videos,external_ids' }, env);
      if (data) {
        const formatted = formatMediaItem(data, 'tv');
        const enriched = await enrichWithImdbRatings([formatted], 'tv', env);
        return Response.json(enriched[0], { headers: CORS_HEADERS });
      }
      const curated = CURATED_TV_SHOWS.find((s) => String(s.tmdbId) === id);
      if (curated) return Response.json(curated, { headers: CORS_HEADERS });
      return Response.json({ error: 'TV show not found' }, { status: 404, headers: CORS_HEADERS });
    }

    const seasonMatch = pathname.match(/^\/api\/tmdb\/tv\/(\d+)\/season\/(\d+)$/);
    if (seasonMatch) {
      const id = seasonMatch[1];
      const seasonNumber = seasonMatch[2];
      const data = await tmdbFetch(`/tv/${id}/season/${seasonNumber}`, {}, env);
      if (data) {
        return Response.json(data, { headers: CORS_HEADERS });
      }
      const curatedShow = CURATED_TV_SHOWS.find((s) => String(s.tmdbId) === id);
      const episodes = CURATED_EPISODES.filter(
        (e) => String(e.showTmdbId) === id && String(e.seasonNumber) === seasonNumber
      );
      return Response.json(
        {
          id: Number(id),
          seasonNumber: Number(seasonNumber),
          name: `Season ${seasonNumber}`,
          overview: curatedShow?.overview || '',
          posterPath: curatedShow?.posterPath || null,
          airDate: '2023-01-01',
          episodeCount: episodes.length || 10,
          episodes,
        },
        { headers: CORS_HEADERS }
      );
    }

    const discoverMatch = pathname.match(/^\/api\/tmdb\/discover\/(movie|tv)$/);
    if (discoverMatch) {
      const type = discoverMatch[1] as 'movie' | 'tv';
      const page = searchParams.get('page') || '1';
      const withGenres = searchParams.get('with_genres');
      const sortBy = searchParams.get('sort_by') || 'popularity.desc';
      const year = searchParams.get('primary_release_year') || searchParams.get('first_air_date_year');

      const params: Record<string, string> = { page, sort_by: sortBy };
      if (withGenres) params.with_genres = withGenres;
      if (year) {
        if (type === 'movie') params.primary_release_year = year;
        else params.first_air_date_year = year;
      }

      const data = await tmdbFetch(`/discover/${type}`, params, env);
      if (data?.results) {
        const formatted = data.results.map((item: any) => formatMediaItem(item, type));
        const enriched = await enrichWithImdbRatings(formatted, type, env);
        return Response.json(enriched, { headers: CORS_HEADERS });
      }
      return Response.json(type === 'tv' ? CURATED_TV_SHOWS : CURATED_MOVIES, { headers: CORS_HEADERS });
    }

    const similarMatch = pathname.match(/^\/api\/tmdb\/(movie|tv)\/(\d+)\/similar$/);
    if (similarMatch) {
      const type = similarMatch[1] as 'movie' | 'tv';
      const id = similarMatch[2];
      const data = await tmdbFetch(`/${type}/${id}/similar`, {}, env);
      if (data?.results) {
        const formatted = data.results.map((item: any) => formatMediaItem(item, type));
        const enriched = await enrichWithImdbRatings(formatted, type, env);
        return Response.json(enriched, { headers: CORS_HEADERS });
      }
      const list = type === 'tv' ? CURATED_TV_SHOWS : CURATED_MOVIES;
      return Response.json(list.filter((x) => String(x.tmdbId) !== id).slice(0, 6), { headers: CORS_HEADERS });
    }

    if (pathname === '/api/tmdb/search/multi') {
      const q = searchParams.get('query') || '';
      if (!q) return Response.json([], { headers: CORS_HEADERS });
      const data = await tmdbFetch('/search/multi', { query: q, page: searchParams.get('page') || '1' }, env);
      if (data?.results) {
        const filtered = data.results
          .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
          .map((item: any) => formatMediaItem(item, item.media_type as 'movie' | 'tv'));
        const enriched = await enrichWithImdbRatings(filtered, 'movie', env);
        return Response.json(enriched, { headers: CORS_HEADERS });
      }
      const term = q.toLowerCase();
      const localMatches = [...CURATED_MOVIES, ...CURATED_TV_SHOWS].filter((m) =>
        m.title.toLowerCase().includes(term)
      );
      return Response.json(localMatches, { headers: CORS_HEADERS });
    }

    const personMatch = pathname.match(/^\/api\/tmdb\/person\/(\d+)$/);
    if (personMatch) {
      const id = personMatch[1];
      const data = await tmdbFetch(`/person/${id}`, { append_to_response: 'combined_credits' }, env);
      if (data) {
        return Response.json(formatPerson(data), { headers: CORS_HEADERS });
      }
      const actor = CURATED_ACTORS.find((a) => String(a.tmdbId) === id);
      if (actor) return Response.json(actor, { headers: CORS_HEADERS });
      return Response.json({ error: 'Person not found' }, { status: 404, headers: CORS_HEADERS });
    }

    // -------------------------------------------------------------
    // 11. SEO: ROBOTS.TXT & SITEMAP.XML
    // -------------------------------------------------------------
    if (pathname === '/robots.txt') {
      const appUrl = env.APP_URL || url.origin;
      return new Response(
        [
          'User-agent: *',
          'Allow: /',
          'Allow: /movies',
          'Allow: /tv',
          'Allow: /anime',
          'Allow: /movie/*',
          'Allow: /tv/*',
          'Allow: /watch/*',
          'Allow: /genre/*',
          'Allow: /actor/*',
          'Allow: /trending',
          'Disallow: /api/',
          '',
          `Sitemap: ${appUrl}/sitemap.xml`,
        ].join('\r\n'),
        {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        }
      );
    }

    if (pathname === '/sitemap.xml') {
      const appUrl = env.APP_URL || url.origin;
      const today = new Date().toISOString().split('T')[0];
      const movieUrls = CURATED_MOVIES.map(
        (m) => `  <url><loc>${appUrl}/movie/${m.slug}</loc><lastmod>${today}</lastmod><priority>0.9</priority></url>
  <url><loc>${appUrl}/watch/movie/${m.slug}</loc><lastmod>${today}</lastmod><priority>0.8</priority></url>`
      ).join('\n');
      const tvUrls = CURATED_TV_SHOWS.map(
        (s) => `  <url><loc>${appUrl}/tv/${s.slug}</loc><lastmod>${today}</lastmod><priority>0.9</priority></url>`
      ).join('\n');

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${appUrl}/</loc><lastmod>${today}</lastmod><priority>1.0</priority></url>
  <url><loc>${appUrl}/movies</loc><lastmod>${today}</lastmod><priority>0.9</priority></url>
  <url><loc>${appUrl}/tv</loc><lastmod>${today}</lastmod><priority>0.9</priority></url>
  <url><loc>${appUrl}/anime</loc><lastmod>${today}</lastmod><priority>0.9</priority></url>
${movieUrls}
${tvUrls}
</urlset>`;
      return new Response(xml, {
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      });
    }

    // -------------------------------------------------------------
    // 12. STATIC ASSETS FALLBACK (Vite SPA HTML / CSS / JS / Images)
    // -------------------------------------------------------------
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  },
};
