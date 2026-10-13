import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Play,
  Info,
  Bookmark,
  Star,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { MediaItem } from '../types';
import { getTMDBImageUrl, formatRating, formatRuntime, formatYear } from '../utils/slugify';
import { useWatchlist } from '../hooks/useWatchlist';

interface HeroSliderProps {
  items: MediaItem[];
}

export function HeroSlider({ items }: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const navigate = useNavigate();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const heroItems = items.slice(0, 6);

  // Auto slide every 6 seconds unless paused
  useEffect(() => {
    if (heroItems.length <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroItems.length);
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [heroItems.length, isPaused]);

  if (!heroItems || heroItems.length === 0) return null;

  const current = heroItems[currentIndex];
  const isSaved = isInWatchlist(current.tmdbId, current.type);
  const detailUrl = current.type === 'movie' ? `/movie/${current.slug}` : `/tv/${current.slug}`;
  const watchUrl =
    current.type === 'movie'
      ? `/watch/movie/${current.slug}`
      : `/watch/tv/${current.slug}/season/1/episode/1`;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + heroItems.length) % heroItems.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % heroItems.length);
  };

  return (
    <div
      className="relative w-full h-[75vh] sm:h-[82vh] md:h-[88vh] min-h-[580px] max-h-[920px] overflow-hidden bg-[#08090c]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Backdrops with smooth fade */}
      {heroItems.map((item, index) => {
        const isActive = index === currentIndex;
        return (
          <div
            key={item.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <img
              src={getTMDBImageUrl(item.backdropPath, 'original', 'backdrop')}
              alt={item.title}
              className="w-full h-full object-cover object-center scale-105 animate-kenburns"
            />
            {/* Cinematic Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#08090c] via-[#08090c]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#08090c] via-[#08090c]/70 to-transparent w-full lg:w-3/4" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#08090c] to-transparent" />
          </div>
        );
      })}

      {/* Hero Foreground Content */}
      <div className="relative z-20 max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-16 sm:pb-20">
        <div className="max-w-2xl lg:max-w-3xl space-y-4 sm:space-y-5">
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm font-semibold">
            <span className="bg-[#E50914] text-white text-[11px] font-black uppercase px-2.5 py-0.5 rounded shadow-lg shadow-red-900/40 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>FEATURED {current.type === 'movie' ? 'MOVIE' : 'SERIES'}</span>
            </span>

            <span className="bg-black/60 backdrop-blur-md text-white text-xs px-2 py-0.5 rounded border border-white/10 font-bold">
              {current.quality || '4K ULTRA HD'}
            </span>

            <div className="flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded border border-white/10 font-bold text-white shadow">
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-[#F5C518] text-black tracking-tight leading-tight">
                IMDb
              </span>
              <span className="text-amber-400 font-extrabold">{formatRating(current.imdbRating || current.voteAverage)}</span>
              <span className="text-[10px] text-neutral-400 font-normal">/ 10</span>
            </div>

            <div className="flex items-center gap-1 text-neutral-300">
              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
              <span>{formatYear(current.releaseDate)}</span>
            </div>

            {current.runtime && (
              <div className="flex items-center gap-1 text-neutral-300">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                <span>{formatRuntime(current.runtime)}</span>
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-none drop-shadow-md">
            {current.title}
          </h1>

          {/* Genres */}
          {current.genres && current.genres.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-300">
              {current.genres.map((g) => (
                <Link
                  key={g.id}
                  to={`/genre/${g.slug}`}
                  className="px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-[#E50914]/30 hover:text-white border border-white/10 transition-colors"
                >
                  {g.name}
                </Link>
              ))}
            </div>
          )}

          {/* Overview */}
          <p className="text-neutral-300 text-sm sm:text-base leading-relaxed line-clamp-3 sm:line-clamp-4 max-w-2xl drop-shadow">
            {current.overview}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2">
            {/* Watch Now Button */}
            <Link
              to={detailUrl}
              className="px-6 py-3 rounded-xl bg-[#E50914] hover:bg-[#B81D24] text-white font-bold text-sm sm:text-base flex items-center gap-2 shadow-xl shadow-red-900/40 hover:scale-105 active:scale-95 transition-all glow-accent"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Watch Now</span>
            </Link>

            {/* Details Button */}
            <Link
              to={detailUrl}
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm sm:text-base flex items-center gap-2 backdrop-blur-md border border-white/15 hover:border-white/30 transition-all"
            >
              <Info className="w-4 h-4 text-neutral-300" />
              <span>Details</span>
            </Link>

            {/* Watchlist Toggle */}
            <button
              type="button"
              onClick={() => toggleWatchlist(current)}
              className={`p-3 rounded-xl border transition-all ${
                isSaved
                  ? 'bg-[#E50914]/20 border-[#E50914] text-[#E50914]'
                  : 'bg-white/5 border-white/15 text-neutral-300 hover:text-white hover:bg-white/15'
              }`}
              title={isSaved ? 'In Watchlist' : 'Add to Watchlist'}
              aria-label="Toggle Watchlist"
            >
              <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-[#E50914]' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        type="button"
        onClick={handlePrev}
        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/40 hover:bg-[#E50914] text-white backdrop-blur-md border border-white/10 transition-colors"
        aria-label="Previous Slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        type="button"
        onClick={handleNext}
        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/40 hover:bg-[#E50914] text-white backdrop-blur-md border border-white/10 transition-colors"
        aria-label="Next Slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Pagination Indicators */}
      <div className="absolute bottom-6 right-4 sm:right-8 z-30 flex items-center gap-2">
        {heroItems.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCurrentIndex(idx)}
            className={`transition-all duration-300 rounded-full ${
              idx === currentIndex
                ? 'w-8 h-2 bg-[#E50914]'
                : 'w-2 h-2 bg-white/30 hover:bg-white/60'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
