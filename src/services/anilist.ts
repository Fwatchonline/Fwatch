import {
  AnimeMedia,
  AnimePageInfo,
  AnimeCategoryTab,
  AnimeStatus,
  AnimeFormat,
} from '../types/index';

const ANILIST_DIRECT_URL = 'https://graphql.anilist.co';

export async function fetchAniListGraphQL<T = any>(
  query: string,
  variables: Record<string, any> = {}
): Promise<T> {
  // 1. Try local server-side cached proxy first
  try {
    const isBrowser = typeof window !== 'undefined';
    const proxyUrl = isBrowser ? '/api/anilist' : `http://localhost:${process.env.PORT || 3000}/api/anilist`;

    const res = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.data) return json.data;
    }
  } catch (err) {
    // Continue to direct fallback
  }

  // 2. Direct fallback to official AniList GraphQL API
  const directRes = await fetch(ANILIST_DIRECT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!directRes.ok) {
    throw new Error(`AniList API returned ${directRes.status}`);
  }

  const json = await directRes.json();
  if (json.errors && json.errors.length > 0) {
    throw new Error(json.errors[0]?.message || 'AniList GraphQL error');
  }

  return json.data;
}

export function cleanDescription(desc?: string): string {
  if (!desc) return '';
  return desc
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
}

export function generateAnimeSlug(id: number, title?: string): string {
  const safe = (title || 'anime')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  return `${id}-${safe}`;
}

export function parseAnimeSlug(slug: string): { id: number; cleanSlug: string } {
  const match = slug.match(/^(\d+)(?:-(.*))?$/);
  if (match) {
    return { id: parseInt(match[1], 10), cleanSlug: match[2] || '' };
  }
  const numeric = parseInt(slug, 10);
  return { id: isNaN(numeric) ? 0 : numeric, cleanSlug: slug };
}

export interface GetAnimeParams {
  page?: number;
  perPage?: number;
  tab?: AnimeCategoryTab;
  sort?: string;
  search?: string;
  genre?: string;
  status?: AnimeStatus | 'ALL';
  year?: number;
}

export interface AnimeListResponse {
  media: AnimeMedia[];
  pageInfo: AnimePageInfo;
}

const MEDIA_CARD_FRAGMENT = `
  id
  title {
    romaji
    english
    native
  }
  format
  status
  episodes
  duration
  season
  seasonYear
  averageScore
  popularity
  genres
  bannerImage
  coverImage {
    extraLarge
    large
    medium
    color
  }
  description
`;

export const anilistService = {
  /**
   * Fetch paginated Anime list by Tab (All, Movies, Series, Others)
   */
  async getAnimeList(params: GetAnimeParams = {}): Promise<AnimeListResponse> {
    const {
      page = 1,
      perPage = 24,
      tab = 'all',
      sort = 'TRENDING_DESC',
      search,
      genre,
      status,
      year,
    } = params;

    let format_in: AnimeFormat[] | undefined = undefined;
    if (tab === 'movies') {
      format_in = ['MOVIE'];
    } else if (tab === 'series') {
      format_in = ['TV', 'TV_SHORT'];
    } else if (tab === 'others') {
      format_in = ['OVA', 'ONA', 'SPECIAL', 'MUSIC'];
    }

    const sortArray =
      sort === 'SCORE_DESC'
        ? ['SCORE_DESC', 'POPULARITY_DESC']
        : sort === 'POPULARITY_DESC'
        ? ['POPULARITY_DESC']
        : sort === 'START_DATE_DESC'
        ? ['START_DATE_DESC']
        : sort === 'FAVOURITES_DESC'
        ? ['FAVOURITES_DESC']
        : ['TRENDING_DESC', 'POPULARITY_DESC'];

    const query = `
      query (
        $page: Int,
        $perPage: Int,
        $format_in: [MediaFormat],
        $sort: [MediaSort],
        $search: String,
        $genre: String,
        $status: MediaStatus,
        $seasonYear: Int
      ) {
        Page (page: $page, perPage: $perPage) {
          pageInfo {
            total
            currentPage
            lastPage
            hasNextPage
            perPage
          }
          media (
            type: ANIME,
            format_in: $format_in,
            sort: $sort,
            search: $search,
            genre: $genre,
            status: $status,
            seasonYear: $seasonYear
          ) {
            ${MEDIA_CARD_FRAGMENT}
          }
        }
      }
    `;

    const variables: Record<string, any> = {
      page,
      perPage,
      format_in,
      sort: sortArray,
    };

    if (search && search.trim()) variables.search = search.trim();
    if (genre && genre !== 'all') variables.genre = genre;
    if (status && status !== 'ALL') variables.status = status;
    if (year) variables.seasonYear = year;

    try {
      const data = await fetchAniListGraphQL<{
        Page: {
          pageInfo: AnimePageInfo;
          media: AnimeMedia[];
        };
      }>(query, variables);

      return {
        media: data?.Page?.media || [],
        pageInfo: data?.Page?.pageInfo || {
          total: 0,
          currentPage: page,
          lastPage: 1,
          hasNextPage: false,
          perPage,
        },
      };
    } catch (err) {
      console.warn('[AniList getAnimeList error]:', err);
      return {
        media: [],
        pageInfo: {
          total: 0,
          currentPage: page,
          lastPage: 1,
          hasNextPage: false,
          perPage,
        },
      };
    }
  },

  /**
   * Fetch Single Anime by ID with full details
   */
  async getAnimeById(id: number): Promise<AnimeMedia | null> {
    const query = `
      query ($id: Int) {
        Media (id: $id, type: ANIME) {
          id
          title {
            romaji
            english
            native
          }
          description
          format
          status
          episodes
          duration
          season
          seasonYear
          averageScore
          popularity
          genres
          bannerImage
          coverImage {
            extraLarge
            large
            medium
            color
          }
          trailer {
            id
            site
            thumbnail
          }
          studios (isMain: true) {
            nodes {
              id
              name
              isAnimationStudio
            }
          }
          characters (perPage: 12, sort: [ROLE, RELEVANCE]) {
            edges {
              role
              node {
                id
                name {
                  full
                  native
                }
                image {
                  large
                  medium
                }
              }
            }
          }
          relations {
            edges {
              relationType
              node {
                id
                title {
                  english
                  romaji
                }
                format
                type
                coverImage {
                  medium
                  large
                }
              }
            }
          }
          recommendations (perPage: 10, sort: [RATING_DESC]) {
            nodes {
              mediaRecommendation {
                id
                title {
                  english
                  romaji
                }
                format
                type
                coverImage {
                  medium
                  large
                }
                averageScore
              }
            }
          }
        }
      }
    `;

    try {
      const data = await fetchAniListGraphQL<{ Media: AnimeMedia }>(query, { id });
      return data?.Media || null;
    } catch (err) {
      console.warn(`[AniList getAnimeById ${id} error]:`, err);
      return null;
    }
  },

  /**
   * Top Trending Anime for Hero Banners
   */
  async getTrendingAnime(perPage = 8, tab: AnimeCategoryTab = 'all'): Promise<AnimeMedia[]> {
    const res = await this.getAnimeList({
      page: 1,
      perPage,
      tab,
      sort: 'TRENDING_DESC',
    });
    return res.media;
  },

  /**
   * Search Anime
   */
  async searchAnime(queryStr: string, page = 1, perPage = 18): Promise<AnimeListResponse> {
    return this.getAnimeList({
      page,
      perPage,
      search: queryStr,
      sort: 'SEARCH_MATCH',
    });
  },
};
