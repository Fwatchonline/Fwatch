import React, { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Subtitles,
  Share2,
  AlertCircle,
  SkipForward,
  SkipBack,
  Sliders,
  Tv,
  Moon,
  Sun,
  PictureInPicture2,
  Check,
  ChevronRight,
  HelpCircle,
  RefreshCw,
  Sparkles,
  Search,
  Server,
  Zap,
  Radio,
  Layers,
  X,
  Info,
} from 'lucide-react';
import { StreamResult, SubtitleTrack, AudioTrack, StreamingProvider } from '../types';
import { fetchVylaSubtitles, STREAMING_SERVERS, setPreferredServerId } from '../services/streaming';
import { useWatchProgress } from '../hooks/useWatchProgress';
import { enrichAndSortSubtitles, resolveLanguageInfo } from '../utils/languages';
import { getTMDBImageUrl } from '../utils/slugify';

interface PlayerProps {
  streamResult: StreamResult;
  title: string;
  tmdbId: number;
  type: 'movie' | 'tv';
  slug?: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeName?: string;
  totalEpisodesInSeason?: number;
  onPrevEpisode?: () => void;
  onNextEpisode?: () => void;
  onReportIssue?: () => void;
  onShare?: () => void;
  cinemaMode?: boolean;
  onToggleCinemaMode?: () => void;
  accentColor?: string;
  autoPlay?: boolean;
  isEmbed?: boolean;
  showOverlay?: boolean;
  onEpisodeEnd?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  servers?: StreamingProvider[];
  currentServerId?: string;
  onSelectServer?: (server: StreamingProvider) => void;
  failedServerIds?: string[];
}

interface HlsLevelItem {
  index: number;
  height: number;
  width: number;
  bitrate: number;
  label: string;
}

interface AudioTrackItem {
  index: number;
  id: string;
  label: string;
  language: string;
}

interface SubtitleItem {
  id: string;
  label: string;
  language: string;
  hlsIndex?: number;
  url?: string;
}

type SettingsTab = 'main' | 'quality' | 'audio' | 'subtitles' | 'speed' | 'fit' | 'shortcuts' | 'server';
type VideoFit = 'contain' | 'cover' | 'fill';

export function Player({
  streamResult,
  title,
  tmdbId,
  type,
  slug,
  posterPath,
  backdropPath,
  seasonNumber,
  episodeNumber,
  episodeName,
  totalEpisodesInSeason,
  onPrevEpisode,
  onNextEpisode,
  onReportIssue,
  onShare,
  cinemaMode = false,
  onToggleCinemaMode,
  accentColor = '#E50914',
  autoPlay = false,
  isEmbed = false,
  showOverlay = true,
  onEpisodeEnd,
  onTimeUpdate,
  onPlayStateChange,
  servers,
  currentServerId,
  onSelectServer,
  failedServerIds = [],
}: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPlaybackTimeRef = useRef<number>(0);

  // Streaming Server List & Current Mirror
  const serverList = servers && servers.length > 0 ? servers : STREAMING_SERVERS;
  const activeServerId = currentServerId || streamResult.serverId || serverList[0]?.id;
  const activeServerObj = serverList.find((s) => s.id === activeServerId) || serverList[0];

  // Playback states
  const [hasStartedPlayback, setHasStartedPlayback] = useState(autoPlay);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [videoFit, setVideoFit] = useState<VideoFit>('contain');
  const [showControls, setShowControls] = useState(true);
  const [bufferedPercent, setBufferedPercent] = useState(0);

  // Seeking hover preview
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState(0);

  // HLS Dynamic Quality Levels
  const [hlsLevels, setHlsLevels] = useState<HlsLevelItem[]>([]);
  const [selectedQualityIndex, setSelectedQualityIndex] = useState<number>(-1); // -1 = Auto
  const [currentRenderedQuality, setCurrentRenderedQuality] = useState<string>('Auto (1080p)');

  // Audio Tracks
  const initialAudios: AudioTrackItem[] = (streamResult.audioTracks || []).map((a, idx) => {
    const info = resolveLanguageInfo(a.language, a.label);
    return {
      index: idx,
      id: a.id || `audio-${idx}`,
      label: a.label && a.label !== a.language && a.label.length > 3 ? a.label : info.name,
      language: info.code || a.language || 'en',
    };
  });
  const defaultEngAudioIdx = initialAudios.findIndex(
    (a) => a.language?.toLowerCase().startsWith('en') || a.label.toLowerCase().includes('english')
  );

  const [audioTracks, setAudioTracks] = useState<AudioTrackItem[]>(initialAudios);
  const [selectedAudioIndex, setSelectedAudioIndex] = useState<number>(
    defaultEngAudioIdx !== -1 ? defaultEngAudioIdx : 0
  );

  // Subtitles
  const initialSubtitles: SubtitleItem[] = enrichAndSortSubtitles(
    (streamResult.subtitles || []).map((s) => ({
      id: s.id,
      label: s.label,
      language: s.language,
      url: s.url,
    }))
  );

  const [subtitles, setSubtitles] = useState<SubtitleItem[]>(initialSubtitles);
  const [selectedSubtitleId, setSelectedSubtitleId] = useState<string>('off');
  const [subtitleSearch, setSubtitleSearch] = useState('');

  // UI Modals & Menus
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTab | null>(null);
  const [showQuickSubtitles, setShowQuickSubtitles] = useState(false);
  const [showQuickAudio, setShowQuickAudio] = useState(false);
  const [showQuickServer, setShowQuickServer] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [switchingServerName, setSwitchingServerName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skipAnimation, setSkipAnimation] = useState<'left' | 'right' | null>(null);

  // Auto-next episode for TV
  const [showNextEpisodePrompt, setShowNextEpisodePrompt] = useState(false);
  const [nextCountdown, setNextCountdown] = useState(10);

  const currentSource = streamResult.sources[0];
  const isEmbedStream = currentSource?.format === 'embed';
  const hlsSource = streamResult.sources.find((s) => s.format === 'hls');
  const mp4Source = streamResult.sources.find((s) => s.format === 'mp4');

  const { updateProgress, getProgress } = useWatchProgress();

  const mediaKey =
    type === 'movie'
      ? `movie:${tmdbId}`
      : `tv:${tmdbId}:s${seasonNumber}:e${episodeNumber}`;

  // Load comprehensive multi-language subtitles from Vyla SDK
  useEffect(() => {
    let mounted = true;
    fetchVylaSubtitles(tmdbId, type, seasonNumber, episodeNumber)
      .then((vylaSubs) => {
        if (!mounted || !vylaSubs || vylaSubs.length === 0) return;
        setSubtitles((prev) => {
          const existingUrls = new Set(prev.map((s) => s.url).filter(Boolean));
          const existingIds = new Set(prev.map((s) => s.id));
          const newSubs: SubtitleItem[] = vylaSubs
            .filter((s) => (!s.url || !existingUrls.has(s.url)) && !existingIds.has(s.id))
            .map((s) => ({
              id: s.id,
              label: s.label,
              language: s.language,
              url: s.url,
            }));
          if (newSubs.length === 0) return prev;
          return enrichAndSortSubtitles([...prev, ...newSubs]);
        });
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [tmdbId, type, seasonNumber, episodeNumber]);

  // Server switching handler with position preservation
  const handleServerChange = (server: StreamingProvider) => {
    if (videoRef.current && videoRef.current.currentTime > 2) {
      lastPlaybackTimeRef.current = videoRef.current.currentTime;
    }
    const cleanName = server.name.split('(')[0].trim();
    setSwitchingServerName(cleanName);
    setPreferredServerId(server.id);
    if (onSelectServer) {
      onSelectServer(server);
    }
    setTimeout(() => {
      setSwitchingServerName(null);
    }, 2800);
    setShowQuickServer(false);
    setActiveSettingsTab(null);
  };

  // -------------------------------------------------------------
  // INITIALIZE HLS STREAM
  // -------------------------------------------------------------
  useEffect(() => {
    const video = videoRef.current;

    setIsLoading(true);
    setError(null);
    setShowNextEpisodePrompt(false);

    if (isEmbedStream) {
      setIsLoading(false);
      return;
    }

    if (!video) return;

    const bufferTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 4500);

    if (hlsRef.current) {
      try {
        hlsRef.current.destroy();
      } catch {
        // ignore
      }
      hlsRef.current = null;
    }

    const sourceUrl = hlsSource?.url || mp4Source?.url;

    if (!sourceUrl) {
      setError('Unable to load video stream. Please switch to another source mirror.');
      setIsLoading(false);
      return;
    }

    if (hlsSource && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 60,
        maxMaxBufferLength: 120,
      });

      hlsRef.current = hls;
      hls.loadSource(hlsSource.url);
      hls.attachMedia(video);

      const syncAudioTracks = () => {
        let audios: AudioTrackItem[] = [];
        if (hls.audioTracks && hls.audioTracks.length > 0) {
          audios = hls.audioTracks.map((a, idx) => {
            const info = resolveLanguageInfo(a.lang, a.name);
            return {
              index: idx,
              id: `audio-${idx}`,
              label: a.name && a.name !== a.lang && a.name.length > 3 ? a.name : info.name,
              language: info.code || a.lang || 'und',
            };
          });
        } else if (streamResult.audioTracks && streamResult.audioTracks.length > 0) {
          audios = streamResult.audioTracks.map((a, idx) => {
            const info = resolveLanguageInfo(a.language, a.label);
            return {
              index: idx,
              id: a.id || `audio-${idx}`,
              label: a.label && a.label !== a.language && a.label.length > 3 ? a.label : info.name,
              language: info.code || a.language || 'en',
            };
          });
        }
        if (audios.length > 0) {
          setAudioTracks(audios);
        }
      };

      const syncSubtitleTracks = () => {
        if (hls.subtitleTracks && hls.subtitleTracks.length > 0) {
          const internalSubs: SubtitleItem[] = hls.subtitleTracks.map((s, idx) => {
            const info = resolveLanguageInfo(s.lang, s.name);
            return {
              id: `hls-sub-${idx}`,
              hlsIndex: idx,
              label: s.name && s.name !== s.lang && s.name.length > 3 ? s.name : info.name,
              language: info.code || s.lang || 'und',
            };
          });

          setSubtitles((prev) => {
            const combined = [...prev];
            internalSubs.forEach((item) => {
              if (!combined.some((c) => c.label.toLowerCase() === item.label.toLowerCase())) {
                combined.push(item);
              }
            });
            return enrichAndSortSubtitles(combined);
          });
        }
      };

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setIsLoading(false);

        if (data.levels && data.levels.length > 0) {
          const parsed = data.levels.map((lvl, idx) => ({
            index: idx,
            height: lvl.height || 0,
            width: lvl.width || 0,
            bitrate: lvl.bitrate || 0,
            label: lvl.height ? `${lvl.height}p` : `Level ${idx + 1}`,
          }));
          setHlsLevels(parsed);
          const maxLevel = parsed.reduce((max, p) => (p.height > max.height ? p : max), parsed[0]);
          setCurrentRenderedQuality(maxLevel?.height ? `Auto (${maxLevel.height}p)` : 'Auto (1080p)');
        }

        syncAudioTracks();
        syncSubtitleTracks();

        // Restore playback position if preserved or from storage
        const targetSeek = lastPlaybackTimeRef.current > 2
          ? lastPlaybackTimeRef.current
          : getProgress(mediaKey)?.currentTime || 0;

        if (targetSeek > 5) {
          video.currentTime = targetSeek;
        }

        if (hasStartedPlayback || autoPlay) {
          video.play()
            .then(() => {
              setIsPlaying(true);
              setIsLoading(false);
            })
            .catch(() => {
              setIsPlaying(false);
              setIsLoading(false);
            });
        }
      });

      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, () => syncAudioTracks());
      hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, () => syncSubtitleTracks());

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        const lvl = hls.levels[data.level];
        if (lvl) {
          const res = lvl.height ? `${lvl.height}p` : 'Auto';
          setCurrentRenderedQuality(selectedQualityIndex === -1 ? `Auto (${res})` : res);
        }
      });

      hls.on(Hls.Events.FRAG_LOADED, () => setIsLoading(false));

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              try {
                hls.destroy();
              } catch {
                // ignore
              }
              if (mp4Source) {
                video.src = mp4Source.url;
                video.load();
              } else {
                setError('Playback encountered a stall. Switch source mirror or click Retry.');
              }
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = sourceUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        const targetSeek = lastPlaybackTimeRef.current || getProgress(mediaKey)?.currentTime || 0;
        if (targetSeek > 5) video.currentTime = targetSeek;
        if (hasStartedPlayback) video.play().catch(() => {});
      });
    } else if (mp4Source) {
      video.src = mp4Source.url;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        const targetSeek = lastPlaybackTimeRef.current || getProgress(mediaKey)?.currentTime || 0;
        if (targetSeek > 5) video.currentTime = targetSeek;
        if (hasStartedPlayback) video.play().catch(() => {});
      });
    } else {
      setError('HLS playback is not supported on this browser.');
      setIsLoading(false);
    }

    return () => {
      clearTimeout(bufferTimeout);
      if (video) {
        try {
          video.pause();
        } catch {
          // ignore
        }
      }
      if (hlsRef.current) {
        try {
          hlsRef.current.destroy();
        } catch {
          // ignore
        }
        hlsRef.current = null;
      }
    };
  }, [streamResult, mediaKey, isEmbedStream, hasStartedPlayback]);

  // Video Events
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    setCurrentTime(video.currentTime);
    lastPlaybackTimeRef.current = video.currentTime;
    const dur = video.duration || 0;
    setDuration(dur);

    // Buffered range
    if (dur > 0 && video.buffered.length > 0) {
      for (let i = 0; i < video.buffered.length; i++) {
        if (
          video.buffered.start(i) <= video.currentTime &&
          video.currentTime <= video.buffered.end(i)
        ) {
          setBufferedPercent((video.buffered.end(i) / dur) * 100);
          break;
        }
      }
    }

    // Save progress periodically
    if (dur > 0 && Math.floor(video.currentTime) % 4 === 0) {
      updateProgress({
        id: mediaKey,
        tmdbId,
        type,
        slug: slug || '',
        title,
        posterPath: posterPath || null,
        backdropPath: backdropPath || null,
        seasonNumber,
        episodeNumber,
        episodeName,
        currentTime: video.currentTime,
        duration: dur,
      });
    }

    // Auto next prompt 25s before end
    if (type === 'tv' && onNextEpisode && dur > 60 && dur - video.currentTime <= 25) {
      setShowNextEpisodePrompt(true);
    }
  };

  // Auto-next countdown
  useEffect(() => {
    if (!showNextEpisodePrompt || !onNextEpisode) return;

    const interval = setInterval(() => {
      setNextCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onNextEpisode();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showNextEpisodePrompt, onNextEpisode]);

  // Play / Pause toggle
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!hasStartedPlayback) {
      setHasStartedPlayback(true);
    }

    if (video.paused) {
      video.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleStartPlayback = () => {
    setHasStartedPlayback(true);
    const video = videoRef.current;
    if (video) {
      video.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const skipTime = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + seconds));
    setSkipAnimation(seconds > 0 ? 'right' : 'left');
    setTimeout(() => setSkipAnimation(null), 600);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const target = pos * duration;
    video.currentTime = target;
    setCurrentTime(target);
  };

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPos(pos * 100);
    setHoverTime(pos * (duration || 0));
  };

  const handleTimelineMouseLeave = () => {
    setHoverTime(null);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const video = videoRef.current;
    if (!video) return;
    video.volume = val;
    setVolume(val);
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isMuted) {
      video.volume = volume || 1;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiP(false);
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
        setIsPiP(true);
      }
    } catch {
      // ignore
    }
  };

  const handleQualityChange = (levelIndex: number) => {
    setSelectedQualityIndex(levelIndex);
    setActiveSettingsTab(null);

    if (hlsRef.current) {
      if (levelIndex === -1) {
        hlsRef.current.currentLevel = -1;
        setCurrentRenderedQuality('Auto');
      } else {
        hlsRef.current.currentLevel = levelIndex;
        const lvl = hlsRef.current.levels[levelIndex];
        setCurrentRenderedQuality(lvl?.height ? `${lvl.height}p` : `Level ${levelIndex + 1}`);
      }
    }
  };

  const handleAudioTrackChange = (audioIndex: number) => {
    setSelectedAudioIndex(audioIndex);
    setActiveSettingsTab(null);
    setShowQuickAudio(false);

    if (hlsRef.current && hlsRef.current.audioTracks.length > audioIndex) {
      hlsRef.current.audioTrack = audioIndex;
    }
  };

  const handleSubtitleChange = (subId: string) => {
    setSelectedSubtitleId(subId);
    setShowQuickSubtitles(false);
    setActiveSettingsTab(null);

    const video = videoRef.current;
    if (!video) return;

    const found = subtitles.find((s) => s.id === subId);

    if (hlsRef.current) {
      if (subId === 'off' || !found || found.hlsIndex === undefined) {
        hlsRef.current.subtitleTrack = -1;
      } else {
        hlsRef.current.subtitleTrack = found.hlsIndex;
      }
    }

    if (video.textTracks && video.textTracks.length > 0) {
      for (let i = 0; i < video.textTracks.length; i++) {
        const track = video.textTracks[i];
        if (subId === 'off') {
          track.mode = 'disabled';
        } else if (
          found &&
          (track.language?.toLowerCase() === found.language?.toLowerCase() ||
            track.label?.toLowerCase() === found.label?.toLowerCase())
        ) {
          track.mode = 'showing';
        } else {
          track.mode = 'disabled';
        }
      }
    }
  };

  const handleSpeedChange = (speed: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
    setPlaybackSpeed(speed);
    setActiveSettingsTab(null);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !activeSettingsTab && !showQuickSubtitles && !showQuickAudio && !showQuickServer) {
        setShowControls(false);
      }
    }, 3500);
  };

  // Keyboard navigation & Smart TV Remote control support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement).tagName.toLowerCase())) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
        case 'mediaplaypause':
          e.preventDefault();
          if (!hasStartedPlayback) {
            handleStartPlayback();
          } else {
            togglePlay();
          }
          break;
        case 'arrowright':
        case 'l':
        case 'mediafastforward':
          e.preventDefault();
          skipTime(10);
          break;
        case 'arrowleft':
        case 'j':
        case 'mediarewind':
          e.preventDefault();
          skipTime(-10);
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume((prev) => {
            const next = Math.min(1, prev + 0.1);
            if (videoRef.current) videoRef.current.volume = next;
            setIsMuted(false);
            return next;
          });
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume((prev) => {
            const next = Math.max(0, prev - 0.1);
            if (videoRef.current) videoRef.current.volume = next;
            setIsMuted(next === 0);
            return next;
          });
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'p':
          e.preventDefault();
          togglePiP();
          break;
        case 'c':
          e.preventDefault();
          handleSubtitleChange(
            selectedSubtitleId === 'off' && subtitles.length > 0 ? subtitles[0].id : 'off'
          );
          break;
        case '?':
        case 'h':
          e.preventDefault();
          setShowShortcutsModal((prev) => !prev);
          break;
        case 'escape':
          setActiveSettingsTab(null);
          setShowQuickSubtitles(false);
          setShowQuickAudio(false);
          setShowQuickServer(false);
          setShowShortcutsModal(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const backdropUrl = backdropPath
    ? getTMDBImageUrl(backdropPath, 'original', 'backdrop')
    : posterPath
    ? getTMDBImageUrl(posterPath, 'original', 'poster')
    : null;

  const filteredSubtitles = subtitleSearch.trim()
    ? subtitles.filter(
        (s) =>
          s.label.toLowerCase().includes(subtitleSearch.toLowerCase()) ||
          s.language.toLowerCase().includes(subtitleSearch.toLowerCase())
      )
    : subtitles;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onTouchStart={handleMouseMove}
      onDoubleClick={toggleFullscreen}
      style={{ ['--player-accent' as any]: accentColor }}
      role="region"
      aria-label="Video Player"
      className={`relative select-none overflow-hidden bg-black ${
        isEmbed
          ? 'w-full h-full min-h-screen'
          : 'w-full aspect-video max-h-[85vh] rounded-2xl sm:rounded-3xl shadow-2xl group border border-white/[0.08]'
      }`}
    >
      {/* External Embed iFrame */}
      {isEmbedStream && currentSource?.url ? (
        <iframe
          src={currentSource.url}
          className="w-full h-full border-0 bg-black"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          title={title}
        />
      ) : (
        /* Native HTML5 Video */
        <video
          ref={videoRef}
          onClick={togglePlay}
          onPlay={() => {
            setIsPlaying(true);
            setHasStartedPlayback(true);
            onPlayStateChange?.(true);
          }}
          onPause={() => {
            setIsPlaying(false);
            onPlayStateChange?.(false);
          }}
          onEnded={() => {
            setIsPlaying(false);
            onPlayStateChange?.(false);
            onEpisodeEnd?.();
          }}
          onTimeUpdate={() => {
            handleTimeUpdate();
            onTimeUpdate?.(videoRef.current?.currentTime || 0, videoRef.current?.duration || 0);
          }}
          onCanPlay={() => setIsLoading(false)}
          onLoadedData={() => setIsLoading(false)}
          onLoadedMetadata={() => setIsLoading(false)}
          onWaiting={() => setIsLoading(true)}
          onPlaying={() => setIsLoading(false)}
          playsInline
          className={`w-full h-full cursor-pointer transition-opacity duration-500 ${
            !hasStartedPlayback ? 'opacity-0' : 'opacity-100'
          } ${
            videoFit === 'cover'
              ? 'object-cover'
              : videoFit === 'fill'
              ? 'object-fill'
              : 'object-contain'
          }`}
        >
          {subtitles
            .filter((s) => s.url)
            .map((track) => (
              <track
                key={track.id}
                kind="subtitles"
                label={track.label}
                srcLang={track.language}
                src={track.url}
                default={selectedSubtitleId === track.id}
              />
            ))}
        </video>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3.1 BEFORE PLAYBACK STARTS: HIGH-END CINEMATIC POSTER HERO */}
      {/* ------------------------------------------------------------- */}
      {!hasStartedPlayback && !isEmbedStream && (
        <div
          onClick={handleStartPlayback}
          className="absolute inset-0 z-30 cursor-pointer overflow-hidden flex flex-col justify-between p-6 sm:p-10 transition-all duration-700 bg-black group/start"
        >
          {/* Backdrop Image with Vignette Gradient */}
          {backdropUrl && (
            <div className="absolute inset-0 pointer-events-none">
              <img
                src={backdropUrl}
                alt={title}
                className="w-full h-full object-cover object-center scale-100 group-hover/start:scale-105 transition-transform duration-1000 opacity-55"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/70" />
              <div className="absolute inset-0 bg-radial from-transparent via-black/30 to-black/80" />
            </div>
          )}

          {/* Center Prominent Play Button */}
          <div className="relative z-10 flex flex-col items-center justify-center my-auto text-center space-y-4">
            <div className="relative flex items-center justify-center">
              {/* Outer soft glowing pulsing aura */}
              <div className="absolute w-24 h-24 rounded-full bg-[#E50914]/30 animate-ping opacity-60" />
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#E50914] hover:bg-[#B81D24] text-white flex items-center justify-center shadow-[0_0_40px_rgba(229,9,20,0.55)] transform hover:scale-110 active:scale-95 transition-all duration-300 group-hover/start:shadow-[0_0_60px_rgba(229,9,20,0.8)]">
                <Play className="w-9 h-9 sm:w-11 sm:h-11 fill-white ml-1.5" />
              </div>
            </div>

            <div className="space-y-1 max-w-xl mx-auto px-4">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-md">
                {title}
              </h2>
              {type === 'tv' && episodeName && (
                <p className="text-xs sm:text-sm font-semibold text-[#A1A7B5] drop-shadow">
                  Season {seasonNumber || 1} • Episode {episodeNumber || 1}:{' '}
                  <span className="text-white">{episodeName}</span>
                </p>
              )}
              <p className="text-xs text-[#707684] pt-1">
                Click anywhere or press <strong className="text-white">Space</strong> to begin streaming
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3.1 PAUSED STATE OVERLAY */}
      {/* ------------------------------------------------------------- */}
      {hasStartedPlayback && !isPlaying && !isLoading && !error && !isEmbedStream && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 bg-black/45 backdrop-blur-[2px] flex items-center justify-center cursor-pointer z-20 transition-opacity duration-300"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full bg-[#E50914] text-white flex items-center justify-center shadow-[0_0_35px_rgba(229,9,20,0.6)] transform hover:scale-110 active:scale-95 transition-all">
              <Play className="w-9 h-9 fill-white ml-1.5" />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-white/90 bg-black/60 px-3 py-1 rounded-full border border-white/10">
              Paused · Click to Resume
            </span>
          </div>
        </div>
      )}

      {/* Visual Skip Ripple Feedback */}
      {skipAnimation && (
        <div
          className={`absolute inset-y-0 ${
            skipAnimation === 'right' ? 'right-0' : 'left-0'
          } w-1/3 flex items-center justify-center pointer-events-none z-30 bg-white/5 animate-pulse`}
        >
          <div className="flex flex-col items-center gap-1 text-white bg-black/70 px-4 py-3 rounded-2xl backdrop-blur-md border border-white/10">
            {skipAnimation === 'right' ? (
              <RotateCw className="w-7 h-7 text-[#E50914]" />
            ) : (
              <RotateCcw className="w-7 h-7 text-[#E50914]" />
            )}
            <span className="text-xs font-bold">{skipAnimation === 'right' ? '+10s' : '-10s'}</span>
          </div>
        </div>
      )}

      {/* Loading Spinner */}
      {isLoading && !error && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center pointer-events-none z-30">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-3 border-white/20 border-t-[#E50914] rounded-full animate-spin shadow-lg shadow-red-950/60" />
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E50914] animate-ping" />
              <span className="text-xs font-bold text-neutral-300 tracking-wide uppercase">
                Buffering Stream...
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Switching Server Toast */}
      {switchingServerName && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-[#0D0F14]/95 border border-[#E50914] px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2.5 animate-fade-in pointer-events-none">
          <div className="w-2 h-2 rounded-full bg-[#E50914] animate-ping" />
          <span className="text-xs font-bold text-white">
            Connecting to <strong className="text-[#E50914]">{switchingServerName}</strong>...
          </span>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-6 text-center z-40 overflow-y-auto">
          <AlertCircle className="w-12 h-12 text-[#E50914] mb-3 animate-bounce" />
          <h3 className="text-lg font-bold text-white mb-1">Stream Error</h3>
          <p className="text-sm text-neutral-400 max-w-md mb-4">{error}</p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-4">
            <button
              type="button"
              onClick={() => {
                const nextServer = serverList.find((s) => s.id !== activeServerId && !failedServerIds.includes(s.id)) || serverList[0];
                handleServerChange(nextServer);
              }}
              className="px-4 py-2 bg-[#E50914] hover:bg-[#B81D24] text-white text-xs font-extrabold rounded-xl transition-all shadow-lg shadow-red-900/40 flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Switch to Next Server</span>
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Stream</span>
            </button>
            {onReportIssue && (
              <button
                type="button"
                onClick={onReportIssue}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Report Issue
              </button>
            )}
          </div>
        </div>
      )}

      {/* Auto-Next Episode Prompt */}
      {showNextEpisodePrompt && onNextEpisode && (
        <div className="absolute bottom-24 right-6 z-40 bg-[#0D0F14]/95 border border-[#E50914]/50 p-4 rounded-2xl shadow-2xl backdrop-blur-md max-w-xs animate-slide-up">
          <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#E50914]" />
            <span>Next Episode in {nextCountdown}s</span>
          </div>
          <div className="text-sm font-bold text-white mb-3">Playing next episode automatically</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onNextEpisode}
              className="flex-1 py-1.5 bg-[#E50914] hover:bg-[#B81D24] text-white text-xs font-extrabold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-md"
            >
              <SkipForward className="w-3.5 h-3.5 fill-white" />
              <span>Play Now</span>
            </button>
            <button
              type="button"
              onClick={() => setShowNextEpisodePrompt(false)}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3.2 PLAYER HEADER (TOP BAR) */}
      {/* ------------------------------------------------------------- */}
      {showOverlay && (
        <div
          className={`absolute top-0 inset-x-0 p-3 sm:p-5 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-center justify-between z-30 transition-opacity duration-300 ${
            showControls || !isPlaying
              ? 'opacity-100 pointer-events-auto'
              : 'opacity-0 pointer-events-none'
          } ${isEmbedStream ? 'pointer-events-none' : ''}`}
        >
          {/* Title & Metadata */}
          <div className={`max-w-[65%] truncate ${isEmbedStream ? 'pointer-events-auto' : ''}`}>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#E50914] text-white text-[10px] font-black uppercase tracking-wide">
                {currentRenderedQuality}
              </span>
              <h2 className="text-xs sm:text-sm md:text-base font-bold text-white drop-shadow truncate">
                {title}
              </h2>
            </div>
            {type === 'tv' && episodeName && (
              <p className="text-[11px] sm:text-xs text-neutral-300 drop-shadow truncate mt-0.5">
                S{String(seasonNumber).padStart(2, '0')}E{String(episodeNumber).padStart(2, '0')} •{' '}
                {episodeName}
              </p>
            )}
          </div>

          {/* Action cluster */}
          <div className={`flex items-center gap-1.5 sm:gap-2 ${isEmbedStream ? 'pointer-events-auto' : ''}`}>
            {/* Quick Server Mirror button */}
            <button
              type="button"
              onClick={() => {
                setShowQuickServer(!showQuickServer);
                setShowQuickSubtitles(false);
                setShowQuickAudio(false);
                setActiveSettingsTab(null);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-black/60 hover:bg-black/90 text-white border border-white/10 hover:border-[#E50914]/50 transition-all text-xs font-semibold cursor-pointer backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E50914]"
              title="Change Streaming Server Mirror"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <Server className="w-3.5 h-3.5 text-[#E50914]" />
              <span className="hidden sm:inline text-neutral-400">Server:</span>
              <span className="font-extrabold text-white text-[11px] max-w-[80px] sm:max-w-[110px] truncate">
                {activeServerObj.name.split('(')[0].trim()}
              </span>
            </button>

            {/* Remote & Keyboard Shortcuts Guide */}
            <button
              type="button"
              onClick={() => setShowShortcutsModal(true)}
              className="p-2 rounded-xl bg-black/50 hover:bg-black/80 text-white border border-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E50914]"
              title="TV Remote & Keyboard Shortcuts Guide (?)"
            >
              <HelpCircle className="w-4 h-4 text-[#A1A7B5] hover:text-white" />
            </button>

            {/* Cinema Mode Toggle */}
            {onToggleCinemaMode && !isEmbed && (
              <button
                type="button"
                onClick={onToggleCinemaMode}
                className={`p-2 rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E50914] ${
                  cinemaMode
                    ? 'bg-[#E50914] text-white shadow-md shadow-red-950/60'
                    : 'bg-black/50 hover:bg-black/80 text-white border border-white/10'
                }`}
                title={cinemaMode ? 'Turn On Lights' : 'Cinema Mode (Dim Lights)'}
              >
                {cinemaMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            {/* Share */}
            {onShare && (
              <button
                type="button"
                onClick={onShare}
                className="p-2 rounded-xl bg-black/50 hover:bg-black/80 text-white border border-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E50914]"
                title="Share Stream"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}

            {/* Report */}
            {onReportIssue && (
              <button
                type="button"
                onClick={onReportIssue}
                className="p-2 rounded-xl bg-black/50 hover:bg-black/80 text-white border border-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E50914]"
                title="Report Issue"
              >
                <AlertCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quick Server Dropdown Menu */}
      {showQuickServer && (
        <div className="absolute top-16 right-4 sm:right-6 z-40 bg-[#0D0F14]/95 border border-white/10 p-3 rounded-2xl shadow-2xl backdrop-blur-md w-72 space-y-2 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-xs font-black uppercase tracking-wider text-white">
              Streaming Mirrors
            </span>
            <button
              type="button"
              onClick={() => setShowQuickServer(false)}
              className="text-neutral-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-1 max-h-60 overflow-y-auto no-scrollbar">
            {serverList.map((s) => {
              const isActive = s.id === activeServerId;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleServerChange(s)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#E50914] text-white'
                      : 'bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isActive ? 'bg-white' : 'bg-[#10B981]'
                      }`}
                    />
                    <span className="truncate">{s.name.split('(')[0].trim()}</span>
                  </div>
                  <span className="text-[10px] opacity-75 shrink-0 ml-1">{s.latencyMs || 12}ms</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3.3 BOTTOM CONTROL BAR (ONLY FOR DIRECT HLS/MP4, NOT IFRAMES) */}
      {/* ------------------------------------------------------------- */}
      {!isEmbedStream && (
        <div
          className={`absolute bottom-0 inset-x-0 p-3 sm:p-5 bg-gradient-to-t from-black via-black/80 to-transparent z-30 transition-opacity duration-300 space-y-2 ${
            showControls || !isPlaying
              ? 'opacity-100 pointer-events-auto'
              : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Progress Bar / Scrubber */}
          <div
            onClick={handleTimelineClick}
            onMouseMove={handleTimelineMouseMove}
            onMouseLeave={handleTimelineMouseLeave}
            className="relative group/timeline h-1.5 hover:h-2.5 bg-white/20 rounded-full cursor-pointer transition-all duration-150 flex items-center"
            role="slider"
            aria-label="Seek Slider"
            aria-valuemin={0}
            aria-valuemax={duration || 1}
            aria-valuenow={currentTime}
          >
            {/* Buffered */}
            <div
              style={{ width: `${bufferedPercent}%` }}
              className="absolute left-0 top-0 h-full bg-white/30 rounded-full pointer-events-none"
            />

            {/* Played */}
            <div
              style={{
                width: `${(currentTime / (duration || 1)) * 100}%`,
                backgroundColor: accentColor,
              }}
              className="absolute left-0 top-0 h-full rounded-full pointer-events-none shadow-[0_0_10px_rgba(229,9,20,0.5)]"
            />

            {/* Knob */}
            <div
              style={{
                left: `${(currentTime / (duration || 1)) * 100}%`,
                backgroundColor: accentColor,
              }}
              className="absolute -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-white scale-0 group-hover/timeline:scale-100 transition-transform pointer-events-none shadow-md"
            />

            {/* Hover Tooltip */}
            {hoverTime !== null && (
              <div
                style={{ left: `${hoverPos}%` }}
                className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded-md bg-black/90 text-[10.5px] font-bold text-white border border-white/20 shadow-md pointer-events-none whitespace-nowrap z-30"
              >
                {formatTime(hoverTime)}
              </div>
            )}
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between text-white text-xs sm:text-sm pt-1">
            {/* Left Controls */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Play / Pause */}
              <button
                type="button"
                onClick={togglePlay}
                className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E50914]"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-white" />
                ) : (
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                )}
              </button>

              {/* Prev Episode */}
              {onPrevEpisode && (
                <button
                  type="button"
                  onClick={onPrevEpisode}
                  className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E50914]"
                  title="Previous Episode"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
              )}

              {/* Rewind 10s */}
              <button
                type="button"
                onClick={() => skipTime(-10)}
                className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E50914]"
                title="Rewind 10 seconds (J / Left Arrow)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Forward 10s */}
              <button
                type="button"
                onClick={() => skipTime(10)}
                className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E50914]"
                title="Forward 10 seconds (L / Right Arrow)"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Next Episode */}
              {onNextEpisode && (
                <button
                  type="button"
                  onClick={onNextEpisode}
                  className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E50914]"
                  title="Next Episode"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              )}

              {/* Volume Slider */}
              <div className="flex items-center gap-1 group/volume ml-1">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E50914]"
                  title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4.5 h-4.5 text-red-400" />
                  ) : volume < 0.5 ? (
                    <Volume1 className="w-4.5 h-4.5" />
                  ) : (
                    <Volume2 className="w-4.5 h-4.5" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 sm:w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer hidden sm:block accent-[#E50914]"
                  aria-label="Volume Slider"
                />
              </div>

              {/* Elapsed / Total Time */}
              <div className="text-[11px] font-semibold text-[#A1A7B5] hidden sm:flex items-center ml-2">
                <span className="text-white">{formatTime(currentTime)}</span>
                <span className="mx-1 text-neutral-600">/</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-1 sm:gap-2 relative">
              {/* Subtitles Button */}
              <button
                type="button"
                onClick={() => {
                  setShowQuickSubtitles(!showQuickSubtitles);
                  setShowQuickAudio(false);
                  setActiveSettingsTab(null);
                }}
                className={`p-2 rounded-xl transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E50914] ${
                  selectedSubtitleId !== 'off'
                    ? 'bg-[#E50914] text-white shadow-md shadow-red-950/60'
                    : 'hover:bg-white/10 text-white'
                }`}
                title="Subtitles (C)"
              >
                <Subtitles className="w-4.5 h-4.5" />
              </button>

              {/* Settings Gear */}
              <button
                type="button"
                onClick={() => {
                  setActiveSettingsTab(activeSettingsTab ? null : 'main');
                  setShowQuickSubtitles(false);
                  setShowQuickAudio(false);
                }}
                className={`p-2 rounded-xl transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E50914] ${
                  activeSettingsTab
                    ? 'bg-white/20 text-white'
                    : 'hover:bg-white/10 text-white'
                }`}
                title="Settings (Quality, Speed, Audio)"
              >
                <Settings className="w-4.5 h-4.5" />
              </button>

              {/* PiP */}
              <button
                type="button"
                onClick={togglePiP}
                className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors cursor-pointer hidden xs:block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E50914]"
                title="Picture-in-Picture (P)"
              >
                <PictureInPicture2 className="w-4.5 h-4.5" />
              </button>

              {/* Fullscreen */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E50914]"
                title="Fullscreen (F)"
              >
                {isFullscreen ? (
                  <Minimize className="w-5 h-5" />
                ) : (
                  <Maximize className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subtitles Popover Menu */}
      {showQuickSubtitles && (
        <div className="absolute bottom-16 right-4 sm:right-6 z-40 bg-[#0D0F14]/95 border border-white/10 p-3.5 rounded-2xl shadow-2xl backdrop-blur-md w-72 space-y-2.5 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-xs font-black uppercase tracking-wider text-white">
              Subtitles ({subtitles.length})
            </span>
            <button
              type="button"
              onClick={() => setShowQuickSubtitles(false)}
              className="text-neutral-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Subtitle search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search language..."
              value={subtitleSearch}
              onChange={(e) => setSubtitleSearch(e.target.value)}
              className="w-full bg-[#161922] text-xs text-white pl-8 pr-3 py-1.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#E50914]"
            />
          </div>

          <div className="space-y-1 max-h-56 overflow-y-auto no-scrollbar">
            {/* Off */}
            <button
              type="button"
              onClick={() => handleSubtitleChange('off')}
              className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                selectedSubtitleId === 'off'
                  ? 'bg-[#E50914] text-white'
                  : 'bg-white/5 hover:bg-white/10 text-neutral-300'
              }`}
            >
              <span>Off</span>
              {selectedSubtitleId === 'off' && <Check className="w-3.5 h-3.5" />}
            </button>

            {filteredSubtitles.map((sub) => {
              const isSelected = selectedSubtitleId === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => handleSubtitleChange(sub.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                    isSelected
                      ? 'bg-[#E50914] text-white'
                      : 'bg-white/5 hover:bg-white/10 text-neutral-300'
                  }`}
                >
                  <span className="truncate">{sub.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Settings Tab Popover Menu */}
      {activeSettingsTab && (
        <div className="absolute bottom-16 right-4 sm:right-6 z-40 bg-[#0D0F14]/95 border border-white/10 p-3.5 rounded-2xl shadow-2xl backdrop-blur-md w-72 space-y-2.5 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-xs font-black uppercase tracking-wider text-white">
              {activeSettingsTab === 'main'
                ? 'Playback Settings'
                : activeSettingsTab === 'quality'
                ? 'Video Quality'
                : activeSettingsTab === 'speed'
                ? 'Playback Speed'
                : activeSettingsTab === 'fit'
                ? 'Aspect Ratio / Fit'
                : 'Audio Track'}
            </span>
            <button
              type="button"
              onClick={() => setActiveSettingsTab(null)}
              className="text-neutral-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Main Menu */}
          {activeSettingsTab === 'main' && (
            <div className="space-y-1">
              {/* Quality item */}
              <button
                type="button"
                onClick={() => setActiveSettingsTab('quality')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                <span>Quality</span>
                <span className="text-[#A1A7B5] flex items-center gap-1">
                  {currentRenderedQuality}
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </button>

              {/* Audio item */}
              <button
                type="button"
                onClick={() => setActiveSettingsTab('audio')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                <span>Audio Track</span>
                <span className="text-[#A1A7B5] flex items-center gap-1">
                  {audioTracks[selectedAudioIndex]?.label || 'English'}
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </button>

              {/* Speed item */}
              <button
                type="button"
                onClick={() => setActiveSettingsTab('speed')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                <span>Speed</span>
                <span className="text-[#A1A7B5] flex items-center gap-1">
                  {playbackSpeed}x
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </button>

              {/* Fit item */}
              <button
                type="button"
                onClick={() => setActiveSettingsTab('fit')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                <span>Aspect Ratio</span>
                <span className="text-[#A1A7B5] flex items-center gap-1 capitalize">
                  {videoFit}
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </button>
            </div>
          )}

          {/* Quality Submenu */}
          {activeSettingsTab === 'quality' && (
            <div className="space-y-1 max-h-56 overflow-y-auto no-scrollbar">
              <button
                type="button"
                onClick={() => handleQualityChange(-1)}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  selectedQualityIndex === -1 ? 'bg-[#E50914] text-white' : 'bg-white/5 text-neutral-300'
                }`}
              >
                <span>Auto (Adaptive Bitrate)</span>
                {selectedQualityIndex === -1 && <Check className="w-3.5 h-3.5" />}
              </button>
              {hlsLevels.map((lvl) => (
                <button
                  key={lvl.index}
                  type="button"
                  onClick={() => handleQualityChange(lvl.index)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                    selectedQualityIndex === lvl.index ? 'bg-[#E50914] text-white' : 'bg-white/5 text-neutral-300'
                  }`}
                >
                  <span>{lvl.label}</span>
                  {selectedQualityIndex === lvl.index && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}

          {/* Audio Submenu */}
          {activeSettingsTab === 'audio' && (
            <div className="space-y-1 max-h-56 overflow-y-auto no-scrollbar">
              {audioTracks.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => handleAudioTrackChange(a.index)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                    selectedAudioIndex === a.index ? 'bg-[#E50914] text-white' : 'bg-white/5 text-neutral-300'
                  }`}
                >
                  <span>{a.label}</span>
                  {selectedAudioIndex === a.index && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}

          {/* Speed Submenu */}
          {activeSettingsTab === 'speed' && (
            <div className="space-y-1">
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSpeedChange(s)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                    playbackSpeed === s ? 'bg-[#E50914] text-white' : 'bg-white/5 text-neutral-300'
                  }`}
                >
                  <span>{s}x {s === 1 ? '(Normal)' : ''}</span>
                  {playbackSpeed === s && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}

          {/* Video Fit Submenu */}
          {activeSettingsTab === 'fit' && (
            <div className="space-y-1">
              {(['contain', 'cover', 'fill'] as const).map((fit) => (
                <button
                  key={fit}
                  type="button"
                  onClick={() => {
                    setVideoFit(fit);
                    setActiveSettingsTab(null);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all text-left capitalize cursor-pointer ${
                    videoFit === fit ? 'bg-[#E50914] text-white' : 'bg-white/5 text-neutral-300'
                  }`}
                >
                  <span>{fit} {fit === 'contain' ? '(Default 16:9)' : ''}</span>
                  {videoFit === fit && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* REMOTE CONTROL & KEYBOARD SHORTCUTS MODAL */}
      {/* ------------------------------------------------------------- */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0D0F14] border border-white/10 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Tv className="w-5 h-5 text-[#E50914]" />
                <h3 className="text-base font-black text-white">TV Remote & Keyboard Shortcuts</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-white/5 space-y-1.5 border border-white/5">
                <span className="text-[11px] font-extrabold uppercase text-[#E50914] block">
                  Playback
                </span>
                <div className="flex justify-between text-neutral-300">
                  <span>Play / Pause</span>
                  <kbd className="px-2 py-0.5 rounded bg-black text-white font-mono">Space / K / OK</kbd>
                </div>
                <div className="flex justify-between text-neutral-300">
                  <span>Rewind 10s</span>
                  <kbd className="px-2 py-0.5 rounded bg-black text-white font-mono">← / J</kbd>
                </div>
                <div className="flex justify-between text-neutral-300">
                  <span>Forward 10s</span>
                  <kbd className="px-2 py-0.5 rounded bg-black text-white font-mono">→ / L</kbd>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 space-y-1.5 border border-white/5">
                <span className="text-[11px] font-extrabold uppercase text-[#E50914] block">
                  Volume & View
                </span>
                <div className="flex justify-between text-neutral-300">
                  <span>Volume Up/Down</span>
                  <kbd className="px-2 py-0.5 rounded bg-black text-white font-mono">↑ / ↓</kbd>
                </div>
                <div className="flex justify-between text-neutral-300">
                  <span>Mute / Unmute</span>
                  <kbd className="px-2 py-0.5 rounded bg-black text-white font-mono">M</kbd>
                </div>
                <div className="flex justify-between text-neutral-300">
                  <span>Fullscreen</span>
                  <kbd className="px-2 py-0.5 rounded bg-black text-white font-mono">F</kbd>
                </div>
                <div className="flex justify-between text-neutral-300">
                  <span>Toggle Subtitles</span>
                  <kbd className="px-2 py-0.5 rounded bg-black text-white font-mono">C</kbd>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/20 text-neutral-300 text-xs">
              <strong className="text-white block mb-0.5">Smart TV Remote:</strong>
              Use your TV remote D-Pad (Up, Down, Left, Right) to navigate and the OK/Center button to select. Press Back / Exit to dismiss overlays.
            </div>

            <button
              type="button"
              onClick={() => setShowShortcutsModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#E50914] hover:bg-[#B81D24] text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Close Guide
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
