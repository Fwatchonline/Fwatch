import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { tmdbService } from '../services/tmdb';
import { MediaItem, TMDBEpisode, TMDBSeason, StreamResult, StreamingProvider } from '../types';
import { getBestWorkingServer, STREAMING_SERVERS, setPreferredServerId } from '../services/streaming';
import { Player } from '../components/Player';
import { SEO } from '../components/SEO';
import {
  List,
  X,
  Play,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RotateCcw,
  Server,
} from 'lucide-react';

interface EmbedPlayerProps {
  type: 'movie' | 'tv';
}

export function EmbedPlayer({ type }: EmbedPlayerProps) {
  const { id, seasonNumber, episodeNumber } = useParams<{
    id: string;
    seasonNumber?: string;
    episodeNumber?: string;
  }>();

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Parse Query Parameters
  const rawColor = searchParams.get('color');
  const accentColor = rawColor
    ? rawColor.startsWith('#')
      ? rawColor
      : `#${rawColor}`
    : '#F5C518';

  const autoPlayParam = searchParams.get('autoplay') || searchParams.get('autoPlay');
  const autoPlay = autoPlayParam === 'true' || autoPlayParam === '1';

  const nextEpisodeEnabled =
    searchParams.get('nextEpisode') !== 'false' && searchParams.get('nextEpisode') !== '0';

  const episodeSelectorEnabled =
    searchParams.get('episodeSelector') !== 'false' && searchParams.get('episodeSelector') !== '0';

  const autoplayNextEpisode =
    searchParams.get('autoplayNextEpisode') !== 'false' &&
    searchParams.get('autoplayNextEpisode') !== '0' &&
    searchParams.get('autoNext') !== 'false';

  const showOverlay = searchParams.get('overlay') === 'true' || searchParams.get('overlay') === '1';
  const customServerId = searchParams.get('server');

  // Season & Episode resolution
  const currentSeason = parseInt(seasonNumber || '1', 10);
  const currentEpisode = parseInt(episodeNumber || '1', 10);

  // States
  const [mediaItem, setMediaItem] = useState<MediaItem | null>(null);
  const [episode, setEpisode] = useState<TMDBEpisode | null>(null);
  const [season, setSeason] = useState<TMDBSeason | null>(null);
  const [streamResult, setStreamResult] = useState<StreamResult | null>(null);
  const [currentServer, setCurrentServer] = useState<StreamingProvider>(STREAMING_SERVERS[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Embedded Drawer States
  const [showEpisodeDrawer, setShowEpisodeDrawer] = useState(false);
  const [showServerDrawer, setShowServerDrawer] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);

  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Notify parent iframe via postMessage
  const postToParent = useCallback((eventName: string, payload?: any) => {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          {
            source: 'tmovie-embed',
            type: eventName,
            ...payload,
          },
          '*'
        );
      }
    } catch {}
  }, []);

  // Resolve media item & stream
  useEffect(() => {
    let mounted = true;
    if (!id) return;

    setLoading(true);
    setError(null);

    // Extract numeric ID if slug or number
    const numericId = parseInt(id, 10);

    const resolvePromise =
      !isNaN(numericId) && numericId > 0
        ? type === 'movie'
          ? tmdbService.getMovieByTmdbId(numericId)
          : tmdbService.getTvByTmdbId(numericId)
        : tmdbService.resolveMediaBySlug(type, id);

    resolvePromise
      .then(async (resolved) => {
        if (!mounted) return;
        if (!resolved) {
          setError('Title not found on T.Movie catalog');
          setLoading(false);
          return;
        }

        setMediaItem(resolved);

        if (type === 'tv') {
          const [ep, s] = await Promise.all([
            tmdbService.getEpisode(resolved.tmdbId, currentSeason, currentEpisode),
            tmdbService.getSeason(resolved.tmdbId, currentSeason),
          ]);
          if (mounted) {
            setEpisode(ep);
            setSeason(s);
          }
        }

        // Selected server priority
        let chosenServer = STREAMING_SERVERS[0];
        if (customServerId) {
          const found = STREAMING_SERVERS.find((s) => s.id === customServerId);
          if (found) chosenServer = found;
        }

        const working = await getBestWorkingServer({
          tmdbId: resolved.tmdbId,
          type,
          season: type === 'tv' ? currentSeason : undefined,
          episode: type === 'tv' ? currentEpisode : undefined,
        });

        if (working && mounted) {
          setCurrentServer(working.provider);
          setStreamResult(working.stream);
        } else if (mounted) {
          try {
            const stream = await chosenServer.getStream({
              tmdbId: resolved.tmdbId,
              type,
              season: type === 'tv' ? currentSeason : undefined,
              episode: type === 'tv' ? currentEpisode : undefined,
            });
            setCurrentServer(chosenServer);
            setStreamResult(stream);
          } catch {
            setError('Playback stream temporarily unavailable. Try changing servers.');
          }
        }

        setLoading(false);

        postToParent('TM_EMBED_READY', {
          title: resolved.title,
          tmdbId: resolved.tmdbId,
          type,
          season: type === 'tv' ? currentSeason : undefined,
          episode: type === 'tv' ? currentEpisode : undefined,
        });
      })
      .catch((err) => {
        if (mounted) {
          setError(String(err?.message || 'Error loading media stream'));
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [id, type, currentSeason, currentEpisode, customServerId, postToParent]);

  // Handle postMessage commands from parent window
  useEffect(() => {
    const handleParentMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data) return;

      if (data.command === 'next' || data.command === 'nextEpisode') {
        handleNavigateEpisode(currentSeason, currentEpisode + 1);
      } else if (data.command === 'prev' || data.command === 'prevEpisode') {
        if (currentEpisode > 1) {
          handleNavigateEpisode(currentSeason, currentEpisode - 1);
        }
      } else if (data.command === 'setSeason' && data.season) {
        handleNavigateEpisode(data.season, data.episode || 1);
      }
    };

    window.addEventListener('message', handleParentMessage);
    return () => window.removeEventListener('message', handleParentMessage);
  }, [currentSeason, currentEpisode]);

  // Episode Navigation
  const handleNavigateEpisode = (sNum: number, epNum: number) => {
    if (!id) return;
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      setCountdownSeconds(null);
    }
    setShowEpisodeDrawer(false);
    postToParent('TM_EMBED_EPISODE_CHANGE', { season: sNum, episode: epNum });
    navigate(`/embed/tv/${id}/${sNum}/${epNum}${location.search}`);
  };

  // Autoplay Next Episode on video ended
  const handleEpisodeEnded = () => {
    postToParent('TM_EMBED_ENDED');

    if (type === 'tv' && autoplayNextEpisode) {
      const totalInSeason = season?.episodes?.length || 24;
      const hasNext = currentEpisode < totalInSeason;

      if (hasNext) {
        let count = 5;
        setCountdownSeconds(count);
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

        countdownTimerRef.current = setInterval(() => {
          count -= 1;
          setCountdownSeconds(count);
          if (count <= 0) {
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
            setCountdownSeconds(null);
            handleNavigateEpisode(currentSeason, currentEpisode + 1);
          }
        }, 1000);
      }
    }
  };

  const handleSelectServer = async (server: StreamingProvider) => {
    if (!mediaItem) return;
    setCurrentServer(server);
    setPreferredServerId(server.id);
    setShowServerDrawer(false);
    setLoading(true);
    try {
      const stream = await server.getStream({
        tmdbId: mediaItem.tmdbId,
        type,
        season: type === 'tv' ? currentSeason : undefined,
        episode: type === 'tv' ? currentEpisode : undefined,
      });
      setStreamResult(stream);
      setError(null);
    } catch {
      setError(`Server ${server.name} connection failed. Please choose another.`);
    } finally {
      setLoading(false);
    }
  };

  // Loading state with custom accent spinner
  if (loading) {
    return (
      <div className="fixed inset-0 w-full h-full bg-black flex flex-col items-center justify-center gap-3 select-none">
        <div
          style={{ borderColor: `${accentColor} transparent transparent transparent` }}
          className="w-12 h-12 border-4 rounded-full animate-spin"
        />
        <span className="text-xs font-bold text-neutral-400 tracking-wider animate-pulse">
          Loading player stream...
        </span>
      </div>
    );
  }

  // Error state
  if (error || !mediaItem) {
    return (
      <div className="fixed inset-0 w-full h-full bg-[#0A0B0E] text-white flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mb-3">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h3 className="text-base font-extrabold mb-1">Stream Unavailable</h3>
        <p className="text-xs text-neutral-400 max-w-sm mb-4 leading-relaxed">
          {error || 'The requested stream is not available.'}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
          <button
            type="button"
            onClick={() => setShowServerDrawer(true)}
            style={{ backgroundColor: accentColor }}
            className="px-4 py-2 rounded-xl text-xs font-black text-black transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Server className="w-3.5 h-3.5" />
            <span>Change Server</span>
          </button>
        </div>
      </div>
    );
  }

  const episodeTitle = episode?.name || `Episode ${currentEpisode}`;
  const totalInSeason = season?.episodes?.length || 24;
  const hasNext = currentEpisode < totalInSeason;
  const hasPrev = currentEpisode > 1;

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden select-none">
      <SEO
        title={`Embed: ${mediaItem.title}${type === 'tv' ? ` S${currentSeason}E${currentEpisode}` : ''} - T.Movie`}
        description="Embedded high speed video stream."
      />

      {/* Direct Player Component configured for embed iframe */}
      {streamResult && (
        <Player
          streamResult={streamResult}
          title={mediaItem.title}
          episodeName={type === 'tv' ? episodeTitle : undefined}
          tmdbId={mediaItem.tmdbId}
          type={type}
          slug={mediaItem.slug}
          posterPath={mediaItem.posterPath}
          backdropPath={mediaItem.backdropPath}
          seasonNumber={type === 'tv' ? currentSeason : undefined}
          episodeNumber={type === 'tv' ? currentEpisode : undefined}
          onPrevEpisode={hasPrev && nextEpisodeEnabled ? () => handleNavigateEpisode(currentSeason, currentEpisode - 1) : undefined}
          onNextEpisode={hasNext && nextEpisodeEnabled ? () => handleNavigateEpisode(currentSeason, currentEpisode + 1) : undefined}
          accentColor={accentColor}
          autoPlay={autoPlay}
          isEmbed={true}
          showOverlay={showOverlay}
          onEpisodeEnd={handleEpisodeEnded}
          onPlayStateChange={(playing) => postToParent(playing ? 'TM_EMBED_PLAY' : 'TM_EMBED_PAUSE')}
          onTimeUpdate={(currentTime, duration) =>
            postToParent('TM_EMBED_TIMEUPDATE', {
              currentTime,
              duration,
              percent: duration > 0 ? (currentTime / duration) * 100 : 0,
            })
          }
        />
      )}

      {/* Floating Embedded Controls Header (Episode Drawer & Server Switcher) */}
      <div className="absolute top-3 right-3 flex items-center gap-2 z-40 pointer-events-auto">
        {/* TV Episode Selector Button */}
        {type === 'tv' && episodeSelectorEnabled && (
          <button
            type="button"
            onClick={() => setShowEpisodeDrawer(true)}
            style={{ backgroundColor: `${accentColor}1A`, borderColor: `${accentColor}40`, color: accentColor }}
            className="px-2.5 py-1.5 rounded-xl border text-[11px] font-black backdrop-blur-md hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer shadow-lg"
            title="Browse Episodes"
          >
            <List className="w-3.5 h-3.5" />
            <span>S{currentSeason} · E{currentEpisode}</span>
          </button>
        )}

        {/* Server Mirror Picker Button */}
        <button
          type="button"
          onClick={() => setShowServerDrawer(true)}
          className="p-1.5 rounded-xl bg-black/60 hover:bg-black/90 text-white/80 hover:text-white border border-white/10 backdrop-blur-md transition-all cursor-pointer"
          title="Change Streaming Server"
        >
          <Server className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Autoplay Next Episode Countdown Overlay */}
      {countdownSeconds !== null && (
        <div className="absolute bottom-16 right-4 z-50 animate-fade-in bg-[#111318]/95 border border-white/15 backdrop-blur-xl p-3.5 rounded-2xl shadow-2xl flex items-center gap-4 max-w-sm">
          <div className="flex-1 min-w-0">
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
              Up Next
            </span>
            <p className="text-xs font-bold text-white truncate">
              Season {currentSeason}, Episode {currentEpisode + 1}
            </p>
            <span style={{ color: accentColor }} className="text-[11px] font-bold">
              Playing in {countdownSeconds}s...
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
                setCountdownSeconds(null);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleNavigateEpisode(currentSeason, currentEpisode + 1)}
              style={{ backgroundColor: accentColor }}
              className="px-3 py-1.5 rounded-xl text-black text-xs font-black flex items-center gap-1 cursor-pointer"
            >
              <SkipForward className="w-3.5 h-3.5 fill-black" />
              <span>Play</span>
            </button>
          </div>
        </div>
      )}

      {/* Embedded Episode Drawer Modal */}
      {showEpisodeDrawer && type === 'tv' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end animate-fade-in">
          <div className="w-full sm:w-80 h-full bg-[#111318] border-l border-white/10 p-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <List style={{ color: accentColor }} className="w-4 h-4" />
                <h3 className="font-extrabold text-sm text-white">Episodes</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEpisodeDrawer(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Season Selector */}
            <div className="py-3">
              <label className="text-[11px] font-bold text-neutral-400 block mb-1">
                Select Season:
              </label>
              <select
                value={currentSeason}
                onChange={(e) => handleNavigateEpisode(Number(e.target.value), 1)}
                className="w-full bg-[#0D0F14] text-white border border-white/10 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
              >
                {Array.from({ length: mediaItem.numberOfSeasons || 1 }, (_, i) => i + 1).map((sNum) => (
                  <option key={sNum} value={sNum}>
                    Season {sNum}
                  </option>
                ))}
              </select>
            </div>

            {/* Episode Grid */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
              {(season?.episodes || []).map((ep) => {
                const isCurrent = ep.episodeNumber === currentEpisode;
                return (
                  <button
                    key={ep.episodeNumber}
                    type="button"
                    onClick={() => handleNavigateEpisode(currentSeason, ep.episodeNumber)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                      isCurrent
                        ? 'border-transparent font-bold'
                        : 'bg-[#0D0F14] border-white/5 hover:border-white/20 text-neutral-300 hover:text-white'
                    }`}
                    style={
                      isCurrent
                        ? { backgroundColor: accentColor, color: '#000000' }
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xs font-black opacity-80">
                        E{ep.episodeNumber}
                      </span>
                      <span className="text-xs truncate font-medium">
                        {ep.name || `Episode ${ep.episodeNumber}`}
                      </span>
                    </div>
                    {isCurrent && <Play className="w-3.5 h-3.5 fill-black flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Embedded Server Selector Modal */}
      {showServerDrawer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-[#111318] border border-white/10 rounded-2xl p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Server style={{ color: accentColor }} className="w-4 h-4" />
                <h3 className="font-extrabold text-sm text-white">Streaming Server</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowServerDrawer(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {STREAMING_SERVERS.map((server) => {
                const isActive = server.id === currentServer.id;
                return (
                  <button
                    key={server.id}
                    type="button"
                    onClick={() => handleSelectServer(server)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                      isActive
                        ? 'border-transparent font-bold'
                        : 'bg-[#0D0F14] border-white/5 hover:border-white/20 text-neutral-200'
                    }`}
                    style={
                      isActive
                        ? { backgroundColor: accentColor, color: '#000000' }
                        : undefined
                    }
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">
                        {server.name.split('(')[0].trim()}
                      </p>
                      <span className="text-[10px] opacity-75">
                        Latency: {server.latencyMs || 15}ms · Direct HLS
                      </span>
                    </div>
                    {isActive && <Play className="w-3.5 h-3.5 fill-black flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
