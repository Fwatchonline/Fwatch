import { useState } from 'react';
import { Server, Check, AlertTriangle, Zap, Radio } from 'lucide-react';
import { StreamingProvider } from '../types';
import { STREAMING_SERVERS } from '../services/streaming';

interface ServerSelectorProps {
  currentServerId: string;
  onSelectServer: (server: StreamingProvider) => void;
  failedServerIds?: string[];
}

export function ServerSelector({
  currentServerId,
  onSelectServer,
  failedServerIds = [],
}: ServerSelectorProps) {
  const currentServer =
    STREAMING_SERVERS.find((s) => s.id === currentServerId) || STREAMING_SERVERS[0];

  return (
    <div className="space-y-3 p-4 rounded-2xl bg-[#101217] border border-white/10 shadow-xl">
      {/* Notice Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10 text-xs">
        <div className="flex items-center gap-2 text-neutral-300">
          <Radio className="w-4 h-4 text-[#F5C518] animate-pulse" />
          <span>
            Direct HLS stream resolvers. If one buffers, switch to any mirror below:
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>Active:</span>
          <strong className="text-white">{currentServer.name}</strong>
          <span className="text-[#F5C518] font-semibold">({currentServer.latencyMs || 20}ms)</span>
        </div>
      </div>

      {/* Server Buttons Grid (Direct 1-click switching for all 8 HLS resolvers) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {STREAMING_SERVERS.map((server, idx) => {
          const isActive = server.id === currentServerId;
          const safeFailed = Array.isArray(failedServerIds) ? failedServerIds : [];
          const hasFailed = safeFailed.includes(server.id);

          // Extract friendly server badge name: e.g. "VidCore", "VidRock", "VidUP", "111Movies", "CineSrc", "VidFast Pro"
          const badgeName = server.name.includes('(')
            ? server.name.split('(')[0].trim()
            : server.name;

          return (
            <button
              key={server.id}
              type="button"
              disabled={hasFailed}
              onClick={() => onSelectServer(server)}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                isActive
                  ? 'bg-[#F5C518] text-black border-[#F5C518] shadow-lg shadow-[#F5C518]/30 ring-2 ring-[#F5C518]/40 font-extrabold scale-[1.02]'
                  : hasFailed
                  ? 'bg-neutral-900/60 text-neutral-500 border-transparent opacity-50 cursor-not-allowed'
                  : 'bg-[#151820] text-neutral-200 border-white/5 hover:border-white/20 hover:bg-white/10 active:scale-98'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-black' : 'bg-emerald-400'}`}></span>
                <span className="truncate">{badgeName}</span>
              </div>

              <div className="flex items-center gap-1 text-[10px] uppercase font-bold opacity-90 flex-shrink-0">
                <span className={isActive ? 'text-black/80' : 'text-neutral-400'}>
                  {server.latencyMs}ms
                </span>
                {isActive && <Check className="w-3.5 h-3.5 ml-0.5 text-black" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
