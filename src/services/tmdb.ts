import { MediaItem, TMDBEpisode, TMDBSeason, TMDBPerson, TMDBGenre } from '../types';
import { CURATED_MOVIES, CURATED_TV_SHOWS, CURATED_EPISODES, CURATED_ACTORS, GENRES_LIST } from './curatedData';
import { parseSlug, generateMediaSlug, slugify } from '../utils/slugify';

// In-memory cache for client requests
const clientCache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

async function fetchFromApi<T>(endpoint: string): Promise<T | null> {
  const cacheKey = endpoint;
  const cached = clientCache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return cached.data as T;
  }

  try {
    const res = await fetch(`/api/tmdb${endpoint}`);
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    clientCache.set(cacheKey, { data, expiry: Date.now() + CACHE_TTL_MS });
    return data as T;
  } catch {
    return null;
  }
}

// Internal slug registry to ensure canonical mapping between slugs and TMDB IDs
const slugToTmdbIdMap = new Map<string, { id: number; type: 'movie' | 'tv' }>();

// Populate registry with curated items
[...CURATED_MOVIES].forEach((m) => {
  slugToTmdbIdMap.set(`movie:${m.slug}`, { id: m.tmdbId, type: 'movie' });
  slugToTmdbIdMap.set(`movie:${slugify(m.title)}`, { id: m.tmdbId, type: 'movie' });
});
[...CURATED_TV_SHOWS].forEach((s) => {
  slugToTmdbIdMap.set(`tv:${s.slug}`, { id: s.tmdbId, type: 'tv' });
  slugToTmdbIdMap.set(`tv:${slugify(s.title)}`, { id: s.tmdbId, type: 'tv' });
});

export interface PaginatedResult<T> {
  results: T[];
  page: number;
  totalPages: number;
  totalResults: number;
}

export const tmdbService = {
  getGenres(): TMDBGenre[] {
    return GENRES_LIST;
  },

  async getTrendingMovies(timeWindow: 'day' | 'week' = 'day'): Promise<MediaItem[]> {
    const apiData = await fetchFromApi<{ results: MediaItem[] }>(`/trending/movie/${timeWindow}`);
    if (apiData && apiData.results?.length > 0) {
      apiData.results.forEach((item) => {
        slugToTmdbIdMap.set(`movie:${item.slug}`, { id: item.tmdbId, type: 'movie' });
        slugToTmdbIdMap.set(`movie:${slugify(item.title)}`, { id: item.tmdbId, type: 'movie' });
      });
      return apiData.results;
    }
    return CURATED_MOVIES;
  },

  async getTrendingTV(timeWindow: 'day' | 'week' = 'day'): Promise<MediaItem[]> {
    const apiData = await fetchFromApi<{ results: MediaItem[] }>(`/trending/tv/${timeWindow}`);
    if (apiData && apiData.results?.length > 0) {
      apiData.results.forEach((item) => {
        slugToTmdbIdMap.set(`tv:${item.slug}`, { id: item.tmdbId, type: 'tv' });
        slugToTmdbIdMap.set(`tv:${slugify(item.title)}`, { id: item.tmdbId, type: 'tv' });
      });
      return apiData.results;
    }
    return CURATED_TV_SHOWS;
  },

  async getPopularMovies(): Promise<MediaItem[]> {
    const apiData = await fetchFromApi<{ results: MediaItem[] }>('/movie/popular');
    if (apiData && apiData.results?.length > 0) {
      return apiData.results;
    }
    return CURATED_MOVIES.slice().reverse();
  },

  async getPopularTV(): Promise<MediaItem[]> {
    const apiData = await fetchFromApi<{ results: MediaItem[] }>('/tv/popular');
    if (apiData && apiData.results?.length > 0) {
      return apiData.results;
    }
    return CURATED_TV_SHOWS.slice().reverse();
  },

  async getTopRatedMovies(): Promise<MediaItem[]> {
    const apiData = await fetchFromApi<{ results: MediaItem[] }>('/movie/top_rated');
    if (apiData && apiData.results?.length > 0) {
      return apiData.results;
    }
    return [...CURATED_MOVIES].sort((a, b) => b.voteAverage - a.voteAverage);
  },

  async getTopRatedTV(): Promise<MediaItem[]> {
    const apiData = await fetchFromApi<{ results: MediaItem[] }>('/tv/top_rated');
    if (apiData && apiData.results?.length > 0) {
      return apiData.results;
    }
    return [...CURATED_TV_SHOWS].sort((a, b) => b.voteAverage - a.voteAverage);
  },

  async getLatestMovies(): Promise<MediaItem[]> {
    const apiData = await fetchFromApi<{ results: MediaItem[] }>('/movie/now_playing');
    if (apiData && apiData.results?.length > 0) {
      return apiData.results;
    }
    return CURATED_MOVIES.filter((m) => m.isNew || parseInt(m.releaseDate.split('-')[0]) >= 2023);
  },

  async getLatestTV(): Promise<MediaItem[]> {
    const apiData = await fetchFromApi<{ results: MediaItem[] }>('/tv/on_the_air');
    if (apiData && apiData.results?.length > 0) {
      return apiData.results;
    }
    return CURATED_TV_SHOWS.filter((s) => s.isNew || s.status === 'Returning Series');
  },

  async getNewEpisodes(page: number = 1): Promise<TMDBEpisode[]> {
    const apiData = await fetchFromApi<{ results: TMDBEpisode[] }>(`/tv/new_episodes?page=${page}`);
    if (apiData && apiData.results?.length > 0) {
      return apiData.results;
    }
    return CURATED_EPISODES;
  },

  async getNewEpisodesPaginated(
    page: number = 1
  ): Promise<{ results: TMDBEpisode[]; totalPages: number; totalResults: number }> {
    const apiData = await fetchFromApi<{
      results: TMDBEpisode[];
      total_pages?: number;
      total_results?: number;
    }>(`/tv/new_episodes?page=${page}`);

    if (apiData && apiData.results?.length > 0) {
      return {
        results: apiData.results,
        totalPages: apiData.total_pages || 10,
        totalResults: apiData.total_results || 100,
      };
    }
    return {
      results: CURATED_EPISODES,
      totalPages: 1,
      totalResults: CURATED_EPISODES.length,
    };
  },

  async getByGenre(genreId: number, type: 'movie' | 'tv' = 'movie'): Promise<MediaItem[]> {
    const apiData = await fetchFromApi<{ results: MediaItem[] }>(`/discover/${type}?with_genres=${genreId}`);
    if (apiData && apiData.results?.length > 0) {
      return apiData.results;
    }
    const pool = type === 'movie' ? CURATED_MOVIES : CURATED_TV_SHOWS;
    return pool.filter((item) => item.genres.some((g) => g.id === genreId));
  },

  async getMovieByTmdbId(tmdbId: number): Promise<MediaItem | null> {
    const apiData = await fetchFromApi<MediaItem>(`/movie/${tmdbId}`);
    if (apiData) return apiData;

    return CURATED_MOVIES.find((m) => m.tmdbId === tmdbId) || null;
  },

  async getTvByTmdbId(tmdbId: number): Promise<MediaItem | null> {
    const apiData = await fetchFromApi<MediaItem>(`/tv/${tmdbId}`);
    if (apiData) return apiData;

    return CURATED_TV_SHOWS.find((s) => s.tmdbId === tmdbId) || null;
  },

  /**
   * Authoritative Slug Resolver:
   * 1. Check if slug has an embedded ID, e.g. "550-fight-club"
   * 2. Check internal slug registry
   * 3. Fallback to API resolution / search
   */
  async resolveMediaBySlug(type: 'movie' | 'tv', slug: string): Promise<MediaItem | null> {
    const { tmdbId, cleanSlug } = parseSlug(slug);

    if (tmdbId) {
      return type === 'movie'
        ? this.getMovieByTmdbId(tmdbId)
        : this.getTvByTmdbId(tmdbId);
    }

    // Check slug registry
    const registryKey = `${type}:${slug}`;
    const registered = slugToTmdbIdMap.get(registryKey) || slugToTmdbIdMap.get(`${type}:${cleanSlug}`);
    if (registered) {
      return type === 'movie'
        ? this.getMovieByTmdbId(registered.id)
        : this.getTvByTmdbId(registered.id);
    }

    // Search fallback
    const query = cleanSlug.replace(/-/g, ' ');
    const searchRes = await this.multiSearch(query);
    const match = searchRes.find((item) => item.type === type && (item.slug === slug || slugify(item.title) === cleanSlug));
    if (match) {
      slugToTmdbIdMap.set(registryKey, { id: match.tmdbId, type });
      return type === 'movie'
        ? this.getMovieByTmdbId(match.tmdbId)
        : this.getTvByTmdbId(match.tmdbId);
    }

    // Curated check
    const pool = type === 'movie' ? CURATED_MOVIES : CURATED_TV_SHOWS;
    const curated = pool.find((i) => i.slug === slug || slugify(i.title) === cleanSlug);
    return curated || null;
  },

  async getSeason(tvTmdbId: number, seasonNumber: number): Promise<TMDBSeason | null> {
    const apiData = await fetchFromApi<TMDBSeason>(`/tv/${tvTmdbId}/season/${seasonNumber}`);
    if (apiData) return apiData;

    const episodes = CURATED_EPISODES.filter((e) => e.showTmdbId === tvTmdbId && e.seasonNumber === seasonNumber);
    return {
      id: seasonNumber,
      seasonNumber,
      name: `Season ${seasonNumber}`,
      overview: `All episodes from Season ${seasonNumber}`,
      posterPath: null,
      airDate: '2023-01-01',
      episodeCount: episodes.length > 0 ? episodes.length : 10,
      episodes: episodes.length > 0 ? episodes : [
        {
          id: `tv:${tvTmdbId}:s${seasonNumber}:e1`,
          tmdbId: 100000 + seasonNumber,
          showTmdbId: tvTmdbId,
          showTitle: 'Series',
          showSlug: 'series',
          seasonNumber,
          episodeNumber: 1,
          name: `Episode 1`,
          overview: `Premiere episode of Season ${seasonNumber}.`,
          stillPath: null,
          airDate: '2023-01-01',
          voteAverage: 8.5,
          runtime: 55,
        },
      ],
    };
  },

  async getEpisode(tvTmdbId: number, seasonNumber: number, episodeNumber: number): Promise<TMDBEpisode | null> {
    const apiData = await fetchFromApi<TMDBEpisode>(`/tv/${tvTmdbId}/season/${seasonNumber}/episode/${episodeNumber}`);
    if (apiData) return apiData;

    const found = CURATED_EPISODES.find(
      (e) => e.showTmdbId === tvTmdbId && e.seasonNumber === seasonNumber && e.episodeNumber === episodeNumber
    );
    if (found) return found;

    const show = await this.getTvByTmdbId(tvTmdbId);
    return {
      id: `tv:${tvTmdbId}:s${seasonNumber}:e${episodeNumber}`,
      tmdbId: tvTmdbId * 100 + seasonNumber * 10 + episodeNumber,
      showTmdbId: tvTmdbId,
      showTitle: show?.title || 'TV Series',
      showSlug: show?.slug || 'tv-series',
      seasonNumber,
      episodeNumber,
      name: `Episode ${episodeNumber}`,
      overview: `Episode ${episodeNumber} of season ${seasonNumber}.`,
      stillPath: show?.backdropPath || null,
      airDate: '2023-01-01',
      voteAverage: 8.5,
      runtime: 52,
    };
  },

  async getSimilar(type: 'movie' | 'tv', tmdbId: number): Promise<MediaItem[]> {
    const apiData = await fetchFromApi<{ results: MediaItem[] }>(`/${type}/${tmdbId}/similar`);
    if (apiData && apiData.results?.length > 0) {
      return apiData.results;
    }
    const pool = type === 'movie' ? CURATED_MOVIES : CURATED_TV_SHOWS;
    return pool.filter((item) => item.tmdbId !== tmdbId).slice(0, 6);
  },

  async getPerson(id: number): Promise<TMDBPerson | null> {
    const apiData = await fetchFromApi<TMDBPerson>(`/person/${id}`);
    if (apiData) return apiData;

    return CURATED_ACTORS.find((a) => a.id === id || a.tmdbId === id) || null;
  },

  async getPopularActors(page: number = 1): Promise<{ results: TMDBPerson[]; totalPages: number; page: number }> {
    const apiData = await fetchFromApi<{ results: TMDBPerson[]; total_pages: number; page: number }>(`/person/popular?page=${page}`);
    if (apiData && apiData.results?.length > 0) {
      return {
        results: apiData.results,
        totalPages: apiData.total_pages || 50,
        page: apiData.page || page,
      };
    }
    return {
      results: CURATED_ACTORS,
      totalPages: 1,
      page: 1,
    };
  },

  async searchPeople(query: string, page: number = 1): Promise<{ results: TMDBPerson[]; totalPages: number; page: number }> {
    if (!query.trim()) {
      return this.getPopularActors(page);
    }
    const apiData = await fetchFromApi<{ results: TMDBPerson[]; total_pages: number; page: number }>(
      `/search/person?query=${encodeURIComponent(query.trim())}&page=${page}`
    );
    if (apiData && apiData.results?.length > 0) {
      return {
        results: apiData.results,
        totalPages: apiData.total_pages || 1,
        page: apiData.page || page,
      };
    }
    const q = query.toLowerCase().trim();
    const matched = CURATED_ACTORS.filter((a) => a.name.toLowerCase().includes(q));
    return {
      results: matched,
      totalPages: 1,
      page: 1,
    };
  },

  async multiSearch(query: string): Promise<MediaItem[]> {
    if (!query.trim()) return [];
    const apiData = await fetchFromApi<{ results: MediaItem[] }>(`/search/multi?query=${encodeURIComponent(query)}`);
    if (apiData && apiData.results?.length > 0) {
      return apiData.results;
    }

    const q = query.toLowerCase().trim();
    const all = [...CURATED_MOVIES, ...CURATED_TV_SHOWS];
    return all.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.originalTitle && item.originalTitle.toLowerCase().includes(q)) ||
        item.overview.toLowerCase().includes(q) ||
        item.genres.some((g) => g.name.toLowerCase().includes(q))
    );
  },

  async getMoviesPaginated(options: {
    sort?: 'popular' | 'trending' | 'top_rated' | 'newest';
    genreId?: number | 'all';
    page?: number;
  } = {}): Promise<PaginatedResult<MediaItem>> {
    const page = options.page || 1;
    let endpoint = `/movie/popular?page=${page}`;

    if (options.genreId && options.genreId !== 'all') {
      endpoint = `/discover/movie?with_genres=${options.genreId}&page=${page}`;
    } else if (options.sort === 'trending') {
      endpoint = `/trending/movie/week?page=${page}`;
    } else if (options.sort === 'top_rated') {
      endpoint = `/movie/top_rated?page=${page}`;
    } else if (options.sort === 'newest') {
      endpoint = `/movie/now_playing?page=${page}`;
    }

    const apiData = await fetchFromApi<{
      results: MediaItem[];
      page: number;
      total_pages: number;
      total_results: number;
    }>(endpoint);

    if (apiData && apiData.results?.length > 0) {
      apiData.results.forEach((item) => {
        slugToTmdbIdMap.set(`movie:${item.slug}`, { id: item.tmdbId, type: 'movie' });
        slugToTmdbIdMap.set(`movie:${slugify(item.title)}`, { id: item.tmdbId, type: 'movie' });
      });
      return {
        results: apiData.results,
        page: apiData.page || page,
        totalPages: Math.min(apiData.total_pages || 50, 50),
        totalResults: apiData.total_results || 1000,
      };
    }

    let pool = [...CURATED_MOVIES];
    if (options.genreId && options.genreId !== 'all') {
      pool = pool.filter((m) => m.genres.some((g) => g.id === options.genreId));
    }
    const perPage = 15;
    const start = (page - 1) * perPage;
    return {
      results: pool.slice(start, start + perPage),
      page,
      totalPages: Math.max(1, Math.ceil(pool.length / perPage)),
      totalResults: pool.length,
    };
  },

  async getTVShowsPaginated(options: {
    sort?: 'popular' | 'trending' | 'top_rated' | 'newest';
    genreId?: number | 'all';
    page?: number;
  } = {}): Promise<PaginatedResult<MediaItem>> {
    const page = options.page || 1;
    let endpoint = `/tv/popular?page=${page}`;

    if (options.genreId && options.genreId !== 'all') {
      endpoint = `/discover/tv?with_genres=${options.genreId}&page=${page}`;
    } else if (options.sort === 'trending') {
      endpoint = `/trending/tv/week?page=${page}`;
    } else if (options.sort === 'top_rated') {
      endpoint = `/tv/top_rated?page=${page}`;
    } else if (options.sort === 'newest') {
      endpoint = `/tv/on_the_air?page=${page}`;
    }

    const apiData = await fetchFromApi<{
      results: MediaItem[];
      page: number;
      total_pages: number;
      total_results: number;
    }>(endpoint);

    if (apiData && apiData.results?.length > 0) {
      apiData.results.forEach((item) => {
        slugToTmdbIdMap.set(`tv:${item.slug}`, { id: item.tmdbId, type: 'tv' });
        slugToTmdbIdMap.set(`tv:${slugify(item.title)}`, { id: item.tmdbId, type: 'tv' });
      });
      return {
        results: apiData.results,
        page: apiData.page || page,
        totalPages: Math.min(apiData.total_pages || 50, 50),
        totalResults: apiData.total_results || 1000,
      };
    }

    let pool = [...CURATED_TV_SHOWS];
    if (options.genreId && options.genreId !== 'all') {
      pool = pool.filter((s) => s.genres.some((g) => g.id === options.genreId));
    }
    const perPage = 15;
    const start = (page - 1) * perPage;
    return {
      results: pool.slice(start, start + perPage),
      page,
      totalPages: Math.max(1, Math.ceil(pool.length / perPage)),
      totalResults: pool.length,
    };
  },

  async getTrendingPaginated(
    type: 'all' | 'movies' | 'tv' = 'all',
    timeWindow: 'day' | 'week' = 'day',
    page: number = 1
  ): Promise<PaginatedResult<MediaItem>> {
    if (type === 'movies') {
      const data = await fetchFromApi<{
        results: MediaItem[];
        page: number;
        total_pages: number;
        total_results: number;
      }>(`/trending/movie/${timeWindow}?page=${page}`);
      if (data && data.results) {
        return {
          results: data.results,
          page: data.page || page,
          totalPages: Math.min(data.total_pages || 50, 50),
          totalResults: data.total_results || 1000,
        };
      }
    } else if (type === 'tv') {
      const data = await fetchFromApi<{
        results: MediaItem[];
        page: number;
        total_pages: number;
        total_results: number;
      }>(`/trending/tv/${timeWindow}?page=${page}`);
      if (data && data.results) {
        return {
          results: data.results,
          page: data.page || page,
          totalPages: Math.min(data.total_pages || 50, 50),
          totalResults: data.total_results || 1000,
        };
      }
    } else {
      const [m, t] = await Promise.all([
        fetchFromApi<{ results: MediaItem[]; total_pages: number; total_results: number }>(
          `/trending/movie/${timeWindow}?page=${page}`
        ),
        fetchFromApi<{ results: MediaItem[]; total_pages: number; total_results: number }>(
          `/trending/tv/${timeWindow}?page=${page}`
        ),
      ]);
      const mList = m?.results || CURATED_MOVIES;
      const tList = t?.results || CURATED_TV_SHOWS;
      const combined: MediaItem[] = [];
      const maxLen = Math.max(mList.length, tList.length);
      for (let i = 0; i < maxLen; i++) {
        if (mList[i]) combined.push(mList[i]);
        if (tList[i]) combined.push(tList[i]);
      }
      return {
        results: combined,
        page,
        totalPages: Math.min(Math.max(m?.total_pages || 1, t?.total_pages || 1), 50),
        totalResults: (m?.total_results || mList.length) + (t?.total_results || tList.length),
      };
    }

    const fallback = type === 'movies' ? CURATED_MOVIES : CURATED_TV_SHOWS;
    return {
      results: fallback,
      page: 1,
      totalPages: 1,
      totalResults: fallback.length,
    };
  },

  async searchMultiPaginated(query: string, page: number = 1): Promise<PaginatedResult<MediaItem>> {
    if (!query.trim()) {
      return { results: [], page: 1, totalPages: 1, totalResults: 0 };
    }
    const apiData = await fetchFromApi<{
      results: MediaItem[];
      page: number;
      total_pages: number;
      total_results: number;
    }>(`/search/multi?query=${encodeURIComponent(query.trim())}&page=${page}`);
    if (apiData && apiData.results) {
      return {
        results: apiData.results,
        page: apiData.page || page,
        totalPages: Math.min(apiData.total_pages || 1, 50),
        totalResults: apiData.total_results || apiData.results.length,
      };
    }
    const q = query.toLowerCase().trim();
    const all = [...CURATED_MOVIES, ...CURATED_TV_SHOWS];
    const matched = all.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.originalTitle && item.originalTitle.toLowerCase().includes(q)) ||
        item.overview.toLowerCase().includes(q) ||
        item.genres.some((g) => g.name.toLowerCase().includes(q))
    );
    return {
      results: matched,
      page: 1,
      totalPages: 1,
      totalResults: matched.length,
    };
  },

  async getByGenrePaginated(
    genreId: number,
    type: 'movie' | 'tv' | 'all' = 'movie',
    page: number = 1
  ): Promise<PaginatedResult<MediaItem>> {
    if (type === 'all') {
      const [m, t] = await Promise.all([
        fetchFromApi<{ results: MediaItem[]; total_pages: number; total_results: number }>(
          `/discover/movie?with_genres=${genreId}&page=${page}`
        ),
        fetchFromApi<{ results: MediaItem[]; total_pages: number; total_results: number }>(
          `/discover/tv?with_genres=${genreId}&page=${page}`
        ),
      ]);
      const mList = m?.results || CURATED_MOVIES.filter((i) => i.genres.some((g) => g.id === genreId));
      const tList = t?.results || CURATED_TV_SHOWS.filter((i) => i.genres.some((g) => g.id === genreId));
      const combined: MediaItem[] = [];
      const maxLen = Math.max(mList.length, tList.length);
      for (let i = 0; i < maxLen; i++) {
        if (mList[i]) combined.push(mList[i]);
        if (tList[i]) combined.push(tList[i]);
      }
      return {
        results: combined,
        page,
        totalPages: Math.min(Math.max(m?.total_pages || 1, t?.total_pages || 1), 50),
        totalResults: (m?.total_results || mList.length) + (t?.total_results || tList.length),
      };
    }

    const apiData = await fetchFromApi<{
      results: MediaItem[];
      page: number;
      total_pages: number;
      total_results: number;
    }>(`/discover/${type}?with_genres=${genreId}&page=${page}`);

    if (apiData && apiData.results) {
      return {
        results: apiData.results,
        page: apiData.page || page,
        totalPages: Math.min(apiData.total_pages || 50, 50),
        totalResults: apiData.total_results || 1000,
      };
    }

    const pool = type === 'movie' ? CURATED_MOVIES : CURATED_TV_SHOWS;
    const filtered = pool.filter((item) => item.genres.some((g) => g.id === genreId));
    return {
      results: filtered,
      page: 1,
      totalPages: 1,
      totalResults: filtered.length,
    };
  },
};
