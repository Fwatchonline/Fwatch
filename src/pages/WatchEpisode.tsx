import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { tmdbService } from '../services/tmdb';
import { MediaItem, TMDBEpisode, TMDBSeason, StreamResult, StreamingProvider } from '../types';
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
import { EpisodeSelector } from '../components/watch/EpisodeSelector';
import { RecommendedSidebar } from '../components/watch/RecommendedSidebar';
import { useWatchlist } from '../hooks/useWatchlist';

export function WatchEpisode() {
  const { slug, seasonNumber, episodeNumber } = useParams<{
    slug: string;
    seasonNumber: string;
    episodeNumber: string;
  }>();

  const navigate = useNavigate();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  const currentSeasonNum = parseInt(seasonNumber || '1', 10);
  const currentEpisodeNum = parseInt(episodeNumber || '1', 10);

  const [tvShow, setTvShow] = useState<MediaItem | null>(null);
  const [episode, setEpisode] = useState<TMDBEpisode | null>(null);
  const [season, setSeason] = useState<TMDBSeason | null>(null);
  const [similar, setSimilar] = useState<MediaItem[]>([]);
  const [streamResult, setStreamResult] = useState<StreamResult | null>(null);
  const [currentServer, setCurrentServer] = useState<StreamingProvider>(STREAMING_SERVERS[0]);
  const [failedServerIds, setFailedServerIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [cinemaMode, setCinemaMode] = useState(false);
  const [autoNext, setAutoNext] = useState(true);
  const [likesCount, setLikesCount] = useState(1890);
  const [liked, setLiked] = useState(false);

  // Load TV show, current episode, season and stream
  useEffect(() => {
    let mounted = true;
    if (!slug) return;

    setLoading(true);
    tmdbService.resolveMediaBySlug('tv', slug).then(async (resolvedShow) => {
      if (!mounted) return;
      setTvShow(resolvedShow);

      if (resolvedShow) {
        tmdbService.getSimilar('tv', resolvedShow.tmdbId).then((sim) => {
          if (mounted) setSimilar(sim);
        });

        const [ep, s] = await Promise.all([
          tmdbService.getEpisode(resolvedShow.tmdbId, currentSeasonNum, currentEpisodeNum),
          tmdbService.getSeason(resolvedShow.tmdbId, currentSeasonNum),
        ]);

        if (mounted) {
          setEpisode(ep);
          setSeason(s);
        }

        const working = await getBestWorkingServer({
          tmdbId: resolvedShow.tmdbId,
          type: 'tv',
          season: currentSeasonNum,
          episode: currentEpisodeNum,
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
  }, [slug, currentSeasonNum, currentEpisodeNum]);

  // When season changes in the episode selector dropdown
  const handleSeasonSelect = async (sNum: number) => {
    if (!tvShow) return;
    const s = await tmdbService.getSeason(tvShow.tmdbId, sNum);
    setSeason(s);
    navigate(`/watch/tv/${tvShow.slug}/season/${sNum}/episode/1`);
  };

  const handleEpisodeSelect = (epNum: number) => {
    if (!tvShow) return;
    navigate(`/watch/tv/${tvShow.slug}/season/${currentSeasonNum}/episode/${epNum}`);
  };

  const handleSelectServer = async (server: StreamingProvider) => {
    if (!tvShow) return;
    setCurrentServer(server);
    setPreferredServerId(server.id);
    try {
      const stream = await server.getStream({
        tmdbId: tvShow.tmdbId,
        type: 'tv',
        season: currentSeasonNum,
        episode: currentEpisodeNum,
      });
      setStreamResult(stream);
    } catch {
      setFailedServerIds((prev) => [...prev, server.id]);
    }
  };

  const episodesList = season?.episodes || [];
  const maxEpisodes = episodesList.length > 0 ? episodesList.length : 24;
  const hasNextEpisode = currentEpisodeNum < maxEpisodes;
  const hasPrevEpisode = currentEpisodeNum > 1;

  const handleNextEpisode = () => {
    if (!tvShow) return;
    navigate(`/watch/tv/${tvShow.slug}/season/${currentSeasonNum}/episode/${currentEpisodeNum + 1}`);
  };

  const handlePrevEpisode = () => {
    if (!tvShow || currentEpisodeNum <= 1) return;
    navigate(`/watch/tv/${tvShow.slug}/season/${currentSeasonNum}/episode/${currentEpisodeNum - 1}`);
  };

  const handleToggleLike = () => {
    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin shadow-lg shadow-[#F5C518]/20" />
        <p className="text-sm font-semibold text-[#A1A7B5] animate-pulse">Loading episode stream...</p>
      </div>
    );
  }

  if (!tvShow) {
    return (
      <div className="text-center py-24 max-w-md mx-auto">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#111318] border border-white/10 flex items-center justify-center text-2xl font-black text-[#F5C518]">
          !
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Series Not Found</h2>
        <p className="text-sm text-[#A1A7B5] mb-6">
          We couldn't find the requested series. It may have been moved or removed.
        </p>
        <Link
          to="/tv"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#F5C518] hover:bg-[#FFD633] text-black font-extrabold text-sm transition-all shadow-lg shadow-[#F5C518]/25"
        >
          Explore All TV Series
        </Link>
      </div>
    );
  }

  const isSaved = isInWatchlist(tvShow.tmdbId, 'tv');
  const episodeTitle = episode?.name || `Episode ${currentEpisodeNum}`;
  const totalSeasons = tvShow.numberOfSeasons || 1;

  return (
    <div className="relative py-2 space-y-6">
      <SEO
        title={`${episodeTitle} - ${tvShow.title} - T.Movie`}
        description={episode?.overview || tvShow.overview || 'Watch TV episode online in HD.'}
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
        {/* Left Column: Player, Episode Selector, Metadata, Cast */}
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
                title={tvShow.title}
                episodeName={episodeTitle}
                tmdbId={tvShow.tmdbId}
                type="tv"
                slug={tvShow.slug}
                posterPath={tvShow.posterPath}
                backdropPath={tvShow.backdropPath}
                seasonNumber={currentSeasonNum}
                episodeNumber={currentEpisodeNum}
                onPrevEpisode={hasPrevEpisode ? handlePrevEpisode : undefined}
                onNextEpisode={hasNextEpisode ? handleNextEpisode : undefined}
                cinemaMode={cinemaMode}
                onToggleCinemaMode={() => setCinemaMode(!cinemaMode)}
                onShare={() => setShareOpen(true)}
                onReportIssue={() => setReportOpen(true)}
              />
            </div>
          )}

          {/* Episode Quick Selector Bar (Seasons, Episodes Modal, Prev/Next, Auto-Next) */}
          <EpisodeSelector
            currentSeasonNumber={currentSeasonNum}
            currentEpisodeNumber={currentEpisodeNum}
            season={season}
            totalSeasons={totalSeasons}
            onSelectSeason={handleSeasonSelect}
            onSelectEpisode={handleEpisodeSelect}
            onPrevEpisode={handlePrevEpisode}
            onNextEpisode={handleNextEpisode}
            hasPrevEpisode={hasPrevEpisode}
            hasNextEpisode={hasNextEpisode}
            autoNext={autoNext}
            onToggleAutoNext={() => setAutoNext(!autoNext)}
          />

          {/* Streaming Server Selector */}
          <ServerSelector
            currentServerId={currentServer.id}
            onSelectServer={handleSelectServer}
            failedServerIds={failedServerIds}
          />

          {/* Comprehensive TV Episode Info Panel with Poster, Season/Ep, Runtime, IMDb, Actions */}
          <MovieInfoPanel
            item={tvShow}
            type="tv"
            episode={episode}
            seasonNumber={currentSeasonNum}
            episodeNumber={currentEpisodeNum}
            liked={liked}
            likesCount={likesCount}
            onToggleLike={handleToggleLike}
            isSaved={isSaved}
            onToggleWatchlist={() => toggleWatchlist(tvShow)}
            onShare={() => setShareOpen(true)}
            onDownload={() => setDownloadOpen(true)}
          />

          {/* Expandable Storyline Section */}
          <StorylineSection
            overview={episode?.overview || tvShow.overview}
            tagline={tvShow.tagline}
          />

          {/* Cast & Characters Carousel */}
          {tvShow.cast && tvShow.cast.length > 0 && (
            <CastCarousel cast={tvShow.cast} />
          )}
        </div>

        {/* Right Column: Recommended Titles */}
        {!cinemaMode && (
          <div className="lg:col-span-4 xl:col-span-3 space-y-4">
            <RecommendedSidebar items={similar} type="tv" />
          </div>
        )}
      </div>

      {/* Modals */}
      {shareOpen && (
        <ShareModal
          title={`${tvShow.title} - S${currentSeasonNum}E${currentEpisodeNum}`}
          url={window.location.href}
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
        />
      )}

      {reportOpen && (
        <ReportModal
          isOpen={reportOpen}
          onClose={() => setReportOpen(false)}
          title={`${tvShow.title} S${currentSeasonNum}E${currentEpisodeNum}`}
          serverId={currentServer.id}
        />
      )}

      {downloadOpen && (
        <DownloadModal
          isOpen={downloadOpen}
          onClose={() => setDownloadOpen(false)}
          title={`${tvShow.title} S${currentSeasonNum}E${currentEpisodeNum}`}
          tmdbId={tvShow.tmdbId}
          type="tv"
        />
      )}
    </div>
  );
}
