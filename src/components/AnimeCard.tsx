import { Link } from 'react-router-dom';
import { Star, Play, Tv, Film, Sparkles, Layers } from 'lucide-react';
import { AnimeMedia } from '../types';
import { generateAnimeSlug } from '../services/anilist';

interface AnimeCardProps {
  anime: AnimeMedia;
  priority?: boolean;
}

export function AnimeCard({ anime }: AnimeCardProps) {
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

  const isReleasing = anime.status === 'RELEASING';

  return (
    <div className="group relative flex flex-col transition-all duration-300">
      {/* Poster Art Container */}
      <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#151820] border border-white/10 group-hover:border-[#F5C518]/60 group-hover:shadow-2xl group-hover:shadow-[#F5C518]/15 transition-all duration-300">
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
            to={watchUrl}
            className="w-12 h-12 rounded-full bg-[#F5C518] hover:bg-[#E5B508] text-black flex items-center justify-center shadow-xl shadow-[#F5C518]/30 transition-transform hover:scale-110 active:scale-95 cursor-pointer"
            title="Watch Anime"
          >
            <Play className="w-5 h-5 fill-black ml-0.5" />
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
          className="text-sm font-bold text-white group-hover:text-[#F5C518] transition-colors line-clamp-1 block"
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
  );
}
