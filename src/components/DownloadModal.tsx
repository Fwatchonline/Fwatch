import { useState, useEffect } from 'react';
import { Download, X, Film, Check, ExternalLink, HardDrive, Sparkles } from 'lucide-react';
import { fetchVylaDownloads, VylaDownloadItem } from '../services/streaming';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  tmdbId: number;
  type: 'movie' | 'tv';
  season?: number;
  episode?: number;
}

export function DownloadModal({
  isOpen,
  onClose,
  title,
  tmdbId,
  type,
  season,
  episode,
}: DownloadModalProps) {
  const [downloads, setDownloads] = useState<VylaDownloadItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetchVylaDownloads(tmdbId, type, season, episode)
      .then((items) => {
        setDownloads(items);
        setLoading(false);
      })
      .catch(() => {
        setDownloads([]);
        setLoading(false);
      });
  }, [isOpen, tmdbId, type, season, episode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#14151a] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-[#F5C518] text-black text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 fill-black" />
                <span>Vyla SDK Direct Downloads</span>
              </span>
            </div>
            <h3 className="text-xl font-black text-white tracking-tight">
              Download {title}
            </h3>
            {type === 'tv' && season && episode && (
              <p className="text-xs text-neutral-400 font-semibold">
                Season {season}, Episode {episode}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
              Fetching direct high-speed streams from Vyla SDK...
            </p>
          </div>
        ) : downloads.length > 0 ? (
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {downloads.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="flex items-center justify-between p-4 rounded-2xl bg-[#1b1c24] hover:bg-[#22242e] border border-white/5 hover:border-[#F5C518]/50 transition-all group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#F5C518]/10 text-[#F5C518] flex items-center justify-center group-hover:bg-[#F5C518] group-hover:text-black transition-colors">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-[#F5C518] transition-colors">
                      {item.label}
                    </h4>
                    <p className="text-[11px] text-neutral-400 flex items-center gap-2">
                      <span className="font-semibold text-emerald-400">Direct Link</span>
                      <span>•</span>
                      <span>Source: {item.source}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-black/40 text-neutral-300 text-xs font-black">
                    {item.quality}
                  </span>
                  <ExternalLink className="w-4 h-4 text-neutral-400 group-hover:text-[#F5C518]" />
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 space-y-3">
            <HardDrive className="w-12 h-12 text-neutral-600 mx-auto" />
            <h4 className="text-sm font-bold text-white">No direct file downloads available</h4>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
              This title is streamed directly via multi-server HLS playlist chunks. You can watch it directly in 4K / 1080p using the player.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-neutral-500">
          <span>Powered by @vyla-entertainment/sdk</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
