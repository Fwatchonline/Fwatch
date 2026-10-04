import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  AudioLines,
  Check,
  ChevronRight,
  HelpCircle,
  Info,
  RefreshCw,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { StreamResult, SubtitleTrack, AudioTrack } from '../types';
import { fetchVylaSubtitles } from '../services/streaming';
import { useWatchProgress } from '../hooks/useWatchProgress';

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

type SettingsTab = 'main' | 'quality' | 'audio' | 'subtitles' | 'speed' | 'fit' | 'shortcuts';
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
}: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Playback states
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
  const [selectedQualityTier, setSelectedQualityTier] = useState<string>('auto');
  const [currentRenderedQuality, setCurrentRenderedQuality] = useState<string>('Auto');

  // Pre-populate Audio Tracks from stream result and default to English
  const initialAudios: AudioTrackItem[] = (streamResult.audioTracks || []).map((a, idx) => ({
    index: idx,
    id: a.id || `audio-${idx}`,
    label: a.label,
    language: a.language,
  }));
  const defaultEngAudioIdx = initialAudios.findIndex(
    (a) => a.language?.toLowerCase().startsWith('en') || a.label.toLowerCase().includes('english')
  );

  const [audioTracks, setAudioTracks] = useState<AudioTrackItem[]>(initialAudios);
  const [selectedAudioIndex, setSelectedAudioIndex] = useState<number>(
    defaultEngAudioIdx !== -1 ? defaultEngAudioIdx : 0
  );

  // Pre-populate Subtitle Tracks from stream result, prioritizing English
  const initialSubtitles: SubtitleItem[] = (streamResult.subtitles || []).map((s) => ({
    id: s.id,
    label: s.label,
    language: s.language,
    url: s.url,
  }));
  initialSubtitles.sort((a, b) => {
    const aIsEng = a.language.toLowerCase().startsWith('en') || a.label.toLowerCase().includes('english');
    const bIsEng = b.language.toLowerCase().startsWith('en') || b.label.toLowerCase().includes('english');
    if (aIsEng && !bIsEng) return -1;
    if (!aIsEng && bIsEng) return 1;
    return a.label.localeCompare(b.label);
  });

  const [subtitles, setSubtitles] = useState<SubtitleItem[]>(initialSubtitles);
  const [selectedSubtitleId, setSelectedSubtitleId] = useState<string>('off');

  // Load comprehensive multi-language subtitles from Vyla SDK
  useEffect(() => {
    let mounted = true;
    fetchVylaSubtitles(tmdbId, type, seasonNumber, episodeNumber)
      .then((vylaSubs) => {
        if (!mounted || !vylaSubs || vylaSubs.length === 0) return;
        setSubtitles((prev) => {
          const existingUrls = new Set(prev.map((s) => s.url));
          const newSubs: SubtitleItem[] = vylaSubs
            .filter((s) => s.url && !existingUrls.has(s.url))
            .map((s) => ({
              id: s.id,
              label: s.label,
              language: s.language,
              url: s.url,
            }));
          if (newSubs.length === 0) return prev;
          const combined = [...prev, ...newSubs];
          combined.sort((a, b) => {
            const aIsEng = a.language.toLowerCase().startsWith('en') || a.label.toLowerCase().includes('english');
            const bIsEng = b.language.toLowerCase().startsWith('en') || b.label.toLowerCase().includes('english');
            if (aIsEng && !bIsEng) return -1;
            if (!aIsEng && bIsEng) return 1;
            return a.label.localeCompare(b.label);
          });
          return combined;
        });
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [tmdbId, type, seasonNumber, episodeNumber]);

  // UI Modals & Menus
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTab | null>(null);
  const [showQuickSubtitles, setShowQuickSubtitles] = useState(false);
  const [showQuickAudio, setShowQuickAudio] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skipAnimation, setSkipAnimation] = useState<'left' | 'right' | null>(null);

  // Auto-next episode for TV
  const [showNextEpisodePrompt, setShowNextEpisodePrompt] = useState(false);
  const [nextCountdown, setNextCountdown] = useState(10);

  const hlsSource = streamResult.sources.find((s) => s.format === 'hls');
  const mp4Source = streamResult.sources.find((s) => s.format === 'mp4');

  const { updateProgress, getProgress } = useWatchProgress();
  const navigate = useNavigate();

  const mediaKey =
    type === 'movie'
      ? `movie:${tmdbId}`
      : `tv:${tmdbId}:s${seasonNumber}:e${episodeNumber}`;

  // -------------------------------------------------------------
  // INITIALIZE HLS STREAM WITH DYNAMIC ADAPTIVE BITRATES & TRACKS
  // -------------------------------------------------------------
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);
    setError(null);
    setShowNextEpisodePrompt(false);

    const bufferTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 4000);

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
      setError('No playable direct HLS stream found. Please switch to another server.');
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

      // Helper to update Audio Tracks & set default English
      const syncAudioTracks = () => {
        let audios: AudioTrackItem[] = [];
        if (hls.audioTracks && hls.audioTracks.length > 0) {
          audios = hls.audioTracks.map((a, idx) => ({
            index: idx,
            id: `audio-${idx}`,
            label: a.name || a.lang || `Track ${idx + 1}`,
            language: a.lang || 'und',
          }));
        } else if (streamResult.audioTracks && streamResult.audioTracks.length > 0) {
          audios = streamResult.audioTracks.map((a, idx) => ({
            index: idx,
            id: a.id || `audio-${idx}`,
            label: a.label,
            language: a.language,
          }));
        }

        if (audios.length > 0) {
          setAudioTracks(audios);

          // Force default English audio track if available
          const engIdx = audios.findIndex(
            (a) =>
              a.language?.toLowerCase().startsWith('en') ||
              a.label.toLowerCase().includes('english')
          );

          if (engIdx !== -1) {
            if (hls.audioTracks.length > engIdx && hls.audioTrack !== engIdx) {
              hls.audioTrack = engIdx;
            }
            setSelectedAudioIndex(engIdx);
          } else {
            setSelectedAudioIndex(hls.audioTrack >= 0 ? hls.audioTrack : 0);
          }
        }
      };

      // Helper to update Subtitle Tracks
      const syncSubtitleTracks = () => {
        const subsMap = new Map<string, SubtitleItem>();

        // 1. Add all external/backend subtitles
        if (streamResult.subtitles && streamResult.subtitles.length > 0) {
          streamResult.subtitles.forEach((s) => {
            subsMap.set(s.language.toLowerCase(), {
              id: s.id,
              label: s.label,
              language: s.language,
              url: s.url,
            });
          });
        }

        // 2. Add/merge internal HLS subtitle tracks
        if (hls.subtitleTracks && hls.subtitleTracks.length > 0) {
          hls.subtitleTracks.forEach((st, idx) => {
            const langKey = (st.lang || st.name || `sub-${idx}`).toLowerCase();
            const existing = subsMap.get(langKey);
            if (existing) {
              existing.hlsIndex = idx;
              existing.label = st.name || existing.label;
            } else {
              subsMap.set(langKey, {
                id: `hls-sub-${idx}`,
                label: st.name || st.lang || `Subtitle ${idx + 1}`,
                language: st.lang || 'en',
                hlsIndex: idx,
              });
            }
          });
        }

        const resultSubs = Array.from(subsMap.values());
        // Sort with English first, then alphabetical
        resultSubs.sort((a, b) => {
          const aIsEng =
            a.language.toLowerCase().startsWith('en') ||
            a.label.toLowerCase().includes('english');
          const bIsEng =
            b.language.toLowerCase().startsWith('en') ||
            b.label.toLowerCase().includes('english');
          if (aIsEng && !bIsEng) return -1;
          if (!aIsEng && bIsEng) return 1;
          return a.label.localeCompare(b.label);
        });

        if (resultSubs.length > 0) {
          setSubtitles(resultSubs);
        }
      };

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setIsLoading(false);

        // 1. Parse Real HLS Quality Levels
        if (data.levels && data.levels.length > 0) {
          const parsedLevels: HlsLevelItem[] = data.levels.map((lvl, idx) => {
            const h = lvl.height || 0;
            const br = lvl.bitrate ? Math.round(lvl.bitrate / 1000) : 0;
            const label =
              h > 0
                ? `${h}p ${
                    h >= 2160 ? '4K' : h >= 1080 ? 'FHD' : h >= 720 ? 'HD' : 'SD'
                  }${br ? ` (${(br / 1000).toFixed(1)} Mbps)` : ''}`
                : `Level ${idx + 1} (${br ? `${br} kbps` : 'ABR'})`;

            return {
              index: idx,
              height: h,
              width: lvl.width || 0,
              bitrate: lvl.bitrate || 0,
              label,
            };
          });

          // Sort high to low
          parsedLevels.sort((a, b) => b.height - a.height || b.bitrate - a.bitrate);
          setHlsLevels(parsedLevels);
        } else {
          setHlsLevels([]);
        }

        // 2. Parse Audio & Subtitles
        syncAudioTracks();
        syncSubtitleTracks();

        // Resume saved progress if exists
        const saved = getProgress(mediaKey);
        if (saved && saved.currentTime > 5 && saved.currentTime < saved.duration - 10) {
          video.currentTime = saved.currentTime;
        }

        // Autoplay attempt
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
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

      // Listen for asynchronous Audio & Subtitle track updates from Hls.js
      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, () => {
        syncAudioTracks();
      });

      hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, () => {
        syncSubtitleTracks();
      });

      // Update active quality description when ABR switches
      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        const lvl = hls.levels[data.level];
        if (lvl) {
          const res = lvl.height ? `${lvl.height}p` : 'Auto';
          setCurrentRenderedQuality(selectedQualityIndex === -1 ? `Auto (${res})` : res);
        }
      });

      // Update audio track changes
      hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (_, data) => {
        setSelectedAudioIndex(data.id);
      });

      hls.on(Hls.Events.FRAG_LOADED, () => {
        setIsLoading(false);
      });

      // Error Recovery Pipeline
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn('[HLS] Fatal Network Error -> attempting startLoad() recovery');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('[HLS] Fatal Media Error -> attempting recoverMediaError()');
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
                setError('Playback encountered a network stall. Switch servers or click Retry.');
              }
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Apple HLS (Safari/iOS)
      video.src = sourceUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        const saved = getProgress(mediaKey);
        if (saved && saved.currentTime > 5) {
          video.currentTime = saved.currentTime;
        }
      });
    } else if (mp4Source) {
      video.src = mp4Source.url;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        const saved = getProgress(mediaKey);
        if (saved && saved.currentTime > 5) {
          video.currentTime = saved.currentTime;
        }
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
  }, [streamResult, mediaKey]);

  // -------------------------------------------------------------
  // VIDEO EVENTS & BUFFER TRACKING
  // -------------------------------------------------------------
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    setCurrentTime(video.currentTime);
    const dur = video.duration || 0;
    setDuration(dur);

    // Calculate buffered range
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

    // Trigger auto-next prompt 25 seconds before ending
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

  // -------------------------------------------------------------
  // QUALITY SWITCHING HANDLER
  // -------------------------------------------------------------
  const handleQualityChange = (levelIndex: number) => {
    setSelectedQualityIndex(levelIndex);
    setActiveSettingsTab(null);

    if (hlsRef.current) {
      if (levelIndex === -1) {
        hlsRef.current.currentLevel = -1;
        setCurrentRenderedQuality('Auto');
      } else if (levelIndex === -4) {
        // 4K Ultra HD requested: pick highest available level
        const levels = hlsRef.current.levels;
        if (levels && levels.length > 0) {
          let bestIdx = 0;
          let maxH = 0;
          levels.forEach((l, idx) => {
            if ((l.height || 0) > maxH) {
              maxH = l.height || 0;
              bestIdx = idx;
            }
          });
          hlsRef.current.currentLevel = bestIdx;
          setCurrentRenderedQuality(maxH >= 2160 ? '4K UHD' : `4K (Max ${maxH || 720}p)`);
        } else {
          setCurrentRenderedQuality('4K UHD');
        }
      } else if (levelIndex === -1080) {
        // 1080p Full HD requested: pick 1080p if available, else max available level
        const levels = hlsRef.current.levels;
        if (levels && levels.length > 0) {
          const found1080 = levels.findIndex((l) => (l.height || 0) >= 1080);
          if (found1080 !== -1) {
            hlsRef.current.currentLevel = found1080;
            setCurrentRenderedQuality('1080p FHD');
          } else {
            let bestIdx = 0;
            let maxH = 0;
            levels.forEach((l, idx) => {
              if ((l.height || 0) > maxH) {
                maxH = l.height || 0;
                bestIdx = idx;
              }
            });
            hlsRef.current.currentLevel = bestIdx;
            setCurrentRenderedQuality(`1080p (Max ${maxH || 720}p)`);
          }
        } else {
          setCurrentRenderedQuality('1080p FHD');
        }
      } else {
        hlsRef.current.currentLevel = levelIndex;
        const lvl = hlsRef.current.levels[levelIndex];
        setCurrentRenderedQuality(lvl?.height ? `${lvl.height}p` : `Level ${levelIndex + 1}`);
      }
    }
  };

  // -------------------------------------------------------------
  // AUDIO TRACK SWITCHING HANDLER
  // -------------------------------------------------------------
  const handleAudioTrackChange = (audioIndex: number) => {
    setSelectedAudioIndex(audioIndex);
    setActiveSettingsTab(null);
    setShowQuickAudio(false);

    if (hlsRef.current && hlsRef.current.audioTracks.length > audioIndex) {
      hlsRef.current.audioTrack = audioIndex;
    }
  };

  // -------------------------------------------------------------
  // SUBTITLE TRACK SWITCHING HANDLER
  // -------------------------------------------------------------
  const handleSubtitleChange = (subId: string) => {
    setSelectedSubtitleId(subId);
    setShowQuickSubtitles(false);
    setActiveSettingsTab(null);

    const video = videoRef.current;
    if (!video) return;

    const found = subtitles.find((s) => s.id === subId);

    // 1. Manage HLS internal subtitle track
    if (hlsRef.current) {
      if (subId === 'off' || !found || found.hlsIndex === undefined) {
        hlsRef.current.subtitleTrack = -1;
      } else {
        hlsRef.current.subtitleTrack = found.hlsIndex;
      }
    }

    // 2. Manage HTML5 TextTracks (WebVTT external subtitles)
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

  // -------------------------------------------------------------
  // CONTROLS & KEYBOARD ACTIONS
  // -------------------------------------------------------------
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          if (err?.name === 'AbortError' || err?.name === 'NotAllowedError') {
            setIsPlaying(false);
            return;
          }
          console.warn('Playback play request was interrupted:', err);
          setIsPlaying(false);
        });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const skipTime = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + seconds));
    setSkipAnimation(seconds > 0 ? 'right' : 'left');
    setTimeout(() => setSkipAnimation(null), 600);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const target = parseFloat(e.target.value);
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

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const target = pos * duration;
    video.currentTime = target;
    setCurrentTime(target);
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
      container.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(console.error);
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
    } catch (err) {
      console.warn('Picture-in-picture failed:', err);
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
      if (isPlaying) {
        setShowControls(false);
        setActiveSettingsTab(null);
        setShowQuickSubtitles(false);
        setShowQuickAudio(false);
      }
    }, 3800);
  };

  // Keyboard navigation & shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement).tagName.toLowerCase())) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowright':
        case 'l':
          e.preventDefault();
          skipTime(10);
          break;
        case 'arrowleft':
        case 'j':
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
        case 'escape':
          setActiveSettingsTab(null);
          setShowQuickSubtitles(false);
          setShowQuickAudio(false);
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

  const activeSubtitleLabel =
    selectedSubtitleId === 'off'
      ? 'Off'
      : subtitles.find((s) => s.id === selectedSubtitleId)?.label || 'On';

  const activeAudioLabel =
    audioTracks.find((a) => a.index === selectedAudioIndex)?.label || 'English';

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onDoubleClick={toggleFullscreen}
      className="relative w-full aspect-video max-h-[85vh] bg-black rounded-2xl overflow-hidden shadow-2xl group border border-white/10 select-none"
    >
      {/* Video Element */}
      <video
            ref={videoRef}
            onClick={togglePlay}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={handleTimeUpdate}
            onCanPlay={() => setIsLoading(false)}
            onLoadedData={() => setIsLoading(false)}
            onLoadedMetadata={() => setIsLoading(false)}
            onWaiting={() => setIsLoading(true)}
            onPlaying={() => setIsLoading(false)}
            playsInline
            className={`w-full h-full cursor-pointer ${
              videoFit === 'cover'
                ? 'object-cover'
                : videoFit === 'fill'
                ? 'object-fill'
                : 'object-contain'
            }`}
          >
            {/* Render external WebVTT tracks */}
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

      {/* Visual Skip Ripple Feedback */}
      {skipAnimation && (
        <div
          className={`absolute inset-y-0 ${
            skipAnimation === 'right' ? 'right-0' : 'left-0'
          } w-1/3 flex items-center justify-center pointer-events-none z-30 bg-white/5 animate-pulse`}
        >
          <div className="flex flex-col items-center gap-1 text-white bg-black/60 px-4 py-3 rounded-2xl backdrop-blur-md">
            {skipAnimation === 'right' ? (
              <RotateCw className="w-8 h-8 text-[#F5C518]" />
            ) : (
              <RotateCcw className="w-8 h-8 text-[#F5C518]" />
            )}
            <span className="text-xs font-bold">{skipAnimation === 'right' ? '+10s' : '-10s'}</span>
          </div>
        </div>
      )}

      {/* Loading Spinner */}
      {isLoading && !error && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center pointer-events-none z-30">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-white/20 border-t-[#F5C518] rounded-full animate-spin"></div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#F5C518] animate-ping"></span>
              <span className="text-xs font-bold text-neutral-300 tracking-wide uppercase">
                Loading HLS Direct Stream...
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 bg-neutral-950/95 flex flex-col items-center justify-center p-6 text-center z-40">
          <AlertCircle className="w-12 h-12 text-[#F5C518] mb-3 animate-bounce" />
          <h3 className="text-lg font-bold text-white mb-1">Stream Error</h3>
          <p className="text-sm text-neutral-400 max-w-md mb-4">{error}</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#F5C518] hover:bg-[#E5B508] text-black text-xs font-extrabold rounded-xl transition-all shadow-lg shadow-[#F5C518]/20 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Stream</span>
            </button>
            {onReportIssue && (
              <button
                type="button"
                onClick={onReportIssue}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Report Issue
              </button>
            )}
          </div>
        </div>
      )}

      {/* Auto-Next Episode Floating Banner */}
      {showNextEpisodePrompt && onNextEpisode && (
        <div className="absolute bottom-24 right-6 z-40 bg-[#101217]/95 border border-[#F5C518]/50 p-4 rounded-2xl shadow-2xl backdrop-blur-md max-w-xs animate-slide-up">
          <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#F5C518]" />
            <span>Next Episode in {nextCountdown}s</span>
          </div>
          <div className="text-sm font-bold text-white mb-3">
            Playing next episode automatically
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onNextEpisode}
              className="flex-1 py-1.5 bg-[#F5C518] hover:bg-[#E5B508] text-black text-xs font-extrabold rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <SkipForward className="w-3.5 h-3.5 fill-black" />
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

      {/* Center Big Play Button on Pause */}
      {!isPlaying && !isLoading && !error && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center cursor-pointer z-20"
        >
          <div className="w-20 h-20 rounded-full bg-[#F5C518] hover:bg-[#E5B508] text-black flex items-center justify-center shadow-2xl shadow-[#F5C518]/50 transform hover:scale-110 active:scale-95 transition-all">
            <Play className="w-10 h-10 fill-black ml-1.5" />
          </div>
        </div>
      )}

      {/* Top Header Bar inside Video */}
      <div
        className={`absolute top-0 inset-x-0 p-3 sm:p-5 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-center justify-between z-30 transition-opacity duration-300 pointer-events-auto ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="max-w-[65%] truncate">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#F5C518] text-black text-[10px] font-extrabold uppercase tracking-wide">
              {currentRenderedQuality}
            </span>
            <span className="px-2 py-0.5 rounded bg-white/10 text-neutral-300 text-[10px] font-bold uppercase tracking-wide">
              {activeAudioLabel}
            </span>
            <h2 className="text-sm sm:text-base font-bold text-white drop-shadow truncate">
              {title}
            </h2>
          </div>
          {type === 'tv' && episodeName && (
            <p className="text-xs text-neutral-300 drop-shadow truncate mt-0.5">
              S{String(seasonNumber).padStart(2, '0')}E{String(episodeNumber).padStart(2, '0')} •{' '}
              {episodeName}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onToggleCinemaMode && (
            <button
              type="button"
              onClick={onToggleCinemaMode}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                cinemaMode
                  ? 'bg-[#F5C518] text-black font-bold'
                  : 'bg-black/50 hover:bg-black/80 text-white border border-white/10'
              }`}
              title={cinemaMode ? 'Turn On Lights' : 'Cinema Mode (Dim Lights)'}
            >
              {cinemaMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}

          {onShare && (
            <button
              type="button"
              onClick={onShare}
              className="p-2 rounded-xl bg-black/50 hover:bg-black/80 text-white border border-white/10 transition-colors cursor-pointer"
              title="Share Stream"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}

          {onReportIssue && (
            <button
              type="button"
              onClick={onReportIssue}
              className="p-2 rounded-xl bg-black/50 hover:bg-black/80 text-white border border-white/10 transition-colors cursor-pointer"
              title="Report Issue"
            >
              <AlertCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* BOTTOM CONTROL BAR */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`absolute bottom-0 inset-x-0 p-3 sm:p-5 bg-gradient-to-t from-black/95 via-black/75 to-transparent z-30 transition-opacity duration-300 space-y-2.5 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Timeline Slider with Hover Preview & Buffer Region */}
        <div
          onClick={handleTimelineClick}
          onMouseMove={handleTimelineMouseMove}
          onMouseLeave={handleTimelineMouseLeave}
          className="relative group/timeline h-2 hover:h-3 bg-white/20 rounded-lg cursor-pointer transition-all duration-150 flex items-center"
        >
          {/* Buffered Progress */}
          <div
            style={{ width: `${bufferedPercent}%` }}
            className="absolute left-0 top-0 h-full bg-white/30 rounded-lg pointer-events-none"
          />

          {/* Played Progress */}
          <div
            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
            className="absolute left-0 top-0 h-full bg-[#F5C518] rounded-lg pointer-events-none"
          />

          {/* Scrubber Knob */}
          <div
            style={{ left: `${(currentTime / (duration || 1)) * 100}%` }}
            className="absolute -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-[#F5C518] shadow-md border-2 border-black scale-0 group-hover/timeline:scale-100 transition-transform pointer-events-none"
          />

          {/* Hover Time Tooltip */}
          {hoverTime !== null && (
            <div
              style={{ left: `${hoverPos}%` }}
              className="absolute -top-8 -translate-x-1/2 px-2 py-0.5 rounded bg-black/90 text-[11px] font-bold text-white border border-white/20 shadow-md pointer-events-none whitespace-nowrap z-30"
            >
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between text-white text-xs sm:text-sm">
          {/* Left Controls: Play/Pause, Rewind, Fast Forward, Volume, Time */}
          <div className="flex items-center gap-1 sm:gap-3">
            <button
              type="button"
              onClick={togglePlay}
              className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors cursor-pointer"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-white" />
              ) : (
                <Play className="w-5 h-5 fill-white ml-0.5" />
              )}
            </button>

            {onPrevEpisode && (
              <button
                type="button"
                onClick={onPrevEpisode}
                className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors cursor-pointer"
                title="Previous Episode"
              >
                <SkipBack className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => skipTime(-10)}
              className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors cursor-pointer"
              title="Rewind 10 seconds (J / Left Arrow)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => skipTime(10)}
              className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors cursor-pointer"
              title="Forward 10 seconds (L / Right Arrow)"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {onNextEpisode && (
              <button
                type="button"
                onClick={onNextEpisode}
                className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors cursor-pointer"
                title="Next Episode"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            )}

            {/* Volume Control */}
            <div className="flex items-center gap-1 group/volume ml-1">
              <button
                type="button"
                onClick={toggleMute}
                className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors cursor-pointer"
                title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5 text-red-400" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 sm:w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer hidden sm:block accent-[#F5C518]"
              />
            </div>

            {/* Current / Duration Time */}
            <div className="text-xs font-semibold text-neutral-300 hidden md:flex items-center ml-2">
              <span>{formatTime(currentTime)}</span>
              <span className="mx-1 text-neutral-500">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Controls: Subtitles, Audio, Settings (Quality/Speed/Fit), PiP, Fullscreen */}
          <div className="flex items-center gap-1 sm:gap-2 relative">
            {/* Quick Subtitle Toggle Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowQuickSubtitles(!showQuickSubtitles);
                  setShowQuickAudio(false);
                  setActiveSettingsTab(null);
                }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl transition-all text-xs font-bold cursor-pointer ${
                  selectedSubtitleId !== 'off'
                    ? 'bg-[#F5C518] text-black shadow-md shadow-[#F5C518]/20'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title="Subtitles (C)"
              >
                <Subtitles className="w-4 h-4" />
                <span className="hidden sm:inline">{activeSubtitleLabel}</span>
              </button>

              {/* Quick Subtitles Dropdown */}
              {showQuickSubtitles && (
                <div className="absolute bottom-full right-0 mb-3 w-60 glass-dropdown rounded-2xl shadow-2xl p-2 z-50 text-xs border border-white/10 animate-fade-in max-h-80 overflow-y-auto">
                  <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-white/10 mb-1">
                    <span className="font-extrabold text-neutral-400 uppercase tracking-wider text-[10px]">
                      Subtitles
                    </span>
                    <span className="text-[10px] text-[#F5C518] font-bold">
                      {subtitles.length} Available
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSubtitleChange('off')}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between cursor-pointer ${
                      selectedSubtitleId === 'off'
                        ? 'bg-[#F5C518] text-black font-extrabold'
                        : 'text-neutral-300 hover:bg-white/10'
                    }`}
                  >
                    <span>Off</span>
                    {selectedSubtitleId === 'off' && <Check className="w-3.5 h-3.5" />}
                  </button>

                  {subtitles.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSubtitleChange(s.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between cursor-pointer ${
                        selectedSubtitleId === s.id
                          ? 'bg-[#F5C518] text-black font-extrabold'
                          : 'text-neutral-300 hover:bg-white/10'
                      }`}
                    >
                      <span className="truncate">{s.label}</span>
                      {selectedSubtitleId === s.id && <Check className="w-3.5 h-3.5 ml-1" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Audio Track Button */}
            {audioTracks.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickAudio(!showQuickAudio);
                    setShowQuickSubtitles(false);
                    setActiveSettingsTab(null);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all text-xs font-bold cursor-pointer"
                  title="Audio Track"
                >
                  <AudioLines className="w-4 h-4 text-[#F5C518]" />
                  <span className="hidden sm:inline">{activeAudioLabel}</span>
                </button>

                {/* Quick Audio Dropdown */}
                {showQuickAudio && (
                  <div className="absolute bottom-full right-0 mb-3 w-56 glass-dropdown rounded-2xl shadow-2xl p-2 z-50 text-xs border border-white/10 animate-fade-in max-h-64 overflow-y-auto">
                    <div className="px-2.5 py-1.5 border-b border-white/10 mb-1 font-extrabold text-neutral-400 uppercase tracking-wider text-[10px]">
                      Audio Tracks ({audioTracks.length})
                    </div>
                    {audioTracks.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => handleAudioTrackChange(a.index)}
                        className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between cursor-pointer ${
                          selectedAudioIndex === a.index
                            ? 'bg-[#F5C518] text-black font-extrabold'
                            : 'text-neutral-300 hover:bg-white/10'
                        }`}
                      >
                        <span className="truncate">{a.label}</span>
                        {selectedAudioIndex === a.index && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quick Quality Button */}
            {hlsLevels.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setActiveSettingsTab(activeSettingsTab === 'quality' ? null : 'quality');
                  setShowQuickSubtitles(false);
                  setShowQuickAudio(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all text-xs font-bold cursor-pointer ${
                  activeSettingsTab === 'quality'
                    ? 'bg-[#F5C518] text-black shadow-md shadow-[#F5C518]/20'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title="HLS Quality & Resolution"
              >
                <Sliders className="w-3.5 h-3.5 text-[#F5C518]" />
                <span className="text-[11px] font-extrabold">{currentRenderedQuality}</span>
              </button>
            )}

            {/* Playback Settings Modal Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setActiveSettingsTab(activeSettingsTab ? null : 'main');
                  setShowQuickSubtitles(false);
                  setShowQuickAudio(false);
                }}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  activeSettingsTab
                    ? 'bg-[#F5C518] text-black font-bold'
                    : 'hover:bg-white/10 text-white'
                }`}
                title="Settings (Quality, Speed, Fit, Audio)"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* Settings Menu Panel */}
              {activeSettingsTab && (
                <div className="absolute bottom-full right-0 mb-3 w-64 glass-dropdown rounded-2xl shadow-2xl p-2.5 z-50 text-xs border border-white/10 animate-fade-in">
                  {/* MAIN TAB */}
                  {activeSettingsTab === 'main' && (
                    <div className="space-y-1">
                      <div className="px-2.5 py-1 font-extrabold text-neutral-400 uppercase tracking-wider text-[10px] border-b border-white/10 mb-1.5 flex items-center justify-between">
                        <span>Playback Settings</span>
                        <span className="text-[#F5C518]">{currentRenderedQuality}</span>
                      </div>

                      {/* Quality Entry */}
                      <button
                        type="button"
                        onClick={() => setActiveSettingsTab('quality')}
                        className="w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-neutral-200 hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-[#F5C518]" />
                          <span>Quality</span>
                        </span>
                        <span className="text-neutral-400 flex items-center gap-1 font-semibold">
                          <span>
                            {selectedQualityIndex === -1 ? 'Auto' : currentRenderedQuality}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </button>

                      {/* Speed Entry */}
                      <button
                        type="button"
                        onClick={() => setActiveSettingsTab('speed')}
                        className="w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-neutral-200 hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-emerald-400" />
                          <span>Playback Speed</span>
                        </span>
                        <span className="text-neutral-400 flex items-center gap-1 font-semibold">
                          <span>{playbackSpeed === 1 ? 'Normal' : `${playbackSpeed}x`}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </button>

                      {/* Audio Entry */}
                      <button
                        type="button"
                        onClick={() => setActiveSettingsTab('audio')}
                        className="w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-neutral-200 hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <AudioLines className="w-4 h-4 text-cyan-400" />
                          <span>Audio Track</span>
                        </span>
                        <span className="text-neutral-400 flex items-center gap-1 font-semibold truncate max-w-[100px]">
                          <span className="truncate">{activeAudioLabel}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </button>

                      {/* Subtitles Entry */}
                      <button
                        type="button"
                        onClick={() => setActiveSettingsTab('subtitles')}
                        className="w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-neutral-200 hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Subtitles className="w-4 h-4 text-amber-400" />
                          <span>Subtitles</span>
                        </span>
                        <span className="text-neutral-400 flex items-center gap-1 font-semibold truncate max-w-[100px]">
                          <span className="truncate">{activeSubtitleLabel}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </button>

                      {/* Fit / Aspect Ratio Entry */}
                      <button
                        type="button"
                        onClick={() => setActiveSettingsTab('fit')}
                        className="w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-neutral-200 hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Maximize2 className="w-4 h-4 text-purple-400" />
                          <span>Video Fit</span>
                        </span>
                        <span className="text-neutral-400 flex items-center gap-1 font-semibold capitalize">
                          <span>{videoFit}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </button>

                      {/* Shortcuts Help */}
                      <button
                        type="button"
                        onClick={() => setActiveSettingsTab('shortcuts')}
                        className="w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-neutral-200 hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <HelpCircle className="w-4 h-4 text-neutral-400" />
                          <span>Keyboard Shortcuts</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                      </button>
                    </div>
                  )}

                  {/* QUALITY SUBMENU */}
                  {activeSettingsTab === 'quality' && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 px-2 py-1 border-b border-white/10 mb-1">
                        <button
                          type="button"
                          onClick={() => setActiveSettingsTab('main')}
                          className="hover:text-[#F5C518] text-neutral-400 font-bold flex items-center gap-1"
                        >
                          <span>← Back</span>
                        </button>
                        <span className="mx-1 text-neutral-600">|</span>
                        <span className="font-extrabold text-white text-[11px]">HLS Quality</span>
                      </div>

                      {/* Auto (Adaptive Bitrate) */}
                      <button
                        type="button"
                        onClick={() => handleQualityChange(-1)}
                        className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between cursor-pointer ${
                          selectedQualityIndex === -1
                            ? 'bg-[#F5C518] text-black font-extrabold'
                            : 'text-neutral-200 hover:bg-white/10'
                        }`}
                      >
                        <div>
                          <div className="font-bold">Auto (Adaptive)</div>
                          <div className="text-[10px] opacity-80">
                            Dynamically matches your bandwidth
                          </div>
                        </div>
                        {selectedQualityIndex === -1 && <Check className="w-4 h-4 flex-shrink-0" />}
                      </button>

                      {/* 4K Ultra HD Option */}
                      <button
                        type="button"
                        onClick={() => handleQualityChange(-4)}
                        className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between cursor-pointer ${
                          selectedQualityIndex === -4
                            ? 'bg-[#F5C518] text-black font-extrabold'
                            : 'text-neutral-200 hover:bg-white/10'
                        }`}
                      >
                        <div>
                          <div className="font-bold flex items-center gap-1.5">
                            <span>4K Ultra HD</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/40 text-[#F5C518] border border-[#F5C518]/30 font-black">
                              UHD
                            </span>
                          </div>
                          <div className="text-[10px] opacity-80">
                            Highest bitrate stream &amp; upscale
                          </div>
                        </div>
                        {selectedQualityIndex === -4 && <Check className="w-4 h-4 flex-shrink-0" />}
                      </button>

                      {/* 1080p Full HD Option */}
                      <button
                        type="button"
                        onClick={() => handleQualityChange(-1080)}
                        className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between cursor-pointer ${
                          selectedQualityIndex === -1080
                            ? 'bg-[#F5C518] text-black font-extrabold'
                            : 'text-neutral-200 hover:bg-white/10'
                        }`}
                      >
                        <div>
                          <div className="font-bold flex items-center gap-1.5">
                            <span>1080p Full HD</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/40 text-neutral-300 border border-white/20 font-black">
                              FHD
                            </span>
                          </div>
                          <div className="text-[10px] opacity-80">
                            Crisp high definition fidelity
                          </div>
                        </div>
                        {selectedQualityIndex === -1080 && <Check className="w-4 h-4 flex-shrink-0" />}
                      </button>

                      {/* Real Stream Levels */}
                      {hlsLevels.length > 0 ? (
                        hlsLevels.map((lvl) => (
                          <button
                            key={lvl.index}
                            type="button"
                            onClick={() => handleQualityChange(lvl.index)}
                            className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between cursor-pointer ${
                              selectedQualityIndex === lvl.index
                                ? 'bg-[#F5C518] text-black font-extrabold'
                                : 'text-neutral-200 hover:bg-white/10'
                            }`}
                          >
                            <span className="font-semibold">{lvl.label}</span>
                            {selectedQualityIndex === lvl.index && (
                              <Check className="w-4 h-4 flex-shrink-0" />
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-xs text-neutral-400">
                          Single adaptive rendition active
                        </div>
                      )}

                      {/* Quality Information Note */}
                      <div className="mt-2.5 p-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-[#F5C518] text-[10px] mb-0.5">
                          <Info className="w-3 h-3 shrink-0" />
                          <span>Direct HLS Resolution Info</span>
                        </div>
                        <p className="text-neutral-400 text-[9.5px] leading-snug">
                          Upstream HLS servers encode 720p HD &amp; 480p SD for lightning-fast buffer-free streaming. 4K/1080p mode engages maximum bitrates. Switch servers in top bar for alternative embed players.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* SPEED SUBMENU */}
                  {activeSettingsTab === 'speed' && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 px-2 py-1 border-b border-white/10 mb-1">
                        <button
                          type="button"
                          onClick={() => setActiveSettingsTab('main')}
                          className="hover:text-[#F5C518] text-neutral-400 font-bold flex items-center gap-1"
                        >
                          <span>← Back</span>
                        </button>
                        <span className="mx-1 text-neutral-600">|</span>
                        <span className="font-extrabold text-white text-[11px]">Speed</span>
                      </div>

                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map((spd) => (
                        <button
                          key={spd}
                          type="button"
                          onClick={() => handleSpeedChange(spd)}
                          className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between cursor-pointer ${
                            playbackSpeed === spd
                              ? 'bg-[#F5C518] text-black font-extrabold'
                              : 'text-neutral-200 hover:bg-white/10'
                          }`}
                        >
                          <span>{spd === 1 ? '1x (Normal)' : `${spd}x`}</span>
                          {playbackSpeed === spd && <Check className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* AUDIO SUBMENU */}
                  {activeSettingsTab === 'audio' && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 px-2 py-1 border-b border-white/10 mb-1">
                        <button
                          type="button"
                          onClick={() => setActiveSettingsTab('main')}
                          className="hover:text-[#F5C518] text-neutral-400 font-bold flex items-center gap-1"
                        >
                          <span>← Back</span>
                        </button>
                        <span className="mx-1 text-neutral-600">|</span>
                        <span className="font-extrabold text-white text-[11px]">Audio Tracks</span>
                      </div>

                      {audioTracks.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => handleAudioTrackChange(a.index)}
                          className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between cursor-pointer ${
                            selectedAudioIndex === a.index
                              ? 'bg-[#F5C518] text-black font-extrabold'
                              : 'text-neutral-200 hover:bg-white/10'
                          }`}
                        >
                          <span className="truncate">{a.label}</span>
                          {selectedAudioIndex === a.index && <Check className="w-4 h-4 ml-1" />}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* SUBTITLES SUBMENU */}
                  {activeSettingsTab === 'subtitles' && (
                    <div className="space-y-1 max-h-72 overflow-y-auto">
                      <div className="flex items-center gap-1.5 px-2 py-1 border-b border-white/10 mb-1">
                        <button
                          type="button"
                          onClick={() => setActiveSettingsTab('main')}
                          className="hover:text-[#F5C518] text-neutral-400 font-bold flex items-center gap-1"
                        >
                          <span>← Back</span>
                        </button>
                        <span className="mx-1 text-neutral-600">|</span>
                        <span className="font-extrabold text-white text-[11px]">Subtitles</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSubtitleChange('off')}
                        className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between cursor-pointer ${
                          selectedSubtitleId === 'off'
                            ? 'bg-[#F5C518] text-black font-extrabold'
                            : 'text-neutral-200 hover:bg-white/10'
                        }`}
                      >
                        <span>Off</span>
                        {selectedSubtitleId === 'off' && <Check className="w-4 h-4" />}
                      </button>

                      {subtitles.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleSubtitleChange(s.id)}
                          className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between cursor-pointer ${
                            selectedSubtitleId === s.id
                              ? 'bg-[#F5C518] text-black font-extrabold'
                              : 'text-neutral-200 hover:bg-white/10'
                          }`}
                        >
                          <span className="truncate">{s.label}</span>
                          {selectedSubtitleId === s.id && <Check className="w-4 h-4 ml-1" />}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* FIT / ASPECT RATIO SUBMENU */}
                  {activeSettingsTab === 'fit' && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 px-2 py-1 border-b border-white/10 mb-1">
                        <button
                          type="button"
                          onClick={() => {
                            setVideoFit('contain');
                            setActiveSettingsTab(null);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between cursor-pointer ${
                            videoFit === 'contain'
                              ? 'bg-[#F5C518] text-black font-extrabold'
                              : 'text-neutral-200 hover:bg-white/10'
                          }`}
                        >
                          <div>
                            <div className="font-bold">Contain (Default)</div>
                            <div className="text-[10px] opacity-80">
                              Preserves true aspect ratio
                            </div>
                          </div>
                          {videoFit === 'contain' && <Check className="w-4 h-4" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setVideoFit('cover');
                            setActiveSettingsTab(null);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between cursor-pointer ${
                            videoFit === 'cover'
                              ? 'bg-[#F5C518] text-black font-extrabold'
                              : 'text-neutral-200 hover:bg-white/10'
                          }`}
                        >
                          <div>
                            <div className="font-bold">Cover (Zoom)</div>
                            <div className="text-[10px] opacity-80">Removes black bars</div>
                          </div>
                          {videoFit === 'cover' && <Check className="w-4 h-4" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setVideoFit('fill');
                            setActiveSettingsTab(null);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between cursor-pointer ${
                            videoFit === 'fill'
                              ? 'bg-[#F5C518] text-black font-extrabold'
                              : 'text-neutral-200 hover:bg-white/10'
                          }`}
                        >
                          <div>
                            <div className="font-bold">Stretch (16:9)</div>
                            <div className="text-[10px] opacity-80">Fills entire display area</div>
                          </div>
                          {videoFit === 'fill' && <Check className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* KEYBOARD SHORTCUTS SUBMENU */}
                  {activeSettingsTab === 'shortcuts' && (
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5 px-2 py-1 border-b border-white/10 mb-1">
                        <button
                          type="button"
                          onClick={() => setActiveSettingsTab('main')}
                          className="hover:text-[#F5C518] text-neutral-400 font-bold flex items-center gap-1"
                        >
                          <span>← Back</span>
                        </button>
                        <span className="mx-1 text-neutral-600">|</span>
                        <span className="font-extrabold text-white text-[11px]">Shortcuts</span>
                      </div>

                      <div className="space-y-1 p-1 text-neutral-300">
                        <div className="flex justify-between py-0.5">
                          <span>Play / Pause</span>
                          <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-[10px]">
                            Space / K
                          </kbd>
                        </div>
                        <div className="flex justify-between py-0.5">
                          <span>Rewind 10s</span>
                          <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-[10px]">
                            ← / J
                          </kbd>
                        </div>
                        <div className="flex justify-between py-0.5">
                          <span>Forward 10s</span>
                          <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-[10px]">
                            → / L
                          </kbd>
                        </div>
                        <div className="flex justify-between py-0.5">
                          <span>Volume Up / Down</span>
                          <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-[10px]">
                            ↑ / ↓
                          </kbd>
                        </div>
                        <div className="flex justify-between py-0.5">
                          <span>Mute / Unmute</span>
                          <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-[10px]">
                            M
                          </kbd>
                        </div>
                        <div className="flex justify-between py-0.5">
                          <span>Fullscreen</span>
                          <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-[10px]">
                            F
                          </kbd>
                        </div>
                        <div className="flex justify-between py-0.5">
                          <span>Toggle Subtitles</span>
                          <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-[10px]">
                            C
                          </kbd>
                        </div>
                        <div className="flex justify-between py-0.5">
                          <span>Picture in Picture</span>
                          <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-[10px]">
                            P
                          </kbd>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Picture in Picture Button */}
            {document.pictureInPictureEnabled && (
              <button
                type="button"
                onClick={togglePiP}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isPiP ? 'bg-[#F5C518] text-black font-bold' : 'hover:bg-white/10 text-white'
                }`}
                title="Picture in Picture (P)"
              >
                <PictureInPicture2 className="w-5 h-5" />
              </button>
            )}

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
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
    </div>
  );
}
