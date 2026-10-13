import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Play, Tv, Film, Sparkles, Bell, Clock, Clapperboard, Check, Plus } from 'lucide-react';
import { AnimeMedia } from '../types';
import { generateAnimeSlug } from '../services/anilist';

interface AnimeCardProps {
  anime: AnimeMedia;
  priority?: boolean;
}

export function AnimeCard({ anime }: AnimeCardProps) {
  const navigate = useNavigate();
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

  const slug = generateAnimeSlug(anime.id, anime.title?.english || anime.title?.romaji);
  const detailUrl = `/anime/${slug}`;
  const watchUrl = `/anime/${slug}?watch=1`;

  const title = anime.title?.english || anime.title?.romaji || 'Untitled Anime';
  const subtitle =
    anime.title?.english && anime.title?.romaji && anime.title?.english !== anime.title?.romaji
      ? anime.title.romaji
      : null;

  const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;

  const isMovie = anime.format === 'MOVIE';
  const isSeries = anime.format === 'TV' || anime.format === 'TV_SHORT';

  const formatLabel =
    anime.format === 'MOVIE'
      ? 'Movie'
      : anime.format === 'TV'
      ? 'Series'
      : anime.format === 'TV_SHORT'
      ? 'Short Series'
      : anime.format === 'OVA'
      ? 'OVA'
      : anime.format === 'ONA'
      ? 'ONA'
      : anime.format === 'SPECIAL'
      ? 'Special'
      : anime.format;

  const episodeOrDuration = isMovie
    ? anime.duration
      ? `${anime.duration}m`
      : 'Movie'
    : anime.episodes
    ? `${anime.episodes} Ep${anime.episodes > 1 ? 's' : ''}`
    : anime.status === 'RELEASING'
    ? 'Airing'
    : 'Series';

  const coverUrl =
    anime.coverImage?.extraLarge ||
    anime.coverImage?.large ||
    anime.coverImage?.medium ||
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=80';

  const bannerUrl =
    anime.bannerImage ||
    anime.coverImage?.extraLarge ||
    coverUrl;

  const isReleasing = anime.status === 'RELEASING';

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

        if (left < 12) {
          left = 12;
        }

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

  const cleanDescription = (anime.description || '')
    .replace(/<[^>]*>?/gm, '')
    .trim() || 'Exciting anime storyline filled with adventure and unforgettable scenes.';

  const latestEpNum = anime.episodes ? anime.episodes : isReleasing ? 12 : 1;

  return (
    <>
      <div
        ref={cardRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="group relative flex flex-col transition-all duration-300"
      >
        {/* Poster Art Container */}
        <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#151820] border border-white/10 group-hover:border-[#E50914]/60 group-hover:shadow-2xl group-hover:shadow-red-900/20 transition-all duration-300">
          <img
            src={coverUrl}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=80';
            }}
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 pointer-events-none" />

          {/* Top Badges */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
            {/* Format Badge */}
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider backdrop-blur-md border ${
                isMovie
                  ? 'bg-amber-500/80 text-black border-amber-400/50'
                  : isSeries
                  ? 'bg-blue-600/80 text-white border-blue-400/50'
                  : 'bg-purple-600/80 text-white border-purple-400/50'
              }`}
            >
              {formatLabel}
            </span>

            {/* Airing Status Dot */}
            {isReleasing && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-500/40 text-[10px] font-bold text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Airing</span>
              </span>
            )}
          </div>

          {/* Bottom Poster Bar: Score & Ep count */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none text-xs">
            {score ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md border border-[#F5C518]/40 text-[#F5C518] font-black text-[11px]">
                <Star className="w-3 h-3 fill-[#F5C518]" />
                <span>{score}</span>
              </span>
            ) : (
              <span />
            )}

            <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md border border-white/10 text-white text-[11px] font-semibold">
              {episodeOrDuration}
            </span>
          </div>

          {/* Hover Action Overlay */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4 gap-2.5 z-20">
            <Link
              to={detailUrl}
              className="w-12 h-12 rounded-full bg-[#E50914] hover:bg-[#B81D24] text-white flex items-center justify-center shadow-xl shadow-red-900/50 transition-transform hover:scale-110 active:scale-95 cursor-pointer"
              title="View Details"
            >
              <Play className="w-5 h-5 fill-white ml-0.5" />
            </Link>

            <Link
              to={detailUrl}
              className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              View Details
            </Link>
          </div>
        </div>

        {/* Anime Info Text */}
        <div className="mt-2.5 space-y-1">
          <Link
            to={detailUrl}
            className="text-sm font-bold text-white group-hover:text-[#E50914] transition-colors line-clamp-1 block"
            title={title}
          >
            {title}
          </Link>

          {subtitle && (
            <p className="text-[11px] text-neutral-400 line-clamp-1 italic">
              {subtitle}
            </p>
          )}

          {/* Genres */}
          {anime.genres && anime.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {anime.genres.slice(0, 2).map((g) => (
                <span
                  key={g}
                  className="text-[9.5px] px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-neutral-300"
                >
                  {g}
                </span>
              ))}
              {anime.seasonYear && (
                <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-black/40 text-neutral-400 border border-white/5">
                  {anime.seasonYear}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right-Side Hover Popover with New Episode Notification */}
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
            {/* Banner/Cover Image */}
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#070b14]">
              <img
                src={bannerUrl}
                alt={title}
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1322] via-[#0b1322]/40 to-transparent" />
            </div>

            {/* Body */}
            <div className="p-4 sm:p-5 space-y-3 -mt-6 relative z-10">
              {/* Badge */}
              <div>
                <span className="inline-block px-3 py-0.5 rounded-full bg-red-950/60 border border-red-500/40 text-red-300 text-[11px] font-extrabold tracking-wide uppercase shadow-sm">
                  {isReleasing ? 'AIRING NOW' : 'TRENDING ANIME'}
                </span>
              </div>

              {/* Title */}
              <Link
                to={detailUrl}
                onClick={() => setIsHovered(false)}
                className="text-base sm:text-lg font-black text-white hover:text-[#E50914] transition-colors leading-snug line-clamp-2 block"
                title={title}
              >
                {title}
              </Link>

              {/* Meta Row */}
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-neutral-300">
                {score && (
                  <>
                    <span className="flex items-center gap-1 text-emerald-400 font-black">
                      <Star className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                      <span>{score}</span>
                    </span>
                    <span className="text-neutral-500 font-bold">·</span>
                  </>
                )}
                <span className="text-neutral-200">{anime.seasonYear || '2025'}</span>
                <span className="text-neutral-500 font-bold">·</span>
                <span className="text-neutral-300">{episodeOrDuration}</span>
              </div>

              {/* Genres */}
              {anime.genres && anime.genres.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {anime.genres.slice(0, 3).map((g) => (
                    <span
                      key={g}
                      className="px-2.5 py-0.5 rounded-full bg-[#1b263b] text-[#cbd5e1] border border-white/5 text-[11px] font-semibold tracking-tight"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {/* Obaveštenje za nove epizode / New Episode Notification */}
              <div className="rounded-2xl bg-gradient-to-br from-red-950/80 via-[#180e14] to-[#0c0f18] border border-red-500/40 p-3 shadow-lg shadow-red-950/40 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E50914]" />
                    </span>
                    <span className="text-[11px] font-black uppercase tracking-wider text-red-400 flex items-center gap-1">
                      <Bell className="w-3 h-3 text-[#E50914]" />
                      {isSeries ? 'Obaveštenje o novoj epizodi' : 'Novo Anime Izdanje'}
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                    {isReleasing ? 'Novo emitovanje' : 'Sub & Dub'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2.5 pt-0.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-white truncate">
                      {isSeries ? `Epizoda ${latestEpNum} • Najnovije izdanje` : `${title} (Full HD)`}
                    </p>
                    <p className="text-[10.5px] text-neutral-400 truncate flex items-center gap-1 mt-0.5">
                      <Sparkles className="w-2.5 h-2.5 text-[#E50914]" />
                      <span>Japanski audio • SRB/ENG titlovi • 1080p</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsHovered(false);
                      navigate(watchUrl);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#E50914] hover:bg-[#B81D24] text-white text-[11px] font-black shrink-0 flex items-center gap-1 shadow-md shadow-red-900/50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    <span>Pusti</span>
                  </button>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-neutral-300 leading-relaxed line-clamp-2 font-normal drop-shadow-xs">
                {cleanDescription}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsHovered(false);
                    navigate(watchUrl);
                  }}
                  className="flex-1 py-2.5 px-5 rounded-full bg-[#E50914] hover:bg-[#B81D24] active:scale-95 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-900/40 hover:shadow-red-800/60 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{isSeries ? `Gledaj Epizodu ${latestEpNum}` : 'Pusti Anime'}</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsHovered(false);
                    navigate(detailUrl);
                  }}
                  className="w-10 h-10 rounded-full bg-[#1b263b] hover:bg-[#27354f] border border-white/10 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  title="Details"
                >
                  <Clapperboard className="w-4 h-4 text-neutral-200" />
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

