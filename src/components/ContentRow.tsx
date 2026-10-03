import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaItem } from '../types';
import { MovieCard } from './MovieCard';

interface ContentRowProps {
  title: string;
  subtitle?: string;
  items: MediaItem[];
  viewAllLink?: string;
  showImdbBadge?: boolean;
}

export function ContentRow({
  title,
  subtitle,
  items,
  viewAllLink,
  showImdbBadge = false,
}: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -650 : 650;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="my-8 sm:my-10">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {title}
          </h2>
          {subtitle && <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-3">
          {viewAllLink && (
            <Link
              to={viewAllLink}
              className="text-xs sm:text-sm font-bold text-[#F5C518] hover:text-[#E5B508] transition-colors flex items-center gap-1 group"
            >
              <span>View All</span>
              <span className="transform group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>
          )}

          {/* Desktop Arrow Buttons */}
          <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-white/10">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-[#F5C518] text-neutral-300 hover:text-black transition-colors"
              aria-label={`Scroll ${title} left`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll('right')}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-[#F5C518] text-neutral-300 hover:text-black transition-colors"
              aria-label={`Scroll ${title} right`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Cards Scroller */}
      <div
        ref={scrollRef}
        className="flex items-start space-x-4 sm:space-x-5 overflow-x-auto no-scrollbar scroll-smooth py-2"
      >
        {items.map((item, index) => (
          <MovieCard
            key={item.id}
            media={item}
            priority={index < 4}
            showImdbBadge={showImdbBadge}
            className="w-36 sm:w-44 md:w-48 lg:w-52 flex-shrink-0"
          />
        ))}
      </div>
    </section>
  );
}
