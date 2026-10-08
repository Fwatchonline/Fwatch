import React from 'react';
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Download,
  Plus,
  Check,
  Clock,
  Globe,
  Film,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { MediaItem, TMDBEpisode } from '../../types';
import { getTMDBImageUrl, formatRuntime, formatYear } from '../../utils/slugify';

interface MovieInfoPanelProps {
  item: MediaItem;
  type: 'movie' | 'tv';
  episode?: TMDBEpisode | null;
  seasonNumber?: number;
  episodeNumber?: number;
  liked: boolean;
  likesCount: number;
  onToggleLike: () => void;
  isSaved: boolean;
  onToggleWatchlist: () => void;
  onShare: () => void;
  onDownload: () => void;
}

export function MovieInfoPanel({
  item,
  type,
  episode,
  seasonNumber,
  episodeNumber,
  liked,
  likesCount,
  onToggleLike,
  isSaved,
  onToggleWatchlist,
  onShare,
  onDownload,
}: MovieInfoPanelProps) {
  const isMovie = type === 'movie';
  const year = formatYear(item.releaseDate);

  // Safe genres extraction (guaranteed zero [object Object])
  const genresList: string[] = Array.isArray(item.genres)
    ? item.genres
        .map((g) => (typeof g === 'string' ? g : g?.name || ''))
        .filter(Boolean)
    : [];

  const genresText = genresList.length > 0 ? genresList.join(' · ') : (isMovie ? 'Action · Drama' : 'Drama · Series');

  // Rating resolution
  const rawRating = isMovie
    ? item.imdbRating || item.voteAverage
    : episode?.imdbRating || episode?.voteAverage || item.imdbRating || item.voteAverage;
  const ratingFormatted = rawRating && Number(rawRating) > 0 ? Number(rawRating).toFixed(1) : '8.0';

  // Runtime
  const runtimeDisplay = isMovie
    ? item.runtime ? formatRuntime(item.runtime) : '124m'
    : episode?.runtime ? `${episode.runtime}m` : '45m';

  // Country
  const country = item.country || 'United States';

  // Page Title for SEO
  const displayTitle = isMovie
    ? item.title
    : `${item.title}: S${String(seasonNumber || 1).padStart(2, '0')}E${String(episodeNumber || 1).padStart(2, '0')} - ${episode?.name || 'Episode ' + (episodeNumber || 1)}`;

  return (
    <div className="rounded-2xl bg-[#111318] border border-white/[0.07] p-5 sm:p-6 shadow-xl transition-all">
      <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 items-start">
        {/* Poster Card */}
        <div className="relative group w-28 sm:w-36 md:w-40 flex-shrink-0 mx-auto sm:mx-0">
          <div className="aspect-[2/3] w-full rounded-xl overflow-hidden bg-[#0D0F14] border border-white/10 shadow-lg relative">
            <img
              src={getTMDBImageUrl(item.posterPath, 'w500', 'poster')}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md text-[10px] font-black text-[#F5C518] px-2 py-0.5 rounded border border-[#F5C518]/30 uppercase tracking-wider">
              {item.quality || '4K UHD'}
            </div>
          </div>
        </div>

        {/* Information & Details */}
        <div className="flex-1 min-w-0 w-full space-y-3.5">
          {/* Header Row: Title & Release Year */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold text-[#F5C518] uppercase tracking-wider px-2 py-0.5 rounded bg-[#F5C518]/10 border border-[#F5C518]/20">
                {isMovie ? 'Movie' : `Season ${seasonNumber || 1} • Episode ${episodeNumber || 1}`}
              </span>
              <span className="text-xs text-[#707684]">·</span>
              <span className="text-xs font-semibold text-[#A1A7B5]">{year}</span>
              <span className="text-xs text-[#707684]">·</span>
              <span className="text-xs font-semibold text-[#A1A7B5] flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#A1A7B5]" />
                {runtimeDisplay}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Watch {item.title} {isMovie && `(${year})`} Online
            </h1>

            {/* Episode Title if TV Show */}
            {!isMovie && episode?.name && (
              <p className="text-sm font-medium text-[#A1A7B5] mt-1">
                Episode {episodeNumber}: <span className="text-white font-semibold">{episode.name}</span>
              </p>
            )}
          </div>

          {/* Metadata Badges / Info Strip */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#A1A7B5] pt-1">
            {/* IMDb Rating */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F5C518] text-black font-black text-xs shadow-sm">
              <Star className="w-3.5 h-3.5 fill-black" />
              <span>{ratingFormatted}</span>
              <span className="text-[10px] opacity-80 font-bold">IMDb</span>
            </div>

            {/* Quality Pill */}
            <span className="px-2 py-0.5 rounded-md bg-[#161922] text-white border border-white/10 font-bold text-[11px]">
              1080p / 4K
            </span>

            {/* Audio Pill */}
            <span className="px-2 py-0.5 rounded-md bg-[#161922] text-white border border-white/10 font-semibold text-[11px] flex items-center gap-1">
              <Volume2 className="w-3 h-3 text-[#18C98B]" />
              English 5.1
            </span>

            {/* Subtitles Available */}
            <span className="px-2 py-0.5 rounded-md bg-[#161922] text-[#A1A7B5] border border-white/10 font-semibold text-[11px]">
              CC / Multi-Subs
            </span>

            {/* Country */}
            <span className="px-2 py-0.5 rounded-md bg-[#161922] text-[#A1A7B5] border border-white/10 font-medium text-[11px] flex items-center gap-1">
              <Globe className="w-3 h-3 text-neutral-400" />
              {country}
            </span>
          </div>

          {/* Clean Unboxed Genres */}
          <div className="text-xs text-[#A1A7B5] flex items-center gap-2 flex-wrap pt-0.5">
            <span className="text-[#707684] font-medium">Genres:</span>
            <span className="text-neutral-200 font-medium">{genresText}</span>
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pt-2 border-t border-white/[0.06]">
            {/* Like */}
            <button
              type="button"
              onClick={onToggleLike}
              className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                liked
                  ? 'bg-[#F5C518] border-[#F5C518] text-black shadow-md shadow-[#F5C518]/25'
                  : 'bg-[#161922] border-white/10 hover:border-white/20 text-[#A1A7B5] hover:text-white'
              }`}
              title="Like this title"
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${liked ? 'fill-black' : ''}`} />
              <span>{likesCount}</span>
            </button>

            {/* Dislike */}
            <button
              type="button"
              className="p-2 rounded-xl bg-[#161922] border border-white/10 hover:border-white/20 text-[#A1A7B5] hover:text-white transition-colors cursor-pointer"
              title="Dislike"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>

            {/* Share */}
            <button
              type="button"
              onClick={onShare}
              className="px-3 py-2 rounded-xl bg-[#161922] border border-white/10 hover:border-white/20 text-[#A1A7B5] hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="Share with friends"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {/* Download */}
            <button
              type="button"
              onClick={onDownload}
              className="px-3 py-2 rounded-xl bg-[#161922] border border-white/10 hover:border-white/20 text-[#A1A7B5] hover:text-[#F5C518] transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="Download offline streams"
            >
              <Download className="w-3.5 h-3.5 text-[#F5C518]" />
              <span className="hidden sm:inline">Download</span>
            </button>

            {/* Add to Watchlist (Primary Accent CTA) */}
            <button
              type="button"
              onClick={onToggleWatchlist}
              className={`ml-auto px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                isSaved
                  ? 'bg-[#18C98B] hover:bg-[#15B07A] text-black shadow-[#18C98B]/20'
                  : 'bg-[#F5C518] hover:bg-[#FFD633] text-black shadow-[#F5C518]/25'
              }`}
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>In Watchlist</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Add to Watchlist</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
