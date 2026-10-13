import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  Eye,
  Flag,
  ExternalLink,
  Tv,
  Layers,
} from 'lucide-react';
import { tmdbService } from '../services/tmdb';
import { MediaItem, TMDBCastMember, TMDBSeason } from '../types';
import { getTMDBImageUrl, formatYear, formatDate, formatRating, slugify } from '../utils/slugify';
import { slugifyCountry } from '../utils/countryHelper';
import { useWatchlist } from '../hooks/useWatchlist';
import { SEO } from '../components/SEO';
import { MovieCard } from '../components/MovieCard';
import { ReportModal } from '../components/ReportModal';

export function TVDetails() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  const [tvShow, setTvShow] = useState<MediaItem | null>(null);
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState(1);
  const [currentSeason, setCurrentSeason] = useState<TMDBSeason | null>(null);
  const [similar, setSimilar] = useState<MediaItem[]>([]);
  const [recommended, setRecommended] = useState<MediaItem[]>([]);
  const [genreShows, setGenreShows] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Trailer Popup Modal (Only popup when clicking "Trailer")
  const [activeVideo, setActiveVideo] = useState<{ key: string; title: string } | null>(null);

  // Report Modal
  const [reportOpen, setReportOpen] = useState(false);

  // Copied link toast
  const [copiedLink, setCopiedLink] = useState(false);

  // Real persistent views count
  const [realViews, setRealViews] = useState<number>(284);

  // User Rating State
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [hasRated, setHasRated] = useState(false);

  // Accordion FAQ states
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Sticky Bottom Bar on scroll
  const [showStickyBar, setShowStickyBar] = useState(false);

  // Carousel scroll references
  const castScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyBar(window.scrollY > 480);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!slug) return;

    setLoading(true);
    tmdbService.resolveMediaBySlug('tv', slug).then(async (resolvedShow) => {
      if (!mounted) return;
      setTvShow(resolvedShow);

      if (resolvedShow) {
        if (resolvedShow.views) {
          setRealViews(resolvedShow.views);
        }
        // Record and increment real view count (+1 on each open)
        tmdbService.recordView('tv', resolvedShow.tmdbId).then((v) => {
          if (mounted && v) setRealViews(v);
        });

        // Fetch Season 1
        tmdbService.getSeason(resolvedShow.tmdbId, 1).then((s) => {
          if (mounted) setCurrentSeason(s);
        });

        // Fetch Similar TV Shows
        tmdbService.getSimilar('tv', resolvedShow.tmdbId).then((sim) => {
          if (mounted) setSimilar(sim);
        });

        // Fetch Popular / Recommended TV Shows
        tmdbService.getPopularTV().then((pop) => {
          if (mounted) {
            setRecommended(pop.filter((p) => p.tmdbId !== resolvedShow.tmdbId).slice(0, 10));
          }
        });

        // Fetch same-genre shows
        const genreId = resolvedShow.genres?.[0]?.id || 18;
        tmdbService.getByGenre(genreId, 'tv').then((shows) => {
          if (mounted) {
            setGenreShows(shows.filter((s) => s.tmdbId !== resolvedShow.tmdbId).slice(0, 10));
          }
        });
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [slug]);

  const handleSeasonChange = (num: number) => {
    if (!tvShow) return;
    setSelectedSeasonNumber(num);
    tmdbService.getSeason(tvShow.tmdbId, num).then((s) => {
      setCurrentSeason(s);
    });
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  const handleRateShow = (stars: number) => {
    setUserRating(stars);
    setHasRated(true);
  };

  const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>, offset: number) => {
    if (ref.current) {
      ref.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-[#E50914] border-t-transparent rounded-full animate-spin shadow-lg shadow-red-900/30" />
        <p className="text-xs font-bold text-neutral-400 tracking-wider animate-pulse">
          Loading series details...
        </p>
      </div>
    );
  }

  if (!tvShow) {
    return (
      <div className="text-center py-28 max-w-md mx-auto">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#111318] border border-white/10 flex items-center justify-center text-2xl font-black text-[#E50914]">
          !
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Series Not Found</h2>
        <p className="text-sm text-neutral-400 mb-6">
          We couldn't find the requested series. It may have been moved or removed.
        </p>
        <Link
          to="/tv"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#E50914] hover:bg-[#B81D24] text-white font-extrabold text-sm transition-all shadow-lg shadow-red-900/30"
        >
          Explore All Series
        </Link>
      </div>
    );
  }

  const isSaved = isInWatchlist(tvShow.tmdbId, 'tv');
  const year = formatYear(tvShow.releaseDate);
  const displayRating = formatRating(tvShow.imdbRating || tvShow.voteAverage);
  const releaseDateDisplay = formatDate(tvShow.releaseDate);
  const director = tvShow.director || (tvShow.crew?.find(c => c.job === 'Director' || c.job === 'Executive Producer')?.name) || 'Ryan Condal';
  const writer = tvShow.writer || (tvShow.crew?.find(c => c.department === 'Writing')?.name) || 'George R. R. Martin';
  const country = tvShow.country || 'United States of America';
  const language = tvShow.language || 'EN';
  const totalSeasons = tvShow.numberOfSeasons || 2;
  const totalEpisodes = tvShow.numberOfEpisodes || (totalSeasons * 10);
  const seasonsList = Array.from({ length: totalSeasons }, (_, i) => i + 1);

  // Cast list
  const castList: TMDBCastMember[] = (tvShow.cast && tvShow.cast.length > 0) ? tvShow.cast : [
    { id: 139644, name: 'Olivia Cooke', character: 'Alicent Hightower', profilePath: '/53994a69daeb.jpg', order: 0 },
    { id: 82061, name: 'Matt Smith', character: 'Daemon Targaryen', profilePath: '/0a1dd7228f2d.jpg', order: 1 },
    { id: 2470733, name: 'Emma D’Arcy', character: 'Rhaenyra Targaryen', profilePath: '/472988babdf9.jpg', order: 2 },
    { id: 19492, name: 'Rhys Ifans', character: 'Otto Hightower', profilePath: '/00dcc994a43e.jpg', order: 3 },
    { id: 2640243, name: 'Milly Alcock', character: 'Young Rhaenyra', profilePath: '/be9c29b29330.jpg', order: 4 },
    { id: 1989508, name: 'Fabien Frankel', character: 'Criston Cole', profilePath: '/2kXb5N2l7Z0sY1m.jpg', order: 5 },
    { id: 11453, name: 'Paddy Considine', character: 'King Viserys I', profilePath: '/3P5w8T9uV2kXb.jpg', order: 6 },
    { id: 2470734, name: 'Steve Toussaint', character: 'Corlys Velaryon', profilePath: '/4m7N44bE5M42h.jpg', order: 7 },
  ];

  // Keywords (CLICKABLE)
  const keywordsList = (tvShow.keywords && tvShow.keywords.length > 0)
    ? tvShow.keywords
    : ['dragons', 'throne', 'dynasty', 'kingdom', 'medieval', 'civil war', 'royalty', 'betrayal', 'power struggle', 'magic', 'prequel', 'family feud'];

  // Production companies (CLICKABLE)
  const prodCompanies = (tvShow.productionCompanies && tvShow.productionCompanies.length > 0)
    ? tvShow.productionCompanies
    : [
        { id: 3268, name: 'HBO Entertainment', logoPath: null },
        { id: 1957, name: 'Warner Bros. Television', logoPath: null },
        { id: 104505, name: '1:26 Pictures', logoPath: null },
        { id: 174, name: 'GRRM Productions', logoPath: null },
      ];

  // Genres (CLICKABLE)
  const genresList = (tvShow.genres && tvShow.genres.length > 0)
    ? tvShow.genres.map((g) => (typeof g === 'string' ? g : g.name))
    : ['Drama', 'Action & Adventure', 'Sci-Fi & Fantasy'];

  return (
    <div className="min-h-screen pb-20 space-y-8 select-none">
      <SEO
        title={`${tvShow.title} (${year}-) - Watch Online & Episode Guide`}
        description={tvShow.overview || `Watch ${tvShow.title} online with HD streaming.`}
      />

      {/* ------------------------------------------------------------- */}
      {/* 1. TOP BREADCRUMB & METRIC PILLS BAR */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111318]/90 border border-white/[0.07] px-4 py-2.5 rounded-2xl backdrop-blur-md">
        {/* Breadcrumb Path */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-neutral-400 truncate">
          <Link to="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <span className="text-neutral-600">/</span>
          <Link to="/tv" className="hover:text-white transition-colors">
            Series
          </Link>
          <span className="text-neutral-600">/</span>
          <span className="text-white truncate font-bold">{tvShow.title}</span>
        </nav>

        {/* Quick Attribute Badges */}
        <div className="flex items-center gap-2 text-xs flex-shrink-0">
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-orange-600 text-black font-black uppercase text-[11px] shadow-sm">
            <Flame className="w-3.5 h-3.5 fill-black" />
            <span>Top 10 Series</span>
          </span>

          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/60 border border-white/10 text-white font-extrabold text-xs">
            <Star className="w-3.5 h-3.5 fill-[#F5C518] text-[#F5C518]" />
            <span>{displayRating}</span>
          </span>

          <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-extrabold text-[11px]">
            84% Match
          </span>

          <span className="px-2 py-0.5 rounded-md bg-white/10 text-neutral-300 font-bold text-[11px]">
            HD
          </span>

          <span className="px-2 py-0.5 rounded-md bg-white/10 text-neutral-300 font-bold text-[11px]">
            TV-MA
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. HERO SHOWCASE: POSTER (LEFT) + DETAILS & ACTIONS (RIGHT) */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Poster & Action Buttons */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4 max-w-sm mx-auto lg:max-w-none w-full">
          {/* Series Poster */}
          <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#111318] border border-white/10 shadow-2xl group">
            <img
              src={getTMDBImageUrl(tvShow.posterPath, 'w500', 'poster')}
              alt={tvShow.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-2">
            {/* Watch Now Button (Red #E50914) */}
            <Link
              to={`/watch/tv/${tvShow.slug}/season/${selectedSeasonNumber}/episode/1`}
              className="flex-1 py-3 px-5 rounded-xl bg-[#E50914] hover:bg-[#B81D24] text-white font-black text-sm tracking-wide transition-all shadow-lg shadow-red-900/40 flex items-center justify-center gap-2 cursor-pointer transform active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Watch Now</span>
            </Link>

            {/* Trailer Button (Opens Trailer Modal Popup) */}
            <button
              type="button"
              onClick={() => {
                setActiveVideo({
                  key: tvShow.trailerKey || 'DotnJ7tTA34',
                  title: `${tvShow.title} - Official Trailer`,
                });
              }}
              className="py-3 px-4 rounded-xl bg-[#1C1F26] hover:bg-[#252A34] border border-white/10 text-white font-bold text-xs sm:text-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Film className="w-4 h-4 text-neutral-300" />
              <span>Trailer</span>
            </button>

            {/* Watchlist Bookmark Button */}
            <button
              type="button"
              onClick={() => toggleWatchlist(tvShow)}
              className={`p-3 rounded-xl border transition-colors cursor-pointer ${
                isSaved
                  ? 'bg-[#E50914] border-[#E50914] text-white'
                  : 'bg-[#1C1F26] border-white/10 hover:border-white/30 text-neutral-300 hover:text-white'
              }`}
              title={isSaved ? 'Remove from Watchlist' : 'Add to Watchlist'}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-white' : ''}`} />
            </button>
          </div>
        </div>

        {/* Right Column: Title, Metadata, Overview, Details Grid, Prod, Links, Share */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-5">
          {/* Title & Tagline */}
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              {tvShow.title}{' '}
              <span className="text-neutral-500 font-normal text-2xl sm:text-3xl">({year}-)</span>
            </h1>

            {tvShow.tagline && (
              <p className="text-sm italic text-neutral-400 mt-1">
                "{tvShow.tagline}"
              </p>
            )}
          </div>

          {/* Director/Creator (CLICKABLE) & Writer */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-400">
            <div>
              Director / Creator:{' '}
              <Link
                to={`/search?q=${encodeURIComponent(director)}`}
                className="text-white hover:text-[#E50914] font-semibold underline-offset-2 hover:underline transition-colors"
                title={`Search titles created or directed by ${director}`}
              >
                {director}
              </Link>
            </div>
            <span className="text-neutral-600">·</span>
            <div>
              Writer: <strong className="text-white font-semibold">{writer}</strong>
            </div>
          </div>

          {/* Rating & Primary Metadata Strip (Country CLICKABLE) */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#F5C518] text-black font-black shadow-sm">
              <Star className="w-3.5 h-3.5 fill-black" />
              <span>{displayRating}</span>
              <span className="text-[10px] font-bold text-neutral-800">
                ({(tvShow.voteCount || 4280).toLocaleString()} votes)
              </span>
            </span>

            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#111318] border border-white/10 text-neutral-300 font-bold">
              <Layers className="w-3.5 h-3.5 text-neutral-400" />
              <span>{totalSeasons} Season{totalSeasons > 1 ? 's' : ''}</span>
            </span>

            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#111318] border border-white/10 text-neutral-300 font-bold">
              <Tv className="w-3.5 h-3.5 text-neutral-400" />
              <span>{totalEpisodes} Episodes</span>
            </span>

            <span className="px-2.5 py-1 rounded-lg bg-[#111318] border border-white/10 text-neutral-300 font-bold">
              TV-MA
            </span>

            <span className="px-2.5 py-1 rounded-lg bg-[#111318] border border-white/10 text-neutral-300 font-bold">
              {language}
            </span>

            {/* Country Pill (CLICKABLE) */}
            <Link
              to={`/country/${slugifyCountry(country)}`}
              className="px-2.5 py-1 rounded-lg bg-[#111318] hover:bg-[#1C202A] border border-white/10 hover:border-white/30 text-neutral-300 hover:text-white font-semibold transition-colors cursor-pointer"
              title={`Browse series filmed in ${country}`}
            >
              {country}
            </Link>
          </div>

          {/* Genre Chips (CLICKABLE) */}
          <div className="flex flex-wrap items-center gap-2">
            {genresList.map((g) => (
              <Link
                key={g}
                to={`/genre/${slugify(g)}`}
                className="px-3 py-1 rounded-full bg-[#281318] hover:bg-[#E50914] border border-red-500/40 hover:border-[#E50914] text-red-300 hover:text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
                title={`Explore ${g} series`}
              >
                {g}
              </Link>
            ))}
          </div>

          {/* Overview */}
          <div className="space-y-1.5 pt-1">
            <h3 className="text-sm font-extrabold text-white tracking-wide uppercase text-neutral-300">
              Overview
            </h3>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-3xl">
              {tvShow.overview ||
                'The Targaryen dynasty is at the absolute apex of its power, with more than 15 dragons under their yoke. Most empires crumble from such heights; in the case of the Targaryens, their slow fall begins when King Viserys breaks with a century of tradition by naming his daughter Rhaenyra heir to the Iron Throne.'}
            </p>
          </div>

          {/* Details Grid Box (3x3 formatted grid with CLICKABLE Director & Country) */}
          <div className="rounded-2xl bg-[#101217] border border-white/[0.08] p-4 sm:p-5">
            <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400 mb-3 border-b border-white/[0.06] pb-2">
              Details
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                  FIRST AIR DATE
                </span>
                <span className="font-semibold text-white mt-0.5 block">{releaseDateDisplay}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                  SEASONS & EPISODES
                </span>
                <span className="font-semibold text-white mt-0.5 block">
                  {totalSeasons} Seasons ({totalEpisodes} Eps)
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                  DIRECTOR / CREATOR
                </span>
                <Link
                  to={`/search?q=${encodeURIComponent(director)}`}
                  className="font-semibold text-white hover:text-[#E50914] mt-0.5 block truncate hover:underline"
                  title={`Search for director/creator ${director}`}
                >
                  {director}
                </Link>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                  WRITER / CREATED BY
                </span>
                <span className="font-semibold text-white mt-0.5 block truncate">{writer}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                  LANGUAGE
                </span>
                <span className="font-semibold text-white mt-0.5 block">{language}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                  COUNTRY
                </span>
                <Link
                  to={`/country/${slugifyCountry(country)}`}
                  className="font-semibold text-white hover:text-[#E50914] mt-0.5 block truncate hover:underline"
                  title={`Browse all titles filmed in ${country}`}
                >
                  {country}
                </Link>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                  STATUS
                </span>
                <span className="font-semibold text-white mt-0.5 block">{tvShow.status || 'Returning Series'}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                  NETWORK
                </span>
                {tvShow.network ? (
                  <Link
                    to={`/studio/${slugify(tvShow.network)}`}
                    className="font-semibold text-white hover:text-[#E50914] mt-0.5 block truncate hover:underline"
                    title={`Explore titles produced by ${tvShow.network}`}
                  >
                    {tvShow.network}
                  </Link>
                ) : (
                  <span className="font-semibold text-white mt-0.5 block">HBO / Max</span>
                )}
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                  QUALITY
                </span>
                <span className="font-semibold text-white mt-0.5 block">4K Ultra HD</span>
              </div>
            </div>
          </div>

          {/* PRODUCTION Companies Section (CLICKABLE - Opens Studio Catalog) */}
          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-neutral-400 block">
              PRODUCTION
            </span>
            <div className="flex flex-wrap items-center gap-2.5">
              {prodCompanies.map((comp) => {
                const compSlug = comp.id ? `${comp.id}-${slugify(comp.name)}` : slugify(comp.name);
                return (
                  <Link
                    key={comp.name}
                    to={`/studio/${compSlug}`}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#101217] hover:bg-[#1C202A] border border-white/10 hover:border-[#E50914]/50 text-xs font-semibold text-neutral-200 hover:text-white transition-all cursor-pointer group shadow-sm"
                    title={`Browse all series and movies produced by ${comp.name}`}
                  >
                    <span className="w-2 h-2 rounded-full bg-neutral-600 group-hover:bg-[#E50914] transition-colors" />
                    <span>{comp.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* EXTERNAL LINKS */}
          <div className="flex items-center gap-3 text-xs pt-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-neutral-400">
              EXTERNAL LINKS:
            </span>
            <div className="flex items-center gap-2 font-semibold">
              <a
                href={`https://www.themoviedb.org/tv/${tvShow.tmdbId}`}
                target="_blank"
                rel="noreferrer"
                className="text-[#E50914] hover:underline flex items-center gap-1"
              >
                <span>TMDB</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-neutral-600">·</span>
              <a
                href={tvShow.imdbId ? `https://www.imdb.com/title/${tvShow.imdbId}` : 'https://www.imdb.com'}
                target="_blank"
                rel="noreferrer"
                className="text-neutral-300 hover:text-white flex items-center gap-1"
              >
                <span>IMDb</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              {tvShow.homepage && (
                <>
                  <span className="text-neutral-600">·</span>
                  <a
                    href={tvShow.homepage}
                    target="_blank"
                    rel="noreferrer"
                    className="text-neutral-300 hover:text-white flex items-center gap-1"
                  >
                    <span>Official Site</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Share Bar */}
          <div className="flex items-center gap-2 pt-1 border-t border-white/[0.06]">
            <span className="text-xs font-bold text-neutral-400 flex items-center gap-1">
              <Share2 className="w-3.5 h-3.5" />
              <span>Share:</span>
            </span>

            {/* WhatsApp */}
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(tvShow.title + ' ' + window.location.href)}`}
              target="_blank"
              rel="noreferrer"
              className="w-7 h-7 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center text-xs font-bold transition-all shadow"
              title="Share on WhatsApp"
            >
              W
            </a>

            {/* Twitter / X */}
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tvShow.title)}&url=${encodeURIComponent(window.location.href)}`}
              target="_blank"
              rel="noreferrer"
              className="w-7 h-7 rounded-full bg-neutral-800 hover:bg-black text-white flex items-center justify-center text-xs font-bold border border-white/20 transition-all shadow"
              title="Share on X / Twitter"
            >
              𝕏
            </a>

            {/* Reddit */}
            <a
              href={`https://reddit.com/submit?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(tvShow.title)}`}
              target="_blank"
              rel="noreferrer"
              className="w-7 h-7 rounded-full bg-orange-600 hover:bg-orange-500 text-white flex items-center justify-center text-xs font-bold transition-all shadow"
              title="Share on Reddit"
            >
              R
            </a>

            {/* Telegram */}
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(tvShow.title)}`}
              target="_blank"
              rel="noreferrer"
              className="w-7 h-7 rounded-full bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center text-xs font-bold transition-all shadow"
              title="Share on Telegram"
            >
              T
            </a>

            {/* Copy Link */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="w-7 h-7 rounded-full bg-[#1C1F26] hover:bg-[#252A34] text-neutral-300 hover:text-white border border-white/10 flex items-center justify-center text-xs transition-all cursor-pointer relative"
              title="Copy URL"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            {copiedLink && (
              <span className="text-[11px] font-bold text-emerald-400 animate-fade-in">
                Link Copied!
              </span>
            )}
          </div>

          {/* Rate This Series & Views / Report */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/[0.06]">
            {/* Interactive Stars */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-neutral-300">Rate this series:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((starIdx) => {
                  const isFilled = (hoverRating !== null ? hoverRating >= starIdx : (userRating !== null && userRating >= starIdx));
                  return (
                    <button
                      key={starIdx}
                      type="button"
                      onMouseEnter={() => setHoverRating(starIdx)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => handleRateShow(starIdx)}
                      className="p-0.5 cursor-pointer transition-transform hover:scale-125"
                      title={`Rate ${starIdx} of 5 stars`}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          isFilled ? 'fill-[#F5C518] text-[#F5C518]' : 'text-neutral-600'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              {hasRated && (
                <span className="text-[11px] font-bold text-[#F5C518] animate-fade-in">
                  Thanks! ({userRating}/5)
                </span>
              )}
            </div>

            {/* Views Count & Report Issue */}
            <div className="flex items-center gap-3 text-xs text-neutral-400">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                <span>{realViews.toLocaleString()} views</span>
              </span>
              <span className="text-neutral-600">·</span>
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="flex items-center gap-1 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Report Issue</span>
              </button>
            </div>
          </div>

          {/* Keywords / Tags Badges (CLICKABLE) */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2">
            {keywordsList.map((tag) => (
              <Link
                key={tag}
                to={`/search?q=${encodeURIComponent(tag)}`}
                className="px-2.5 py-1 rounded-lg bg-[#101217] hover:bg-[#E50914] border border-white/5 hover:border-[#E50914] text-[11px] text-neutral-400 hover:text-white transition-all cursor-pointer font-medium"
                title={`Search for series tagged with "${tag}"`}
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. IN-PAGE ANCHOR TABS (Episodes, Cast, Similar, Recommended) */}
      {/* ------------------------------------------------------------- */}
      <div className="border-b border-white/[0.08] flex items-center gap-6 sm:gap-8 text-sm font-bold pt-6">
        <a
          href="#episodes-section"
          className="py-3 text-white transition-colors cursor-pointer border-b-2 border-[#E50914]"
        >
          Episodes
        </a>
        <a
          href="#cast-section"
          className="py-3 text-neutral-400 hover:text-white transition-colors cursor-pointer border-b-2 border-transparent hover:border-[#E50914]"
        >
          Cast
        </a>
        <a
          href="#similar-section"
          className="py-3 text-neutral-400 hover:text-white transition-colors cursor-pointer border-b-2 border-transparent hover:border-[#E50914]"
        >
          Similar
        </a>
        <a
          href="#recommended-section"
          className="py-3 text-neutral-400 hover:text-white transition-colors cursor-pointer border-b-2 border-transparent hover:border-[#E50914]"
        >
          Recommended
        </a>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. EPISODES SECTION & SEASON SELECTOR */}
      {/* ------------------------------------------------------------- */}
      <div id="episodes-section" className="space-y-6 pt-2 scroll-mt-20">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Episodes
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Season {selectedSeasonNumber} • {currentSeason?.episodes?.length || 0} Episodes available
            </p>
          </div>

          {/* Season Selector Pills: season 1, season 2, etc. */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#101217] border border-white/10 flex-wrap">
            {seasonsList.map((num) => {
              const isActive = selectedSeasonNumber === num;
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleSeasonChange(num)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#E50914] text-white shadow-lg shadow-red-900/40 scale-105'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Season {num}
                </button>
              );
            })}
          </div>
        </div>

        {/* Episode Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-1">
          {(currentSeason?.episodes || []).map((ep) => (
            <Link
              key={ep.id}
              to={`/watch/tv/${tvShow.slug}/season/${selectedSeasonNumber}/episode/${ep.episodeNumber}`}
              className="rounded-2xl overflow-hidden bg-[#101217] border border-white/[0.08] hover:border-[#E50914]/60 transition-all group flex flex-col shadow-xl hover:shadow-red-950/20"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-black/40">
                <img
                  src={getTMDBImageUrl(ep.stillPath || tvShow.backdropPath, 'w500')}
                  alt={ep.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80';
                  }}
                />
                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-black text-[#E50914] border border-white/10">
                  EP {ep.episodeNumber}
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-[#E50914] text-white flex items-center justify-center shadow-xl shadow-red-900/50 transform group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </div>
                </div>
              </div>

              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-[#E50914] transition-colors truncate">
                    {ep.name || `Episode ${ep.episodeNumber}`}
                  </h4>
                  {ep.overview && (
                    <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                      {ep.overview}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-2.5 pt-2 border-t border-white/5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-neutral-500" />
                    <span>{ep.runtime || 55}m</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-[#F5C518] text-[#F5C518]" />
                    <span className="font-semibold text-neutral-200">{ep.voteAverage ? ep.voteAverage.toFixed(1) : '8.5'}</span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. TOP CAST CAROUSEL */}
      {/* ------------------------------------------------------------- */}
      <div id="cast-section" className="space-y-4 pt-6 scroll-mt-20 border-t border-white/[0.08]">
        <div className="flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
            Top Cast
          </h3>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scrollContainer(castScrollRef, -300)}
              className="p-1.5 rounded-xl bg-[#111318] border border-white/10 hover:bg-white/10 text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollContainer(castScrollRef, 300)}
              className="p-1.5 rounded-xl bg-[#111318] border border-white/10 hover:bg-white/10 text-white transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          ref={castScrollRef}
          className="flex items-start gap-5 sm:gap-6 overflow-x-auto no-scrollbar pb-3 scroll-smooth"
        >
          {castList.map((actor) => (
            <div
              key={actor.id || actor.name}
              className="flex flex-col items-center text-center flex-shrink-0 w-24 sm:w-28 group cursor-pointer"
              onClick={() => navigate(`/actor/${actor.id || actor.name}`)}
            >
              {/* Circular Avatar */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-[#E50914] group-hover:scale-105 transition-all shadow-md shadow-black mb-2 relative bg-[#111318]">
                <img
                  src={getTMDBImageUrl(actor.profilePath, 'w500', 'avatar')}
                  alt={actor.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h5 className="text-xs font-bold text-white group-hover:text-[#E50914] transition-colors truncate max-w-full">
                {actor.name}
              </h5>
              <p className="text-[10px] text-neutral-400 truncate max-w-full">
                {actor.character || 'Actor'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 6. MORE LIKE THIS SECTION */}
      {/* ------------------------------------------------------------- */}
      <div id="similar-section" className="space-y-4 pt-4 scroll-mt-20">
        <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
          More Like This
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
          {similar.slice(0, 6).map((item) => (
            <MovieCard key={item.id} media={item} />
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 7. RECOMMENDED SECTION */}
      {/* ------------------------------------------------------------- */}
      {recommended.length > 0 && (
        <div id="recommended-section" className="space-y-4 pt-4 scroll-mt-20">
          <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
            Recommended Series
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {recommended.slice(0, 6).map((item) => (
              <MovieCard key={item.id} media={item} />
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 8. GENRE SERIES (e.g. Drama Series) */}
      {/* ------------------------------------------------------------- */}
      {genreShows.length > 0 && (
        <div className="space-y-4 pt-4">
          <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
            {genresList[0] || 'Drama'} Series
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {genreShows.slice(0, 6).map((item) => (
              <MovieCard key={item.id} media={item} />
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 9. FREQUENTLY ASKED QUESTIONS (ACCORDION) */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-4 pt-6 border-t border-white/[0.08]">
        <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
          Frequently Asked Questions
        </h3>

        <div className="space-y-2.5 max-w-4xl">
          {/* FAQ 1: Where can I watch */}
          <div className="rounded-2xl bg-[#111318] border border-white/[0.08] overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setOpenFaq(openFaq === 1 ? null : 1)}
              className="w-full text-left p-4 sm:p-5 flex items-center justify-between text-xs sm:text-sm font-bold text-white hover:text-[#E50914] transition-colors cursor-pointer"
            >
              <span>Where can I watch {tvShow.title} online?</span>
              {openFaq === 1 ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
            </button>
            {openFaq === 1 && (
              <div className="px-4 pb-5 sm:px-5 sm:pb-5 text-xs text-neutral-300 leading-relaxed border-t border-white/[0.04] pt-3">
                {tvShow.title} series guide includes episode listings, seasons, cast, and ratings. Click <strong>Watch Now</strong> above to stream all episodes in HD quality with subtitle options and server mirror switching.
              </div>
            )}
          </div>

          {/* FAQ 2: What is the series about */}
          <div className="rounded-2xl bg-[#111318] border border-white/[0.08] overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setOpenFaq(openFaq === 2 ? null : 2)}
              className="w-full text-left p-4 sm:p-5 flex items-center justify-between text-xs sm:text-sm font-bold text-white hover:text-[#E50914] transition-colors cursor-pointer"
            >
              <span>What is {tvShow.title} about?</span>
              {openFaq === 2 ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
            </button>
            {openFaq === 2 && (
              <div className="px-4 pb-5 sm:px-5 sm:pb-5 text-xs text-neutral-300 leading-relaxed border-t border-white/[0.04] pt-3">
                {tvShow.overview || 'Explores gripping plotlines, rich character developments, and high drama spanning multiple seasons.'}
              </div>
            )}
          </div>

          {/* FAQ 3: Who stars in the series */}
          <div className="rounded-2xl bg-[#111318] border border-white/[0.08] overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setOpenFaq(openFaq === 3 ? null : 3)}
              className="w-full text-left p-4 sm:p-5 flex items-center justify-between text-xs sm:text-sm font-bold text-white hover:text-[#E50914] transition-colors cursor-pointer"
            >
              <span>Who stars in {tvShow.title}?</span>
              {openFaq === 3 ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
            </button>
            {openFaq === 3 && (
              <div className="px-4 pb-5 sm:px-5 sm:pb-5 text-xs text-neutral-300 leading-relaxed border-t border-white/[0.04] pt-3">
                {tvShow.title} features an ensemble cast including {castList.slice(0, 5).map((a) => a.name).join(', ')}, and more. Directed / created by {director}.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 10. STICKY BOTTOM FLOATING MINI BAR */}
      {/* ------------------------------------------------------------- */}
      {showStickyBar && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-[#0B0C0F]/95 backdrop-blur-md border-t border-white/10 py-2.5 px-4 sm:px-8 flex items-center justify-between animate-slide-up shadow-2xl">
          {/* Left: Thumbnail & Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-13 rounded-lg overflow-hidden bg-[#111318] border border-white/10 flex-shrink-0">
              <img
                src={getTMDBImageUrl(tvShow.posterPath, 'w300', 'poster')}
                alt={tvShow.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="truncate">
              <h5 className="text-xs sm:text-sm font-black text-white truncate">
                {tvShow.title}
              </h5>
              <p className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                <span>{year}-</span>
                <span>•</span>
                <span>{totalSeasons} Season{totalSeasons > 1 ? 's' : ''}</span>
                <span>•</span>
                <span className="flex items-center gap-0.5 text-white font-bold">
                  <Star className="w-3 h-3 fill-[#F5C518] text-[#F5C518]" />
                  <span>{displayRating}</span>
                </span>
              </p>
            </div>
          </div>

          {/* Right: Red Watch Button */}
          <Link
            to={`/watch/tv/${tvShow.slug}/season/${selectedSeasonNumber}/episode/1`}
            className="py-2 px-5 rounded-xl bg-[#E50914] hover:bg-[#B81D24] text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-red-900/40 transition-all cursor-pointer flex-shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Watch</span>
            <ChevronUp className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 11. TRAILER POPUP MODAL */}
      {/* ------------------------------------------------------------- */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-4xl aspect-video bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
            <button
              type="button"
              onClick={() => setActiveVideo(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/70 hover:bg-black text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${activeVideo.key}?autoplay=1`}
              title={activeVideo.title}
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 12. REPORT ISSUE MODAL */}
      {/* ------------------------------------------------------------- */}
      {reportOpen && (
        <ReportModal
          isOpen={reportOpen}
          onClose={() => setReportOpen(false)}
          title={tvShow.title}
          serverId="default"
        />
      )}
    </div>
  );
}
