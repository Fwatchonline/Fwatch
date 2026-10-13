import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TMDBPerson, TMDBCastMember } from '../types';
import { getTMDBImageUrl } from '../utils/slugify';

interface ActorCardProps {
  person: TMDBPerson | TMDBCastMember;
  className?: string;
}

export function ActorCard({ person, className }: ActorCardProps) {
  const [imgError, setImgError] = useState(false);
  const isPerson = 'slug' in person;
  const name = person.name || (person as any).title || 'Actor';
  const slug =
    isPerson && (person as any).slug
      ? (person as any).slug
      : `${person.id}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const character = 'character' in person ? (person as any).character : undefined;
  const knownFor = 'knownForDepartment' in person ? (person as any).knownForDepartment : undefined;
  const rawPath = person.profilePath || (person as any).profile_path || (person as any).posterPath;

  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((n: string) => n[0])
    .join('')
    .toUpperCase();

  const containerClasses = className || 'w-32 sm:w-36 md:w-40 flex-shrink-0';

  return (
    <Link
      to={`/actor/${slug}`}
      className={`group flex flex-col ${containerClasses} transition-all duration-300`}
      title={name}
    >
      {/* Portrait Photo Container */}
      <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-[#151820] border border-white/10 group-hover:border-[#E50914]/60 group-hover:shadow-xl group-hover:shadow-red-900/20 transition-all duration-300 shadow-md">
        {imgError || !rawPath ? (
          <div className="w-full h-full bg-gradient-to-br from-[#1c202a] to-[#0e1015] flex flex-col items-center justify-center text-neutral-400 p-2">
            <span className="text-xl sm:text-2xl font-black text-white/80 tracking-wider">
              {initials || 'ACT'}
            </span>
            <span className="text-[10px] uppercase font-bold text-neutral-500 mt-1">
              {knownFor || 'Actor'}
            </span>
          </div>
        ) : (
          <img
            src={getTMDBImageUrl(rawPath, 'w500', 'avatar')}
            alt={name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        )}

        {/* Subtle Dark Gradient at Bottom of Portrait */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
      </div>

      {/* Actor Info Below Poster */}
      <div className="mt-2 space-y-0.5 text-center px-1">
        <h4 className="text-xs sm:text-sm font-bold text-neutral-100 group-hover:text-[#E50914] transition-colors truncate">
          {name}
        </h4>
        <p className="text-[11px] text-neutral-400 truncate">
          {character || knownFor || 'Actor'}
        </p>
      </div>
    </Link>
  );
}

