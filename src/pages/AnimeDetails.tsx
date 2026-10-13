import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Play,
  Bookmark,
  Star,
  Film,
  X,
  Clock,
  Calendar,
  Globe,
  Award,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Share2,
  Flame,
  Check,
  Copy,
  AlertCircle,
  Eye,
  Flag,
  ExternalLink,
  Tv,
  Layers,
  Sparkles,
  Users,
  TvMinimal,
} from 'lucide-react';
import {
  anilistService,
  cleanDescription,
  parseAnimeSlug,
  generateAnimeSlug,
} from '../services/anilist';
import { AnimeMedia, StreamResult, StreamingProvider } from '../types';
import { SEO } from '../components/SEO';
import { AnimeCard } from '../components/AnimeCard';
import { ReportModal } from '../components/ReportModal';
import { Player } from '../components/Player';
import { ServerSelector } from '../components/ServerSelector';
import { STREAMING_SERVERS, getBestWorkingServer, setPreferredServerId } from '../services/streaming';
import { useWatchlist } from '../hooks/useWatchlist';
import { slugifyCountry } from '../utils/countryHelper';
import { slugify } from '../utils/slugify';
import { tmdbService } from '../services/tmdb';

export function AnimeDetails() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [anime, setAnime] = useState<AnimeMedia | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [activeEpisode, setActiveEpisode] = useState(1);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [realViews, setRealViews] = useState<number>(284);

  // Direct Player State (Replaces embed iframe with native player)
  const [resolvedMedia, setResolvedMedia] = useState<{ id: number; type: 'movie' | 'tv'; slug: string } | null>(null);
  const [streamResult, setStreamResult] = useState<StreamResult | null>(null);
  const [currentServer, setCurrentServer] = useState<StreamingProvider>(STREAMING_SERVERS[0]);
  const [failedServerIds, setFailedServerIds] = useState<string[]>([]);
  const [streamLoading, setStreamLoading] = useState(false);

  const { watchlist, toggleWatchlist } = useWatchlist();
  const castScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top on slug change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    let mounted = true;
    if (!slug) return;

    setLoading(true);
    const { id } = parseAnimeSlug(slug);

    if (id) {
      anilistService.getAnimeById(id).then((res) => {
        if (!mounted) return;
        setAnime(res);
        setLoading(false);

        // Record real view count (+1 on each open)
        tmdbService.recordView('anime', id).then((v) => {
          if (mounted && v) setRealViews(v);
        });

        // Resolve matching TMDB item for pure native player playback
        const searchTitle = res.title.english || res.title.romaji;
        if (searchTitle) {
          fetch(`/api/tmdb/search/multi?query=${encodeURIComponent(searchTitle)}`)
            .then((r) => r.json())
            .then((searchData) => {
              if (!mounted) return;
              const results = searchData?.results || [];
              const isAnimMovie = res.format === 'MOVIE';
              // Find matching entry
              const match = results.find((item: any) =>
                isAnimMovie ? item.type === 'movie' : item.type === 'tv'
              ) || results[0];

              if (match) {
                setResolvedMedia({
                  id: match.tmdbId || match.id,
                  type: isAnimMovie ? 'movie' : 'tv',
                  slug: match.slug || `${match.id}-${slugify(searchTitle)}`,
                });
              }
            })
            .catch(() => {});
        }
      });
    } else {
      setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [slug]);

  // Load stream with our native HLS engine whenever player is opened or episode changes
  useEffect(() => {
    let mounted = true;
    if (!showPlayer || !anime) return;

    setStreamLoading(true);
    const tmdbTargetId = resolvedMedia?.id || anime.id;
    const mediaType = (resolvedMedia?.type || (anime.format === 'MOVIE' ? 'movie' : 'tv')) as 'movie' | 'tv';

    getBestWorkingServer({
      tmdbId: tmdbTargetId,
      type: mediaType,
      season: 1,
      episode: activeEpisode,
    })
      .then((working) => {
        if (!mounted) return;
        if (working) {
          setCurrentServer(working.provider);
          setStreamResult(working.stream);
        }
        setStreamLoading(false);
      })
      .catch(() => {
        if (mounted) setStreamLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [showPlayer, anime, resolvedMedia, activeEpisode]);

  const handleSelectServer = async (server: StreamingProvider) => {
    if (!anime) return;
    setCurrentServer(server);
    setPreferredServerId(server.id);
    const tmdbTargetId = resolvedMedia?.id || anime.id;
    const mediaType = (resolvedMedia?.type || (anime.format === 'MOVIE' ? 'movie' : 'tv')) as 'movie' | 'tv';

    try {
      const stream = await server.getStream({
        tmdbId: tmdbTargetId,
        type: mediaType,
        season: 1,
        episode: activeEpisode,
      });
      setStreamResult(stream);
    } catch {
      setFailedServerIds((prev) => [...prev, server.id]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-[#E50914] border-t-transparent rounded-full animate-spin shadow-lg shadow-red-900/30" />
        <p className="text-xs font-bold text-neutral-400 tracking-wider animate-pulse">
          Loading anime details...
        </p>
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="text-center py-24 space-y-4 max-w-md mx-auto">
        <h2 className="text-2xl font-black text-white">Anime Not Found</h2>
        <p className="text-xs text-neutral-400">
          The requested anime could not be found or retrieved.
        </p>
        <Link
          to="/anime"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#B81D24] text-white font-extrabold text-xs transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Return to Anime Catalog</span>
        </Link>
      </div>
    );
  }

  const title = anime.title.english || anime.title.romaji || 'Anime Title';
  const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : '8.6';
  const isMovie = anime.format === 'MOVIE';
  const totalEpisodes = isMovie ? 1 : anime.episodes || 12;
  const isSaved = watchlist.some((w) => w.tmdbId === anime.id && w.type === (isMovie ? 'movie' : 'tv'));

  const coverUrl =
    anime.coverImage?.extraLarge ||
    anime.coverImage?.large ||
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500';

  const backdropUrl = anime.bannerImage || coverUrl;

  const studioName = anime.studios?.nodes?.[0]?.name || 'Toei Animation';
  const studioSlug = slugify(studioName);

  const countryName = 'Japan';
  const countrySlug = slugifyCountry(countryName);

  const handleToggleWatchlist = () => {
    toggleWatchlist({
      id: `anime:${anime.id}`,
      tmdbId: anime.id,
      type: isMovie ? 'movie' : 'tv',
      slug: generateAnimeSlug(anime.id, title),
      title,
      posterPath: anime.coverImage?.large || null,
      backdropPath: anime.bannerImage || null,
      voteAverage: anime.averageScore ? anime.averageScore / 10 : 8.5,
      releaseDate: anime.seasonYear ? `${anime.seasonYear}-01-01` : '2024-01-01',
      genres: anime.genres.map((g, i) => ({ id: i + 1, name: g, slug: slugify(g) })),
      overview: cleanDescription(anime.description) || '',
      voteCount: anime.popularity || 1000,
    });
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  const scrollCast = (direction: 'left' | 'right') => {
    if (castScrollRef.current) {
      const scrollAmount = direction === 'left' ? -350 : 350;
      castScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-12 pb-16">
      <SEO
        title={`${title} (${isMovie ? 'Movie' : 'Series'}) - Watch Anime Online | Tstream`}
        description={
          cleanDescription(anime.description).slice(0, 160) ||
          `Stream ${title} on Tstream with English and Romaji subtitles, full episodes and cast details.`
        }
        ogImage={backdropUrl}
      />

      {/* ------------------------------------------------------------- */}
      {/* 1. TOP BREADCRUMB                                             */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400">
        <Link to="/" className="hover:text-white transition-colors">Home</Link>
        <span>/</span>
        <Link to="/anime" className="hover:text-white transition-colors">Anime</Link>
        <span>/</span>
        <span className="text-neutral-500">{isMovie ? 'Anime Movie' : 'Anime Series'}</span>
        <span>/</span>
        <span className="text-[#E50914] truncate max-w-xs">{title}</span>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. STREAMING PLAYER (Native HLS Player with Multi-CDN Servers) */}
      {/* ------------------------------------------------------------- */}
      {showPlayer && (
        <div className="space-y-4 rounded-3xl overflow-hidden bg-black/90 p-4 border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-sm font-black text-white">
                Now Playing: {title} {!isMovie && `- Episode ${activeEpisode}`}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowPlayer(false)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="Close Player"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {streamLoading && !streamResult ? (
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-[#E50914] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-neutral-400 animate-pulse">
                Connecting to high-speed stream server...
              </p>
            </div>
          ) : streamResult ? (
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
              <Player
                streamResult={streamResult}
                title={title}
                episodeName={!isMovie ? `Episode ${activeEpisode}` : undefined}
                tmdbId={resolvedMedia?.id || anime.id}
                type={isMovie ? 'movie' : 'tv'}
                slug={generateAnimeSlug(anime.id, title)}
                posterPath={anime.coverImage?.large || null}
                backdropPath={backdropUrl}
                seasonNumber={1}
                episodeNumber={activeEpisode}
                totalEpisodesInSeason={totalEpisodes}
                onPrevEpisode={
                  !isMovie && activeEpisode > 1
                    ? () => setActiveEpisode((prev) => Math.max(1, prev - 1))
                    : undefined
                }
                onNextEpisode={
                  !isMovie && activeEpisode < totalEpisodes
                    ? () => setActiveEpisode((prev) => Math.min(totalEpisodes, prev + 1))
                    : undefined
                }
                onReportIssue={() => setReportModalOpen(true)}
                onShare={handleShare}
                servers={STREAMING_SERVERS}
                currentServerId={currentServer.id}
                onSelectServer={handleSelectServer}
                failedServerIds={failedServerIds}
              />
            </div>
          ) : (
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10 flex flex-col items-center justify-center gap-3 p-6 text-center">
              <p className="text-sm font-bold text-white">Stream is initializing</p>
              <button
                type="button"
                onClick={() => handleSelectServer(currentServer)}
                className="px-4 py-2 rounded-xl bg-[#E50914] text-white text-xs font-bold"
              >
                Retry Stream
              </button>
            </div>
          )}

          {/* Native Source Selector */}
          <ServerSelector
            currentServerId={currentServer.id}
            onSelectServer={handleSelectServer}
            failedServerIds={failedServerIds}
          />
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. HERO SECTION (100% Matching MovieDetails & TVDetails)      */}
      {/* ------------------------------------------------------------- */}
      <div className="relative rounded-3xl overflow-hidden bg-[#16171E] border border-white/10 shadow-2xl">
        {/* Full Cinematic Backdrop */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src={backdropUrl}
            alt={title}
            className="w-full h-full object-cover object-center filter blur-xs scale-105 opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#16171E] via-[#16171E]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#16171E] via-[#16171E]/90 to-transparent" />
        </div>

        <div className="relative z-10 p-6 sm:p-10 lg:p-12 flex flex-col md:flex-row gap-8 lg:gap-10 items-start">
          {/* Poster Column */}
          <div className="w-48 sm:w-60 md:w-64 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden bg-[#0A0B0E] border-2 border-white/10 shadow-2xl shadow-black relative group mx-auto md:mx-0">
            <img
              src={coverUrl}
              alt={title}
              className="w-full h-full object-cover"
            />

            {/* Poster IMDb/AniList badge */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-black/85 backdrop-blur-md border border-white/15 text-xs font-bold text-white shadow-lg">
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-[#E50914] text-white">
                AniList
              </span>
              <span className="font-extrabold text-neutral-100">{score}</span>
            </div>

            {/* Floating Quick Play Overlay on Poster */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={() => {
                  setShowPlayer(true);
                  window.scrollTo({ top: 80, behavior: 'smooth' });
                }}
                className="w-14 h-14 rounded-full bg-[#E50914] text-white flex items-center justify-center shadow-xl shadow-red-900/40 hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                title="Play Now"
              >
                <Play className="w-6 h-6 fill-white ml-0.5" />
              </button>
            </div>
          </div>

          {/* Details Column */}
          <div className="flex-1 space-y-5">
            {/* Top Metric Row: Rating, Year, Views */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-white font-bold">
                <Star className="w-3.5 h-3.5 fill-[#F5C518] text-[#F5C518]" />
                <span className="text-amber-400 font-black text-sm">{score}</span>
                <span className="text-neutral-400">/ 10</span>
              </div>

              {/* Real Views Count Pill (Real +1 on each view) */}
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold"
                title="Real persistent view count (+1 on each open)"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>{realViews.toLocaleString()} views</span>
              </div>

              {anime.seasonYear && (
                <span className="px-2.5 py-1 rounded-lg bg-[#111318] border border-white/10 text-neutral-300 font-bold">
                  {anime.seasonYear}
                </span>
              )}

              <span className="px-2.5 py-1 rounded-lg bg-[#111318] border border-white/10 text-neutral-300 font-bold">
                {isMovie ? `${anime.duration || 105} min` : `${totalEpisodes} Episodes`}
              </span>

              {/* Clickable Country Pill */}
              <Link
                to={`/country/${countrySlug}`}
                className="px-2.5 py-1 rounded-lg bg-[#111318] hover:bg-[#1C202A] border border-white/10 hover:border-white/30 text-neutral-300 hover:text-white font-semibold transition-colors cursor-pointer"
                title={`Browse anime from ${countryName}`}
              >
                🇯🇵 {countryName}
              </Link>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md">
                {title}
              </h1>
              {anime.title.romaji && anime.title.english && anime.title.romaji !== anime.title.english && (
                <p className="text-sm sm:text-base text-[#E50914] font-semibold italic mt-1">
                  {anime.title.romaji}
                </p>
              )}
            </div>

            {/* Genre Chips */}
            <div className="flex flex-wrap items-center gap-2">
              {anime.genres.map((g) => (
                <Link
                  key={g}
                  to={`/genre/${slugify(g)}`}
                  className="px-3 py-1 rounded-full bg-[#281318] hover:bg-[#E50914] border border-red-500/40 hover:border-[#E50914] text-red-300 hover:text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
                >
                  {g}
                </Link>
              ))}
            </div>

            {/* Action Buttons: Watch Now, Trailer, Watchlist, Share, Report */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPlayer(true);
                  window.scrollTo({ top: 80, behavior: 'smooth' });
                }}
                className="px-7 py-3 rounded-xl bg-[#E50914] hover:bg-[#B81D24] text-white font-black text-xs sm:text-sm tracking-wide shadow-xl shadow-red-900/40 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{isMovie ? 'WATCH MOVIE' : 'WATCH SERIES'}</span>
              </button>

              {anime.trailer?.id && anime.trailer.site === 'youtube' && (
                <button
                  type="button"
                  onClick={() => setShowTrailer(true)}
                  className="px-5 py-3 rounded-xl bg-black/60 hover:bg-black/80 border border-white/20 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Film className="w-4 h-4 text-neutral-300" />
                  <span>Watch Trailer</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleToggleWatchlist}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSaved
                    ? 'bg-[#E50914] border-[#E50914] text-white shadow-md shadow-red-900/40'
                    : 'bg-black/60 border-white/15 text-neutral-300 hover:text-white hover:bg-white/10'
                }`}
                title={isSaved ? 'In Watchlist' : 'Add to Watchlist'}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-white' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="p-3 rounded-xl bg-black/60 hover:bg-white/10 border border-white/15 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                title="Share Link"
              >
                {shareCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => setReportModalOpen(true)}
                className="p-3 rounded-xl bg-black/60 hover:bg-white/10 border border-white/15 text-neutral-300 hover:text-red-400 transition-colors cursor-pointer"
                title="Report Issue"
              >
                <Flag className="w-4 h-4" />
              </button>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* 4. COMPREHENSIVE METADATA GRID                                */}
            {/* ------------------------------------------------------------- */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-[#0E0F14] border border-white/5 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">TYPE</span>
                <span className="font-semibold text-white mt-0.5 block">{isMovie ? 'Anime Movie' : 'Anime Series'}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">COUNTRY</span>
                <Link
                  to={`/country/${countrySlug}`}
                  className="font-semibold text-white hover:text-[#E50914] mt-0.5 block truncate hover:underline"
                  title={`Browse all titles filmed in ${countryName}`}
                >
                  {countryName}
                </Link>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">RELEASE</span>
                <span className="font-semibold text-white mt-0.5 block">
                  {anime.seasonYear ? `${anime.season ? anime.season + ' ' : ''}${anime.seasonYear}` : '2024'}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">STATUS</span>
                <span className="font-semibold text-white mt-0.5 block">{anime.status || 'Finished Airing'}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">STUDIO</span>
                <Link
                  to={`/studio/${studioSlug}`}
                  className="font-semibold text-white hover:text-[#E50914] mt-0.5 block truncate hover:underline"
                  title={`Browse anime produced by ${studioName}`}
                >
                  {studioName}
                </Link>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">LANGUAGE</span>
                <span className="font-semibold text-white mt-0.5 block">JA / Japanese</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">PRODUCTION</span>
                <Link
                  to={`/studio/${studioSlug}`}
                  className="font-semibold text-white hover:text-[#E50914] mt-0.5 block truncate hover:underline"
                  title={`Browse anime produced by ${studioName}`}
                >
                  {studioName}
                </Link>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">REAL VIEWS</span>
                <span className="font-semibold text-emerald-400 mt-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {realViews.toLocaleString()} views
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. EPISODES SECTION (For Anime Series - 100% Matching TVDetails) */}
      {/* ------------------------------------------------------------- */}
      {!isMovie && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Tv className="w-5 h-5 text-[#E50914]" />
              <span>Episodes ({totalEpisodes})</span>
            </h2>
            <span className="text-xs text-neutral-400 font-medium">
              Japanese Audio with English Subtitles
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: totalEpisodes }, (_, i) => i + 1).map((epNum) => {
              const isActive = activeEpisode === epNum;
              return (
                <div
                  key={epNum}
                  onClick={() => {
                    setActiveEpisode(epNum);
                    setShowPlayer(true);
                    window.scrollTo({ top: 80, behavior: 'smooth' });
                  }}
                  className={`group relative rounded-2xl overflow-hidden p-3.5 border transition-all cursor-pointer flex flex-col justify-between min-h-[110px] ${
                    isActive
                      ? 'bg-[#1C1F2B] border-[#E50914] shadow-lg shadow-red-900/30 scale-102'
                      : 'bg-[#13151D] hover:bg-[#1A1D27] border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black ${isActive ? 'text-[#E50914]' : 'text-neutral-300'}`}>
                      EPISODE {epNum}
                    </span>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                      isActive ? 'bg-[#E50914]' : 'bg-black/60 group-hover:bg-[#E50914]'
                    }`}>
                      <Play className="w-3.5 h-3.5 fill-white text-transparent ml-0.5 transition-colors" />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-[#E50914] transition-colors">
                      Episode {epNum}
                    </h4>
                    <span className="text-[10px] text-neutral-400">24 min • HD</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. STORYLINE & SYNOPSIS                                       */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-3 p-6 rounded-3xl bg-[#14161E] border border-white/5 shadow-md">
        <h3 className="text-base font-extrabold text-white flex items-center gap-2">
          <Film className="w-4 h-4 text-[#E50914]" />
          <span>Storyline &amp; Synopsis</span>
        </h3>
        <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-4xl whitespace-pre-line">
          {cleanDescription(anime.description) ||
            'Experience this compelling anime narrative featuring rich character dynamics, extraordinary world-building, and stellar production craft.'}
        </p>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 7. CHARACTERS & VOICE CAST CAROUSEL                           */}
      {/* ------------------------------------------------------------- */}
      {anime.characters?.edges && anime.characters.edges.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-[#E50914]" />
              <span>Characters &amp; Voice Cast</span>
            </h2>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollCast('left')}
                className="w-8 h-8 rounded-full bg-[#181B24] hover:bg-white/10 text-white flex items-center justify-center border border-white/10 transition-colors cursor-pointer"
                aria-label="Previous Cast"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollCast('right')}
                className="w-8 h-8 rounded-full bg-[#181B24] hover:bg-white/10 text-white flex items-center justify-center border border-white/10 transition-colors cursor-pointer"
                aria-label="Next Cast"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            ref={castScrollRef}
            className="flex items-start gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2"
          >
            {anime.characters.edges.map((edge) => {
              const char = edge.node;
              return (
                <div
                  key={char.id}
                  className="flex-shrink-0 w-32 p-3 rounded-2xl bg-[#14161E] border border-white/5 flex flex-col items-center text-center space-y-2 group hover:border-[#E50914]/40 transition-all"
                >
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-black/40 border border-white/10 group-hover:scale-105 transition-transform">
                    <img
                      src={
                        char.image?.large ||
                        char.image?.medium ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'
                      }
                      alt={char.name.full}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="w-full">
                    <h4 className="text-xs font-bold text-white truncate" title={char.name.full}>
                      {char.name.full}
                    </h4>
                    <span className="text-[10px] text-[#E50914] uppercase font-bold tracking-wider block truncate">
                      {edge.role || 'Character'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 8. RECOMMENDED ANIME                                          */}
      {/* ------------------------------------------------------------- */}
      {anime.recommendations?.nodes && anime.recommendations.nodes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#E50914]" />
              <span>You May Also Like</span>
            </h2>
            <Link to="/anime" className="text-xs font-bold text-[#E50914] hover:underline">
              View All
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
            {anime.recommendations.nodes
              .filter((n) => n.mediaRecommendation)
              .slice(0, 6)
              .map((n) => {
                const rec = n.mediaRecommendation as unknown as AnimeMedia;
                return <AnimeCard key={rec.id} anime={rec} />;
              })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 9. TRAILER MODAL                                              */}
      {/* ------------------------------------------------------------- */}
      {showTrailer && anime.trailer?.id && anime.trailer.site === 'youtube' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-4xl rounded-3xl overflow-hidden bg-[#16171E] border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Film className="w-4 h-4 text-[#E50914]" />
                <span>{title} — Official Trailer</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowTrailer(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${anime.trailer.id}?autoplay=1`}
                title={`${title} Trailer`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title={title}
        serverId={selectedServer}
      />
    </div>
  );
}
