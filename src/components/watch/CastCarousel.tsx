import React from 'react';
import { Link } from 'react-router-dom';
import { Users, ChevronRight } from 'lucide-react';
import { TMDBCastMember } from '../../types';
import { getTMDBImageUrl, generateMediaSlug } from '../../utils/slugify';

interface CastCarouselProps {
  cast?: TMDBCastMember[];
}

export function CastCarousel({ cast = [] }: CastCarouselProps) {
  // If no cast data available, provide default well-known actors
  const displayCast = cast && cast.length > 0 ? cast.slice(0, 10) : [];

  if (displayCast.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-[#111318] border border-white/[0.07] p-5 sm:p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-[#A1A7B5] uppercase tracking-wider">
          <Users className="w-3.5 h-3.5 text-[#F5C518]" />
          <span>Cast & Characters</span>
        </div>
        <Link
          to="/people"
          className="text-xs font-semibold text-[#F5C518] hover:text-[#FFD633] transition-colors flex items-center gap-0.5"
        >
          <span>All Artists</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Cast Grid / Scrollable Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {displayCast.map((actor) => {
          const actorSlug = generateMediaSlug(actor.id, actor.name);
          return (
            <Link
              key={actor.id}
              to={`/people`}
              className="group flex items-center gap-2.5 p-2 rounded-xl bg-[#0D0F14] border border-white/5 hover:border-white/20 hover:bg-[#161922] transition-all"
            >
              <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-[#161922] border border-white/10 group-hover:border-[#F5C518] transition-colors">
                <img
                  src={getTMDBImageUrl(actor.profilePath, 'w300', 'avatar')}
                  alt={actor.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-white group-hover:text-[#F5C518] transition-colors truncate">
                  {actor.name}
                </h4>
                <p className="text-[11px] text-[#707684] truncate">
                  {actor.character || 'Cast'}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
