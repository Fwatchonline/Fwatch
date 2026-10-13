import React, { useRef } from 'react';
import { Server, Check, Zap, Layers, RefreshCw } from 'lucide-react';
import { StreamingProvider } from '../types';
import { STREAMING_SERVERS } from '../services/streaming';

interface ServerSelectorProps {
  currentServerId: string;
  onSelectServer: (server: StreamingProvider) => void;
  failedServerIds?: string[];
  switchingNotice?: string | null;
  onOpenAggregatedSources?: () => void;
  totalAggregatedCount?: number;
  className?: string;
}

export function ServerSelector({
  currentServerId,
  onSelectServer,
  failedServerIds = [],
  switchingNotice,
  onOpenAggregatedSources,
  totalAggregatedCount,
  className = '',
}: ServerSelectorProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentServer =
    STREAMING_SERVERS.find((s) => s.id === currentServerId) || STREAMING_SERVERS[0];

  const cleanActiveName = currentServer.name.includes('(')
    ? currentServer.name.split('(')[0].trim()
    : currentServer.name;

  return (
    <div
      className={`rounded-2xl bg-[#0D0F14] border border-white/[0.08] p-3 sm:p-4 shadow-xl backdrop-blur-sm transition-all ${className}`}
      role="region"
      aria-label="Streaming Source Selector"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 mb-2.5 pb-2.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-red-950/60 border border-red-500/25 flex items-center justify-center shrink-0">
            <Server className="w-3.5 h-3.5 text-[#E50914]" />
          </div>
          <div className="flex items-center gap-2 truncate">
            <h3 className="text-xs sm:text-sm font-black text-white tracking-wide uppercase">
              Streaming Source
            </h3>
            <span className="hidden sm:inline text-[11px] text-[#707684]">
              · Select alternative source if video buffers
            </span>
          </div>
        </div>

        {/* Active Pill & Aggregated Modal Trigger */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#161922] border border-white/[0.08] text-xs">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[#A1A7B5] text-[11px] hidden xs:inline">Active:</span>
            <span className="font-extrabold text-white text-[11px] truncate max-w-[110px] sm:max-w-[140px]">
              {cleanActiveName}
            </span>
            <span className="text-[#E50914] text-[10px] font-bold">
              {currentServer.latencyMs || 12}ms
            </span>
          </div>

          {onOpenAggregatedSources && (
            <button
              type="button"
              onClick={onOpenAggregatedSources}
              className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[11px] font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E50914]"
              title="Open FMOV Aggregated Source Hub"
            >
              <Layers className="w-3 h-3 text-[#E50914]" />
              <span>More Sources {totalAggregatedCount ? `(${totalAggregatedCount})` : ''}</span>
            </button>
          )}
        </div>
      </div>

      {/* Auto Switch Toast Banner */}
      {switchingNotice && (
        <div className="mb-2 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-950/60 border border-red-500/30 text-xs text-[#E50914] font-medium animate-fade-in">
          <Zap className="w-3.5 h-3.5 animate-bounce shrink-0" />
          <span className="truncate">{switchingNotice}</span>
        </div>
      )}

      {/* Compact Horizontal / Responsive Source Chips */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth"
        tabIndex={-1}
      >
        {STREAMING_SERVERS.map((server, idx) => {
          const isActive = server.id === currentServerId;
          const safeFailed = Array.isArray(failedServerIds) ? failedServerIds : [];
          const hasFailed = safeFailed.includes(server.id);

          const cleanName = server.name.includes('(')
            ? server.name.split('(')[0].trim()
            : server.name;

          const qualityBadge = server.id.includes('rive') || server.id.includes('movy')
            ? '4K'
            : '1080p';

          return (
            <button
              key={server.id}
              type="button"
              disabled={hasFailed}
              onClick={() => onSelectServer(server)}
              tabIndex={0}
              aria-pressed={isActive}
              className={`group flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all shrink-0 cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E50914] ${
                isActive
                  ? 'bg-[#181C26] border-[#E50914] text-white shadow-md shadow-red-950/50'
                  : hasFailed
                  ? 'bg-[#111318]/50 border-white/5 text-neutral-600 opacity-50 cursor-not-allowed'
                  : 'bg-[#111318] border-white/[0.07] hover:border-white/20 hover:bg-[#161922] text-[#A1A7B5] hover:text-white'
              }`}
            >
              {/* Active Indicator Dot / Checkmark */}
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                    isActive ? 'bg-[#E50914] shadow-xs shadow-red-500' : hasFailed ? 'bg-red-500/50' : 'bg-[#10B981]'
                  }`}
                />
                <span className={`text-xs font-bold truncate ${isActive ? 'text-white' : ''}`}>
                  {cleanName}
                </span>
              </div>

              {/* Quality & Latency Badge */}
              <div className="flex items-center gap-1 shrink-0 ml-1">
                <span
                  className={`px-1.5 py-0.5 rounded text-[9.5px] font-extrabold ${
                    isActive
                      ? 'bg-red-950/80 text-red-400 border border-red-500/30'
                      : 'bg-white/5 text-neutral-400'
                  }`}
                >
                  {qualityBadge}
                </span>
                {isActive && (
                  <Check className="w-3.5 h-3.5 text-[#E50914] stroke-[2.5]" />
                )}
              </div>
            </button>
          );
        })}

        {onOpenAggregatedSources && (
          <button
            type="button"
            onClick={onOpenAggregatedSources}
            className="md:hidden flex items-center gap-1 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold shrink-0 transition-colors cursor-pointer"
          >
            <Layers className="w-3 h-3 text-[#E50914]" />
            <span>More Sources</span>
          </button>
        )}
      </div>
    </div>
  );
}
