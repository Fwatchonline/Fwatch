import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ThumbsUp,
  ThumbsDown,
  Share2,
  Star,
  Plus,
  ChevronRight,
  ChevronLeft,
  Play,
  Grid,
  X,
  Clock,
} from 'lucide-react';
import { tmdbService } from '../services/tmdb';
import { MediaItem, TMDBEpisode, TMDBSeason, StreamResult, StreamingProvider } from '../types';
import { getBestWorkingServer, STREAMING_SERVERS, setPreferredServerId } from '../services/streaming';
import { getTMDBImageUrl } from '../utils/slugify';
import { Player } from '../components/Player';
import { ServerSelector } from '../components/ServerSelector';
import { SEO } from '../components/SEO';
import { ShareModal } from '../components/ShareModal';
import { ReportModal } from '../components/ReportModal';
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
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(currentSeasonNum);
  const [season, setSeason] = useState<TMDBSeason | null>(null);
  const [streamResult, setStreamResult] = useState<StreamResult | null>(null);
  const [currentServer, setCurrentServer] = useState<StreamingProvider>(STREAMING_SERVERS[0]);
  const [failedServerIds, setFailedServerIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [allEpisodesModalOpen, setAllEpisodesModalOpen] = useState(false);
  const [cinemaMode, setCinemaMode] = useState(false);
  const [storyExpanded, setStoryExpanded] = useState(false);
  const [likesCount, setLikesCount] = useState(1420);
  const [liked, setLiked] = useState(false);

  // Sync selected season with URL
  useEffect(() => {
    setSelectedSeasonNumber(currentSeasonNum);
  }, [currentSeasonNum]);

  // Load TV show, current episode and stream
  useEffect(() => {
    let mounted = true;
    if (!slug) return;

    setLoading(true);
    tmdbService.resolveMediaBySlug('tv', slug).then(async (resolvedShow) => {
      if (!mounted) return;
      setTvShow(resolvedShow);

      if (resolvedShow) {
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

  // When season changes in the dropdown
  const handleSeasonSelect = async (sNum: number) => {
    if (!tvShow) return;
    setSelectedSeasonNumber(sNum);
    setEpisodesLoading(true);
    const s = await tmdbService.getSeason(tvShow.tmdbId, sNum);
    setSeason(s);
    setEpisodesLoading(false);
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
  const hasNextEpisode = episodesList.some((e) => e.episodeNumber === currentEpisodeNum + 1) || true;
  const hasPrevEpisode = currentEpisodeNum > 1;

  const handleNextEpisode = () => {
    if (!tvShow) return;
    navigate(`/watch/tv/${tvShow.slug}/season/${currentSeasonNum}/episode/${currentEpisodeNum + 1}`);
  };

  const handlePrevEpisode = () => {
    if (!tvShow || currentEpisodeNum <= 1) return;
    navigate(`/watch/tv/${tvShow.slug}/season/${currentSeasonNum}/episode/${currentEpisodeNum - 1}`);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!tvShow) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white mb-2">Series Not Found</h2>
        <Link to="/tv" className="text-[#F5C518] font-semibold hover:underline">
          Return to Series
        </Link>
      </div>
    );
  }

  const isSaved = isInWatchlist(tvShow.tmdbId, 'tv');
  const episodeTitle = episode?.name || `Episode ${currentEpisodeNum}`;
  const totalSeasons = tvShow.numberOfSeasons || 1;
  const seasonsList = Array.from({ length: totalSeasons }, (_, i) => i + 1);

  return (
    <div className="space-y-8 py-2">
      <SEO
        title={`${episodeTitle} - ${tvShow.title} - T.Movie`}
        description={episode?.overview || tvShow.overview || 'Watch episode online.'}
      />

      {/* Main Grid: Left Column (Player & Details), Right Column (Episodes List) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Player, Controls & Details) */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          {/* Direct HLS Video Player */}
          {streamResult && (
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
              onNextEpisode={handleNextEpisode}
              cinemaMode={cinemaMode}
              onToggleCinemaMode={() => setCinemaMode(!cinemaMode)}
              onShare={() => setShareOpen(true)}
              onReportIssue={() => setReportOpen(true)}
            />
          )}

          {/* Episode Quick Navigation Bar (Previous Episode / Next Episode) */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#16171E] border border-white/5">
            <button
              type="button"
              onClick={handlePrevEpisode}
              disabled={!hasPrevEpisode}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                hasPrevEpisode
                  ? 'bg-[#0E0F12] hover:bg-[#F5C518] text-white hover:text-black border border-white/10 cursor-pointer'
                  : 'bg-[#0E0F12]/50 text-neutral-600 border border-white/5 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Episode</span>
            </button>

            <span className="text-xs font-black text-[#F5C518] px-3 py-1 rounded-lg bg-black/40 border border-[#F5C518]/20">
              S{String(currentSeasonNum).padStart(2, '0')} • E{String(currentEpisodeNum).padStart(2, '0')}
            </span>

            <button
              type="button"
              onClick={handleNextEpisode}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#F5C518] hover:bg-[#E5B508] text-black transition-all cursor-pointer shadow-md shadow-[#F5C518]/20"
            >
              <span>Next Episode</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Under-Player Metadata & Actions */}
          <div className="rounded-3xl bg-[#16171E] border border-white/5 p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                  {episodeTitle}{' '}
                  <span className="text-neutral-400 font-semibold text-sm">
                    (Season {currentSeasonNum}, Episode {currentEpisodeNum})
                  </span>
                </h1>

                {/* Show chip */}
                <Link
                  to={`/tv/${tvShow.slug}`}
                  className="flex items-center gap-2 mt-2 group w-fit"
                >
                  <img
                    src={getTMDBImageUrl(tvShow.posterPath, 'w300')}
                    alt={tvShow.title}
                    className="w-7 h-7 rounded-full object-cover border border-[#F5C518]"
                  />
                  <span className="text-xs font-bold text-neutral-300 group-hover:text-[#F5C518] transition-colors">
                    {tvShow.title}
                  </span>
                </Link>
              </div>

              {/* Action Buttons: Like, Dislike, Share, Rating, Add to Watchlist */}
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
                  <span>{episode?.imdbRating ? Number(episode.imdbRating).toFixed(1) : (episode?.voteAverage ? episode.voteAverage.toFixed(1) : '9.0')}</span>
                  <Star className="w-3.5 h-3.5 fill-black" />
                </div>

                <button
                  type="button"
                  onClick={() => toggleWatchlist(tvShow)}
                  className="py-2.5 px-4 rounded-xl bg-[#F5C518] hover:bg-[#E5B508] text-black text-xs font-extrabold transition-colors flex items-center gap-1.5 shadow-md shadow-[#F5C518]/20 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{isSaved ? 'In Watchlist' : 'Add to Watchlist'}</span>
                </button>
              </div>
            </div>

            {/* Story Line */}
            <div className="pt-2 border-t border-white/5">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">
                Story line:
              </h4>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                {episode?.overview ||
                  tvShow.overview ||
                  'Dramatic conflicts unfold as characters navigate alliances, peril, and unforeseen twists in this episode.'}
                {!storyExpanded && (
                  <button
                    type="button"
                    onClick={() => setStoryExpanded(true)}
                    className="text-[#F5C518] font-bold ml-1.5 hover:underline"
                  >
                    ... Read More
                  </button>
                )}
              </p>
            </div>
          </div>

          {/* Multi-Server Fallback Selector */}
          <ServerSelector
            currentServerId={currentServer.id}
            onSelectServer={handleSelectServer}
            failedServerIds={failedServerIds}
          />
        </div>

        {/* Right Column: Episodes Playlist & Season Selector */}
        <div className="lg:col-span-4 xl:col-span-3 rounded-3xl bg-[#16171E] border border-white/5 p-5 shadow-2xl h-fit space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 gap-2">
            <h3 className="font-extrabold text-base text-white">Episodes</h3>

            {/* Season Selector Dropdown */}
            <select
              value={selectedSeasonNumber}
              onChange={(e) => handleSeasonSelect(Number(e.target.value))}
              className="py-1 px-3 rounded-xl bg-[#0E0F12] border border-white/10 text-xs font-bold text-[#F5C518] outline-hidden cursor-pointer focus:border-[#F5C518]"
            >
              {seasonsList.map((num) => (
                <option key={num} value={num} className="bg-[#16171E] text-white">
                  Season {num}
                </option>
              ))}
            </select>
          </div>

          {/* Quick All-Episodes Grid Trigger */}
          <button
            type="button"
            onClick={() => setAllEpisodesModalOpen(true)}
            className="w-full py-2 px-3 rounded-xl bg-[#0E0F12] hover:bg-white/5 border border-white/10 text-xs font-bold text-neutral-300 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Grid className="w-3.5 h-3.5 text-[#F5C518]" />
            <span>Open All Episodes Grid ({episodesList.length})</span>
          </button>

          {/* Episodes Playlist (Scrollable, full season list) */}
          {episodesLoading ? (
            <div className="py-12 text-center">
              <div className="w-6 h-6 border-2 border-[#F5C518] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span className="text-[11px] text-neutral-400">Loading episodes...</span>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[720px] overflow-y-auto no-scrollbar pr-1">
              {episodesList.map((ep) => {
                const isActive =
                  selectedSeasonNumber === currentSeasonNum &&
                  ep.episodeNumber === currentEpisodeNum;

                return (
                  <Link
                    key={ep.id}
                    to={`/watch/tv/${tvShow.slug}/season/${selectedSeasonNumber}/episode/${ep.episodeNumber}`}
                    className={`flex items-start gap-3 p-2.5 rounded-2xl transition-all border group ${
                      isActive
                        ? 'bg-[#F5C518]/15 border-[#F5C518] shadow-md shadow-[#F5C518]/10'
                        : 'bg-[#0E0F12] border-white/5 hover:border-[#F5C518]/30'
                    }`}
                  >
                    <div className="relative w-22 sm:w-24 aspect-video rounded-xl overflow-hidden shrink-0 bg-black/40">
                      <img
                        src={getTMDBImageUrl(ep.stillPath || tvShow.backdropPath, 'w300')}
                        alt={ep.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80';
                        }}
                      />
                      {isActive ? (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Play className="w-5 h-5 fill-[#F5C518] text-[#F5C518]" />
                        </div>
                      ) : (
                        <div className="absolute top-1 left-1 px-1 rounded bg-black/80 text-[9px] font-black text-[#F5C518]">
                          E{ep.episodeNumber}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 py-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-black text-[#F5C518] uppercase">
                          S{String(selectedSeasonNumber).padStart(2, '0')} E{String(ep.episodeNumber).padStart(2, '0')}
                        </span>
                        {ep.runtime && (
                          <span className="text-[10px] text-neutral-500 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {ep.runtime}m
                          </span>
                        )}
                      </div>

                      <h4
                        className={`text-xs font-bold truncate mt-0.5 ${
                          isActive ? 'text-[#F5C518]' : 'text-white group-hover:text-[#F5C518]'
                        }`}
                      >
                        {ep.name || `Episode ${ep.episodeNumber}`}
                      </h4>

                      {ep.overview && (
                        <p className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">
                          {ep.overview}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="pt-2">
            <Link
              to={`/tv/${tvShow.slug}`}
              className="w-full py-2.5 rounded-xl bg-[#F5C518] hover:bg-[#E5B508] text-black text-xs font-extrabold transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-[#F5C518]/20 cursor-pointer"
            >
              <span>Series Details & Cast</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* ALL EPISODES FULL MODAL OVERLAY */}
      {allEpisodesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-5xl max-h-[85vh] bg-[#16171E] border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-extrabold text-white">
                  {tvShow.title} — All Episodes
                </h3>
                {/* Season switch in modal */}
                <select
                  value={selectedSeasonNumber}
                  onChange={(e) => handleSeasonSelect(Number(e.target.value))}
                  className="py-1 px-3 rounded-xl bg-[#0E0F12] border border-white/10 text-xs font-bold text-[#F5C518] outline-hidden cursor-pointer"
                >
                  {seasonsList.map((num) => (
                    <option key={num} value={num} className="bg-[#16171E] text-white">
                      Season {num}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setAllEpisodesModalOpen(false)}
                className="p-2 rounded-xl bg-[#0E0F12] hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Episodes Grid in Modal */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {episodesList.map((ep) => {
                const isActive =
                  selectedSeasonNumber === currentSeasonNum &&
                  ep.episodeNumber === currentEpisodeNum;

                return (
                  <Link
                    key={ep.id}
                    to={`/watch/tv/${tvShow.slug}/season/${selectedSeasonNumber}/episode/${ep.episodeNumber}`}
                    onClick={() => setAllEpisodesModalOpen(false)}
                    className={`rounded-2xl overflow-hidden bg-[#0E0F12] border transition-all duration-300 group flex flex-col p-3 gap-2.5 ${
                      isActive
                        ? 'border-[#F5C518] bg-[#F5C518]/10'
                        : 'border-white/5 hover:border-[#F5C518]/40'
                    }`}
                  >
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black/40">
                      <img
                        src={getTMDBImageUrl(ep.stillPath || tvShow.backdropPath, 'w500')}
                        alt={ep.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80';
                        }}
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-black text-[#F5C518]">
                        EP {ep.episodeNumber}
                      </div>
                      {isActive && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Play className="w-8 h-8 fill-[#F5C518] text-[#F5C518]" />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-[#F5C518]">
                        <span>S{selectedSeasonNumber} E{ep.episodeNumber}</span>
                        {ep.runtime && <span className="text-neutral-500 font-normal">{ep.runtime}m</span>}
                      </div>
                      <h4 className="text-xs font-bold text-white group-hover:text-[#F5C518] transition-colors line-clamp-1 mt-0.5">
                        {ep.name || `Episode ${ep.episodeNumber}`}
                      </h4>
                      <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1">
                        {ep.overview || 'Watch this episode online in HD quality.'}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {shareOpen && (
        <ShareModal
          title={`${episodeTitle} - ${tvShow.title}`}
          url={window.location.href}
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
        />
      )}

      {reportOpen && (
        <ReportModal
          isOpen={reportOpen}
          onClose={() => setReportOpen(false)}
          title={`${episodeTitle} - ${tvShow.title}`}
          serverId={currentServer.id}
        />
      )}
    </div>
  );
}
