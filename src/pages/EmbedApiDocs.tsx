import { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Play,
  Tv,
  Film,
  Sparkles,
  Sliders,
  ExternalLink,
  ShieldCheck,
  Zap,
  Globe,
  Terminal,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { SEO } from '../components/SEO';

const COLOR_PRESETS = [
  { name: 'T.Movie Gold', hex: '#F5C518' },
  { name: 'Cyan Teal', hex: '#14B8A6' },
  { name: 'Neon Purple', hex: '#8B5CF6' },
  { name: 'Crimson Red', hex: '#EF4444' },
  { name: 'Sky Blue', hex: '#3B82F6' },
  { name: 'Emerald Green', hex: '#10B981' },
];

const SAMPLE_MOVIES = [
  { title: 'Fight Club', tmdbId: 550 },
  { title: 'Interstellar', tmdbId: 157336 },
  { title: 'The Dark Knight', tmdbId: 155 },
  { title: 'Inception', tmdbId: 27205 },
];

const SAMPLE_SHOWS = [
  { title: 'Game of Thrones', tmdbId: 1399, season: 1, episode: 1 },
  { title: 'Breaking Bad', tmdbId: 1396, season: 1, episode: 1 },
  { title: 'Stranger Things', tmdbId: 66732, season: 1, episode: 1 },
  { title: 'The Last of Us', tmdbId: 100088, season: 1, episode: 1 },
];

export function EmbedApiDocs() {
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('tv');
  const [tmdbId, setTmdbId] = useState<string>('1399');
  const [season, setSeason] = useState<number>(1);
  const [episode, setEpisode] = useState<number>(1);
  const [selectedColor, setSelectedColor] = useState<string>('#14B8A6');
  const [autoplay, setAutoplay] = useState<boolean>(false);
  const [nextEpisode, setNextEpisode] = useState<boolean>(true);
  const [episodeSelector, setEpisodeSelector] = useState<boolean>(true);
  const [autoplayNextEpisode, setAutoplayNextEpisode] = useState<boolean>(true);
  const [overlay, setOverlay] = useState<boolean>(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'html' | 'responsive' | 'react' | 'url'>('html');
  const [copied, setCopied] = useState<string | null>(null);

  // Generate Embed Path and Full URL
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tmovie.snapmire.workers.dev';
  const cleanColor = selectedColor.replace('#', '');

  const queryParams = new URLSearchParams();
  if (cleanColor !== 'f5c518') queryParams.set('color', cleanColor);
  if (autoplay) queryParams.set('autoplay', 'true');
  if (!nextEpisode && mediaType === 'tv') queryParams.set('nextEpisode', 'false');
  if (!episodeSelector && mediaType === 'tv') queryParams.set('episodeSelector', 'false');
  if (!autoplayNextEpisode && mediaType === 'tv') queryParams.set('autoplayNextEpisode', 'false');
  if (overlay) queryParams.set('overlay', 'true');

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

  const embedPath =
    mediaType === 'movie'
      ? `/embed/movie/${tmdbId}${queryString}`
      : `/embed/tv/${tmdbId}/${season}/${episode}${queryString}`;

  const fullEmbedUrl = `${origin}${embedPath}`;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  // Code formats
  const htmlSnippet = `<iframe
  src="${fullEmbedUrl}"
  width="100%"
  height="100%"
  frameborder="0"
  allow="autoplay; fullscreen; picture-in-picture"
  allowfullscreen
></iframe>`;

  const responsiveHtmlSnippet = `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 16px; background: #000;">
  <iframe
    src="${fullEmbedUrl}"
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
    allow="autoplay; fullscreen; picture-in-picture"
    allowfullscreen
  ></iframe>
</div>`;

  const reactSnippet = `export function StreamingPlayer() {
  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl">
      <iframe
        src="${fullEmbedUrl}"
        className="w-full h-full border-0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title="Streaming Video"
      />
    </div>
  );
}`;

  return (
    <div className="py-6 space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <SEO
        title="Embed Video Player & Developer API - T.Movie"
        description="Integrate T.Movie's ultra-fast 4K streaming player directly into your website. Zero ads, customizable colors, and full postMessage controls."
      />

      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 pt-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F5C518]/10 border border-[#F5C518]/30 text-xs font-black text-[#F5C518]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>FREE &amp; ZERO-CONFIG DEVELOPER API</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          Embed T.Movie Player on <span className="text-[#F5C518]">Your Website</span>
        </h1>

        <p className="text-base sm:text-lg text-neutral-300 leading-relaxed">
          Provide your users with a modern, high-speed, direct HLS 4K &amp; Full HD video player.
          Customize theme colors, autoplay behavior, next episode logic, and listen to player events in real-time.
        </p>

        {/* Feature Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs text-neutral-300">
            <Zap className="w-3.5 h-3.5 text-[#F5C518]" />
            <span>Direct HLS (No Ads / Popups)</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs text-neutral-300">
            <Sliders className="w-3.5 h-3.5 text-[#14B8A6]" />
            <span>Custom Brand Colors</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs text-neutral-300">
            <Terminal className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span>postMessage JavaScript API</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* INTERACTIVE LIVE EMBED SANDBOX & GENERATOR */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-3xl bg-[#111318] border border-white/[0.08] p-6 sm:p-8 shadow-2xl space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <Code2 className="w-6 h-6 text-[#F5C518]" />
              <span>Interactive Player Generator</span>
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              Configure parameters below to preview the live player and copy your custom embed code.
            </p>
          </div>

          {/* Quick Media Type Switcher */}
          <div className="flex items-center p-1 rounded-2xl bg-[#0D0F14] border border-white/10 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setMediaType('movie');
                setTmdbId('550');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                mediaType === 'movie'
                  ? 'bg-[#F5C518] text-black shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Movie</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMediaType('tv');
                setTmdbId('1399');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                mediaType === 'tv'
                  ? 'bg-[#F5C518] text-black shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>TV Series</span>
            </button>
          </div>
        </div>

        {/* Configuration Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* TMDB ID Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-300 flex items-center justify-between">
              <span>TMDB ID or Slug:</span>
              <span className="text-[10px] text-neutral-500">e.g. 550, 1399</span>
            </label>
            <input
              type="text"
              value={tmdbId}
              onChange={(e) => setTmdbId(e.target.value)}
              className="w-full bg-[#0D0F14] text-white border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:border-[#F5C518]"
              placeholder="e.g. 550"
            />
            {/* Quick Samples */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-neutral-500">Quick:</span>
              {(mediaType === 'movie' ? SAMPLE_MOVIES : SAMPLE_SHOWS).map((s) => (
                <button
                  key={s.tmdbId}
                  type="button"
                  onClick={() => {
                    setTmdbId(String(s.tmdbId));
                    if ('season' in s && typeof (s as any).season === 'number') {
                      setSeason((s as any).season);
                      setEpisode((s as any).episode || 1);
                    }
                  }}
                  className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 text-neutral-300 transition-colors"
                >
                  {s.title}
                </button>
              ))}
            </div>
          </div>

          {/* Season & Episode (if TV) */}
          {mediaType === 'tv' && (
            <>
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-300">
                  Season Number:
                </label>
                <input
                  type="number"
                  min="1"
                  value={season}
                  onChange={(e) => setSeason(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full bg-[#0D0F14] text-white border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:border-[#F5C518]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-300">
                  Episode Number:
                </label>
                <input
                  type="number"
                  min="1"
                  value={episode}
                  onChange={(e) => setEpisode(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full bg-[#0D0F14] text-white border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:border-[#F5C518]"
                />
              </div>
            </>
          )}

          {/* Accent Color Picker */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-300 flex items-center justify-between">
              <span>Accent Theme Color:</span>
              <span className="font-mono text-[10px] text-neutral-400">{selectedColor}</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-10 h-10 rounded-xl bg-transparent border border-white/10 cursor-pointer"
              />
              <div className="flex items-center gap-1.5 flex-wrap flex-1">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setSelectedColor(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    className={`w-6 h-6 rounded-lg transition-transform ${
                      selectedColor.toLowerCase() === c.hex.toLowerCase()
                        ? 'scale-110 ring-2 ring-white'
                        : 'hover:scale-105 opacity-80 hover:opacity-100'
                    }`}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Feature Toggles Row */}
        <div className="p-4 rounded-2xl bg-[#0D0F14] border border-white/5 flex flex-wrap items-center gap-6 text-xs">
          <label className="flex items-center gap-2 cursor-pointer font-bold text-neutral-300 hover:text-white">
            <input
              type="checkbox"
              checked={autoplay}
              onChange={(e) => setAutoplay(e.target.checked)}
              className="w-4 h-4 rounded text-[#F5C518] focus:ring-0"
            />
            <span>Autoplay Video (`autoplay`)</span>
          </label>

          {mediaType === 'tv' && (
            <>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-neutral-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={nextEpisode}
                  onChange={(e) => setNextEpisode(e.target.checked)}
                  className="w-4 h-4 rounded text-[#F5C518] focus:ring-0"
                />
                <span>Next Episode Button (`nextEpisode`)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-neutral-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={episodeSelector}
                  onChange={(e) => setEpisodeSelector(e.target.checked)}
                  className="w-4 h-4 rounded text-[#F5C518] focus:ring-0"
                />
                <span>Episode Switcher (`episodeSelector`)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-neutral-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={autoplayNextEpisode}
                  onChange={(e) => setAutoplayNextEpisode(e.target.checked)}
                  className="w-4 h-4 rounded text-[#F5C518] focus:ring-0"
                />
                <span>Autoplay Next Episode (`autoplayNextEpisode`)</span>
              </label>
            </>
          )}

          <label className="flex items-center gap-2 cursor-pointer font-bold text-neutral-300 hover:text-white">
            <input
              type="checkbox"
              checked={overlay}
              onChange={(e) => setOverlay(e.target.checked)}
              className="w-4 h-4 rounded text-[#F5C518] focus:ring-0"
            />
            <span>Show Overlay (`overlay`)</span>
          </label>
        </div>

        {/* Live Preview Screen */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-neutral-400 flex items-center gap-2">
              <Play className="w-3.5 h-3.5 text-[#F5C518]" />
              <span>Live Embed Preview</span>
            </span>
            <a
              href={fullEmbedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-[#F5C518] hover:underline flex items-center gap-1"
            >
              <span>Open in New Tab</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl">
            <iframe
              src={embedPath}
              className="w-full h-full border-0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title="Live Embed Preview"
            />
          </div>
        </div>

        {/* Ready to Copy Code Snippets */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-neutral-400">
                Embed Code:
              </span>
              <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0D0F14] border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('html')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    activeCodeTab === 'html' ? 'bg-[#F5C518] text-black' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  HTML Iframe
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('responsive')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    activeCodeTab === 'responsive' ? 'bg-[#F5C518] text-black' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Responsive (16:9)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('react')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    activeCodeTab === 'react' ? 'bg-[#F5C518] text-black' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  React / Next.js
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('url')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    activeCodeTab === 'url' ? 'bg-[#F5C518] text-black' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Direct URL
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const code =
                  activeCodeTab === 'html'
                    ? htmlSnippet
                    : activeCodeTab === 'responsive'
                    ? responsiveHtmlSnippet
                    : activeCodeTab === 'react'
                    ? reactSnippet
                    : fullEmbedUrl;
                copyToClipboard(code, activeCodeTab);
              }}
              style={{ backgroundColor: selectedColor }}
              className="px-4 py-2 rounded-xl text-black font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-lg"
            >
              {copied === activeCodeTab ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-4 rounded-2xl bg-[#0D0F14] border border-white/10 text-xs font-mono text-neutral-300 overflow-x-auto whitespace-pre leading-relaxed">
            {activeCodeTab === 'html' && htmlSnippet}
            {activeCodeTab === 'responsive' && responsiveHtmlSnippet}
            {activeCodeTab === 'react' && reactSnippet}
            {activeCodeTab === 'url' && fullEmbedUrl}
          </pre>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* QUERY PARAMETERS REFERENCE TABLE */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-3xl bg-[#111318] border border-white/[0.08] p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center gap-2.5">
          <Sliders className="w-5 h-5 text-[#F5C518]" />
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Embed URL Parameters Reference
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-white/10 text-neutral-400 font-extrabold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-3">Parameter</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Default</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3">Example</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-neutral-300 font-medium">
              <tr>
                <td className="py-3 px-3 font-mono font-bold text-[#F5C518]">color</td>
                <td className="py-3 px-3 font-mono text-neutral-400">string</td>
                <td className="py-3 px-3 font-mono text-neutral-400">F5C518</td>
                <td className="py-3 px-3">
                  Hex color code for player scrubber, buttons and badges (without # or URL encoded).
                </td>
                <td className="py-3 px-3 font-mono text-neutral-400">color=14b8a6</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-mono font-bold text-[#F5C518]">autoplay</td>
                <td className="py-3 px-3 font-mono text-neutral-400">boolean</td>
                <td className="py-3 px-3 font-mono text-neutral-400">false</td>
                <td className="py-3 px-3">
                  Automatically start playback when loaded (muted if browser blocks unmuted sound).
                </td>
                <td className="py-3 px-3 font-mono text-neutral-400">autoplay=true</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-mono font-bold text-[#F5C518]">nextEpisode</td>
                <td className="py-3 px-3 font-mono text-neutral-400">boolean</td>
                <td className="py-3 px-3 font-mono text-neutral-400">true</td>
                <td className="py-3 px-3">
                  Show or hide next episode button in video player controls (TV series only).
                </td>
                <td className="py-3 px-3 font-mono text-neutral-400">nextEpisode=true</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-mono font-bold text-[#F5C518]">episodeSelector</td>
                <td className="py-3 px-3 font-mono text-neutral-400">boolean</td>
                <td className="py-3 px-3 font-mono text-neutral-400">true</td>
                <td className="py-3 px-3">
                  Show floating button allowing users to browse seasons &amp; episodes directly inside embed.
                </td>
                <td className="py-3 px-3 font-mono text-neutral-400">episodeSelector=true</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-mono font-bold text-[#F5C518]">autoplayNextEpisode</td>
                <td className="py-3 px-3 font-mono text-neutral-400">boolean</td>
                <td className="py-3 px-3 font-mono text-neutral-400">true</td>
                <td className="py-3 px-3">
                  Automatically switch to the next episode with a 5-second countdown on video completion.
                </td>
                <td className="py-3 px-3 font-mono text-neutral-400">autoplayNextEpisode=true</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-mono font-bold text-[#F5C518]">overlay</td>
                <td className="py-3 px-3 font-mono text-neutral-400">boolean</td>
                <td className="py-3 px-3 font-mono text-neutral-400">false</td>
                <td className="py-3 px-3">
                  Display title and stream quality badge overlay in the top header.
                </td>
                <td className="py-3 px-3 font-mono text-neutral-400">overlay=false</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-mono font-bold text-[#F5C518]">server</td>
                <td className="py-3 px-3 font-mono text-neutral-400">string</td>
                <td className="py-3 px-3 font-mono text-neutral-400">auto</td>
                <td className="py-3 px-3">
                  Pre-select a specific streaming mirror provider.
                </td>
                <td className="py-3 px-3 font-mono text-neutral-400">server=server-rive</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* postMessage JAVASCRIPT INTEGRATION SDK */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-3xl bg-[#111318] border border-white/[0.08] p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-5 h-5 text-[#F5C518]" />
          <h2 className="text-xl sm:text-2xl font-black text-white">
            postMessage JavaScript API
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
          Communicate with the embedded iframe directly from your parent website. Listen to playback
          events (for watch history, analytics, or UI sync) and send commands to control playback.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Listening to Events */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              1. Listen to Events from Embed:
            </h4>
            <pre className="p-4 rounded-2xl bg-[#0D0F14] border border-white/10 text-xs font-mono text-neutral-300 overflow-x-auto whitespace-pre leading-relaxed">
{`window.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.source !== 'tmovie-embed') return;

  switch (data.type) {
    case 'TM_EMBED_READY':
      console.log('Player loaded:', data.title);
      break;
    case 'TM_EMBED_PLAY':
      console.log('Video started playing');
      break;
    case 'TM_EMBED_PAUSE':
      console.log('Video paused');
      break;
    case 'TM_EMBED_TIMEUPDATE':
      console.log('Progress:', data.percent.toFixed(1) + '%');
      break;
    case 'TM_EMBED_ENDED':
      console.log('Video ended');
      break;
    case 'TM_EMBED_EPISODE_CHANGE':
      console.log('Switched to S' + data.season + 'E' + data.episode);
      break;
  }
});`}
            </pre>
          </div>

          {/* Sending Commands */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              2. Send Control Commands to Embed:
            </h4>
            <pre className="p-4 rounded-2xl bg-[#0D0F14] border border-white/10 text-xs font-mono text-neutral-300 overflow-x-auto whitespace-pre leading-relaxed">
{`const iframe = document.querySelector('iframe');

// Switch to Next Episode
iframe.contentWindow.postMessage(
  { command: 'nextEpisode' },
  '*'
);

// Switch to Previous Episode
iframe.contentWindow.postMessage(
  { command: 'prevEpisode' },
  '*'
);

// Jump to Specific Season & Episode
iframe.contentWindow.postMessage(
  { command: 'setSeason', season: 2, episode: 4 },
  '*'
);`}
            </pre>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* REST API ENDPOINTS */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-3xl bg-[#111318] border border-white/[0.08] p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center gap-2.5">
          <Layers className="w-5 h-5 text-[#F5C518]" />
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Direct Streaming JSON API
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
          If you prefer to build your own custom video player, you can query our high-speed JSON resolver endpoints directly.
        </p>

        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#0D0F14] border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                GET
              </span>
              <span className="font-mono text-white">/api/stream/resolve</span>
            </div>
            <p className="text-xs text-neutral-400">
              Returns direct playable HLS master m3u8 streams, multi-language subtitles, and audio tracks.
            </p>
            <p className="font-mono text-[11px] text-[#F5C518]">
              {origin}/api/stream/resolve?id=550&amp;type=movie
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#0D0F14] border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                GET
              </span>
              <span className="font-mono text-white">/api/vyla/subtitles</span>
            </div>
            <p className="text-xs text-neutral-400">
              Returns comprehensive WebVTT multi-language subtitles with full language names.
            </p>
            <p className="font-mono text-[11px] text-[#F5C518]">
              {origin}/api/vyla/subtitles?id=1399&amp;type=tv&amp;season=1&amp;episode=1
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
