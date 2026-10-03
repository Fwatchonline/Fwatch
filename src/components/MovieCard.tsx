import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Star, Bookmark } from 'lucide-react';
import { MediaItem } from '../types';
import { getTMDBImageUrl, formatRating, formatYear } from '../utils/slugify';
import { useWatchlist } from '../hooks/useWatchlist';

interface MovieCardProps {
  media: MediaItem;
  priority?: boolean;
  className?: string;
  showImdbBadge?: boolean;
}

export function MovieCard({
  media,
  priority = false,
  className,
  showImdbBadge = true,
}: MovieCardProps) {
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  const isSaved = isInWatchlist(media.tmdbId, media.type);
  const detailUrl = media.type === 'movie' ? `/movie/${media.slug}` : `/tv/${media.slug}`;
  const watchUrl =
    media.type === 'movie'
      ? `/watch/movie/${media.slug}`
      : `/watch/tv/${media.slug}/season/1/episode/1`;

  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWatchlist(media);
  };

  const handleQuickPlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(watchUrl);
  };

  const containerClasses = className !== undefined ? className : 'w-full';
  const displayRating = formatRating(media.imdbRating || media.voteAverage);

  return (
    <div className={`group relative flex flex-col ${containerClasses} transition-all duration-300`}>
      {/* Poster Container */}
      <Link
        to={detailUrl}
        className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#16171E] border border-white/5 group-hover:border-[#F5C518]/50 group-hover:shadow-2xl group-hover:shadow-[#F5C518]/15 transition-all duration-300 block shadow-md"
      >
        <img
          src={imgError ? getTMDBImageUrl(null, 'w500') : getTMDBImageUrl(media.posterPath, 'w500')}
          alt={media.title}
          loading={priority ? 'eager' : 'lazy'}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Rating Badge at Top Left - Official IMDb badge */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-black/85 backdrop-blur-md border border-white/15 text-[11px] font-bold text-white shadow-md">
            <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-[#F5C518] text-black tracking-tight leading-tight">
              IMDb
            </span>
            <span className="font-extrabold text-neutral-100">
              {displayRating}
            </span>
          </div>
        </div>

        {/* Bookmark Icon at Top Right */}
        <button
          type="button"
          onClick={handleWatchlistClick}
          className={`absolute top-2.5 right-2.5 z-20 p-2 rounded-xl backdrop-blur-md transition-all ${
            isSaved
              ? 'bg-[#F5C518] text-black shadow-lg shadow-[#F5C518]/30 scale-105'
              : 'bg-black/60 text-white/80 hover:bg-[#F5C518] hover:text-black border border-white/10'
          }`}
          title={isSaved ? 'Remove from Watchlist' : 'Add to Watchlist'}
          aria-label={isSaved ? 'Remove from Watchlist' : 'Add to Watchlist'}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
        </button>

        {/* Gradient Overlay & Glowing Play Button on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center p-3 z-10">
          <button
            type="button"
            onClick={handleQuickPlay}
            className="w-12 h-12 rounded-full bg-[#F5C518] text-black flex items-center justify-center shadow-xl shadow-[#F5C518]/50 hover:scale-110 active:scale-95 transition-transform"
            title="Watch Now"
            aria-label="Quick Play"
          >
            <Play className="w-5 h-5 fill-black ml-0.5" />
          </button>
        </div>
      </Link>

      {/* Info Below Poster */}
      <div className="mt-2.5 space-y-1">
        <Link
          to={detailUrl}
          className="text-xs sm:text-sm font-bold text-neutral-100 group-hover:text-[#F5C518] transition-colors truncate block"
          title={media.title}
        >
          {media.title}
        </Link>

        <div className="flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-1.5 text-[11px] truncate">
            <span>{formatYear(media.releaseDate)}</span>
            <span className="text-neutral-600">·</span>
            <span className="capitalize">{media.type === 'movie' ? 'Movie' : 'Series'}</span>
            {media.genres && media.genres.length > 0 && (
              <>
                <span className="text-neutral-600">·</span>
                <span className="text-neutral-400 truncate max-w-[90px]">
                  {typeof media.genres[0] === 'string'
                    ? media.genres[0]
                    : (media.genres[0] as { id: number; name: string })?.name || 'Drama'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
