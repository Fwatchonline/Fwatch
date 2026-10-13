import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  List,
  Play,
  X,
  Check,
  Clock,
  Sparkles,
} from 'lucide-react';
import { TMDBEpisode, TMDBSeason } from '../../types';
import { getTMDBImageUrl } from '../../utils/slugify';

interface EpisodeSelectorProps {
  currentSeasonNumber: number;
  currentEpisodeNumber: number;
  season: TMDBSeason | null;
  totalSeasons?: number;
  onSelectSeason: (seasonNumber: number) => void;
  onSelectEpisode: (episodeNumber: number) => void;
  onPrevEpisode: () => void;
  onNextEpisode: () => void;
  hasPrevEpisode: boolean;
  hasNextEpisode: boolean;
  autoNext: boolean;
  onToggleAutoNext: () => void;
}

export function EpisodeSelector({
  currentSeasonNumber,
  currentEpisodeNumber,
  season,
  totalSeasons = 1,
  onSelectSeason,
  onSelectEpisode,
  onPrevEpisode,
  onNextEpisode,
  hasPrevEpisode,
  hasNextEpisode,
  autoNext,
  onToggleAutoNext,
}: EpisodeSelectorProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const episodes = season?.episodes || [];
  const currentEp = episodes.find((e) => e.episodeNumber === currentEpisodeNumber);

  return (
    <>
      <div className="rounded-2xl bg-[#111318] border border-white/[0.07] p-3.5 sm:p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        {/* Left: Previous Episode & Season Dropdown */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onPrevEpisode}
            disabled={!hasPrevEpisode}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              hasPrevEpisode
                ? 'bg-[#161922] hover:bg-[#E50914] text-[#A1A7B5] hover:text-white border border-white/10'
                : 'bg-white/5 text-neutral-600 border border-transparent cursor-not-allowed'
            }`}
            title="Previous Episode"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          {/* Season Selector */}
          <div className="relative">
            <select
              value={currentSeasonNumber}
              onChange={(e) => onSelectSeason(Number(e.target.value))}
              className="bg-[#161922] text-white border border-white/10 hover:border-white/20 rounded-xl px-3 py-2 text-xs font-bold appearance-none pr-8 cursor-pointer focus:outline-none focus:border-[#E50914]"
            >
              {Array.from({ length: Math.max(totalSeasons, currentSeasonNumber, 1) }, (_, i) => i + 1).map((sNum) => (
                <option key={sNum} value={sNum} className="bg-[#111318] text-white">
                  Season {sNum}
                </option>
              ))}
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
              ▼
            </div>
          </div>

          {/* Current Episode Indicator */}
          <span className="text-xs font-black text-[#E50914] px-3 py-1.5 rounded-lg bg-red-950/60 border border-red-500/30">
            S{String(currentSeasonNumber).padStart(2, '0')} · E{String(currentEpisodeNumber).padStart(2, '0')}
          </span>
        </div>

        {/* Right: Episode List Button & Auto Next & Next Episode */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Episode List Drawer / Modal Trigger */}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-[#161922] border border-white/10 hover:border-[#E50914]/50 text-white hover:text-[#E50914] transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            title="View all episodes"
          >
            <List className="w-4 h-4 text-[#E50914]" />
            <span>Episode List ({episodes.length || '10+'})</span>
          </button>

          {/* Auto Next Toggle */}
          <button
            type="button"
            onClick={onToggleAutoNext}
            className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              autoNext
                ? 'bg-[#18C98B]/10 text-[#18C98B] border-[#18C98B]/30'
                : 'bg-[#161922] text-[#707684] border-white/10'
            }`}
            title="Automatically start next episode when this finishes"
          >
            <span className={`w-2 h-2 rounded-full ${autoNext ? 'bg-[#18C98B] animate-pulse' : 'bg-neutral-600'}`} />
            <span>Auto Next</span>
          </button>

          {/* Next Episode Button */}
          <button
            type="button"
            onClick={onNextEpisode}
            disabled={!hasNextEpisode}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${
              hasNextEpisode
                ? 'bg-[#E50914] hover:bg-[#B81D24] text-white shadow-red-900/30 cursor-pointer'
                : 'bg-white/5 text-neutral-600 border border-transparent cursor-not-allowed'
            }`}
            title="Next Episode"
          >
            <span className="hidden sm:inline">Next Episode</span>
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Episode List Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl max-h-[85vh] bg-[#111318] border border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0D0F14]">
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  Season {currentSeasonNumber} Episodes
                </h3>
                <p className="text-xs text-[#A1A7B5]">
                  Select an episode to begin streaming immediately
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Episodes Scrollable List */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-2.5 flex-1">
              {episodes.length === 0 ? (
                <div className="text-center py-10 text-neutral-400 text-sm">
                  Loading episodes list...
                </div>
              ) : (
                episodes.map((ep) => {
                  const isCurrent = ep.episodeNumber === currentEpisodeNumber;
                  return (
                    <button
                      key={ep.id}
                      type="button"
                      onClick={() => {
                        onSelectEpisode(ep.episodeNumber);
                        setModalOpen(false);
                      }}
                      className={`w-full flex items-center gap-3.5 p-3 rounded-2xl text-left transition-all border cursor-pointer ${
                        isCurrent
                          ? 'bg-red-950/40 border-[#E50914] shadow-lg shadow-red-900/20'
                          : 'bg-[#0D0F14] border-white/5 hover:border-white/20 hover:bg-[#161922]'
                      }`}
                    >
                      {/* Episode Thumbnail */}
                      <div className="w-20 sm:w-24 aspect-video rounded-xl overflow-hidden bg-[#161922] flex-shrink-0 relative border border-white/10">
                        {ep.stillPath ? (
                          <img
                            src={getTMDBImageUrl(ep.stillPath, 'w300', 'backdrop')}
                            alt={ep.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-neutral-500 font-bold">
                            EP {ep.episodeNumber}
                          </div>
                        )}
                        {isCurrent && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="w-6 h-6 rounded-full bg-[#E50914] flex items-center justify-center text-white">
                              <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Episode Meta */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-black ${isCurrent ? 'text-[#E50914]' : 'text-white'}`}>
                            EP {ep.episodeNumber}
                          </span>
                          {ep.runtime && (
                            <span className="text-[11px] text-[#707684] flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {ep.runtime}m
                            </span>
                          )}
                          {isCurrent && (
                            <span className="ml-auto text-[10px] font-black uppercase text-white bg-[#E50914] px-2 py-0.5 rounded-full">
                              Now Playing
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-white truncate">
                          {ep.name || `Episode ${ep.episodeNumber}`}
                        </h4>

                        {ep.overview && (
                          <p className="text-xs text-[#A1A7B5] line-clamp-1 mt-0.5">
                            {ep.overview}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
