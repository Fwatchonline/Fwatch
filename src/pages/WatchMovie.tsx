import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ThumbsUp,
  ThumbsDown,
  Share2,
  Star,
  Plus,
  ChevronRight,
  Film,
} from 'lucide-react';
import { tmdbService } from '../services/tmdb';
import { MediaItem, StreamResult, StreamingProvider } from '../types';
import { getBestWorkingServer, STREAMING_SERVERS, setPreferredServerId } from '../services/streaming';
import { getTMDBImageUrl } from '../utils/slugify';
import { Player } from '../components/Player';
import { ServerSelector } from '../components/ServerSelector';
import { SEO } from '../components/SEO';
import { ShareModal } from '../components/ShareModal';
import { ReportModal } from '../components/ReportModal';
import { useWatchlist } from '../hooks/useWatchlist';

export function WatchMovie() {
  const { slug } = useParams<{ slug: string }>();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  const [movie, setMovie] = useState<MediaItem | null>(null);
  const [streamResult, setStreamResult] = useState<StreamResult | null>(null);
  const [currentServer, setCurrentServer] = useState<StreamingProvider>(STREAMING_SERVERS[0]);
  const [failedServerIds, setFailedServerIds] = useState<string[]>([]);
  const [similar, setSimilar] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [cinemaMode, setCinemaMode] = useState(false);
  const [likesCount, setLikesCount] = useState(2450);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!slug) return;

    setLoading(true);
    tmdbService.resolveMediaBySlug('movie', slug).then(async (resolvedMovie) => {
      if (!mounted) return;
      setMovie(resolvedMovie);

      if (resolvedMovie) {
        tmdbService.getSimilar('movie', resolvedMovie.tmdbId).then((sim) => {
          if (mounted) setSimilar(sim);
        });

        const working = await getBestWorkingServer({
          tmdbId: resolvedMovie.tmdbId,
          type: 'movie',
        });

        if (working && mounted) {
          setCurrentServer(working.provider);
          setStreamResult(working.stream);
        }
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [slug]);

  const handleSelectServer = async (server: StreamingProvider) => {
    if (!movie) return;
    setCurrentServer(server);
    setPreferredServerId(server.id);
    try {
      const stream = await server.getStream({
        tmdbId: movie.tmdbId,
        type: 'movie',
      });
      setStreamResult(stream);
    } catch {
      setFailedServerIds((prev) => [...prev, server.id]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white mb-2">Movie Not Found</h2>
        <Link to="/movies" className="text-[#F5C518] font-semibold hover:underline">
          Return to Movies
        </Link>
      </div>
    );
  }

  const isSaved = isInWatchlist(movie.tmdbId, 'movie');

  return (
    <div className="space-y-8 py-2">
      <SEO
        title={`Watch ${movie.title} - T.Movie`}
        description={movie.overview || `Watch ${movie.title} online.`}
      />

      {/* Main Grid: Left Column (Player & Details), Right Column (Similar Movies) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          {/* Direct HLS Video Player */}
          {streamResult && (
            <Player
              streamResult={streamResult}
              title={movie.title}
              tmdbId={movie.tmdbId}
              type="movie"
              slug={movie.slug}
              posterPath={movie.posterPath}
              backdropPath={movie.backdropPath}
              cinemaMode={cinemaMode}
              onToggleCinemaMode={() => setCinemaMode(!cinemaMode)}
              onShare={() => setShareOpen(true)}
              onReportIssue={() => setReportOpen(true)}
            />
          )}

          {/* Under-Player Metadata & Actions */}
          <div className="rounded-3xl bg-[#16171E] border border-white/5 p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                  {movie.title}{' '}
                  <span className="text-neutral-400 font-semibold text-sm">
                    ({movie.releaseDate ? movie.releaseDate.slice(0, 4) : '2024'})
                  </span>
                </h1>
                <p className="text-xs text-neutral-400 mt-1">
                  {movie.genres && movie.genres.length > 0 ? movie.genres.join(' • ') : 'Action • Thriller'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setLiked(!liked);
                    setLikesCount(liked ? likesCount - 1 : likesCount + 1);
                  }}
                  className={`p-2.5 rounded-xl border transition-colors flex items-center gap-1.5 text-xs font-bold ${
                    liked
                      ? 'bg-[#F5C518] border-[#F5C518] text-black'
                      : 'bg-[#0E0F12] border-white/10 hover:border-white/20 text-neutral-300'
                  }`}
                  title="Like"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>{likesCount}</span>
                </button>

                <button
                  type="button"
                  className="p-2.5 rounded-xl bg-[#0E0F12] border border-white/10 hover:border-white/20 text-neutral-300 hover:text-white transition-colors"
                  title="Dislike"
                >
                  <ThumbsDown className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setShareOpen(true)}
                  className="p-2.5 rounded-xl bg-[#0E0F12] border border-white/10 hover:border-white/20 text-neutral-300 hover:text-white transition-colors"
                  title="Share"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F5C518] text-black text-xs font-black">
                  <span>IMDb</span>
                  <span>{movie.imdbRating ? Number(movie.imdbRating).toFixed(1) : (movie.voteAverage ? movie.voteAverage.toFixed(1) : '8.2')}</span>
                  <Star className="w-3.5 h-3.5 fill-black" />
                </div>

                <button
                  type="button"
                  onClick={() => toggleWatchlist(movie)}
                  className="py-2.5 px-4 rounded-xl bg-[#F5C518] hover:bg-[#E5B508] text-black text-xs font-extrabold transition-colors flex items-center gap-1.5 shadow-md shadow-[#F5C518]/20 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{isSaved ? 'In Watchlist' : 'Add to Watchlist'}</span>
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-white/5">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">
                Story line:
              </h4>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                {movie.overview ||
                  'A harrowing story of courage, sacrifice, and loyalty tested under extreme survival conditions.'}
              </p>
            </div>
          </div>

          <ServerSelector
            currentServerId={currentServer.id}
            onSelectServer={handleSelectServer}
            failedServerIds={failedServerIds}
          />
        </div>

        {/* Right Column: Suggested Titles */}
        <div className="lg:col-span-4 xl:col-span-3 rounded-3xl bg-[#16171E] border border-white/5 p-5 shadow-2xl h-fit space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="font-extrabold text-base text-white">Recommended</h3>
            <Link to="/movies" className="text-xs text-[#F5C518] hover:underline font-bold">
              See All →
            </Link>
          </div>

          <div className="space-y-3">
            {similar.slice(0, 6).map((item) => (
              <Link
                key={item.id}
                to={`/movie/${item.slug}`}
                className="flex items-center gap-3 p-2 rounded-2xl bg-[#0E0F12] border border-white/5 hover:border-white/15 transition-all group"
              >
                <img
                  src={getTMDBImageUrl(item.posterPath, 'w300')}
                  alt={item.title}
                  className="w-12 h-16 rounded-xl object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white group-hover:text-[#F5C518] transition-colors truncate">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mt-1">
                    <span>{item.releaseDate ? item.releaseDate.slice(0, 4) : '2024'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <span className="text-[9px] font-black px-1 py-0.2 rounded bg-[#F5C518] text-black">IMDb</span>
                      <span className="text-neutral-200 font-semibold">{item.imdbRating ? Number(item.imdbRating).toFixed(1) : (item.voteAverage ? item.voteAverage.toFixed(1) : '7.5')}</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {shareOpen && (
        <ShareModal
          title={movie.title}
          url={window.location.href}
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
        />
      )}

      {reportOpen && (
        <ReportModal
          isOpen={reportOpen}
          onClose={() => setReportOpen(false)}
          title={movie.title}
          serverId={currentServer.id}
        />
      )}
    </div>
  );
}
