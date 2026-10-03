import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, Star, Flame } from 'lucide-react';
import { MediaItem } from '../types';
import { getTMDBImageUrl, formatRating, formatYear } from '../utils/slugify';

interface Top10RowProps {
  movieItems: MediaItem[];
  tvItems: MediaItem[];
}

export function Top10Row({ movieItems, tvItems }: Top10RowProps) {
  const [activeTab, setActiveTab] = useState<'movie' | 'tv'>('movie');
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -600 : 600;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const currentItems = (activeTab === 'movie' ? movieItems : tvItems).slice(0, 10);

  return (
    <section className="relative my-8 sm:my-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#F5C518]/15 border border-[#F5C518]/30">
            <Flame className="w-5 h-5 text-[#F5C518]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2">
              Top 10 Streaming
            </h2>
            <p className="text-xs text-neutral-400">The most-watched titles across the platform</p>
          </div>
        </div>

        {/* Tab Switcher & Navigation */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-[#151820] border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('movie')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'movie'
                  ? 'bg-[#F5C518] text-black font-black shadow-md shadow-[#F5C518]/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Movies
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tv')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'tv'
                  ? 'bg-[#F5C518] text-black font-black shadow-md shadow-[#F5C518]/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              TV Series
            </button>
          </div>

          {/* Scroll Arrows */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              className="p-2 rounded-xl bg-[#151820] border border-white/10 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll('right')}
              className="p-2 rounded-xl bg-[#151820] border border-white/10 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Top 10 Scroller */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={scrollRef}
          className="flex items-end space-x-6 sm:space-x-8 overflow-x-auto no-scrollbar scroll-smooth pb-4 pt-2"
        >
          {currentItems.map((item, index) => {
            const rankStr = String(index + 1);
            const detailUrl = activeTab === 'movie' ? `/movie/${item.slug}` : `/tv/${item.slug}`;
            const watchUrl =
              activeTab === 'movie'
                ? `/watch/movie/${item.slug}`
                : `/watch/tv/${item.slug}/season/1/episode/1`;

            return (
              <div
                key={item.id}
                className="group relative flex-shrink-0 flex items-end cursor-pointer"
              >
                {/* Giant Stylized Rank Number */}
                <div
                  className="bebas-font text-8xl sm:text-9xl md:text-[140px] font-black leading-none select-none -mr-4 sm:-mr-6 z-0 text-transparent transition-all duration-300 group-hover:text-[#F5C518]/25"
                  style={{
                    WebkitTextStroke: '3px rgba(255, 255, 255, 0.28)',
                    transform: 'translateY(16px)',
                  }}
                >
                  {rankStr}
                </div>

                {/* Poster Card */}
                <div className="relative w-36 sm:w-44 md:w-48 aspect-[2/3] rounded-xl overflow-hidden bg-[#151820] border border-white/10 group-hover:border-[#F5C518] shadow-2xl transition-all duration-300 z-10 group-hover:scale-105 group-hover:shadow-[#F5C518]/20">
                  <img
                    src={getTMDBImageUrl(item.posterPath, 'w500')}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />

                  {/* Rating Tag */}
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/85 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/10 text-white text-xs font-bold shadow">
                    <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-[#F5C518] text-black tracking-tight leading-tight">IMDb</span>
                    <span className="text-neutral-100">{formatRating(item.imdbRating || item.voteAverage)}</span>
                  </div>

                  {/* Top Badge */}
                  <div className="absolute top-2 left-2 bg-[#F5C518] text-black text-[10px] font-black px-1.5 py-0.5 rounded shadow">
                    #{index + 1}
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 space-y-2">
                    <h4 className="text-white text-sm font-bold truncate">{item.title}</h4>
                    <div className="flex items-center justify-between text-xs text-neutral-300">
                      <span>{formatYear(item.releaseDate)}</span>
                      <span className="uppercase text-[10px] px-1 py-0.5 rounded bg-white/10 font-bold">
                        {item.quality || '4K'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Link
                        to={watchUrl}
                        className="flex-1 py-1.5 bg-[#F5C518] hover:bg-[#E5B508] text-black text-xs font-extrabold rounded-lg flex items-center justify-center gap-1 shadow shadow-[#F5C518]/20"
                      >
                        <Play className="w-3.5 h-3.5 fill-black" />
                        <span>Watch</span>
                      </Link>
                      <Link
                        to={detailUrl}
                        className="px-2.5 py-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-medium rounded-lg text-center"
                      >
                        Info
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
