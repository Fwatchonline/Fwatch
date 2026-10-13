import { useState } from 'react';
import { X, Copy, Check, Share2 } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
}

export function ShareModal({ isOpen, onClose, title, url }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-[#101217] border border-white/10 rounded-2xl p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-red-950/60 text-[#E50914] border border-red-500/40">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Share This Stream</h3>
            <p className="text-xs text-neutral-400 truncate max-w-[220px]">{title}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 bg-[#151820] border border-white/10 rounded-lg p-2">
            <input
              type="text"
              readOnly
              value={url}
              className="w-full bg-transparent text-xs text-neutral-300 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 rounded-md bg-[#E50914] text-white font-extrabold hover:bg-[#B81D24] transition-colors cursor-pointer"
              title="Copy link"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {copied && (
            <p className="text-xs text-emerald-400 text-center font-semibold">
              Link copied to clipboard!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
