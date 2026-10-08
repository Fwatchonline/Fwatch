import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tmdbService } from '../services/tmdb';
import { MediaItem, StreamResult, StreamingProvider } from '../types';
import { getBestWorkingServer, STREAMING_SERVERS, setPreferredServerId } from '../services/streaming';
import { Player } from '../components/Player';
import { ServerSelector } from '../components/ServerSelector';
import { SEO } from '../components/SEO';
import { ShareModal } from '../components/ShareModal';
import { ReportModal } from '../components/ReportModal';
import { DownloadModal } from '../components/DownloadModal';
import { MovieInfoPanel } from '../components/watch/MovieInfoPanel';
import { StorylineSection } from '../components/watch/StorylineSection';
import { CastCarousel } from '../components/watch/CastCarousel';
import { RecommendedSidebar } from '../components/watch/RecommendedSidebar';
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
  const [downloadOpen, setDownloadOpen] = useState(false);
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

  const handleToggleLike = () => {
    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin shadow-lg shadow-[#F5C518]/20" />
        <p className="text-sm font-semibold text-[#A1A7B5] animate-pulse">Loading movie stream...</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="text-center py-24 max-w-md mx-auto">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#111318] border border-white/10 flex items-center justify-center text-2xl font-black text-[#F5C518]">
          !
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Movie Not Found</h2>
        <p className="text-sm text-[#A1A7B5] mb-6">
          We couldn't find the requested title. It may have been moved or removed.
        </p>
        <Link
          to="/movies"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#F5C518] hover:bg-[#FFD633] text-black font-extrabold text-sm transition-all shadow-lg shadow-[#F5C518]/25"
        >
          Explore All Movies
        </Link>
      </div>
    );
  }

  const isSaved = isInWatchlist(movie.tmdbId, 'movie');

  return (
    <div className="relative py-2 space-y-6">
      <SEO
        title={`Watch ${movie.title} - T.Movie`}
        description={movie.overview || `Watch ${movie.title} online in HD with fast streaming.`}
      />

      {/* Cinema Mode Dimming Overlay */}
      {cinemaMode && (
        <div
          onClick={() => setCinemaMode(false)}
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-40 transition-opacity duration-500 cursor-pointer"
          title="Click to exit Cinema Mode"
        />
      )}

      {/* Main Grid: Left (Player & Details), Right (Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Player, Server Selector, Metadata, Cast */}
        <div
          className={`space-y-6 transition-all duration-300 ${
            cinemaMode
              ? 'lg:col-span-12 relative z-50 max-w-6xl mx-auto w-full'
              : 'lg:col-span-8 xl:col-span-9'
          }`}
        >
          {/* Direct HLS Video Player */}
          {streamResult && (
            <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/[0.08] bg-black">
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
            </div>
          )}

          {/* Streaming Server Selector */}
          <ServerSelector
            currentServerId={currentServer.id}
            onSelectServer={handleSelectServer}
            failedServerIds={failedServerIds}
          />

          {/* Comprehensive Movie Info Panel with Poster, Year, Runtime, Genres, IMDb, Actions */}
          <MovieInfoPanel
            item={movie}
            type="movie"
            liked={liked}
            likesCount={likesCount}
            onToggleLike={handleToggleLike}
            isSaved={isSaved}
            onToggleWatchlist={() => toggleWatchlist(movie)}
            onShare={() => setShareOpen(true)}
            onDownload={() => setDownloadOpen(true)}
          />

          {/* Expandable Storyline Section */}
          <StorylineSection
            overview={movie.overview}
            tagline={movie.tagline}
          />

          {/* Cast & Characters Carousel */}
          {movie.cast && movie.cast.length > 0 && (
            <CastCarousel cast={movie.cast} />
          )}
        </div>

        {/* Right Column: Recommended Titles (hidden or dimmed in cinema mode) */}
        {!cinemaMode && (
          <div className="lg:col-span-4 xl:col-span-3 space-y-4">
            <RecommendedSidebar items={similar} type="movie" />
          </div>
        )}
      </div>

      {/* Modals */}
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

      {downloadOpen && (
        <DownloadModal
          isOpen={downloadOpen}
          onClose={() => setDownloadOpen(false)}
          title={movie.title}
          tmdbId={movie.tmdbId}
          type="movie"
        />
      )}
    </div>
  );
}
