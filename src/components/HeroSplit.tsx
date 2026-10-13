import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Star, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { MediaItem } from '../types';
import { getTMDBImageUrl } from '../utils/slugify';

interface HeroSplitProps {
  items: MediaItem[];
}

export function HeroSplit({ items }: HeroSplitProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const navigate = useNavigate();

  const heroList = items.slice(0, 8);

  useEffect(() => {
    if (heroList.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroList.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [heroList.length, isPaused]);

  if (!heroList || heroList.length === 0) return null;

  const current = heroList[currentIndex];
  const watchUrl = `/watch/movie/${current.slug}`;
  const detailUrl = `/movie/${current.slug}`;

  const nextHero = () => {
    setCurrentIndex((prev) => (prev + 1) % heroList.length);
  };
  const prevHero = () => {
    setCurrentIndex((prev) => (prev - 1 + heroList.length) % heroList.length);
  };

  return (
    <div
      className="w-full mb-10"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Full Width Cinematic Hero Card */}
      <div className="relative rounded-3xl overflow-hidden min-h-[440px] sm:min-h-[500px] bg-[#16171E] border border-white/5 shadow-2xl flex flex-col justify-end p-6 sm:p-12 group">
        {/* Backdrop images */}
        {heroList.map((item, idx) => (
          <div
            key={item.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              idx === currentIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <img
              src={getTMDBImageUrl(item.backdropPath, 'original', 'backdrop')}
              alt={item.title}
              className="w-full h-full object-cover object-top scale-105 group-hover:scale-100 transition-transform duration-700 ease-out"
            />
            {/* Cinematic Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0E0F12] via-[#0E0F12]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0E0F12] via-[#0E0F12]/80 to-transparent w-full md:w-3/4" />
          </div>
        ))}

        {/* Foreground Content */}
        <div className="relative z-10 max-w-2xl space-y-4">
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-extrabold text-white tracking-tight drop-shadow-md">
            {current.title}
          </h1>

          {/* Rating & Categories */}
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-semibold text-neutral-300">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#F5C518] text-black font-black text-xs shadow-md">
              <span className="text-[11px] tracking-tight">IMDb</span>
              <span>{current.imdbRating ? Number(current.imdbRating).toFixed(1) : (current.voteAverage ? current.voteAverage.toFixed(1) : '9.2')}</span>
              <Star className="w-3.5 h-3.5 fill-black" />
            </span>

            <span>•</span>
            <span className="text-neutral-300">
              {current.genres && current.genres.length > 0
                ? current.genres.map((g) => (typeof g === 'string' ? g : g.name)).slice(0, 3).join(' · ')
                : 'Action · Adventure · Drama'}
            </span>
            <span>•</span>
            <span className="text-neutral-400 capitalize">{current.type === 'movie' ? 'Movie' : 'TV Series'}</span>
          </div>

          <p className="text-xs sm:text-sm text-neutral-300 line-clamp-3 leading-relaxed max-w-xl drop-shadow">
            {current.overview ||
              'A sprawling saga of power, ambition, and betrayal as noble families struggle for control in a ruthless world.'}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(detailUrl)}
              className="py-2.5 px-6 rounded-xl bg-[#E50914] hover:bg-[#B81D24] text-white text-xs sm:text-sm font-extrabold tracking-wide transition-all shadow-lg shadow-red-900/40 flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>WATCH</span>
            </button>

            <Link
              to={detailUrl}
              className="py-2.5 px-6 rounded-xl bg-black/40 hover:bg-black/60 border border-white/20 hover:border-[#E50914] text-white text-xs sm:text-sm font-bold tracking-wide transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Info className="w-4 h-4 text-neutral-300" />
              <span>Details &amp; Trailer</span>
            </Link>
          </div>
        </div>

        {/* Carousel Pagination Controls */}
        <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={prevHero}
            className="w-9 h-9 rounded-full bg-black/60 hover:bg-[#E50914] text-white border border-white/10 flex items-center justify-center transition-colors shadow cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={nextHero}
            className="w-9 h-9 rounded-full bg-black/60 hover:bg-[#E50914] text-white border border-white/10 flex items-center justify-center transition-colors shadow cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
