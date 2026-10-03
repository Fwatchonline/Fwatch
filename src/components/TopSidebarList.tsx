import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Flame, Trophy, Play } from 'lucide-react';
import { MediaItem } from '../types';
import { getTMDBImageUrl, formatRating, formatYear } from '../utils/slugify';

interface TopSidebarListProps {
  movieItems: MediaItem[];
  tvItems: MediaItem[];
}

export function TopSidebarList({ movieItems, tvItems }: TopSidebarListProps) {
  const [activeTab, setActiveTab] = useState<'movie' | 'tv'>('movie');

  const items = (activeTab === 'movie' ? movieItems : tvItems).slice(0, 10);

  return (
    <div className="rounded-2xl bg-[#101217] border border-white/10 p-4 sm:p-5 shadow-2xl flex flex-col h-fit">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-black text-white uppercase tracking-wider">Top 10</h3>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center p-0.5 rounded-lg bg-[#151820] border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('movie')}
            className={`px-2.5 py-1 rounded-md font-bold transition-all ${
              activeTab === 'movie' ? 'bg-[#F5C518] text-black font-extrabold shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Movies
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tv')}
            className={`px-2.5 py-1 rounded-md font-bold transition-all ${
              activeTab === 'tv' ? 'bg-[#F5C518] text-black font-extrabold shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            TV Series
          </button>
        </div>
      </div>

      {/* List Items */}
      <div className="space-y-2.5">
        {items.map((item, index) => {
          const detailUrl = activeTab === 'movie' ? `/movie/${item.slug}` : `/tv/${item.slug}`;
          const rankNum = String(index + 1).padStart(2, '0');

          return (
            <Link
              key={item.id}
              to={detailUrl}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all group border border-transparent hover:border-white/5"
            >
              {/* Rank Number */}
              <span
                className={`text-lg sm:text-xl font-black w-6 text-center bebas-font ${
                  index === 0
                    ? 'text-[#F5C518]'
                    : index === 1
                    ? 'text-amber-400'
                    : index === 2
                    ? 'text-yellow-500'
                    : 'text-neutral-500'
                }`}
              >
                {rankNum}
              </span>

              {/* Poster Thumbnail */}
              <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-neutral-800 flex-shrink-0 border border-white/10 group-hover:border-[#F5C518]/50">
                <img
                  src={getTMDBImageUrl(item.posterPath, 'w300')}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Play className="w-3.5 h-3.5 fill-white text-white" />
                </div>
              </div>

              {/* Title & Metadata */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white group-hover:text-[#F5C518] transition-colors truncate">
                  {item.title}
                </h4>

                <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1">
                  <span>{formatYear(item.releaseDate)}</span>
                  <span>·</span>
                  <span className="truncate">{item.genres?.[0]?.name || (activeTab === 'movie' ? 'Movie' : 'TV')}</span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-semibold mt-0.5">
                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-[#F5C518] text-black tracking-tight leading-tight">
                    IMDb
                  </span>
                  <span className="font-bold text-neutral-200">{formatRating(item.imdbRating || item.voteAverage)}</span>
                  {item.quality && (
                    <span className="ml-1 text-[9px] px-1 rounded bg-white/10 text-neutral-300">
                      {item.quality}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
