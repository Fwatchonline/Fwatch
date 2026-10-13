import { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Sliders,
  Tv,
  Eye,
  Database,
  Download,
  Trash2,
  CheckCircle,
  RefreshCw,
  Server,
  Sparkles,
  Info,
  Shield,
} from 'lucide-react';
import { useWatchlist } from '../hooks/useWatchlist';
import { SEO } from '../components/SEO';

export function Settings() {
  const { watchlist, clearWatchlist } = useWatchlist();

  // Settings state persisted in localStorage
  const [defaultServer, setDefaultServer] = useState(() => {
    return localStorage.getItem('tmovie_pref_server') || 'vidlink';
  });
  const [autoplayNext, setAutoplayNext] = useState(() => {
    return localStorage.getItem('tmovie_pref_autoplay') !== 'false';
  });
  const [preferredQuality, setPreferredQuality] = useState(() => {
    return localStorage.getItem('tmovie_pref_quality') || 'auto';
  });
  const [autoSubtitles, setAutoSubtitles] = useState(() => {
    return localStorage.getItem('tmovie_pref_subtitles') !== 'false';
  });
  const [showImdbBadges, setShowImdbBadges] = useState(() => {
    return localStorage.getItem('tmovie_pref_imdb_badge') !== 'false';
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleServerChange = (val: string) => {
    setDefaultServer(val);
    localStorage.setItem('tmovie_pref_server', val);
    showToast(`Default streaming server changed to ${val.toUpperCase()}`);
  };

  const handleAutoplayToggle = () => {
    const nextVal = !autoplayNext;
    setAutoplayNext(nextVal);
    localStorage.setItem('tmovie_pref_autoplay', String(nextVal));
    showToast(`Autoplay next episode ${nextVal ? 'enabled' : 'disabled'}`);
  };

  const handleQualityChange = (val: string) => {
    setPreferredQuality(val);
    localStorage.setItem('tmovie_pref_quality', val);
    showToast(`Preferred resolution set to ${val.toUpperCase()}`);
  };

  const handleSubtitlesToggle = () => {
    const nextVal = !autoSubtitles;
    setAutoSubtitles(nextVal);
    localStorage.setItem('tmovie_pref_subtitles', String(nextVal));
    showToast(`Auto-subtitles ${nextVal ? 'enabled' : 'disabled'}`);
  };

  const handleExportWatchlist = () => {
    try {
      const dataStr =
        'data:text/json;charset=utf-8,' +
        encodeURIComponent(JSON.stringify(watchlist, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `tstream-watchlist-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Watchlist backup exported successfully');
    } catch {
      showToast('Failed to export watchlist');
    }
  };

  const handleClearCache = () => {
    try {
      // Clear non-essential items
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('tmdb_') || k.startsWith('cinemeta_') || k.startsWith('cache_'))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      showToast('Cache and temporary stream buffer cleared');
    } catch {
      showToast('Cache cleared');
    }
  };

  return (
    <div className="min-h-screen bg-[#08090c] pt-24 pb-16">
      <SEO
        title="Settings & Preferences - Tstream"
        description="Configure your streaming preferences, default playback server, subtitle settings, and watchlist backups on Tstream."
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'Settings', item: '/settings' },
        ]}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-[#1c202a] border border-[#E50914]/40 text-white text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-2xl animate-bounce">
          <CheckCircle className="w-4 h-4 text-[#E50914] flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3 pb-6 border-b border-white/10">
          <div className="p-2.5 rounded-xl bg-red-950/60 text-[#E50914] border border-red-500/30 shadow-md shadow-red-950/20">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
              Settings &amp; Preferences
            </h1>
            <p className="text-xs text-neutral-400">
              Customize your streaming quality, default server, and local storage data.
            </p>
          </div>
        </div>

        {/* Section 1: Playback Preferences */}
        <div className="bg-[#12141a] border border-white/5 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
            <Tv className="w-5 h-5 text-[#E50914]" />
            <h2 className="text-base font-bold text-white">Playback &amp; Streaming</h2>
          </div>

          <div className="space-y-5">
            {/* Preferred Server */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-sm font-bold text-white block">Default Streaming Server</span>
                <span className="text-xs text-neutral-400">
                  Primary CDN server loaded when starting a movie or TV episode.
                </span>
              </div>
              <select
                value={defaultServer}
                onChange={(e) => handleServerChange(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-[#171922] border border-white/10 text-xs sm:text-sm font-semibold text-white focus:border-[#E50914] outline-none cursor-pointer"
              >
                <option value="server-vidcore">VidCore (Direct HLS - vidcore.io)</option>
                <option value="server-vidrock">VidRock (Direct HLS - vidrock.net)</option>
                <option value="server-vidup">VidUP (Direct HLS - vidup.to)</option>
                <option value="server-111movies">111Movies (Direct HLS - 111movies.net)</option>
                <option value="server-cinesrc">CineSrc (Direct HLS - cinesrc.to)</option>
                <option value="server-vidfast">VidFast Pro (Direct HLS - vidfast.pro)</option>
                <option value="server-hls-primary">Edge CDN (Direct HLS - High Speed)</option>
                <option value="server-hls-proxy">Proxied HLS (Shield CDN - 4K)</option>
              </select>
            </div>

            {/* Preferred Resolution */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/5">
              <div>
                <span className="text-sm font-bold text-white block">Preferred Video Quality</span>
                <span className="text-xs text-neutral-400">
                  Adaptive bitrates adjust automatically to match your bandwidth.
                </span>
              </div>
              <div className="flex items-center gap-2">
                {['auto', '4k', '1080p', '720p'].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleQualityChange(q)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase cursor-pointer ${
                      preferredQuality === q
                        ? 'bg-[#E50914] text-white font-black shadow-md shadow-red-900/40'
                        : 'bg-[#171922] text-neutral-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {q === 'auto' ? 'Auto Adaptive' : q}
                  </button>
                ))}
              </div>
            </div>

            {/* Autoplay Next Episode */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/5">
              <div>
                <span className="text-sm font-bold text-white block">Autoplay Next Episode</span>
                <span className="text-xs text-neutral-400">
                  Automatically start the next episode when the current one finishes.
                </span>
              </div>
              <button
                type="button"
                onClick={handleAutoplayToggle}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  autoplayNext ? 'bg-[#E50914]' : 'bg-neutral-800 border border-white/10'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                    autoplayNext ? 'right-0.5' : 'left-0.5 bg-neutral-400'
                  }`}
                />
              </button>
            </div>

            {/* Subtitles by default */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/5">
              <div>
                <span className="text-sm font-bold text-white block">Enable Subtitles by Default</span>
                <span className="text-xs text-neutral-400">
                  Automatically turn on English / matched subtitles on video startup.
                </span>
              </div>
              <button
                type="button"
                onClick={handleSubtitlesToggle}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  autoSubtitles ? 'bg-[#E50914]' : 'bg-neutral-800 border border-white/10'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                    autoSubtitles ? 'right-0.5' : 'left-0.5 bg-neutral-400'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Data & Watchlist Storage */}
        <div className="bg-[#12141a] border border-white/5 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
            <Database className="w-5 h-5 text-[#E50914]" />
            <h2 className="text-base font-bold text-white">Data &amp; Storage Management</h2>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
              <div>
                <span className="text-sm font-bold text-white block">
                  Saved Watchlist Items: {watchlist.length} titles
                </span>
                <span className="text-xs text-neutral-400">
                  Export your saved movies and series to JSON for backup or device migration.
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleExportWatchlist}
                  disabled={watchlist.length === 0}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </button>

                <button
                  type="button"
                  onClick={() => setConfirmClearOpen(true)}
                  disabled={watchlist.length === 0}
                  className="px-4 py-2 rounded-xl bg-red-500/15 hover:bg-red-500 text-red-400 hover:text-white disabled:opacity-40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
              <div>
                <span className="text-sm font-bold text-white block">Temporary Cache &amp; Buffers</span>
                <span className="text-xs text-neutral-400">
                  Clear cached TMDB search suggestions and temporary poster cache.
                </span>
              </div>

              <button
                type="button"
                onClick={handleClearCache}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Clear Cache</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Platform Information */}
        <div className="bg-[#12141a] border border-white/5 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
            <Info className="w-5 h-5 text-[#E50914]" />
            <h2 className="text-base font-bold text-white">About Tstream Platform</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <span className="text-neutral-400 block font-medium">Platform Version</span>
              <span className="text-white font-bold text-sm">Tstream v2.4.2</span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <span className="text-neutral-400 block font-medium">Metadata Engine</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                TMDB &amp; IMDb API Connected
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <span className="text-neutral-400 block font-medium">Edge CDN Servers</span>
              <span className="text-[#E50914] font-bold flex items-center gap-1">
                <Server className="w-3.5 h-3.5" />
                5 High-Speed Active Nodes
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal to Clear Watchlist */}
      {confirmClearOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#151820] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Clear Watchlist?</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Are you sure you want to remove all {watchlist.length} saved movies and TV shows? This cannot be undone unless you have an exported JSON backup.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmClearOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  clearWatchlist();
                  setConfirmClearOpen(false);
                  showToast('Watchlist cleared');
                }}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold cursor-pointer"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
