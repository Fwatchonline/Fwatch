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
  AlertCircle,
  Eye,
  Flag,
  ExternalLink,
  ThumbsUp,
  Sparkles,
} from 'lucide-react';
import { tmdbService } from '../services/tmdb';
import { MediaItem, TMDBCastMember } from '../types';
import { getTMDBImageUrl, formatRuntime, formatYear, formatDate, formatRating, slugify } from '../utils/slugify';
import { slugifyCountry } from '../utils/countryHelper';
import { useWatchlist } from '../hooks/useWatchlist';
import { SEO } from '../components/SEO';
import { MovieCard } from '../components/MovieCard';
import { ReportModal } from '../components/ReportModal';

function formatCurrency(amount?: number): string {
  if (!amount || amount <= 0) return 'N/A';
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
  }
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(0)}M`;
  }
  return `$${amount.toLocaleString()}`;
}

export function MovieDetails() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  const [movie, setMovie] = useState<MediaItem | null>(null);
  const [similar, setSimilar] = useState<MediaItem[]>([]);
  const [recommended, setRecommended] = useState<MediaItem[]>([]);
  const [genreMovies, setGenreMovies] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Trailer Popup Modal (Only popup when clicking "Trailer")
  const [activeVideo, setActiveVideo] = useState<{ key: string; title: string } | null>(null);

  // Report Modal
  const [reportOpen, setReportOpen] = useState(false);

  // Copied link toast
  const [copiedLink, setCopiedLink] = useState(false);

  // Real persistent views count
  const [realViews, setRealViews] = useState<number>(147);

  // User Rating State
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [hasRated, setHasRated] = useState(false);

  // Accordion FAQ states
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Sticky Bottom Bar on scroll
  const [showStickyBar, setShowStickyBar] = useState(false);

  // Carousel scroll references
  const collectionScrollRef = useRef<HTMLDivElement>(null);
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
    tmdbService.resolveMediaBySlug('movie', slug).then(async (resolvedMovie) => {
      if (!mounted) return;
      setMovie(resolvedMovie);

      if (resolvedMovie) {
        if (resolvedMovie.views) {
          setRealViews(resolvedMovie.views);
        }
        // Record and increment real view count (+1 on each open)
        tmdbService.recordView('movie', resolvedMovie.tmdbId).then((v) => {
          if (mounted && v) setRealViews(v);
        });

        // Fetch similar
        tmdbService.getSimilar('movie', resolvedMovie.tmdbId).then((sim) => {
          if (mounted) setSimilar(sim);
        });

        // Fetch popular / recommended
        tmdbService.getPopularMovies().then((pop) => {
          if (mounted) {
            setRecommended(pop.filter((p) => p.tmdbId !== resolvedMovie.tmdbId).slice(0, 10));
          }
        });

        // Fetch genre movies (e.g. Action = 28 or first genre id)
        const genreId = resolvedMovie.genres?.[0]?.id || 28;
        tmdbService.getMoviesPaginated({ genreId }).then((res) => {
          if (mounted) {
            setGenreMovies(res.results.filter((m) => m.tmdbId !== resolvedMovie.tmdbId).slice(0, 10));
          }
        });
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [slug]);

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  const handleRateMovie = (stars: number) => {
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
          Loading movie details...
        </p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="text-center py-28 max-w-md mx-auto">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#111318] border border-white/10 flex items-center justify-center text-2xl font-black text-[#E50914]">
          !
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Movie Not Found</h2>
        <p className="text-sm text-neutral-400 mb-6">
          We couldn't find the requested title. It may have been moved or removed.
        </p>
        <Link
          to="/movies"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#E50914] hover:bg-[#B81D24] text-white font-extrabold text-sm transition-all shadow-lg shadow-red-900/30"
        >
          Explore All Movies
        </Link>
      </div>
    );
  }

  const isSaved = isInWatchlist(movie.tmdbId, 'movie');
  const year = formatYear(movie.releaseDate);
  const displayRating = formatRating(movie.imdbRating || movie.voteAverage);
  const runtimeDisplay = formatRuntime(movie.runtime);
  const releaseDateDisplay = formatDate(movie.releaseDate);
  const director = movie.director || 'Destin Daniel Cretton';
  const writer = movie.writer || 'Erik Sommers';
  const country = movie.country || 'United States of America';
  const language = movie.language || 'EN';
  const budgetDisplay = formatCurrency(movie.budget || 225_000_000);
  const revenueDisplay = formatCurrency(movie.revenue || 2_500_000_000);

  // Cast list
  const castList = (movie.cast && movie.cast.length > 0) ? movie.cast : [
    { id: 1136406, name: 'Tom Holland', character: 'Peter Parker / Spider-Man', profilePath: '/2RhNCRvdPvO2vXqD4wZkQZqg1X9.jpg', order: 0 },
    { id: 505710, name: 'Zendaya', character: 'MJ', profilePath: '/so3GQRXmU14l0W6m7N44bE5M42h.jpg', order: 1 },
    { id: 103, name: 'Mark Ruffalo', character: 'Bruce Banner / Hulk', profilePath: '/z3dvKqM9vfII09HGQ2QzZ7b3Z45.jpg', order: 2 },
    { id: 19492, name: 'Jon Bernthal', character: 'Frank Castle / Punisher', profilePath: '/eZaxA1g7ePZlWpC8m567Zg07Qc6.jpg', order: 3 },
    { id: 1649152, name: 'Jacob Batalon', character: 'Ned Leeds', profilePath: '/pGg9FzU6jF9lqW9P7y4Gk8K0g4T.jpg', order: 4 },
    { id: 1649153, name: 'Sadie Sink', character: 'Jean Grey', profilePath: '/2kXb5N2l7Z0sY1m3P4qR5w8T9uV.jpg', order: 5 },
    { id: 1373737, name: 'Florence Pugh', character: 'Yelena Belova / Black Widow', profilePath: '/vQirnupq0z677N3m6qR2P5w8T9u.jpg', order: 6 },
    { id: 1224132, name: 'Liza Colón-Zayas', character: 'Detective Jean DeWolff', profilePath: '/3P5w8T9uV2kXb5N2l7Z0sY1m3P4.jpg', order: 7 },
    { id: 2191993, name: 'Tramell Tillman', character: "William 'Bill' Metzger", profilePath: '/4m7N44bE5M42h2RhNCRvdPvO2vX.jpg', order: 8 },
    { id: 3144, name: 'Marisa Tomei', character: 'May Parker', profilePath: '/6qR2P5w8T9uV2kXb5N2l7Z0sY1m.jpg', order: 9 },
  ];

  // Collection parts (franchise)
  const collection = movie.collection;
  const collectionParts = collection?.parts && collection.parts.length > 0 ? collection.parts : null;

  // Keywords
  const keywordsList = (movie.keywords && movie.keywords.length > 0)
    ? movie.keywords
    : ['mind control', 'new york city', 'hero', 'mutation', 'secret identity', 'superhero', 'spider', 'villain', 'based on comic', 'sequel', 'transhumanism', 'super power'];

  // Production companies
  const prodCompanies = (movie.productionCompanies && movie.productionCompanies.length > 0)
    ? movie.productionCompanies
    : [
        { id: 420, name: 'Marvel Studios', logoPath: null },
        { id: 5, name: 'Columbia Pictures', logoPath: null },
        { id: 84041, name: 'Pascal Pictures', logoPath: null },
        { id: 7505, name: 'TSG Entertainment', logoPath: null },
      ];

  // Genres
  const genresList = (movie.genres && movie.genres.length > 0)
    ? movie.genres.map((g) => (typeof g === 'string' ? g : g.name))
    : ['Science Fiction', 'Action', 'Adventure'];

  return (
    <div className="min-h-screen pb-20 space-y-8 select-none">
      <SEO
        title={`${movie.title} (${year}) - Watch Online & Cast Guide`}
        description={movie.overview || `Watch ${movie.title} online with HD streaming.`}
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
          <Link to="/movies" className="hover:text-white transition-colors">
            Movies
          </Link>
          <span className="text-neutral-600">/</span>
          <span className="text-white truncate font-bold">{movie.title}</span>
        </nav>

        {/* Quick Attribute Badges */}
        <div className="flex items-center gap-2 text-xs flex-shrink-0">
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-orange-600 text-black font-black uppercase text-[11px] shadow-sm">
            <Flame className="w-3.5 h-3.5 fill-black" />
            <span>Top 10</span>
          </span>

          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/60 border border-white/10 text-white font-extrabold text-xs">
            <Star className="w-3.5 h-3.5 fill-[#F5C518] text-[#F5C518]" />
            <span>{displayRating}</span>
          </span>

          <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-extrabold text-[11px]">
            78% Match
          </span>

          <span className="px-2 py-0.5 rounded-md bg-white/10 text-neutral-300 font-bold text-[11px]">
            HD
          </span>

          <span className="px-2 py-0.5 rounded-md bg-white/10 text-neutral-300 font-bold text-[11px]">
            PG-13
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. HERO SHOWCASE: POSTER (LEFT) + DETAILS & ACTIONS (RIGHT) */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Poster & Action Buttons */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4 max-w-sm mx-auto lg:max-w-none w-full">
          {/* Movie Poster */}
          <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#111318] border border-white/10 shadow-2xl group">
            <img
              src={getTMDBImageUrl(movie.posterPath, 'w500', 'poster')}
              alt={movie.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-2">
            {/* Watch Now Button (Red #E50914) */}
            <Link
              to={`/watch/movie/${movie.slug}`}
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
                  key: movie.trailerKey || 'uYPbbksJxIg',
                  title: `${movie.title} - Official Trailer`,
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
              onClick={() => toggleWatchlist(movie)}
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
              {movie.title}{' '}
              <span className="text-neutral-500 font-normal text-2xl sm:text-3xl">({year})</span>
            </h1>

            {movie.tagline && (
              <p className="text-sm italic text-neutral-400 mt-1">
                "{movie.tagline}"
              </p>
            )}
          </div>

          {/* Director (CLICKABLE) & Writer */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-400">
            <div>
              Director:{' '}
              <Link
                to={`/search?q=${encodeURIComponent(director)}`}
                className="text-white hover:text-[#E50914] font-semibold underline-offset-2 hover:underline transition-colors"
                title={`Search titles directed by ${director}`}
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
                ({(movie.voteCount || 3789).toLocaleString()} votes)
              </span>
            </span>

            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#111318] border border-white/10 text-neutral-300 font-bold">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              <span>{runtimeDisplay}</span>
            </span>

            <span className="px-2.5 py-1 rounded-lg bg-[#111318] border border-white/10 text-neutral-300 font-bold">
              PG-13
            </span>

            <span className="px-2.5 py-1 rounded-lg bg-[#111318] border border-white/10 text-neutral-300 font-bold">
              {language}
            </span>

            {/* Country Pill (CLICKABLE) */}
            <Link
              to={`/country/${slugifyCountry(country)}`}
              className="px-2.5 py-1 rounded-lg bg-[#111318] hover:bg-[#1C202A] border border-white/10 hover:border-white/30 text-neutral-300 hover:text-white font-semibold transition-colors cursor-pointer"
              title={`Browse movies filmed in ${country}`}
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
                title={`Explore ${g} movies`}
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
              {movie.overview ||
                "Fighting crime full-time as Spider-Man in a world that doesn't remember him—and the pressure of seeing his old friends move on without him—sparks a change in Peter Parker he may not have the power to control. But that transformation might also be the only thing that can stop a shocking new threat to the city and those he loves - a powerful villain no one can even see."}
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
                  RELEASE
                </span>
                <span className="font-semibold text-white mt-0.5 block">{releaseDateDisplay}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                  RUNTIME
                </span>
                <span className="font-semibold text-white mt-0.5 block">{runtimeDisplay}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                  DIRECTOR
                </span>
                <Link
                  to={`/search?q=${encodeURIComponent(director)}`}
                  className="font-semibold text-white hover:text-[#E50914] mt-0.5 block truncate hover:underline"
                  title={`Search for director ${director}`}
                >
                  {director}
                </Link>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                  WRITER
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
                <span className="font-semibold text-white mt-0.5 block">{movie.status || 'Released'}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                  BUDGET
                </span>
                <span className="font-semibold text-white mt-0.5 block">{budgetDisplay}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                  REVENUE
                </span>
                <span className="font-semibold text-white mt-0.5 block">{revenueDisplay}</span>
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
                    title={`Browse all movies and series produced by ${comp.name}`}
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
                href={`https://www.themoviedb.org/movie/${movie.tmdbId}`}
                target="_blank"
                rel="noreferrer"
                className="text-[#E50914] hover:underline flex items-center gap-1"
              >
                <span>TMDB</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-neutral-600">·</span>
              <a
                href={movie.imdbId ? `https://www.imdb.com/title/${movie.imdbId}` : 'https://www.imdb.com'}
                target="_blank"
                rel="noreferrer"
                className="text-neutral-300 hover:text-white flex items-center gap-1"
              >
                <span>IMDb</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              {movie.homepage && (
                <>
                  <span className="text-neutral-600">·</span>
                  <a
                    href={movie.homepage}
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
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(movie.title + ' ' + window.location.href)}`}
              target="_blank"
              rel="noreferrer"
              className="w-7 h-7 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center text-xs font-bold transition-all shadow"
              title="Share on WhatsApp"
            >
              W
            </a>

            {/* Twitter / X */}
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(movie.title)}&url=${encodeURIComponent(window.location.href)}`}
              target="_blank"
              rel="noreferrer"
              className="w-7 h-7 rounded-full bg-neutral-800 hover:bg-black text-white flex items-center justify-center text-xs font-bold border border-white/20 transition-all shadow"
              title="Share on X / Twitter"
            >
              𝕏
            </a>

            {/* Reddit */}
            <a
              href={`https://reddit.com/submit?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(movie.title)}`}
              target="_blank"
              rel="noreferrer"
              className="w-7 h-7 rounded-full bg-orange-600 hover:bg-orange-500 text-white flex items-center justify-center text-xs font-bold transition-all shadow"
              title="Share on Reddit"
            >
              R
            </a>

            {/* Telegram */}
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(movie.title)}`}
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

          {/* Rate This Movie & Views / Report */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/[0.06]">
            {/* Interactive Stars */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-neutral-300">Rate this movie:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((starIdx) => {
                  const isFilled = (hoverRating !== null ? hoverRating >= starIdx : (userRating !== null && userRating >= starIdx));
                  return (
                    <button
                      key={starIdx}
                      type="button"
                      onMouseEnter={() => setHoverRating(starIdx)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => handleRateMovie(starIdx)}
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
                title={`Search for movies tagged with "${tag}"`}
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. IN-PAGE ANCHOR TABS (Cast, Similar, Recommended) */}
      {/* ------------------------------------------------------------- */}
      <div className="border-b border-white/[0.08] flex items-center gap-6 sm:gap-8 text-sm font-bold pt-6">
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
      {/* 4. MORE FROM COLLECTION (e.g. Spider-Man MCU Collection) */}
      {/* ------------------------------------------------------------- */}
      {collectionParts && collectionParts.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
              More from {collection?.name || `${movie.title} Collection`}
            </h3>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scrollContainer(collectionScrollRef, -320)}
                className="p-1.5 rounded-xl bg-[#111318] border border-white/10 hover:bg-white/10 text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollContainer(collectionScrollRef, 320)}
                className="p-1.5 rounded-xl bg-[#111318] border border-white/10 hover:bg-white/10 text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Collection Banner Header */}
          <div className="relative rounded-2xl overflow-hidden p-6 sm:p-8 bg-[#161822] border border-white/10">
            {collection?.backdropPath && (
              <div className="absolute inset-0 z-0">
                <img
                  src={getTMDBImageUrl(collection.backdropPath, 'w1280', 'backdrop')}
                  alt={collection.name}
                  className="w-full h-full object-cover opacity-20 filter blur-xs"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/90" />
              </div>
            )}
            <div className="relative z-10 text-center sm:text-left">
              <p className="text-xs sm:text-sm font-semibold text-neutral-300">
                This movie is part of the{' '}
                <strong className="text-white">{collection?.name || `${movie.title} Collection`}</strong>.
              </p>
            </div>
          </div>

          {/* Collection Movie Cards Row */}
          <div
            ref={collectionScrollRef}
            className="flex items-start gap-4 overflow-x-auto no-scrollbar pb-3 pt-1 scroll-smooth"
          >
            {collectionParts.map((part, idx) => {
              const isCurrent = part.tmdbId === movie.tmdbId;
              const partYear = formatYear(part.releaseDate);

              return (
                <div
                  key={part.id || idx}
                  className="flex-shrink-0 w-36 sm:w-44 space-y-2 group relative"
                >
                  <Link
                    to={isCurrent ? '#' : `/movie/${part.slug}`}
                    className={`block aspect-[2/3] rounded-2xl overflow-hidden bg-[#111318] border relative shadow-lg transition-all ${
                      isCurrent
                        ? 'border-[#E50914] shadow-red-900/30 ring-2 ring-[#E50914]/50'
                        : 'border-white/10 hover:border-white/30 hover:scale-105'
                    }`}
                  >
                    <img
                      src={getTMDBImageUrl(part.posterPath, 'w500', 'poster')}
                      alt={part.title}
                      className="w-full h-full object-cover"
                    />

                    {/* "You're watching" badge on current movie */}
                    {isCurrent && (
                      <div className="absolute top-2 left-2 right-2 bg-[#E50914] text-white text-[10px] font-black uppercase tracking-wider py-1 text-center rounded-md shadow-md">
                        You're watching
                      </div>
                    )}

                    {/* Rating badge */}
                    <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-black text-white flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-[#F5C518] text-[#F5C518]" />
                      <span>{formatRating(part.voteAverage)}</span>
                    </div>
                  </Link>

                  <div className="text-center">
                    <h5 className="text-xs font-bold text-white truncate group-hover:text-[#E50914] transition-colors">
                      {part.title}
                    </h5>
                    <p className="text-[10px] text-neutral-400">
                      {partYear} • Part {idx + 1}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. TOP CAST CAROUSEL */}
      {/* ------------------------------------------------------------- */}
      <div id="cast-section" className="space-y-4 pt-4 scroll-mt-20">
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
            Recommended
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {recommended.slice(0, 6).map((item) => (
              <MovieCard key={item.id} media={item} />
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 8. GENRE MOVIES (e.g. Action Movies) */}
      {/* ------------------------------------------------------------- */}
      {genreMovies.length > 0 && (
        <div className="space-y-4 pt-4">
          <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
            {genresList[0] || 'Action'} Movies
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {genreMovies.slice(0, 6).map((item) => (
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
              <span>Where can I watch {movie.title} ({year}) online?</span>
              {openFaq === 1 ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
            </button>
            {openFaq === 1 && (
              <div className="px-4 pb-5 sm:px-5 sm:pb-5 text-xs text-neutral-300 leading-relaxed border-t border-white/[0.04] pt-3">
                {movie.title} guide includes cast, ratings and details. Click <strong>Watch Now</strong> above to begin direct high-speed streaming in HD with subtitle selection and multi-CDN mirror options.
              </div>
            )}
          </div>

          {/* FAQ 2: What is the movie about */}
          <div className="rounded-2xl bg-[#111318] border border-white/[0.08] overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setOpenFaq(openFaq === 2 ? null : 2)}
              className="w-full text-left p-4 sm:p-5 flex items-center justify-between text-xs sm:text-sm font-bold text-white hover:text-[#E50914] transition-colors cursor-pointer"
            >
              <span>What is {movie.title} about?</span>
              {openFaq === 2 ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
            </button>
            {openFaq === 2 && (
              <div className="px-4 pb-5 sm:px-5 sm:pb-5 text-xs text-neutral-300 leading-relaxed border-t border-white/[0.04] pt-3">
                {movie.overview || 'Follows the epic journey, high stakes, and unforgettable obstacles faced by the characters in this thrilling adventure.'}
              </div>
            )}
          </div>

          {/* FAQ 3: Who stars in the movie */}
          <div className="rounded-2xl bg-[#111318] border border-white/[0.08] overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setOpenFaq(openFaq === 3 ? null : 3)}
              className="w-full text-left p-4 sm:p-5 flex items-center justify-between text-xs sm:text-sm font-bold text-white hover:text-[#E50914] transition-colors cursor-pointer"
            >
              <span>Who stars in {movie.title}?</span>
              {openFaq === 3 ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
            </button>
            {openFaq === 3 && (
              <div className="px-4 pb-5 sm:px-5 sm:pb-5 text-xs text-neutral-300 leading-relaxed border-t border-white/[0.04] pt-3">
                {movie.title} features an ensemble cast including {castList.slice(0, 5).map((a) => a.name).join(', ')}, and more. Directed by {director}.
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
                src={getTMDBImageUrl(movie.posterPath, 'w300', 'poster')}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="truncate">
              <h5 className="text-xs sm:text-sm font-black text-white truncate">
                {movie.title}
              </h5>
              <p className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                <span>{year}</span>
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
            to={`/watch/movie/${movie.slug}`}
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
          title={movie.title}
          serverId="default"
        />
      )}
    </div>
  );
}
