import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { tmdbService } from '../services/tmdb';
import { MediaItem, TMDBEpisode, TMDBSeason, StreamResult, StreamingProvider } from '../types';
import { getBestWorkingServer, STREAMING_SERVERS, setPreferredServerId } from '../services/streaming';
import { Player } from '../components/Player';
import { ServerSelector } from '../components/ServerSelector';
import { FmovSourceSelector } from '../components/FmovSourceSelector';
import { convertFmovStreamToStreamResult, FmovStreamItem } from '../services/fmovStream';
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
import { Sun, X } from 'lucide-react';

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
  const [showFmovModal, setShowFmovModal] = useState(false);
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
        tmdbService.recordView('tv', resolvedShow.tmdbId);
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

  const handleSelectFmovSource = (source: FmovStreamItem) => {
    if (!tvShow) return;
    const converted = convertFmovStreamToStreamResult(source, tvShow.tmdbId, 'tv');
    setStreamResult(converted);
    setShowFmovModal(false);
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
      <div className="min-h-[65vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-3 border-[#E50914] border-t-transparent rounded-full animate-spin shadow-lg shadow-red-950/60" />
        <p className="text-xs font-bold text-[#A1A7B5] uppercase tracking-wider animate-pulse">
          Loading episode stream...
        </p>
      </div>
    );
  }

  if (!tvShow) {
    return (
      <div className="text-center py-24 max-w-md mx-auto">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#0D0F14] border border-white/10 flex items-center justify-center text-2xl font-black text-[#E50914]">
          !
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Series Not Found</h2>
        <p className="text-sm text-[#A1A7B5] mb-6">
          We couldn't find the requested series. It may have been moved or removed.
        </p>
        <Link
          to="/tv"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#E50914] hover:bg-[#B81D24] text-white font-extrabold text-sm transition-all shadow-lg shadow-red-950/40"
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
    <div className="relative py-2 space-y-5">
      <SEO
        title={`${episodeTitle} - ${tvShow.title} - Tstream`}
        description={episode?.overview || tvShow.overview || 'Watch TV episode online in HD.'}
      />

      {/* Cinema Mode Dimming Overlay */}
      {cinemaMode && (
        <div
          onClick={() => setCinemaMode(false)}
          className="fixed inset-0 bg-black/92 backdrop-blur-md z-40 transition-opacity duration-500 cursor-pointer flex items-start justify-end p-6"
          title="Click anywhere to exit Cinema Mode"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCinemaMode(false);
            }}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-black backdrop-blur-md border border-white/20 transition-all flex items-center gap-2 cursor-pointer shadow-2xl"
          >
            <Sun className="w-4 h-4 text-[#F5C518]" />
            <span>Exit Cinema Mode</span>
          </button>
        </div>
      )}

      {/* Main Grid: Left (Player & Details), Right (Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Player, Episode Selector, Source Selector, Metadata, Cast */}
        <div
          className={`space-y-4 sm:space-y-5 transition-all duration-300 ${
            cinemaMode
              ? 'lg:col-span-12 relative z-50 max-w-6xl mx-auto w-full'
              : 'lg:col-span-8 xl:col-span-9'
          }`}
        >
          {/* Direct HLS Video Player */}
          {streamResult && (
            <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/[0.08] bg-black">
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
                servers={STREAMING_SERVERS}
                currentServerId={currentServer.id}
                onSelectServer={handleSelectServer}
                failedServerIds={failedServerIds}
              />
            </div>
          )}

          {/* Episode Selector Bar (Season, Prev/Next, Episode Drawer, Auto-Next) */}
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

          {/* Compact Stream Source Selector */}
          <ServerSelector
            currentServerId={currentServer.id}
            onSelectServer={handleSelectServer}
            failedServerIds={failedServerIds}
            onOpenAggregatedSources={() => setShowFmovModal(true)}
          />

          {/* Collapsible FMOV Multi-Provider Streams */}
          <FmovSourceSelector
            tmdbId={tvShow.tmdbId}
            type="tv"
            seasonNumber={currentSeasonNum}
            episodeNumber={currentEpisodeNum}
            activeSourceUrl={streamResult?.sources?.[0]?.url}
            onSelectSource={handleSelectFmovSource}
            defaultExpanded={false}
          />

          {/* Comprehensive TV Episode Info Panel */}
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

          {/* Storyline Section */}
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

      {/* FMOV Aggregator Modal if opened from ServerSelector */}
      {showFmovModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[85vh] bg-[#0D0F14] border border-white/10 rounded-3xl shadow-2xl p-5 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-black text-white">All Live Streaming Sources</h3>
              <button
                type="button"
                onClick={() => setShowFmovModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <FmovSourceSelector
              tmdbId={tvShow.tmdbId}
              type="tv"
              seasonNumber={currentSeasonNum}
              episodeNumber={currentEpisodeNum}
              activeSourceUrl={streamResult?.sources?.[0]?.url}
              onSelectSource={handleSelectFmovSource}
              defaultExpanded={true}
            />
          </div>
        </div>
      )}

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
