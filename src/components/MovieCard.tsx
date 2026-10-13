import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Star, Plus, Check, Clapperboard, Bell, Sparkles, Clock, Tv } from 'lucide-react';
import { MediaItem } from '../types';
import { getTMDBImageUrl, formatRating, formatYear } from '../utils/slugify';
import { useWatchlist } from '../hooks/useWatchlist';
import { useUI } from '../context/UIContext';

interface MovieCardProps {
  media: MediaItem;
  priority?: boolean;
  className?: string;
  showImdbBadge?: boolean;
}

function formatCardRuntime(media: MediaItem): string {
  if (media.type === 'movie') {
    if (media.runtime && media.runtime > 0) {
      const h = Math.floor(media.runtime / 60);
      const m = media.runtime % 60;
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    }
    const mockMins = 115 + ((media.tmdbId * 13) % 30);
    const h = Math.floor(mockMins / 60);
    const m = mockMins % 60;
    return `${h}h ${m}m`;
  }

  if (media.numberOfEpisodes && media.numberOfEpisodes > 0) {
    return `${media.numberOfEpisodes} Episodes`;
  }
  if (media.numberOfSeasons && media.numberOfSeasons > 0) {
    return `${media.numberOfSeasons} Season${media.numberOfSeasons > 1 ? 's' : ''}`;
  }
  return 'Series';
}

function getTrendingBadge(media: MediaItem): string {
  const rating = Number(media.imdbRating || media.voteAverage || 0);
  if (rating >= 8.3) return '#1 TRENDING';
  if (rating >= 7.8) return '#1 THIS WEEK';
  if (rating >= 7.2) return 'POPULAR';
  return '#TOP PICK';
}

export function MovieCard({
  media,
  priority = false,
  className,
}: MovieCardProps) {
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { notifications } = useUI();
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const [backdropError, setBackdropError] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [popoverPos, setPopoverPos] = useState<{
    top: number;
    left: number;
    width: number;
    isFlipped: boolean;
  } | null>(null);

  const enterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isSaved = isInWatchlist(media.tmdbId, media.type);
  const detailUrl = media.type === 'movie' ? `/movie/${media.slug}` : `/tv/${media.slug}`;

  // Live or computed new episode notification info
  const isSeries = media.type === 'tv';
  const matchingNotification = notifications.find(
    (n) =>
      (n.mediaTitle && media.title && n.mediaTitle.toLowerCase() === media.title.toLowerCase()) ||
      (n.title && media.title && n.title.toLowerCase().includes(media.title.toLowerCase())) ||
      (media.tmdbId && n.id && n.id.includes(String(media.tmdbId)))
  );

  const latestSeason =
    matchingNotification?.seasonNumber ||
    (media.numberOfSeasons && media.numberOfSeasons > 0 ? media.numberOfSeasons : 1);
  const latestEpisode =
    matchingNotification?.episodeNumber ||
    (media.numberOfEpisodes && media.numberOfEpisodes > 0
      ? Math.min(media.numberOfEpisodes, 10)
      : 8);
  const latestEpTitle =
    matchingNotification?.episodeName ||
    (isSeries ? `Sezona ${latestSeason} Epizoda ${latestEpisode}` : 'Novo 4K Izdanje');

  const displayRating = formatRating(media.imdbRating || media.voteAverage);
  const releaseYear = formatYear(media.releaseDate) || '2025';
  const runtimeDisplay = formatCardRuntime(media);
  const badgeText = getTrendingBadge(media);

  const genreNames: string[] = (media.genres || [])
    .map((g) => (typeof g === 'string' ? g : g?.name))
    .filter(Boolean)
    .slice(0, 3);

  const fallbackGenres =
    genreNames.length > 0
      ? genreNames
      : media.type === 'movie'
      ? ['Action', 'Adventure', 'Drama']
      : ['Drama', 'Series', 'Crime'];

  const overviewText =
    media.overview && media.overview.trim().length > 0
      ? media.overview
      : media.tagline ||
        `An extraordinary story following unforgettable characters in high-stakes drama and thrilling action.`;

  // Hover open handling positioned on the RIGHT side of the poster
  const handleMouseEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }

    enterTimeoutRef.current = setTimeout(() => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const width = Math.min(350, window.innerWidth - 24);

        // Position on the RIGHT side of the poster
        let left = rect.right + 10;
        let isFlipped = false;

        // If not enough room on the right of screen, flip to the LEFT of the poster
        if (left + width > window.innerWidth - 12) {
          left = rect.left - width - 10;
          isFlipped = true;
        }

        // Viewport bounds safeguard
        if (left < 12) {
          left = 12;
        }

        // Align with top of poster
        let top = rect.top + window.scrollY - 8;
        if (top < window.scrollY + 10) {
          top = window.scrollY + 10;
        }

        setPopoverPos({ top, left, width, isFlipped });
        setIsHovered(true);
      }
    }, 180);
  };

  const handleMouseLeave = () => {
    if (enterTimeoutRef.current) {
      clearTimeout(enterTimeoutRef.current);
      enterTimeoutRef.current = null;
    }

    leaveTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 250);
  };

  // Close on window scroll
  useEffect(() => {
    const handleScrollOrResize = () => {
      if (isHovered) {
        setIsHovered(false);
      }
    };

    window.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
      if (enterTimeoutRef.current) clearTimeout(enterTimeoutRef.current);
      if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    };
  }, [isHovered]);

  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWatchlist(media);
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHovered(false);
    navigate(detailUrl);
  };

  const handlePlayEpisodeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHovered(false);
    if (isSeries) {
      navigate(`/tv/${media.slug}?season=${latestSeason}&episode=${latestEpisode}`);
    } else {
      navigate(`/movie/${media.slug}?watch=1`);
    }
  };

  const containerClasses = className !== undefined ? className : 'w-full';

  return (
    <>
      {/* Base Card (Matches Left Poster in Image) */}
      <div
        ref={cardRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`group relative flex flex-col ${containerClasses} transition-all duration-300`}
      >
        {/* Poster Container */}
        <Link
          to={detailUrl}
          className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#16171E] border border-white/5 group-hover:border-[#E50914]/60 group-hover:shadow-2xl group-hover:shadow-red-900/25 transition-all duration-300 block shadow-md"
        >
          <img
            src={
              imgError
                ? getTMDBImageUrl(null, 'w500')
                : getTMDBImageUrl(media.posterPath, 'w500')
            }
            alt={media.title}
            loading={priority ? 'eager' : 'lazy'}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 ease-out"
          />

          {/* Rating Badge at Top Right (⭐ 8.4) */}
          <div className="absolute top-2.5 right-2.5 z-10">
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-xs font-bold text-white shadow-md">
              <Star className="w-3 h-3 fill-[#F5C518] text-[#F5C518]" />
              <span className="font-extrabold text-neutral-100">{displayRating}</span>
            </div>
          </div>

          {/* Center Play Button on Poster */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-11 h-11 rounded-full bg-black/55 backdrop-blur-xs border border-white/20 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-[#E50914] group-hover:border-[#E50914] transition-all">
              <Play className="w-4 h-4 fill-white ml-0.5" />
            </div>
          </div>

          {/* Small Plus button at Bottom Right of Poster */}
          <button
            type="button"
            onClick={handleWatchlistClick}
            className={`absolute bottom-2.5 right-2.5 z-10 p-1.5 rounded-full backdrop-blur-md transition-all cursor-pointer ${
              isSaved
                ? 'bg-[#E50914] text-white shadow-md shadow-red-900/40'
                : 'bg-black/70 hover:bg-[#E50914] text-white border border-white/10'
            }`}
            title={isSaved ? 'In Watchlist' : 'Add to Watchlist'}
            aria-label={isSaved ? 'In Watchlist' : 'Add to Watchlist'}
          >
            {isSaved ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          </button>
        </Link>

        {/* Info Below Poster */}
        <div className="mt-2.5 space-y-0.5">
          <Link
            to={detailUrl}
            className="text-xs sm:text-sm font-bold text-neutral-100 group-hover:text-[#E50914] transition-colors truncate block"
            title={media.title}
          >
            {media.title}
          </Link>

          {/* Subtitle in Red: e.g. "MOVIE · 2026" */}
          <div className="text-[11px] font-extrabold text-[#E50914] tracking-wider uppercase truncate">
            <span>{media.type === 'movie' ? 'MOVIE' : 'SERIES'}</span>
            <span className="mx-1 text-[#E50914]/50">·</span>
            <span>{releaseYear}</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* EXPANDED HOVER POPUP (Positioned on the RIGHT of the poster)              */}
      {/* ========================================================================= */}
      {isHovered &&
        popoverPos &&
        createPortal(
          <div
            style={{
              position: 'absolute',
              top: `${popoverPos.top}px`,
              left: `${popoverPos.left}px`,
              width: `${popoverPos.width}px`,
              zIndex: 9999,
            }}
            onMouseEnter={() => {
              if (leaveTimeoutRef.current) {
                clearTimeout(leaveTimeoutRef.current);
                leaveTimeoutRef.current = null;
              }
              setIsHovered(true);
            }}
            onMouseLeave={handleMouseLeave}
            className={`rounded-3xl bg-[#0b1322] border border-[#1e293b] shadow-2xl shadow-black/95 overflow-hidden transition-all duration-200 animate-in fade-in zoom-in-95 before:absolute ${
              popoverPos.isFlipped ? 'before:-right-4' : 'before:-left-4'
            } before:top-0 before:bottom-0 before:w-5 before:pointer-events-auto`}
          >
            {/* Top 16:9 Backdrop Image */}
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#070b14]">
              <img
                src={
                  backdropError || (!media.backdropPath && !media.posterPath)
                    ? getTMDBImageUrl(media.posterPath, 'w780')
                    : getTMDBImageUrl(
                        media.backdropPath || media.posterPath,
                        'w780',
                        'backdrop'
                      )
                }
                alt={media.title}
                onError={() => setBackdropError(true)}
                className="w-full h-full object-cover object-top"
              />
              {/* Bottom Gradient Fade into card body */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1322] via-[#0b1322]/40 to-transparent" />
            </div>

            {/* Card Content Body */}
            <div className="p-4 sm:p-5 space-y-3 -mt-6 relative z-10">
              {/* Badge: #1 TRENDING in Red/Crimson Accent */}
              <div>
                <span className="inline-block px-3 py-0.5 rounded-full bg-red-950/60 border border-red-500/40 text-red-300 text-[11px] font-extrabold tracking-wide uppercase shadow-sm">
                  {badgeText}
                </span>
              </div>

              {/* Title */}
              <Link
                to={detailUrl}
                onClick={() => setIsHovered(false)}
                className="text-base sm:text-lg font-black text-white hover:text-[#E50914] transition-colors leading-snug line-clamp-2 block"
                title={media.title}
              >
                {media.title}
              </Link>

              {/* Meta Row: Green Star + Rating, Year, Runtime/Episodes */}
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-neutral-300">
                <span className="flex items-center gap-1 text-emerald-400 font-black">
                  <Star className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                  <span>{displayRating}</span>
                </span>
                <span className="text-neutral-500 font-bold">·</span>
                <span className="text-neutral-200">{releaseYear}</span>
                <span className="text-neutral-500 font-bold">·</span>
                <span className="text-neutral-300">{runtimeDisplay}</span>
              </div>

              {/* Genre Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {fallbackGenres.map((g) => (
                  <span
                    key={g}
                    className="px-2.5 py-0.5 rounded-full bg-[#1b263b] text-[#cbd5e1] border border-white/5 text-[11px] font-semibold tracking-tight"
                  >
                    {g}
                  </span>
                ))}
              </div>

              {/* Obaveštenje za nove epizode / New Episode Notification Panel */}
              <div className="rounded-2xl bg-gradient-to-br from-red-950/80 via-[#180e14] to-[#0c0f18] border border-red-500/40 p-3 shadow-lg shadow-red-950/40 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E50914]" />
                    </span>
                    <span className="text-[11px] font-black uppercase tracking-wider text-red-400 flex items-center gap-1">
                      <Bell className="w-3 h-3 text-[#E50914]" />
                      {isSeries ? 'Obaveštenje o novoj epizodi' : 'Novo 4K Izdanje'}
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                    {matchingNotification ? 'Objavljeno danas' : isSeries ? 'Nova epizoda' : '4K Ultra HD'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2.5 pt-0.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-white truncate">
                      {isSeries ? `S${latestSeason} E${latestEpisode} • ${latestEpTitle}` : `${media.title} (4K HDR Stream)`}
                    </p>
                    <p className="text-[10.5px] text-neutral-400 truncate flex items-center gap-1 mt-0.5">
                      <Sparkles className="w-2.5 h-2.5 text-[#E50914]" />
                      <span>{isSeries ? 'Spreman prevod • Multi-audio • 4K UHD' : 'Dodato sa EX-YU titlovima'}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handlePlayEpisodeClick}
                    className="px-3 py-1.5 rounded-xl bg-[#E50914] hover:bg-[#B81D24] text-white text-[11px] font-black shrink-0 flex items-center gap-1 shadow-md shadow-red-900/50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    title={isSeries ? `Gledaj S${latestSeason} E${latestEpisode}` : 'Gledaj film'}
                  >
                    <Play className="w-3 h-3 fill-white" />
                    <span>{isSeries ? `S${latestSeason} E${latestEpisode}` : 'Pusti'}</span>
                  </button>
                </div>
              </div>

              {/* Overview / Synopsis */}
              <p className="text-xs text-neutral-300 leading-relaxed line-clamp-2 font-normal drop-shadow-xs">
                {overviewText}
              </p>

              {/* Bottom Action Buttons: Wide Red Play Button (#E50914) + Clapperboard + Plus */}
              <div className="flex items-center gap-2.5 pt-1">
                {/* Primary Wide Red Button: ▶ Play */}
                <button
                  type="button"
                  onClick={handlePlayEpisodeClick}
                  className="flex-1 py-2.5 px-5 rounded-full bg-[#E50914] hover:bg-[#B81D24] active:scale-95 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-900/40 hover:shadow-red-800/60 transition-all cursor-pointer"
                  title="Play"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{isSeries ? `Gledaj Seriju (S${latestSeason} E${latestEpisode})` : 'Pusti Film'}</span>
                </button>

                {/* Round Clapperboard / Trailer Button */}
                <button
                  type="button"
                  onClick={handlePlayClick}
                  className="w-10 h-10 rounded-full bg-[#1b263b] hover:bg-[#27354f] border border-white/10 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  title="Details & Trailer"
                  aria-label="Details and Trailer"
                >
                  <Clapperboard className="w-4 h-4 text-neutral-200" />
                </button>

                {/* Round Plus / Watchlist Button */}
                <button
                  type="button"
                  onClick={handleWatchlistClick}
                  className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                    isSaved
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                      : 'bg-[#1b263b] hover:bg-[#27354f] border-white/10 text-white'
                  }`}
                  title={isSaved ? 'Remove from Watchlist' : 'Add to Watchlist'}
                  aria-label={isSaved ? 'Remove from Watchlist' : 'Add to Watchlist'}
                >
                  {isSaved ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Plus className="w-4 h-4 text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
