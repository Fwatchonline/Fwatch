import { Link } from 'react-router-dom';
import { Play, X, Clock } from 'lucide-react';
import { useWatchProgress } from '../hooks/useWatchProgress';
import { getTMDBImageUrl, formatRuntime } from '../utils/slugify';

export function ContinueWatchingRow() {
  const { progressList, removeProgress, clearAllProgress } = useWatchProgress();

  if (!progressList || progressList.length === 0) return null;

  return (
    <section className="my-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#F5C518]/15 border border-[#F5C518]/30 text-[#F5C518]">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Continue Watching
            </h2>
            <p className="text-xs text-neutral-400">Pick up right where you left off</p>
          </div>
        </div>

        <button
          type="button"
          onClick={clearAllProgress}
          className="text-xs text-neutral-400 hover:text-white transition-colors"
        >
          Clear History
        </button>
      </div>

      <div className="flex items-start space-x-4 overflow-x-auto no-scrollbar scroll-smooth py-2">
        {progressList.map((item) => {
          const watchUrl =
            item.type === 'movie'
              ? `/watch/movie/${item.slug}`
              : `/watch/tv/${item.slug}/season/${item.seasonNumber || 1}/episode/${
                  item.episodeNumber || 1
                }`;

          return (
            <div
              key={item.id}
              className="group relative flex-shrink-0 w-64 sm:w-72 rounded-xl overflow-hidden bg-[#151820] border border-white/10 hover:border-[#F5C518]/50 transition-all flex flex-col"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-video w-full bg-neutral-900 overflow-hidden">
                <img
                  src={getTMDBImageUrl(item.backdropPath || item.posterPath, 'w500', 'backdrop')}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                <Link
                  to={watchUrl}
                  className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors"
                  aria-label={`Resume watching ${item.title}`}
                >
                  <div className="w-11 h-11 rounded-full bg-[#F5C518] text-black flex items-center justify-center shadow-lg shadow-[#F5C518]/40 group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-black ml-0.5" />
                  </div>
                </Link>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeProgress(item.id);
                  }}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/70 hover:bg-black text-neutral-300 hover:text-white transition-colors"
                  title="Remove from history"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* TV Episode indicator badge */}
                {item.type === 'tv' && (
                  <span className="absolute top-2 left-2 text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-black/75 text-white">
                    S{String(item.seasonNumber || 1).padStart(2, '0')}E
                    {String(item.episodeNumber || 1).padStart(2, '0')}
                  </span>
                )}

                {/* Progress bar overlay */}
                <div className="absolute bottom-0 inset-x-0 h-1.5 bg-neutral-700">
                  <div
                    className="h-full bg-[#F5C518]"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                  <span className="capitalize">{item.type}</span>
                  <span>{Math.round(item.percentage)}% watched</span>
                </div>
                <Link
                  to={watchUrl}
                  className="text-sm font-bold text-white group-hover:text-[#F5C518] transition-colors truncate block"
                >
                  {item.title}
                </Link>
                {item.episodeName && (
                  <p className="text-xs text-neutral-400 truncate mt-0.5">
                    {item.episodeName}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
