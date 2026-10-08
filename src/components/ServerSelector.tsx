import React from 'react';
import { Radio, Check, Server, Zap, ShieldCheck } from 'lucide-react';
import { StreamingProvider } from '../types';
import { STREAMING_SERVERS } from '../services/streaming';

interface ServerSelectorProps {
  currentServerId: string;
  onSelectServer: (server: StreamingProvider) => void;
  failedServerIds?: string[];
  switchingNotice?: string | null;
}

export function ServerSelector({
  currentServerId,
  onSelectServer,
  failedServerIds = [],
  switchingNotice,
}: ServerSelectorProps) {
  const currentServer =
    STREAMING_SERVERS.find((s) => s.id === currentServerId) || STREAMING_SERVERS[0];

  return (
    <div className="rounded-2xl bg-[#111318] border border-white/[0.07] p-4 sm:p-5 shadow-xl space-y-3.5">
      {/* Header with Active Server Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-[#F5C518]" />
          <h3 className="font-extrabold text-sm sm:text-base text-white tracking-wide">
            Streaming Sources
          </h3>
          <span className="text-[11px] text-[#707684] hidden md:inline">
            · Select fastest mirror if video buffers
          </span>
        </div>

        {/* Active Server Status Pill */}
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0D0F14] border border-white/10 text-neutral-300">
            <span className="w-2 h-2 rounded-full bg-[#18C98B] animate-pulse" />
            <span className="text-[#A1A7B5]">Active:</span>
            <strong className="text-white font-bold">{currentServer.name.split('(')[0].trim()}</strong>
            <span className="text-[#F5C518] font-bold text-[11px]">
              ({currentServer.latencyMs || 14}ms)
            </span>
          </span>
        </div>
      </div>

      {/* Auto Switch Toast Banner (if switching) */}
      {switchingNotice && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F5C518]/15 border border-[#F5C518]/30 text-xs text-[#F5C518] font-medium animate-fade-in">
          <Zap className="w-4 h-4 animate-bounce" />
          <span>{switchingNotice}</span>
        </div>
      )}

      {/* Server Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {STREAMING_SERVERS.map((server) => {
          const isActive = server.id === currentServerId;
          const safeFailed = Array.isArray(failedServerIds) ? failedServerIds : [];
          const hasFailed = safeFailed.includes(server.id);

          const cleanName = server.name.includes('(')
            ? server.name.split('(')[0].trim()
            : server.name;

          const qualityBadge = server.id.includes('rive') || server.id.includes('movy')
            ? '4K / 1080p'
            : '1080p HLS';

          const latency = server.latencyMs || 15;

          return (
            <button
              key={server.id}
              type="button"
              disabled={hasFailed}
              onClick={() => onSelectServer(server)}
              className={`group flex flex-col justify-between p-3 rounded-xl text-left transition-all border cursor-pointer relative overflow-hidden ${
                isActive
                  ? 'bg-[#F5C518] text-black border-[#F5C518] shadow-lg shadow-[#F5C518]/20 font-bold'
                  : hasFailed
                  ? 'bg-[#0D0F14]/50 border-white/5 text-neutral-600 opacity-50 cursor-not-allowed'
                  : 'bg-[#0D0F14] border-white/5 hover:border-white/20 hover:bg-[#161922] text-white'
              }`}
            >
              {/* Top Row: Server Name & Active Indicator */}
              <div className="flex items-center justify-between gap-1 w-full mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      isActive ? 'bg-black' : hasFailed ? 'bg-red-500' : 'bg-[#18C98B]'
                    }`}
                  />
                  <span className="text-xs font-extrabold truncate">
                    {cleanName}
                  </span>
                </div>

                {isActive ? (
                  <Check className="w-3.5 h-3.5 flex-shrink-0 text-black stroke-[3]" />
                ) : (
                  <span className="text-[10px] text-[#707684] group-hover:text-neutral-400 font-semibold flex-shrink-0">
                    {latency}ms
                  </span>
                )}
              </div>

              {/* Bottom Row: Quality & Direct HLS Label */}
              <div className="flex items-center justify-between text-[10px] w-full pt-1 border-t border-black/10 dark:border-white/5">
                <span className={isActive ? 'text-black/80 font-bold' : 'text-[#A1A7B5] font-medium'}>
                  {qualityBadge}
                </span>
                <span className={isActive ? 'text-black/70 font-semibold' : 'text-[#707684]'}>
                  Direct
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
