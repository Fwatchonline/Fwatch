import React, { useState, useEffect, useMemo } from 'react';
import {
  Zap,
  RefreshCw,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  getFmovMovieStreams,
  getFmovSeriesStreams,
  FmovStreamItem,
  groupStreamsByProvider,
} from '../services/fmovStream';

interface FmovSourceSelectorProps {
  tmdbId: number;
  type: 'movie' | 'tv';
  seasonNumber?: number;
  episodeNumber?: number;
  activeSourceUrl?: string;
  onSelectSource: (source: FmovStreamItem) => void;
  className?: string;
  defaultExpanded?: boolean;
}

export function FmovSourceSelector({
  tmdbId,
  type,
  seasonNumber = 1,
  episodeNumber = 1,
  activeSourceUrl,
  onSelectSource,
  className = '',
  defaultExpanded = false,
}: FmovSourceSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [loading, setLoading] = useState(true);
  const [streams, setStreams] = useState<FmovStreamItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [selectedFormat, setSelectedFormat] = useState<'all' | 'hls' | 'mp4' | 'embed'>('all');
  const [retryNonce, setRetryNonce] = useState(0);

  // Fetch streams for the current movie or series episode
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    setLoading(true);
    setError(null);

    const loadStreams = async () => {
      try {
        let resp;
        if (type === 'movie') {
          resp = await getFmovMovieStreams(tmdbId, {
            signal: controller.signal,
            forceRefresh: retryNonce > 0,
          });
        } else {
          resp = await getFmovSeriesStreams(tmdbId, seasonNumber, episodeNumber, {
            signal: controller.signal,
            forceRefresh: retryNonce > 0,
          });
        }

        if (!mounted) return;

        if (resp.success && resp.streams && resp.streams.length > 0) {
          setStreams(resp.streams);
          setError(null);
        } else if (resp.error) {
          setStreams([]);
          setError(resp.error);
        } else {
          setStreams([]);
          setError('No aggregated sources found for this title.');
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        if (!mounted) return;
        setStreams([]);
        setError(err?.message || 'Network request timed out while loading sources.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadStreams();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [tmdbId, type, seasonNumber, episodeNumber, retryNonce]);

  // Provider list and counts
  const providerGroups = useMemo(() => groupStreamsByProvider(streams), [streams]);
  const providerNames = useMemo(() => Object.keys(providerGroups).sort(), [providerGroups]);

  // Filtered streams
  const filteredStreams = useMemo(() => {
    return streams.filter((s) => {
      const matchProvider = selectedProvider === 'all' || s.provider === selectedProvider;
      const matchFormat = selectedFormat === 'all' || s.format === selectedFormat;
      return matchProvider && matchFormat;
    });
  }, [streams, selectedProvider, selectedFormat]);

  const handleRetry = () => {
    setRetryNonce((n) => n + 1);
  };

  const activeStreamItem = streams.find((s) => s.url === activeSourceUrl);

  return (
    <div
      className={`rounded-2xl bg-[#0D0F14] border border-white/[0.08] transition-all overflow-hidden ${className}`}
    >
      {/* Sleek Collapsible Header Bar */}
      <div className="p-3 sm:p-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2.5 text-left group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E50914] rounded-lg p-0.5"
          aria-expanded={isExpanded}
        >
          <div className="w-6 h-6 rounded-lg bg-red-950/60 border border-red-500/25 flex items-center justify-center shrink-0">
            <Layers className="w-3.5 h-3.5 text-[#E50914]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-black text-white group-hover:text-neutral-200 transition-colors uppercase tracking-wider">
                FMOV Aggregated Streams
              </h4>
              {!loading && streams.length > 0 && (
                <span className="px-2 py-0.2 rounded-full bg-red-950/80 border border-red-500/30 text-red-400 text-[10px] font-black">
                  {streams.length} Available
                </span>
              )}
            </div>
            {activeStreamItem ? (
              <p className="text-[11px] text-[#A1A7B5] truncate mt-0.5">
                Current: <strong className="text-white">{activeStreamItem.provider}</strong> ({activeStreamItem.quality || 'HD'})
              </p>
            ) : (
              <p className="text-[11px] text-[#707684]">
                Multi-CDN backup streams (StreamFlix, VidLink, etc.)
              </p>
            )}
          </div>
        </button>

        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleRetry}
            disabled={loading}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh FMOV streams"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#E50914]' : ''}`} />
          </button>

          {/* Toggle Expand / Collapse */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E50914]"
          >
            <span>{isExpanded ? 'Collapse' : 'Browse All'}</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Content Area */}
      {isExpanded && (
        <div className="border-t border-white/[0.06] p-3 sm:p-4 space-y-3 bg-black/20">
          {/* Filters Bar */}
          {!loading && streams.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Formats */}
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#111318] border border-white/5 text-[11px]">
                {(['all', 'hls', 'mp4', 'embed'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setSelectedFormat(fmt)}
                    className={`px-2 py-0.5 rounded font-extrabold capitalize transition-colors cursor-pointer ${
                      selectedFormat === fmt
                        ? 'bg-[#E50914] text-white shadow-xs'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {fmt === 'all' ? 'All Formats' : fmt.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Provider Pills */}
              {providerNames.length > 1 && (
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full">
                  <button
                    type="button"
                    onClick={() => setSelectedProvider('all')}
                    className={`px-2 py-0.5 rounded text-[10.5px] font-bold shrink-0 transition-colors cursor-pointer ${
                      selectedProvider === 'all'
                        ? 'bg-white/20 text-white'
                        : 'bg-white/5 text-neutral-400 hover:text-white'
                    }`}
                  >
                    All ({streams.length})
                  </button>
                  {providerNames.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSelectedProvider(p)}
                      className={`px-2 py-0.5 rounded text-[10.5px] font-bold shrink-0 transition-colors cursor-pointer ${
                        selectedProvider === p
                          ? 'bg-[#E50914] text-white'
                          : 'bg-white/5 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {p} ({providerGroups[p]?.length || 0})
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-8 h-8 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-neutral-400">Discovering live provider streams...</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/25 flex items-center justify-between gap-3 text-xs text-red-400">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={handleRetry}
                className="px-2.5 py-1 rounded bg-[#E50914] text-white font-bold shrink-0 hover:bg-[#B81D24] transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* Streams Grid */}
          {!loading && !error && filteredStreams.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto no-scrollbar">
              {filteredStreams.map((s, idx) => {
                const isActive = activeSourceUrl ? s.url === activeSourceUrl : false;
                return (
                  <button
                    key={s.id || idx}
                    type="button"
                    onClick={() => onSelectSource(s)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E50914] ${
                      isActive
                        ? 'bg-[#181C26] border-[#E50914] text-white shadow-sm'
                        : 'bg-[#111318] border-white/[0.06] hover:border-white/20 hover:bg-[#161922] text-[#A1A7B5] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isActive ? 'bg-[#E50914]' : 'bg-[#10B981]'
                        }`}
                      />
                      <div className="min-w-0">
                        <span className={`text-xs font-bold truncate block ${isActive ? 'text-white' : ''}`}>
                          {s.provider}
                        </span>
                        <span className="text-[10px] text-[#707684] truncate block">
                          {s.name || `Source #${idx + 1}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-white/5 text-neutral-300">
                        {s.quality || s.format.toUpperCase()}
                      </span>
                      {isActive && <Check className="w-3.5 h-3.5 text-[#E50914] stroke-[2.5]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
