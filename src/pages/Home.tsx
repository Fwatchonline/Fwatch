import { useState, useEffect } from 'react';
import { tmdbService } from '../services/tmdb';
import { MediaItem, TMDBEpisode } from '../types';
import { HeroSplit } from '../components/HeroSplit';
import { ContentRow } from '../components/ContentRow';
import { GenresFilterRow } from '../components/GenresFilterRow';
import {
  TrendingSeriesSlider,
  LatestEpisodesSlider,
  ImdbPopularMoviesSlider,
} from '../components/PromoBanners';
import { useWatchlist } from '../hooks/useWatchlist';
import { SEO } from '../components/SEO';

export function Home() {
  const [heroMovies, setHeroMovies] = useState<MediaItem[]>([]);
  const [recommended, setRecommended] = useState<MediaItem[]>([]);
  const [trendingMovies, setTrendingMovies] = useState<MediaItem[]>([]);
  const [trendingSeries, setTrendingSeries] = useState<MediaItem[]>([]);
  const [newEpisodes, setNewEpisodes] = useState<TMDBEpisode[]>([]);
  const [imdbTopMovies, setImdbTopMovies] = useState<MediaItem[]>([]);
  const [imdbTopSeries, setImdbTopSeries] = useState<MediaItem[]>([]);
  const [tvShows, setTvShows] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const { watchlist } = useWatchlist();

  useEffect(() => {
    let mounted = true;

    async function loadHomeContent() {
      try {
        const [
          trendingM,
          trendingT,
          topM,
          topT,
          popM,
          episodes,
        ] = await Promise.all([
          tmdbService.getTrendingMovies('week'),
          tmdbService.getTrendingTV('week'),
          tmdbService.getTopRatedMovies(),
          tmdbService.getTopRatedTV(),
          tmdbService.getPopularMovies(),
          tmdbService.getNewEpisodes(),
        ]);

        if (mounted) {
          // Top Hero: Featured Movies
          setHeroMovies(trendingM.slice(0, 8));

          // Recommended for You (popular mix)
          setRecommended(popM.slice(0, 10));

          // Trending Movies
          setTrendingMovies(trendingM.slice(0, 10));

          // Trending Series for carousel & list
          setTrendingSeries(trendingT.slice(0, 10));

          // Latest Episodes for episode hero slider
          setNewEpisodes(episodes || []);

          // IMDb Top / Popular Movies
          setImdbTopMovies(topM.slice(0, 10));

          // IMDb Top Series
          setImdbTopSeries(topT.slice(0, 10));

          // Trending TV Shows
          setTvShows(trendingT.slice(10, 20));

          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load Home data', err);
        if (mounted) setLoading(false);
      }
    }

    loadHomeContent();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-4">
      <SEO
        title="T.Movie - Discover & Stream Movies, Series & Artists"
        description="Stream movies and TV series with real TMDB metadata, direct HLS video streaming, rich artist profiles, and high cinematic experience."
      />

      {/* Top Hero Section: Featured Movies */}
      <HeroSplit items={heroMovies} />

      {/* 1. Recommended For You */}
      <ContentRow
        title="Recommended For You"
        items={recommended}
        viewAllLink="/movies"
      />

      {/* 2. Trending Movies */}
      <ContentRow
        title="Trending Movies"
        items={trendingMovies}
        viewAllLink="/trending?type=movie"
      />

      {/* Hero Slider 1: Trending Series rotating */}
      <TrendingSeriesSlider items={trendingSeries} />

      {/* 3. Trending Series Row */}
      <ContentRow
        title="Trending Series"
        items={trendingSeries}
        viewAllLink="/trending?type=tv"
      />

      {/* 4. Genres Filter Row */}
      <GenresFilterRow />

      {/* Hero Slider 2: Latest Episodes rotating ("na trecoj slici neka se prikazuju latest episodes, kao hero slider") */}
      <LatestEpisodesSlider items={newEpisodes} />

      {/* 5. IMDb Top Movies Row */}
      <ContentRow
        title="IMDb Top Movies"
        items={imdbTopMovies}
        viewAllLink="/movies?sort=top_rated"
        showImdbBadge={true}
      />

      {/* 6. IMDb Top Series Row */}
      <ContentRow
        title="IMDb Top Series"
        items={imdbTopSeries}
        viewAllLink="/tv?sort=top_rated"
        showImdbBadge={true}
      />

      {/* Hero Slider 3: IMDb Popular Movies rotating ("tu neka prikazuje imdb popukarne filmove, kao hero slider") */}
      <ImdbPopularMoviesSlider items={imdbTopMovies} />

      {/* 7. Trending TV Shows Row */}
      <ContentRow
        title="Trending TV Shows"
        items={tvShows}
        viewAllLink="/tv"
      />

      {/* 8. My Watchlist */}
      {watchlist.length > 0 && (
        <ContentRow
          title="My Watchlist"
          items={watchlist as unknown as MediaItem[]}
          viewAllLink="/watchlist"
        />
      )}
    </div>
  );
}
