import { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';

export function SocialShareBanner() {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const shareUrl = typeof window !== 'undefined' ? encodeURIComponent(window.location.origin) : '';
  const shareText = encodeURIComponent('Watch trending movies and TV series in HD for free on Tstream!');

  const socialChannels = [
    {
      name: 'Facebook',
      color: 'bg-[#1877F2] hover:bg-[#166fe5]',
      icon: (
        <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      url: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
    },
    {
      name: 'X / Twitter',
      color: 'bg-[#0f1419] hover:bg-black border border-white/20',
      icon: (
        <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      url: `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`,
    },
    {
      name: 'Telegram',
      color: 'bg-[#229ED9] hover:bg-[#1e8ec3]',
      icon: (
        <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.943z" />
        </svg>
      ),
      url: `https://t.me/share/url?url=${shareUrl}&text=${shareText}`,
    },
    {
      name: 'WhatsApp',
      color: 'bg-[#25D366] hover:bg-[#20ba5a]',
      icon: (
        <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
          <path d="M12.031 0C5.405 0 .025 5.378.025 12.003c0 2.115.55 4.178 1.597 5.992L0 24l6.177-1.62a11.96 11.96 0 005.854 1.517h.005c6.625 0 12.006-5.378 12.006-12.004 0-3.208-1.25-6.224-3.518-8.494A11.937 11.937 0 0012.031 0zm0 21.996h-.004a9.96 9.96 0 01-5.08-1.387l-.364-.216-3.771.989 1.007-3.676-.237-.377a9.92 9.92 0 01-1.52-5.326c0-5.505 4.48-9.985 9.988-9.985 2.668 0 5.176 1.039 7.06 2.924a9.94 9.94 0 012.923 7.059c0 5.506-4.48 9.993-9.991 9.993z" />
        </svg>
      ),
      url: `https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}`,
    },
    {
      name: 'Reddit',
      color: 'bg-[#FF4500] hover:bg-[#e03d00]',
      icon: (
        <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.703zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.688-.562-1.249-1.25-1.249zm-4.466 3.99a.327.327 0 0 0-.231.096.35.35 0 0 0 0 .486c.749.75 2.016.942 2.947.942.93 0 2.199-.193 2.948-.942a.35.35 0 0 0 0-.486.327.327 0 0 0-.462 0c-.574.574-1.631.75-2.486.75-.855 0-1.912-.176-2.486-.75a.327.327 0 0 0-.23-.096z" />
        </svg>
      ),
      url: `https://reddit.com/submit?url=${shareUrl}&title=${shareText}`,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-6">
      <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-r from-[#12151c] via-[#171b24] to-[#12151c] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-950/60 border border-red-500/30 flex items-center justify-center text-[#E50914] flex-shrink-0">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>Share Tstream with your friends</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#E50914] text-white font-black uppercase shadow-sm">
                Support Us
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Help us grow by sharing this platform with your friends and family!
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {socialChannels.map((channel) => (
            <a
              key={channel.name}
              href={channel.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2 rounded-lg ${channel.color} text-white transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center`}
              title={`Share on ${channel.name}`}
              aria-label={`Share on ${channel.name}`}
            >
              {channel.icon}
            </a>
          ))}

          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-colors"
            title="Copy Website Link"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-neutral-300" />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
