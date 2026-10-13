import { X, Check, Crown, Zap, Shield } from 'lucide-react';
import { useUI } from '../context/UIContext';

export function PlansModal() {
  const { plansModalOpen, setPlansModalOpen } = useUI();

  if (!plansModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={() => setPlansModalOpen(false)}
    >
      <div
        className="w-full max-w-2xl rounded-3xl bg-[#16171E] border border-[#2d2f3b] shadow-2xl p-6 sm:p-8 text-white relative animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setPlansModalOpen(false)}
          className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-red-950/60 border border-red-500/30 flex items-center justify-center mb-3">
            <Crown className="w-6 h-6 text-[#E50914]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Choose Your Tstream Plan</h2>
          <p className="text-sm text-neutral-400 mt-1 max-w-md mx-auto">
            Unlock 4K Ultra HD direct HLS streaming, multi-device support, and ad-free experience.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Standard */}
          <div className="p-6 rounded-2xl bg-[#1A1B24] border border-white/5 hover:border-white/10 transition-colors flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Standard</span>
              <div className="mt-2 mb-4 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-white">$4.99</span>
                <span className="text-xs text-neutral-400">/ month</span>
              </div>
              <ul className="space-y-2.5 text-xs text-neutral-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#E50914]" />
                  <span>Full HD 1080p Direct Streams</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#E50914]" />
                  <span>Watch on 2 Devices at once</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#E50914]" />
                  <span>Subtitles in 30+ Languages</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setPlansModalOpen(false)}
              className="mt-6 w-full py-2.5 rounded-xl border border-white/20 hover:border-white/40 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Get Standard
            </button>
          </div>

          {/* Premium VIP */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#20212c] to-[#171822] border-2 border-[#E50914] shadow-xl shadow-red-950/40 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-[#E50914] text-white text-[10px] font-extrabold tracking-wider uppercase">
              Popular
            </div>
            <div>
              <span className="text-xs font-bold text-[#E50914] uppercase tracking-wider">VIP Premium</span>
              <div className="mt-2 mb-4 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-white">$9.99</span>
                <span className="text-xs text-neutral-400">/ month</span>
              </div>
              <ul className="space-y-2.5 text-xs text-neutral-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#E50914]" />
                  <span className="font-semibold text-white">4K Ultra HD + HDR10 Audio</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#E50914]" />
                  <span>Watch on 5 Devices Simultaneously</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#E50914]" />
                  <span>Fastest Direct HLS Edge CDN Servers</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#E50914]" />
                  <span>Early Access to New Releases</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setPlansModalOpen(false)}
              className="mt-6 w-full py-2.5 rounded-xl bg-[#E50914] hover:bg-[#B81D24] text-white text-xs font-extrabold transition-colors shadow-lg shadow-red-900/40 cursor-pointer"
            >
              Get VIP Access
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
