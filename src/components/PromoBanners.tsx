import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Star, ChevronLeft, ChevronRight, Info, Sparkles, Tv, Film } from 'lucide-react';
import { MediaItem, TMDBEpisode } from '../types';
import { getTMDBImageUrl, formatRating } from '../utils/slugify';

// ---------------------------------------------------------------------------
// 1. TRENDING SERIES HERO SLIDER (replaces static Peaky Blinders banner)
// ---------------------------------------------------------------------------
interface TrendingSeriesSliderProps {
  items: MediaItem[];
}

export function TrendingSeriesSlider({ items }: TrendingSeriesSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const navigate = useNavigate();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const seriesList = items && items.length > 0 ? items.slice(0, 8) : [];

  useEffect(() => {
    if (seriesList.length <= 1 || isPaused) return;
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % seriesList.length);
    }, 6000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [seriesList.length, isPaused]);

  if (seriesList.length === 0) return null;

  const current = seriesList[currentIndex];
  const watchUrl = `/watch/tv/${current.slug}/season/1/episode/1`;
  const detailUrl = `/tv/${current.slug}`;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % seriesList.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + seriesList.length) % seriesList.length);
  };

  const genresText =
    current.genres && current.genres.length > 0
      ? current.genres
          .map((g) => (typeof g === 'string' ? g : g.name))
          .slice(0, 3)
          .join(' · ')
      : 'Drama · Crime · Thriller';

  const ratingValue = current.imdbRating
    ? Number(current.imdbRating).toFixed(1)
    : current.voteAverage
    ? Number(current.voteAverage).toFixed(1)
    : '8.8';

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden min-h-[380px] sm:min-h-[460px] bg-[#16171E] border border-white/5 shadow-2xl flex flex-col justify-end p-6 sm:p-12 my-8 group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Backdrops with smooth fade */}
      {seriesList.map((item, idx) => (
        <div
          key={item.id || idx}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === currentIndex ? 'opacity-100 z-0' : 'opacity-0 pointer-events-none'
          }`}
        >
          <img
            src={getTMDBImageUrl(item.backdropPath, 'original', 'backdrop')}
            alt={item.title}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1280&auto=format&fit=crop&q=80';
            }}
            className="w-full h-full object-cover object-top scale-105 group-hover:scale-100 transition-transform duration-700 ease-out"
          />
          {/* Cinematic Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0E0F12] via-[#0E0F12]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0E0F12] via-[#0E0F12]/85 to-transparent w-full md:w-3/4" />
        </div>
      ))}

      {/* Foreground Content */}
      <div className="relative z-10 max-w-2xl space-y-4">
        {/* Category Pill / Tag */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5C518] text-black text-[11px] font-black uppercase tracking-wider shadow-md shadow-[#F5C518]/25">
            <Tv className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>TRENDING SERIES</span>
          </span>
          <span className="text-xs text-neutral-400 font-semibold">
            {currentIndex + 1} / {seriesList.length}
          </span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight drop-shadow-md">
          {current.title}
        </h2>

        {/* Rating & Categories (Image 2 style) */}
        <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-semibold text-neutral-300">
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#F5C518] text-black font-black text-xs shadow-md">
            <span className="text-[11px] tracking-tight">IMDb</span>
            <span>{ratingValue}</span>
            <Star className="w-3.5 h-3.5 fill-black" />
          </span>

          <span>•</span>
          <span className="text-neutral-300">{genresText}</span>
          <span>•</span>
          <span className="text-neutral-400">TV Series</span>
          {current.numberOfSeasons && (
            <>
              <span>•</span>
              <span className="text-neutral-400">{current.numberOfSeasons} Seasons</span>
            </>
          )}
        </div>

        <p className="text-xs sm:text-sm text-neutral-300 line-clamp-3 leading-relaxed max-w-xl drop-shadow">
          {current.overview ||
            'A compelling story of power, tension, and gripping drama unfolding across seasons.'}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(watchUrl)}
            className="py-2.5 px-6 rounded-xl bg-[#F5C518] hover:bg-[#E5B508] text-black text-xs sm:text-sm font-extrabold tracking-wide transition-all shadow-lg shadow-[#F5C518]/25 flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>WATCH</span>
          </button>

          <Link
            to={detailUrl}
            className="py-2.5 px-6 rounded-xl bg-black/40 hover:bg-black/60 border border-[#F5C518]/40 hover:border-[#F5C518] text-white text-xs sm:text-sm font-bold tracking-wide transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Info className="w-4 h-4 text-[#F5C518]" />
            <span>Details &amp; Trailer</span>
          </Link>
        </div>
      </div>

      {/* Navigation Controls (Bottom Right - Image 2 style) */}
      <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous series"
          className="w-10 h-10 rounded-full bg-black/70 hover:bg-[#F5C518] text-white hover:text-black border border-white/10 flex items-center justify-center transition-all shadow cursor-pointer active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={handleNext}
          aria-label="Next series"
          className="w-10 h-10 rounded-full bg-black/70 hover:bg-[#F5C518] text-white hover:text-black border border-white/10 flex items-center justify-center transition-all shadow cursor-pointer active:scale-95"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. LATEST EPISODES HERO SLIDER (replaces static MosaicBanners)
// ---------------------------------------------------------------------------
interface LatestEpisodesSliderProps {
  items: TMDBEpisode[];
}

export function LatestEpisodesSlider({ items }: LatestEpisodesSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const navigate = useNavigate();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const episodesList = items && items.length > 0 ? items.slice(0, 10) : [];

  useEffect(() => {
    if (episodesList.length <= 1 || isPaused) return;
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % episodesList.length);
    }, 6000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [episodesList.length, isPaused]);

  if (episodesList.length === 0) return null;

  const current = episodesList[currentIndex];
  const watchUrl = `/watch/tv/${current.showSlug || current.showTmdbId}/season/${current.seasonNumber}/episode/${current.episodeNumber}`;
  const detailUrl = `/tv/${current.showSlug || current.showTmdbId}`;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % episodesList.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + episodesList.length) % episodesList.length);
  };

  const ratingValue = current.imdbRating
    ? Number(current.imdbRating).toFixed(1)
    : current.voteAverage
    ? Number(current.voteAverage).toFixed(1)
    : '9.0';

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden min-h-[380px] sm:min-h-[460px] bg-[#16171E] border border-white/5 shadow-2xl flex flex-col justify-end p-6 sm:p-12 my-8 group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Backdrops with smooth fade */}
      {episodesList.map((ep, idx) => (
        <div
          key={ep.id || idx}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === currentIndex ? 'opacity-100 z-0' : 'opacity-0 pointer-events-none'
          }`}
        >
          <img
            src={getTMDBImageUrl(ep.stillPath, 'original', 'backdrop')}
            alt={ep.name}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1280&auto=format&fit=crop&q=80';
            }}
            className="w-full h-full object-cover object-center scale-105 group-hover:scale-100 transition-transform duration-700 ease-out"
          />
          {/* Cinematic Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0E0F12] via-[#0E0F12]/65 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0E0F12] via-[#0E0F12]/85 to-transparent w-full md:w-3/4" />
        </div>
      ))}

      {/* Foreground Content */}
      <div className="relative z-10 max-w-2xl space-y-4">
        {/* Category Pill / Tag */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F5C518] text-black text-[11px] font-black uppercase tracking-wider shadow">
            <Sparkles className="w-3 h-3" />
            <span>LATEST EPISODES</span>
          </span>
          <span className="text-xs text-neutral-400 font-semibold">
            {currentIndex + 1} / {episodesList.length}
          </span>
        </div>

        {/* Show Title & Episode Title */}
        <div>
          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#F5C518]">
            {current.showTitle}
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight drop-shadow-md mt-1">
            Season {current.seasonNumber}, Ep. {current.episodeNumber}: {current.name}
          </h2>
        </div>

        {/* Rating & Episode Details */}
        <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-semibold text-neutral-300">
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#F5C518] text-black font-black text-xs shadow-md">
            <span className="text-[11px] tracking-tight">IMDb</span>
            <span>{ratingValue}</span>
            <Star className="w-3.5 h-3.5 fill-black" />
          </span>

          <span>•</span>
          <span className="text-neutral-300">
            Season {current.seasonNumber} · Episode {current.episodeNumber}
          </span>
          <span>•</span>
          <span className="text-neutral-400">
            {current.airDate ? current.airDate.slice(0, 4) : '2024'}
          </span>
          {current.runtime && (
            <>
              <span>•</span>
              <span className="text-neutral-400">{current.runtime} min</span>
            </>
          )}
        </div>

        <p className="text-xs sm:text-sm text-neutral-300 line-clamp-3 leading-relaxed max-w-xl drop-shadow">
          {current.overview ||
            'Tensions peak in this riveting episode as the core storyline takes a dramatic and unforgettable turn.'}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(watchUrl)}
            className="py-2.5 px-6 rounded-xl bg-[#F5C518] hover:bg-[#E5B508] text-black text-xs sm:text-sm font-extrabold tracking-wide transition-all shadow-lg shadow-[#F5C518]/25 flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>WATCH EPISODE</span>
          </button>

          <Link
            to={detailUrl}
            className="py-2.5 px-6 rounded-xl bg-black/40 hover:bg-black/60 border border-[#F5C518]/40 hover:border-[#F5C518] text-white text-xs sm:text-sm font-bold tracking-wide transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Info className="w-4 h-4 text-[#F5C518]" />
            <span>Series Details</span>
          </Link>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous episode"
          className="w-10 h-10 rounded-full bg-black/70 hover:bg-[#F5C518] text-white hover:text-black border border-white/10 flex items-center justify-center transition-all shadow cursor-pointer active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={handleNext}
          aria-label="Next episode"
          className="w-10 h-10 rounded-full bg-black/70 hover:bg-[#F5C518] text-white hover:text-black border border-white/10 flex items-center justify-center transition-all shadow cursor-pointer active:scale-95"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. IMDb POPULAR MOVIES HERO SLIDER (replaces static Legend banner)
// ---------------------------------------------------------------------------
interface ImdbPopularMoviesSliderProps {
  items: MediaItem[];
}

export function ImdbPopularMoviesSlider({ items }: ImdbPopularMoviesSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const navigate = useNavigate();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const moviesList = items && items.length > 0 ? items.slice(0, 8) : [];

  useEffect(() => {
    if (moviesList.length <= 1 || isPaused) return;
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % moviesList.length);
    }, 6000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [moviesList.length, isPaused]);

  if (moviesList.length === 0) return null;

  const current = moviesList[currentIndex];
  const watchUrl = `/watch/movie/${current.slug}`;
  const detailUrl = `/movie/${current.slug}`;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % moviesList.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + moviesList.length) % moviesList.length);
  };

  const genresText =
    current.genres && current.genres.length > 0
      ? current.genres
          .map((g) => (typeof g === 'string' ? g : g.name))
          .slice(0, 3)
          .join(' · ')
      : 'Drama · Action · Sci-Fi';

  const ratingValue = current.imdbRating
    ? Number(current.imdbRating).toFixed(1)
    : current.voteAverage
    ? Number(current.voteAverage).toFixed(1)
    : '8.8';

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden min-h-[380px] sm:min-h-[460px] bg-[#16171E] border border-white/5 shadow-2xl flex flex-col justify-end p-6 sm:p-12 my-8 group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Backdrops with smooth fade */}
      {moviesList.map((item, idx) => (
        <div
          key={item.id || idx}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === currentIndex ? 'opacity-100 z-0' : 'opacity-0 pointer-events-none'
          }`}
        >
          <img
            src={getTMDBImageUrl(item.backdropPath, 'original', 'backdrop')}
            alt={item.title}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1280&auto=format&fit=crop&q=80';
            }}
            className="w-full h-full object-cover object-top scale-105 group-hover:scale-100 transition-transform duration-700 ease-out"
          />
          {/* Cinematic Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0E0F12] via-[#0E0F12]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0E0F12] via-[#0E0F12]/85 to-transparent w-full md:w-3/4" />
        </div>
      ))}

      {/* Foreground Content */}
      <div className="relative z-10 max-w-2xl space-y-4">
        {/* Category Pill / Tag */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F5C518] text-black text-[11px] font-black uppercase tracking-wider shadow">
            <Film className="w-3 h-3" />
            <span>IMDb POPULAR MOVIES</span>
          </span>
          <span className="text-xs text-neutral-400 font-semibold">
            {currentIndex + 1} / {moviesList.length}
          </span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight drop-shadow-md">
          {current.title}
        </h2>

        {/* Rating & Categories */}
        <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-semibold text-neutral-300">
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#F5C518] text-black font-black text-xs shadow-md">
            <span className="text-[11px] tracking-tight">IMDb</span>
            <span>{ratingValue}</span>
            <Star className="w-3.5 h-3.5 fill-black" />
          </span>

          <span>•</span>
          <span className="text-neutral-300">{genresText}</span>
          <span>•</span>
          <span className="text-neutral-400">Movie</span>
          {current.releaseDate && (
            <>
              <span>•</span>
              <span className="text-neutral-400">{current.releaseDate.slice(0, 4)}</span>
            </>
          )}
        </div>

        <p className="text-xs sm:text-sm text-neutral-300 line-clamp-3 leading-relaxed max-w-xl drop-shadow">
          {current.overview ||
            'An iconic film celebrated by millions worldwide, featuring breathtaking performances and stellar storytelling.'}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(watchUrl)}
            className="py-2.5 px-6 rounded-xl bg-[#F5C518] hover:bg-[#E5B508] text-black text-xs sm:text-sm font-extrabold tracking-wide transition-all shadow-lg shadow-[#F5C518]/25 flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>WATCH</span>
          </button>

          <Link
            to={detailUrl}
            className="py-2.5 px-6 rounded-xl bg-black/40 hover:bg-black/60 border border-[#F5C518]/40 hover:border-[#F5C518] text-white text-xs sm:text-sm font-bold tracking-wide transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Info className="w-4 h-4 text-[#F5C518]" />
            <span>Details &amp; Trailer</span>
          </Link>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous movie"
          className="w-10 h-10 rounded-full bg-black/70 hover:bg-[#F5C518] text-white hover:text-black border border-white/10 flex items-center justify-center transition-all shadow cursor-pointer active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={handleNext}
          aria-label="Next movie"
          className="w-10 h-10 rounded-full bg-black/70 hover:bg-[#F5C518] text-white hover:text-black border border-white/10 flex items-center justify-center transition-all shadow cursor-pointer active:scale-95"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// Backward compatibility aliases if needed
export const PeakyBlindersBanner = TrendingSeriesSlider as any;
export const MosaicBanners = LatestEpisodesSlider as any;
export const LegendBanner = ImdbPopularMoviesSlider as any;
