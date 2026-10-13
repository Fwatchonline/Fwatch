import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Star, Clock } from 'lucide-react';
import { TMDBEpisode } from '../types';
import { getTMDBImageUrl, formatRating, formatRuntime, formatDate } from '../utils/slugify';

interface EpisodeCardProps {
  episode: TMDBEpisode;
  showSlug?: string;
  horizontal?: boolean;
  className?: string;
}

const FALLBACK_EPISODE_STILL = 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800&auto=format&fit=crop&q=80';

export function EpisodeCard({ episode, showSlug, horizontal = false, className }: EpisodeCardProps) {
  const [imgError, setImgError] = useState(false);
  const targetShowSlug = showSlug || episode.showSlug;
  const watchUrl = `/watch/tv/${targetShowSlug}/season/${episode.seasonNumber}/episode/${episode.episodeNumber}`;

  const seasonEpBadge = `S${String(episode.seasonNumber).padStart(2, '0')}E${String(
    episode.episodeNumber
  ).padStart(2, '0')}`;

  const imgSrc = imgError || !episode.stillPath
    ? FALLBACK_EPISODE_STILL
    : getTMDBImageUrl(episode.stillPath, 'w500', 'backdrop');

  if (horizontal) {
    return (
      <Link
        to={watchUrl}
        className="group flex flex-col sm:flex-row items-start gap-4 p-3 rounded-xl bg-[#151820]/60 hover:bg-[#151820] border border-white/5 hover:border-[#E50914]/50 transition-all duration-200"
      >
        {/* Still container */}
        <div className="relative aspect-video w-full sm:w-48 sm:flex-shrink-0 rounded-lg overflow-hidden bg-neutral-800">
          <img
            src={imgSrc}
            alt={episode.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors">
            <div className="w-10 h-10 rounded-full bg-[#E50914] text-white flex items-center justify-center shadow-lg shadow-red-900/40 group-hover:scale-110 transition-transform">
              <Play className="w-4 h-4 fill-white ml-0.5" />
            </div>
          </div>
          <span className="absolute bottom-2 left-2 text-[11px] font-black bg-black/80 text-white px-2 py-0.5 rounded">
            {seasonEpBadge}
          </span>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>{formatDate(episode.airDate)}</span>
            {episode.runtime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatRuntime(episode.runtime)}
              </span>
            )}
          </div>
          <h4 className="text-base font-bold text-white group-hover:text-[#E50914] transition-colors truncate">
            {episode.episodeNumber}. {episode.name}
          </h4>
          <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
            {episode.overview || 'No description available for this episode.'}
          </p>
        </div>
      </Link>
    );
  }

  const containerClasses = className || 'w-72 sm:w-80 flex-shrink-0';

  return (
    <div className={`group relative flex flex-col space-y-2.5 ${containerClasses}`}>
      {/* Thumbnail */}
      <Link
        to={watchUrl}
        className="relative aspect-video w-full rounded-xl overflow-hidden bg-[#151820] border border-white/10 group-hover:border-[#E50914]/60 group-hover:shadow-xl group-hover:shadow-red-900/20 transition-all duration-300 block shadow-md"
      >
        <img
          src={imgSrc}
          alt={episode.name}
          loading="lazy"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-center justify-center">
          <div className="w-11 h-11 rounded-full bg-[#E50914] text-white flex items-center justify-center shadow-xl shadow-red-900/40 group-hover:scale-110 active:scale-95 transition-transform">
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </div>
        </div>

        {/* Top Badges */}
        <span className="absolute top-2.5 left-2.5 text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#E50914] text-white shadow-md">
          {seasonEpBadge}
        </span>

        {episode.voteAverage > 0 && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 bg-black/85 backdrop-blur-md border border-white/10 px-1.5 py-0.5 rounded text-white text-xs font-bold shadow">
            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-[#E50914] text-white tracking-tight leading-tight">IMDb</span>
            <span className="text-neutral-100">{formatRating(episode.imdbRating || episode.voteAverage)}</span>
          </div>
        )}
      </Link>

      {/* Info Below Thumbnail */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span className="text-[#E50914] font-bold truncate max-w-[65%]">
            {episode.showTitle}
          </span>
          <span className="text-[11px] text-neutral-400 shrink-0">
            {formatDate(episode.airDate)}
          </span>
        </div>
        <Link
          to={watchUrl}
          className="text-sm font-bold text-neutral-100 group-hover:text-[#E50914] transition-colors truncate block"
          title={episode.name}
        >
          {episode.name}
        </Link>
        <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
          {episode.overview || 'Recently aired episode now available for instant streaming.'}
        </p>
      </div>
    </div>
  );
}

