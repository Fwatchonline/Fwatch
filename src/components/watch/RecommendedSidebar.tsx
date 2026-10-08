import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ChevronRight, Film, Tv } from 'lucide-react';
import { MediaItem } from '../../types';
import { getTMDBImageUrl, formatYear } from '../../utils/slugify';

interface RecommendedSidebarProps {
  items: MediaItem[];
  type?: 'movie' | 'tv';
}

export function RecommendedSidebar({ items = [], type = 'movie' }: RecommendedSidebarProps) {
  const isMovie = type === 'movie';
  const displayItems = items.slice(0, 8);

  return (
    <div className="rounded-2xl bg-[#111318] border border-white/[0.07] p-4 sm:p-5 shadow-xl space-y-3.5 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          {isMovie ? (
            <Film className="w-4 h-4 text-[#F5C518]" />
          ) : (
            <Tv className="w-4 h-4 text-[#F5C518]" />
          )}
          <h3 className="font-extrabold text-sm sm:text-base text-white tracking-wide">
            Recommended
          </h3>
        </div>
        <Link
          to={isMovie ? '/movies' : '/tv'}
          className="text-xs font-bold text-[#F5C518] hover:text-[#FFD633] transition-colors flex items-center gap-0.5"
        >
          <span>See All</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Cards List */}
      <div className="space-y-2.5">
        {displayItems.map((item) => {
          const year = formatYear(item.releaseDate);
          const rating = item.imdbRating || item.voteAverage;
          const ratingFormatted = rating && Number(rating) > 0 ? Number(rating).toFixed(1) : '7.8';
          const linkTarget = item.type === 'tv' ? `/tv/${item.slug}` : `/movie/${item.slug}`;

          return (
            <Link
              key={item.id}
              to={linkTarget}
              className="flex items-center gap-3 p-2 rounded-xl bg-[#0D0F14] border border-white/5 hover:border-white/20 hover:bg-[#161922] transition-all group"
            >
              {/* Compact Poster */}
              <div className="w-12 h-16 sm:w-14 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 bg-[#161922] relative border border-white/10">
                <img
                  src={getTMDBImageUrl(item.posterPath, 'w300', 'poster')}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 py-0.5">
                <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#F5C518] transition-colors truncate">
                  {item.title}
                </h4>

                <div className="flex items-center gap-1.5 text-[11px] text-[#A1A7B5] mt-1">
                  <span>{year}</span>
                  <span className="text-[#707684]">·</span>
                  <span className="capitalize">{item.type === 'tv' ? 'Series' : 'Movie'}</span>
                </div>

                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#F5C518]/15 border border-[#F5C518]/30 text-[10px] font-black text-[#F5C518]">
                    <Star className="w-2.5 h-2.5 fill-[#F5C518]" />
                    <span>{ratingFormatted}</span>
                  </div>

                  <span className="text-[10px] font-bold text-[#707684] px-1.5 py-0.5 rounded bg-white/5">
                    {item.quality || 'HD'}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
