export interface TMDBGenre {
  id: number;
  name: string;
  slug: string;
}

export interface TMDBCastMember {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
  order: number;
}

export interface TMDBCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profilePath: string | null;
}

export interface TMDBVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  size: number;
  type: string;
  official: boolean;
  publishedAt: string;
}

export interface MediaItem {
  id: string; // e.g. "movie:550" or "tv:1399"
  type: 'movie' | 'tv';
  tmdbId: number;
  title: string;
  originalTitle?: string;
  slug: string;
  overview: string;
  tagline?: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string; // YYYY-MM-DD
  voteAverage: number;
  voteCount: number;
  imdbId?: string;
  imdbRating?: number;
  genres: TMDBGenre[];
  runtime?: number; // in minutes for movies
  numberOfSeasons?: number; // for TV
  numberOfEpisodes?: number; // for TV
  status?: string;
  country?: string;
  quality?: '4K' | 'HD' | 'CAM';
  isNew?: boolean;
  trailerKey?: string;
  cast?: TMDBCastMember[];
  crew?: TMDBCrewMember[];
}

export interface TMDBEpisode {
  id: string; // "tv:1399:s1:e1"
  tmdbId: number;
  showTmdbId: number;
  showTitle: string;
  showSlug: string;
  seasonNumber: number;
  episodeNumber: number;
  name: string;
  overview: string;
  stillPath: string | null;
  airDate: string;
  voteAverage: number;
  voteCount?: number;
  imdbRating?: number;
  runtime?: number;
}

export interface TMDBSeason {
  id: number;
  seasonNumber: number;
  name: string;
  overview: string;
  posterPath: string | null;
  airDate: string;
  episodeCount: number;
  episodes?: TMDBEpisode[];
}

export interface TMDBPerson {
  id: number;
  tmdbId: number;
  name: string;
  slug: string;
  profilePath: string | null;
  biography: string;
  birthday?: string;
  deathday?: string | null;
  placeOfBirth?: string;
  knownForDepartment: string;
  role?: string;
  roles?: string[];
  movieCount?: number;
  popularity?: number;
  knownFor: MediaItem[];
  movieCredits: MediaItem[];
  tvCredits: MediaItem[];
}

export interface StreamQuality {
  label: string; // "4K (2160p)", "1080p FHD", "720p HD", "480p SD", "Auto"
  value: string; // "4k", "1080", "720", "480", "auto"
  bitrate?: number;
}

export interface SubtitleTrack {
  id: string;
  label: string; // "English [CC]", "Spanish", "French", "German", "Japanese"
  language: string; // "en", "es", "fr", "de", "ja"
  url: string; // URL to .vtt file
  isDefault?: boolean;
}

export interface AudioTrack {
  id: string;
  label: string; // "English (Original)", "Spanish (Dub)", "French"
  language: string;
}

export interface StreamSource {
  url: string;
  format: 'hls' | 'mp4' | 'embed';
  quality?: string;
  serverName?: string;
}

export interface StreamResult {
  serverId: string;
  serverName: string;
  sources: StreamSource[];
  qualities: StreamQuality[];
  subtitles?: SubtitleTrack[];
  audioTracks?: AudioTrack[];
}

export interface StreamingProvider {
  id: string;
  name: string;
  region: string;
  priority: number;
  type: 'movie' | 'tv' | 'both';
  isAvailable: boolean;
  latencyMs?: number;
  getStream(params: {
    tmdbId: number;
    type: 'movie' | 'tv';
    season?: number;
    episode?: number;
  }): Promise<StreamResult>;
}

export interface WatchProgressItem {
  id: string;
  tmdbId: number;
  type: 'movie' | 'tv';
  slug: string;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeName?: string;
  currentTime: number;
  duration: number;
  percentage: number;
  updatedAt: number;
}

export interface WatchlistItem {
  id: string;
  tmdbId: number;
  type: 'movie' | 'tv';
  slug: string;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  voteAverage: number;
  imdbRating?: number;
  releaseDate: string;
  addedAt: number;
}

export interface SEOData {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'video.movie' | 'video.tv_show' | 'video.episode' | 'profile';
  keywords?: string[];
  noIndex?: boolean;
  jsonLd?: Record<string, any> | Array<Record<string, any>>;
}

// -------------------------------------------------------------
// ANILIST ANIME TYPES
// -------------------------------------------------------------
export type AnimeFormat = 'TV' | 'TV_SHORT' | 'MOVIE' | 'SPECIAL' | 'OVA' | 'ONA' | 'MUSIC';
export type AnimeStatus = 'FINISHED' | 'RELEASING' | 'NOT_YET_RELEASED' | 'CANCELLED' | 'HIATUS';
export type AnimeCategoryTab = 'all' | 'movies' | 'series' | 'others';

export interface AnimeTitle {
  romaji?: string;
  english?: string;
  native?: string;
}

export interface AnimeCoverImage {
  extraLarge?: string;
  large?: string;
  medium?: string;
  color?: string;
}

export interface AnimeCharacter {
  id: number;
  name: {
    full: string;
    native?: string;
  };
  image?: {
    large?: string;
    medium?: string;
  };
  role?: string;
}

export interface AnimeStudio {
  id: number;
  name: string;
  isAnimationStudio?: boolean;
}

export interface AnimeMedia {
  id: number;
  title: AnimeTitle;
  description?: string;
  format: AnimeFormat;
  status: AnimeStatus;
  episodes?: number;
  duration?: number;
  season?: string;
  seasonYear?: number;
  averageScore?: number;
  popularity?: number;
  genres: string[];
  bannerImage?: string | null;
  coverImage: AnimeCoverImage;
  trailer?: {
    id?: string;
    site?: string;
    thumbnail?: string;
  } | null;
  studios?: {
    nodes: AnimeStudio[];
  };
  characters?: {
    edges: Array<{
      role: string;
      node: AnimeCharacter;
    }>;
  };
  relations?: {
    edges: Array<{
      relationType: string;
      node: {
        id: number;
        title: AnimeTitle;
        format: AnimeFormat;
        type: string;
        coverImage: AnimeCoverImage;
      };
    }>;
  };
  recommendations?: {
    nodes: Array<{
      mediaRecommendation?: {
        id: number;
        title: AnimeTitle;
        format: AnimeFormat;
        type: string;
        coverImage: AnimeCoverImage;
        averageScore?: number;
      };
    }>;
  };
}

export interface AnimePageInfo {
  total: number;
  currentPage: number;
  lastPage: number;
  hasNextPage: boolean;
  perPage: number;
}
