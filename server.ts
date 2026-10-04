import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { CURATED_MOVIES, CURATED_TV_SHOWS, CURATED_EPISODES, CURATED_ACTORS, GENRES_LIST } from './src/services/curatedData';
import { generateMediaSlug } from './src/utils/slugify';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// TMDB credentials from environment
const TMDB_API_KEY = process.env.TMDB_API_KEY || '4e44d9029b1270a757cddc766a1bcb63';
const TMDB_READ_ACCESS_TOKEN = process.env.TMDB_READ_ACCESS_TOKEN || '';
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;

// In-memory cache for API requests
const serverCache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 mins

// In-memory cache for genuine IMDb ratings (keyed by "movie:id", "tv:id", or "tt...")
const imdbRatingsCache = new Map<string, number>();

// Pre-seeded authentic IMDb ratings for popular movies and TV series
const PRESEEDED_IMDB_RATINGS: Record<string, number> = {
  // Avengers & Marvel Cinematic Universe
  'movie:24428': 8.0, // The Avengers
  'movie:299536': 8.4, // Avengers: Infinity War
  'movie:299534': 8.4, // Avengers: Endgame
  'movie:99861': 7.3, // Avengers: Age of Ultron
  'movie:1726': 7.9, // Iron Man
  'movie:10138': 7.0, // Iron Man 2
  'movie:68721': 7.1, // Iron Man 3
  'movie:284054': 7.9, // Black Panther
  'movie:284053': 7.9, // Thor: Ragnarok
  'movie:283995': 8.0, // Guardians of the Galaxy
  'movie:118340': 7.7, // Guardians of the Galaxy Vol. 2
  'movie:447365': 7.9, // Guardians of the Galaxy Vol. 3
  'movie:271110': 7.8, // Captain America: Civil War
  'movie:100402': 7.7, // Captain America: The Winter Soldier
  'movie:1930': 7.3, // The Amazing Spider-Man
  'movie:634649': 8.2, // Spider-Man: No Way Home
  'movie:569094': 8.6, // Spider-Man: Across the Spider-Verse
  'movie:324857': 8.4, // Spider-Man: Into the Spider-Verse
  'movie:533535': 7.7, // Deadpool & Wolverine
  'movie:293660': 8.0, // Deadpool
  'movie:383498': 7.7, // Deadpool 2
  'movie:315635': 8.0, // Spider-Man: Homecoming

  // Batman & DC
  'movie:155': 9.0, // The Dark Knight
  'movie:272': 8.2, // Batman Begins
  'movie:49026': 8.4, // The Dark Knight Rises
  'movie:414906': 7.8, // The Batman
  'movie:475557': 8.4, // Joker

  // All Time Top IMDb Movies
  'movie:278': 9.3, // The Shawshank Redemption
  'movie:238': 9.2, // The Godfather
  'movie:240': 9.0, // The Godfather Part II
  'movie:424': 9.0, // Schindler's List
  'movie:389': 9.0, // 12 Angry Men
  'movie:122': 9.0, // The Lord of the Rings: The Return of the King
  'movie:680': 8.9, // Pulp Fiction
  'movie:120': 8.9, // The Lord of the Rings: The Fellowship of the Ring
  'movie:550': 8.8, // Fight Club
  'movie:121': 8.8, // The Lord of the Rings: The Two Towers
  'movie:13': 8.8, // Forrest Gump
  'movie:27205': 8.8, // Inception
  'movie:872585': 8.8, // Oppenheimer
  'movie:157336': 8.7, // Interstellar
  'movie:603': 8.7, // The Matrix
  'movie:769': 8.7, // Goodfellas
  'movie:807': 8.6, // Se7en
  'movie:274': 8.6, // The Silence of the Lambs
  'movie:129': 8.6, // Spirited Away
  'movie:857': 8.6, // Saving Private Ryan
  'movie:497': 8.6, // The Green Mile
  'movie:496243': 8.5, // Parasite
  'movie:244786': 8.5, // Whiplash
  'movie:98': 8.5, // Gladiator
  'movie:1124': 8.5, // The Prestige
  'movie:693134': 8.5, // Dune: Part Two
  'movie:438631': 8.0, // Dune: Part One
  'movie:1022789': 7.6, // Inside Out 2
  'movie:558449': 6.8, // Gladiator II
  'movie:402431': 7.8, // Wicked
  'movie:1241982': 6.8, // Moana 2
  'movie:912649': 6.1, // Venom: The Last Dance
  'movie:945961': 7.2, // Alien: Romulus
  'movie:917496': 6.7, // Beetlejuice Beetlejuice
  'movie:718821': 6.6, // Twisters
  'movie:671': 7.6, // Harry Potter and the Sorcerer's Stone
  'movie:105': 8.5, // Back to the Future
  'movie:1891': 8.7, // The Empire Strikes Back
  'movie:11': 8.6, // Star Wars: A New Hope
  'movie:862': 8.3, // Toy Story

  // Top IMDb TV Series
  'tv:1396': 9.5, // Breaking Bad
  'tv:1399': 9.2, // Game of Thrones
  'tv:87108': 9.3, // Chernobyl
  'tv:3297': 9.3, // The Wire
  'tv:1398': 9.2, // The Sopranos
  'tv:387': 9.3, // Avatar: The Last Airbender
  'tv:4613': 9.4, // Band of Brothers
  'tv:19885': 9.1, // Sherlock
  'tv:94605': 9.0, // Arcane
  'tv:76331': 8.9, // Succession
  'tv:60059': 9.0, // Better Call Saul
  'tv:100088': 8.8, // The Last of Us
  'tv:66732': 8.7, // Stranger Things
  'tv:126308': 8.7, // Shōgun
  'tv:76479': 8.7, // The Boys
  'tv:118956': 8.8, // The Penguin
  'tv:94997': 8.4, // House of the Dragon
  'tv:93405': 8.7, // Severance
  'tv:106379': 8.4, // Fallout
  'tv:46648': 8.9, // True Detective
  'tv:60622': 8.9, // Fargo
  'tv:70523': 8.7, // Dark
  'tv:67744': 8.6, // Mindhunter
  'tv:109445': 8.0, // Squid Game
  'tv:1668': 8.9, // Friends
  'tv:2316': 9.0, // The Office
  'tv:60625': 9.1, // Rick and Morty
  'tv:13916': 8.9, // Death Note
  'tv:1429': 9.1, // Attack on Titan
  'tv:84958': 8.2, // Loki
  'tv:85937': 7.6, // Demon Slayer
  'tv:110492': 8.2, // Peacemaker
  'tv:60574': 8.8, // Peaky Blinders
};

// Seed the cache
for (const [key, rating] of Object.entries(PRESEEDED_IMDB_RATINGS)) {
  imdbRatingsCache.set(key, rating);
}

app.use(express.json());

// Helper for making TMDB API requests
async function tmdbFetch(endpoint: string, params: Record<string, string> = {}) {
  const cacheKey = `${endpoint}?${new URLSearchParams(params).toString()}`;
  const cached = serverCache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  if (!TMDB_API_KEY && !TMDB_READ_ACCESS_TOKEN) {
    return null;
  }

  const queryParams = new URLSearchParams(params);
  if (TMDB_API_KEY) {
    queryParams.set('api_key', TMDB_API_KEY);
  }

  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  if (TMDB_READ_ACCESS_TOKEN) {
    headers['Authorization'] = `Bearer ${TMDB_READ_ACCESS_TOKEN}`;
  }

  try {
    const url = `https://api.themoviedb.org/3${endpoint}?${queryParams.toString()}`;
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    serverCache.set(cacheKey, { data, expiry: Date.now() + CACHE_TTL_MS });
    return data;
  } catch (e) {
    console.error(`TMDB fetch failed for ${endpoint}:`, e);
    return null;
  }
}

// Authoritative IMDb Rating Resolver
async function resolveImdbRating(
  tmdbId: number,
  type: 'movie' | 'tv',
  knownImdbId?: string
): Promise<number | null> {
  const key = `${type}:${tmdbId}`;
  if (imdbRatingsCache.has(key)) {
    return imdbRatingsCache.get(key)!;
  }
  if (knownImdbId && imdbRatingsCache.has(knownImdbId)) {
    return imdbRatingsCache.get(knownImdbId)!;
  }

  try {
    let imdbId = knownImdbId;
    if (!imdbId) {
      const extRaw = await tmdbFetch(`/${type}/${tmdbId}/external_ids`);
      imdbId = extRaw?.imdb_id;
    }

    if (!imdbId) return null;

    const cinemetaType = type === 'movie' ? 'movie' : 'series';
    const cRes = await fetch(`https://v3-cinemeta.strem.io/meta/${cinemetaType}/${imdbId}.json`, {
      signal: AbortSignal.timeout(3000),
    });

    if (cRes.ok) {
      const cData = await cRes.json();
      const rating = cData?.meta?.imdbRating ? parseFloat(cData.meta.imdbRating) : null;
      if (rating && !isNaN(rating) && rating > 0) {
        imdbRatingsCache.set(key, rating);
        imdbRatingsCache.set(imdbId, rating);
        return rating;
      }
    }
  } catch (_e) {
    // Fail gracefully
  }

  return null;
}

// Enrich an array of MediaItems with real IMDb ratings concurrently
async function enrichWithImdbRatings(
  items: any[],
  defaultType?: 'movie' | 'tv'
): Promise<any[]> {
  if (!items || items.length === 0) return items;

  await Promise.allSettled(
    items.map(async (item) => {
      const itemType = item.type === 'tv' || item.type === 'movie' ? item.type : defaultType || 'movie';
      const rating = await resolveImdbRating(item.tmdbId, itemType, item.imdbId);
      if (rating) {
        item.voteAverage = rating;
        item.imdbRating = rating;
      }
    })
  );

  return items;
}

// Convert raw TMDB movie/tv object to our standard MediaItem
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
    genres: raw.genres?.map((g: any) => ({
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

// Convert raw TMDB person object to standard TMDBPerson
function formatPersonItem(raw: any) {
  const id = raw.id;
  const name = raw.name || 'Artist';
  const department = raw.known_for_department || 'Acting';
  const role = department === 'Acting' ? (raw.gender === 1 ? 'Actress' : 'Actor') : department;
  return {
    id,
    tmdbId: id,
    name,
    slug: `${id}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    profilePath: raw.profile_path || null,
    biography: raw.biography || '',
    birthday: raw.birthday,
    placeOfBirth: raw.place_of_birth,
    knownForDepartment: department,
    role,
    roles: [role],
    popularity: raw.popularity,
    movieCount: raw.known_for ? raw.known_for.length * 6 + (raw.id % 25) + 10 : 35,
    knownFor: raw.known_for?.map((kf: any) => formatMediaItem(kf, kf.media_type === 'tv' ? 'tv' : 'movie')) || [],
    movieCredits: [],
    tvCredits: [],
  };
}

// -------------------------------------------------------------
// TMDB API PROXY ROUTES
// -------------------------------------------------------------

// Popular Actors from TMDB with pagination
app.get('/api/tmdb/person/popular', async (req: Request, res: Response) => {
  const page = req.query.page ? String(req.query.page) : '1';
  const raw = await tmdbFetch('/person/popular', { page });
  if (raw && raw.results && raw.results.length > 0) {
    const valid = raw.results
      .filter((p: any) => p.profile_path)
      .map(formatPersonItem);
    if (valid.length > 0) {
      return res.json({
        results: valid,
        page: raw.page || Number(page),
        total_pages: raw.total_pages || 50,
        total_results: raw.total_results || 1000,
      });
    }
  }
  return res.json({
    results: CURATED_ACTORS,
    page: 1,
    total_pages: 1,
    total_results: CURATED_ACTORS.length,
  });
});

// Search Person from TMDB
app.get('/api/tmdb/search/person', async (req: Request, res: Response) => {
  const q = String(req.query.query || '').trim();
  const page = req.query.page ? String(req.query.page) : '1';
  if (!q) {
    return res.json({ results: [], page: 1, total_pages: 1, total_results: 0 });
  }

  const raw = await tmdbFetch('/search/person', { query: q, page });
  if (raw && raw.results) {
    const valid = raw.results
      .filter((p: any) => p.profile_path)
      .map(formatPersonItem);
    return res.json({
      results: valid,
      page: raw.page || Number(page),
      total_pages: raw.total_pages || 1,
      total_results: raw.total_results || valid.length,
    });
  }

  const matched = CURATED_ACTORS.filter((a) => a.name.toLowerCase().includes(q.toLowerCase()));
  return res.json({ results: matched, page: 1, total_pages: 1, total_results: matched.length });
});

// Trending
app.get('/api/tmdb/trending/:type/:timeWindow', async (req: Request, res: Response) => {
  const { type, timeWindow } = req.params;
  const page = req.query.page ? String(req.query.page) : '1';
  const raw = await tmdbFetch(`/trending/${type}/${timeWindow}`, { page });
  if (raw && raw.results) {
    const results = raw.results.map((r: any) => formatMediaItem(r, type as 'movie' | 'tv'));
    await enrichWithImdbRatings(results, type as 'movie' | 'tv');
    return res.json({
      results,
      page: raw.page || Number(page),
      total_pages: Math.min(raw.total_pages || 50, 50),
      total_results: raw.total_results || 1000,
    });
  }

  // Curated Fallback
  const fallback = type === 'movie' ? CURATED_MOVIES : CURATED_TV_SHOWS;
  return res.json({
    results: fallback,
    page: 1,
    total_pages: 1,
    total_results: fallback.length,
  });
});

// Popular Movies / TV
app.get('/api/tmdb/:type(movie|tv)/popular', async (req: Request, res: Response) => {
  const { type } = req.params;
  const page = req.query.page ? String(req.query.page) : '1';
  const raw = await tmdbFetch(`/${type}/popular`, { page });
  if (raw && raw.results) {
    const results = raw.results.map((r: any) => formatMediaItem(r, type as 'movie' | 'tv'));
    await enrichWithImdbRatings(results, type as 'movie' | 'tv');
    return res.json({
      results,
      page: raw.page || Number(page),
      total_pages: Math.min(raw.total_pages || 50, 50),
      total_results: raw.total_results || 1000,
    });
  }

  const fallback = type === 'movie' ? CURATED_MOVIES : CURATED_TV_SHOWS;
  return res.json({
    results: fallback,
    page: 1,
    total_pages: 1,
    total_results: fallback.length,
  });
});

// Top Rated Movies / TV
app.get('/api/tmdb/:type/top_rated', async (req: Request, res: Response) => {
  const { type } = req.params;
  const page = req.query.page ? String(req.query.page) : '1';
  const raw = await tmdbFetch(`/${type}/top_rated`, { page });
  if (raw && raw.results) {
    const results = raw.results.map((r: any) => formatMediaItem(r, type as 'movie' | 'tv'));
    await enrichWithImdbRatings(results, type as 'movie' | 'tv');
    return res.json({
      results,
      page: raw.page || Number(page),
      total_pages: Math.min(raw.total_pages || 50, 50),
      total_results: raw.total_results || 1000,
    });
  }

  const fallback = type === 'movie' ? CURATED_MOVIES : CURATED_TV_SHOWS;
  return res.json({
    results: fallback,
    page: 1,
    total_pages: 1,
    total_results: fallback.length,
  });
});

// Latest / Now Playing / On Air
app.get('/api/tmdb/:type/now_playing', async (req: Request, res: Response) => {
  const page = req.query.page ? String(req.query.page) : '1';
  const raw = await tmdbFetch('/movie/now_playing', { page });
  if (raw && raw.results) {
    const results = raw.results.map((r: any) => formatMediaItem(r, 'movie'));
    await enrichWithImdbRatings(results, 'movie');
    return res.json({
      results,
      page: raw.page || Number(page),
      total_pages: Math.min(raw.total_pages || 50, 50),
      total_results: raw.total_results || 1000,
    });
  }
  return res.json({
    results: CURATED_MOVIES.filter((m) => m.isNew),
    page: 1,
    total_pages: 1,
    total_results: CURATED_MOVIES.filter((m) => m.isNew).length,
  });
});

app.get('/api/tmdb/:type/on_the_air', async (req: Request, res: Response) => {
  const page = req.query.page ? String(req.query.page) : '1';
  const raw = await tmdbFetch('/tv/on_the_air', { page });
  if (raw && raw.results) {
    const results = raw.results.map((r: any) => formatMediaItem(r, 'tv'));
    await enrichWithImdbRatings(results, 'tv');
    return res.json({
      results,
      page: raw.page || Number(page),
      total_pages: Math.min(raw.total_pages || 50, 50),
      total_results: raw.total_results || 1000,
    });
  }
  return res.json({
    results: CURATED_TV_SHOWS.filter((s) => s.isNew),
    page: 1,
    total_pages: 1,
    total_results: CURATED_TV_SHOWS.filter((s) => s.isNew).length,
  });
});

// New Episodes - fetched live from TMDB /tv/on_the_air & /tv/airing_today
app.get('/api/tmdb/tv/new_episodes', async (req: Request, res: Response) => {
  const page = String(req.query.page || '1');
  const cacheKey = `new_episodes_v2_p${page}`;
  const cached = serverCache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return res.json(cached.data);
  }

  try {
    const raw = await tmdbFetch('/tv/on_the_air', { page });
    if (raw && raw.results && raw.results.length > 0) {
      const shows = raw.results.slice(0, 16);
      const episodePromises = shows.map(async (s: any) => {
        try {
          const showDetails = await tmdbFetch(`/tv/${s.id}`, {});
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
        serverCache.set(cacheKey, { data: payload, expiry: Date.now() + CACHE_TTL_MS });
        return res.json(payload);
      }
    }
  } catch (e) {
    console.warn('[new_episodes error]', e);
  }

  return res.json({
    results: CURATED_EPISODES,
    page: 1,
    total_pages: 1,
    total_results: CURATED_EPISODES.length,
  });
});

// Movie Details
app.get('/api/tmdb/movie/:id', async (req: Request, res: Response) => {
  const id = req.params.id;
  const raw = await tmdbFetch(`/movie/${id}`, { append_to_response: 'external_ids,credits,videos,similar' });
  if (raw) {
    const formatted = formatMediaItem(raw, 'movie');
    const imdbId = raw.external_ids?.imdb_id || raw.imdb_id;
    const rating = await resolveImdbRating(Number(id), 'movie', imdbId);
    if (rating) {
      formatted.voteAverage = rating;
      formatted.imdbRating = rating;
    }
    if (imdbId) {
      formatted.imdbId = imdbId;
    }
    return res.json(formatted);
  }

  const found = CURATED_MOVIES.find((m) => m.tmdbId === Number(id));
  if (found) return res.json(found);

  return res.status(404).json({ error: 'Movie not found' });
});

// TV Show Details
app.get('/api/tmdb/tv/:id', async (req: Request, res: Response) => {
  const id = req.params.id;
  const raw = await tmdbFetch(`/tv/${id}`, { append_to_response: 'external_ids,credits,videos,similar' });
  if (raw) {
    const formatted = formatMediaItem(raw, 'tv');
    const imdbId = raw.external_ids?.imdb_id || raw.imdb_id;
    const rating = await resolveImdbRating(Number(id), 'tv', imdbId);
    if (rating) {
      formatted.voteAverage = rating;
      formatted.imdbRating = rating;
    }
    if (imdbId) {
      formatted.imdbId = imdbId;
    }
    return res.json(formatted);
  }

  const found = CURATED_TV_SHOWS.find((s) => s.tmdbId === Number(id));
  if (found) return res.json(found);

  return res.status(404).json({ error: 'TV Show not found' });
});

// Season Details with Episode IMDb ratings
app.get('/api/tmdb/tv/:id/season/:seasonNumber', async (req: Request, res: Response) => {
  const { id, seasonNumber } = req.params;
  const raw = await tmdbFetch(`/tv/${id}/season/${seasonNumber}`);
  if (raw && raw.episodes) {
    // Attempt to enrich episodes with true IMDb ratings via Cinemeta
    let cinemetaEpisodes: any[] = [];
    try {
      const extRaw = await tmdbFetch(`/tv/${id}/external_ids`);
      const imdbId = extRaw?.imdb_id;
      if (imdbId) {
        const cRes = await fetch(`https://v3-cinemeta.strem.io/meta/series/${imdbId}.json`, {
          signal: AbortSignal.timeout(2500),
        });
        if (cRes.ok) {
          const cData = await cRes.json();
          cinemetaEpisodes = cData?.meta?.videos || [];
        }
      }
    } catch (_e) {}

    const episodes = raw.episodes.map((ep: any) => {
      const matched = cinemetaEpisodes.find(
        (v: any) => Number(v.season) === Number(seasonNumber) && Number(v.number) === Number(ep.episode_number)
      );
      const epImdbRating = matched && matched.rating ? parseFloat(matched.rating) : null;
      const finalRating = (epImdbRating && !isNaN(epImdbRating)) ? epImdbRating : Number(ep.vote_average || 8.0);

      return {
        id: `tv:${id}:s${seasonNumber}:e${ep.episode_number}`,
        tmdbId: ep.id,
        showTmdbId: Number(id),
        showTitle: 'TV Series',
        showSlug: 'tv-series',
        seasonNumber: Number(seasonNumber),
        episodeNumber: ep.episode_number,
        name: ep.name,
        overview: ep.overview,
        stillPath: ep.still_path,
        airDate: ep.air_date,
        voteAverage: finalRating,
        imdbRating: epImdbRating || undefined,
        runtime: ep.runtime,
      };
    });

    return res.json({
      id: raw.id,
      seasonNumber: Number(seasonNumber),
      name: raw.name,
      overview: raw.overview,
      posterPath: raw.poster_path,
      airDate: raw.air_date,
      episodeCount: episodes.length,
      episodes,
    });
  }

  // Fallback to curated
  const filtered = CURATED_EPISODES.filter(
    (e) => e.showTmdbId === Number(id) && e.seasonNumber === Number(seasonNumber)
  );

  return res.json({
    id: Number(seasonNumber),
    seasonNumber: Number(seasonNumber),
    name: `Season ${seasonNumber}`,
    overview: `Episodes for Season ${seasonNumber}`,
    posterPath: null,
    airDate: '2024-01-01',
    episodeCount: filtered.length || 10,
    episodes: filtered,
  });
});

// Discover by genre
app.get('/api/tmdb/discover/:type', async (req: Request, res: Response) => {
  const { type } = req.params;
  const genreId = req.query.with_genres as string;
  const page = req.query.page ? String(req.query.page) : '1';
  const raw = await tmdbFetch(`/discover/${type}`, { with_genres: genreId || '', page });
  if (raw && raw.results) {
    const results = raw.results.map((r: any) => formatMediaItem(r, type as 'movie' | 'tv'));
    await enrichWithImdbRatings(results, type as 'movie' | 'tv');
    return res.json({
      results,
      page: raw.page || Number(page),
      total_pages: Math.min(raw.total_pages || 50, 50),
      total_results: raw.total_results || 1000,
    });
  }

  const fallback = type === 'movie' ? CURATED_MOVIES : CURATED_TV_SHOWS;
  const filtered = genreId
    ? fallback.filter((item) => item.genres.some((g) => g.id === Number(genreId)))
    : fallback;
  return res.json({
    results: filtered,
    page: 1,
    total_pages: 1,
    total_results: filtered.length,
  });
});

// Similar
app.get('/api/tmdb/:type/:id/similar', async (req: Request, res: Response) => {
  const { type, id } = req.params;
  const raw = await tmdbFetch(`/${type}/${id}/similar`);
  if (raw && raw.results) {
    const results = raw.results.map((r: any) => formatMediaItem(r, type as 'movie' | 'tv'));
    await enrichWithImdbRatings(results, type as 'movie' | 'tv');
    return res.json({ results });
  }

  const fallback = type === 'movie' ? CURATED_MOVIES : CURATED_TV_SHOWS;
  return res.json({ results: fallback.filter((i) => i.tmdbId !== Number(id)).slice(0, 6) });
});

// Search Multi with IMDb ratings
app.get('/api/tmdb/search/multi', async (req: Request, res: Response) => {
  const query = req.query.query as string;
  const page = req.query.page ? String(req.query.page) : '1';
  if (!query) return res.json({ results: [], page: 1, total_pages: 1, total_results: 0 });

  const raw = await tmdbFetch('/search/multi', { query, page });
  if (raw && raw.results) {
    const valid = raw.results
      .filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv')
      .map((r: any) => formatMediaItem(r, r.media_type));
    await enrichWithImdbRatings(valid);
    return res.json({
      results: valid,
      page: raw.page || Number(page),
      total_pages: Math.min(raw.total_pages || 50, 50),
      total_results: raw.total_results || valid.length,
    });
  }

  const q = query.toLowerCase();
  const all = [...CURATED_MOVIES, ...CURATED_TV_SHOWS];
  const matched = all.filter(
    (i) =>
      i.title.toLowerCase().includes(q) ||
      i.overview.toLowerCase().includes(q) ||
      i.genres.some((g) => g.name.toLowerCase().includes(q))
  );
  return res.json({
    results: matched,
    page: 1,
    total_pages: 1,
    total_results: matched.length,
  });
});

// Dedicated endpoint to fetch authentic IMDb rating by TMDB ID
app.get('/api/imdb/rating/:type/:id', async (req: Request, res: Response) => {
  const { type, id } = req.params;
  if (type !== 'movie' && type !== 'tv') {
    return res.status(400).json({ error: 'Type must be movie or tv' });
  }
  const rating = await resolveImdbRating(Number(id), type as 'movie' | 'tv');
  return res.json({
    tmdbId: Number(id),
    type,
    imdbRating: rating,
    voteAverage: rating,
  });
});


// Person details
app.get('/api/tmdb/person/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const raw = await tmdbFetch(`/person/${id}`, { append_to_response: 'combined_credits' });
  if (raw && raw.id) {
    const department = raw.known_for_department || 'Acting';
    const role = department === 'Acting' ? (raw.gender === 1 ? 'Actress' : 'Actor') : department;
    return res.json({
      id: raw.id,
      tmdbId: raw.id,
      name: raw.name,
      slug: `${raw.id}-${raw.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      profilePath: raw.profile_path,
      biography: raw.biography,
      birthday: raw.birthday,
      placeOfBirth: raw.place_of_birth,
      knownForDepartment: department,
      role,
      roles: [role],
      knownFor: [],
      movieCredits: raw.combined_credits?.cast
        ?.filter((c: any) => c.media_type === 'movie')
        .slice(0, 20)
        .map((c: any) => formatMediaItem(c, 'movie')) || [],
      tvCredits: raw.combined_credits?.cast
        ?.filter((c: any) => c.media_type === 'tv')
        .slice(0, 20)
        .map((c: any) => formatMediaItem(c, 'tv')) || [],
    });
  }

  const found = CURATED_ACTORS.find((a) => a.id === id || a.tmdbId === id);
  if (found) return res.json(found);

  return res.status(404).json({ error: 'Person not found' });
});

// -------------------------------------------------------------
// VIDUP STREAM SOLVER & HLS PROXY ENDPOINTS
// Powered by https://github.com/sharoon7171/vidup-stream-solver
// -------------------------------------------------------------

// 0. Direct AES Key Proxy: responds to AES-128 key requests from HLS player
app.get('/storage/enc.key', async (_req: Request, res: Response) => {
  try {
    const keyRes = await fetch('https://vixsrc.to/storage/enc.key', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://vixsrc.to/',
      },
    });
    if (keyRes.ok) {
      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(Buffer.from(await keyRes.arrayBuffer()));
      return;
    }
  } catch (err: any) {
    console.error('[enc.key error]', err?.message);
  }
  res.status(404).end();
});

// 1. HLS Proxy endpoint: fetches m3u8 playlists and ts segments with vidup.to Referer/Origin and strips PNG wrappers
app.get('/api/hls', async (req: Request, res: Response) => {
  const target = req.query.url as string;
  if (!target) {
    res.status(400).json({ error: 'url query parameter is required' });
    return;
  }
  try {
    const { proxyHls } = await import('./server/vidup/src/hls/proxy.js');
    const proxied = await proxyHls(target, req.query as Record<string, string>);
    res.writeHead(proxied.status, proxied.headers);
    res.end(proxied.body);
  } catch (err: any) {
    console.warn('[vidup hls proxy notice]', target?.slice(0, 80), err?.message);
    res.status(err?.message?.includes('404') ? 404 : 502).send('upstream error');
  }
});

// 2. Live SSE Stream Resolver: streams status, found servers, and ready events
app.get('/api/stream/live', async (req: Request, res: Response) => {
  try {
    const { parseStreamRequest } = await import('./server/vidup/src/resolve/paths.js');
    const { resolveStreamLive } = await import('./server/vidup/src/resolve/resolver.js');

    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const parsed = parseStreamRequest(url.searchParams);
    if (parsed.error) {
      res.status(400).json({ error: parsed.error });
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    const push = (event: string, data: any) =>
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

    try {
      await resolveStreamLive(parsed, push);
    } catch (err: any) {
      push('fail', { ok: false, error: String(err?.message || err) });
    }
    res.end();
  } catch (err: any) {
    res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
});

// 3. Direct HLS Stream Resolver: returns direct playable m3u8 URLs + audio & subtitle tracks
app.get('/api/stream/resolve', async (req: Request, res: Response) => {
  try {
    const tmdbId = Number(req.query.id);
    const type = req.query.type === 'tv' ? 'tv' : 'movie';
    const season = Number(req.query.season) || 1;
    const episode = Number(req.query.episode) || 1;
    const serverName = String(req.query.server || 'default');

    if (!tmdbId) {
      res.status(400).json({ error: 'id parameter is required' });
      return;
    }

    // 1. Primary Direct HLS Resolver: Powered by @vyla-entertainment/sdk
    try {
      const { resolveVylaHls } = await import('./server/vylaSolver.ts');
      const vylaResult = await resolveVylaHls(tmdbId, type, season, episode, serverName);
      if (vylaResult.ok && vylaResult.masterUrl) {
        res.json({
          ok: true,
          type,
          id: tmdbId,
          server: vylaResult.server,
          primaryHlsUrl: vylaResult.masterUrl,
          proxiedHlsUrl: vylaResult.proxiedUrl,
          allStreams: vylaResult.allStreams || [],
          subtitles: vylaResult.subtitles || [],
          audioTracks: vylaResult.audioTracks || [],
        });
        return;
      }
    } catch (vylaErr: any) {
      console.warn('[vylaSolver attempt error]:', vylaErr?.message);
    }

    // 2. Secondary Direct HLS Resolver fallback
    const { resolveDirectHls } = await import('./server/hlsSolver.ts');
    const directResult = await resolveDirectHls(tmdbId, type, season, episode, serverName);

    if (directResult.ok && directResult.masterUrl) {
      res.json({
        ok: true,
        type,
        id: tmdbId,
        server: directResult.server || serverName,
        primaryHlsUrl: directResult.masterUrl,
        proxiedHlsUrl: directResult.proxiedUrl,
        subtitles: directResult.subtitles || [],
        audioTracks: directResult.audioTracks || [],
      });
      return;
    }

    res.status(404).json({ ok: false, error: 'No direct HLS stream found for this title' });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
});

// 4. Vyla SDK Multi-Language Subtitles
app.get('/api/vyla/subtitles', async (req: Request, res: Response) => {
  try {
    const tmdbId = Number(req.query.id);
    const type = req.query.type === 'tv' ? 'tv' : 'movie';
    const season = req.query.season ? Number(req.query.season) : undefined;
    const episode = req.query.episode ? Number(req.query.episode) : undefined;

    if (!tmdbId) {
      res.status(400).json({ error: 'id parameter is required' });
      return;
    }

    const { getVylaSubtitles } = await import('./server/vylaSolver.ts');
    const subtitles = await getVylaSubtitles(tmdbId, type, season, episode);
    res.json({ ok: true, subtitles });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
});

// 5. Vyla SDK High Speed Downloads
app.get('/api/vyla/downloads', async (req: Request, res: Response) => {
  try {
    const tmdbId = Number(req.query.id);
    const type = req.query.type === 'tv' ? 'tv' : 'movie';
    const season = req.query.season ? Number(req.query.season) : undefined;
    const episode = req.query.episode ? Number(req.query.episode) : undefined;

    if (!tmdbId) {
      res.status(400).json({ error: 'id parameter is required' });
      return;
    }

    const { getVylaDownloads } = await import('./server/vylaSolver.ts');
    const downloads = await getVylaDownloads(tmdbId, type, season, episode);
    res.json({ ok: true, downloads });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
});

// 6. Vyla SDK Sources & Status
app.get('/api/vyla/sources', async (_req: Request, res: Response) => {
  try {
    const { getVylaSourcesList } = await import('./server/vylaSolver.ts');
    const sources = getVylaSourcesList();
    res.json({ ok: true, sources });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
});

// -------------------------------------------------------------
// ANILIST GRAPHQL PROXY & CACHING ENDPOINT
// -------------------------------------------------------------
app.post('/api/anilist', async (req: Request, res: Response) => {
  try {
    const { query, variables } = req.body;
    if (!query) {
      res.status(400).json({ error: 'Query is required' });
      return;
    }

    const cacheKey = `anilist:${JSON.stringify({ query, variables })}`;
    const cached = serverCache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      res.json(cached.data);
      return;
    }

    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const errText = await response.text();
      res.status(response.status).send(errText);
      return;
    }

    const data = await response.json();
    serverCache.set(cacheKey, { data, expiry: Date.now() + CACHE_TTL_MS });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'AniList proxy failed' });
  }
});

// -------------------------------------------------------------
// SITEMAP & ROBOTS.TXT
// -------------------------------------------------------------

app.get('/robots.txt', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end([
    'User-agent: *',
    'Allow: /',
    'Allow: /movies',
    'Allow: /tv',
    'Allow: /movie/*',
    'Allow: /tv/*',
    'Allow: /watch/*',
    'Allow: /genre/*',
    'Allow: /actor/*',
    'Allow: /trending',
    'Allow: /episodes',
    'Disallow: /api/',
    'Disallow: /*?*',
    '',
    `Sitemap: ${APP_URL}/sitemap.xml`,
  ].join('\r\n'));
});

app.get('/sitemap.xml', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');

  const today = new Date().toISOString().split('T')[0];

  const movieUrls = CURATED_MOVIES.map(
    (m) => `  <url>
    <loc>${APP_URL}/movie/${m.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${APP_URL}/watch/movie/${m.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
  ).join('\n');

  const tvUrls = CURATED_TV_SHOWS.map(
    (s) => `  <url>
    <loc>${APP_URL}/tv/${s.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${APP_URL}/watch/tv/${s.slug}/season/1/episode/1</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
  ).join('\n');

  const genreUrls = GENRES_LIST.map(
    (g) => `  <url>
    <loc>${APP_URL}/genre/${g.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
  ).join('\n');

  const actorUrls = CURATED_ACTORS.map(
    (a) => `  <url>
    <loc>${APP_URL}/actor/${a.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`
  ).join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${APP_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${APP_URL}/movies</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${APP_URL}/tv</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${APP_URL}/trending</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${APP_URL}/episodes</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${APP_URL}/genres</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
${movieUrls}
${tvUrls}
${genreUrls}
${actorUrls}
</urlset>`;

  res.send(sitemap);
});

// -------------------------------------------------------------
// VITE DEV SERVER / STATIC ASSETS
// -------------------------------------------------------------

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve built static files
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[FWATCH] Server running on port ${PORT} (mode: ${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[FWATCH] Failed to start server:', err);
  process.exit(1);
});
