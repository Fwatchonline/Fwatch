import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Film,
  Tv,
  Building2,
  Globe,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Star,
  Flame,
} from 'lucide-react';
import { tmdbService } from '../services/tmdb';
import { MediaItem, TMDBCompany } from '../types';
import { getTMDBImageUrl } from '../utils/slugify';
import { MovieCard } from '../components/MovieCard';
import { SEO } from '../components/SEO';

export function Studio() {
  const { slug } = useParams<{ slug: string }>();

  const [company, setCompany] = useState<TMDBCompany | null>(null);
  const [movies, setMovies] = useState<MediaItem[]>([]);
  const [tvShows, setTvShows] = useState<MediaItem[]>([]);
  const [allTitles, setAllTitles] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [mediaType, setMediaType] = useState<'all' | 'movie' | 'tv'>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'popular' | 'newest'>('popular');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    let mounted = true;
    if (!slug) return;

    setLoading(true);
    setCurrentPage(1);

    (async () => {
      // 1. Resolve company ID from slug
      const resolved = await tmdbService.resolveCompany(slug);

      if (!resolved?.id) {
        if (mounted) {
          setLoading(false);
        }
        return;
      }

      // 2. Fetch all titles (both movies and series)
      const data = await tmdbService.getCompanyTitles(resolved.id);
      if (!mounted) return;

      setCompany(data.company);
      setMovies(data.movies || []);
      setTvShows(data.tv || []);
      setAllTitles(data.all || []);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [slug]);

  // Filter & sort
  let displayedList: MediaItem[] = [];
  if (mediaType === 'movie') {
    displayedList = [...movies];
  } else if (mediaType === 'tv') {
    displayedList = [...tvShows];
  } else {
    displayedList = [...allTitles];
  }

  if (sortBy === 'rating') {
    displayedList.sort((a, b) => ((b.imdbRating || b.voteAverage || 0) - (a.imdbRating || a.voteAverage || 0)));
  } else if (sortBy === 'newest') {
    displayedList.sort((a, b) => new Date(b.releaseDate || 0).getTime() - new Date(a.releaseDate || 0).getTime());
  } else {
    displayedList.sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));
  }

  const totalPages = Math.ceil(displayedList.length / itemsPerPage) || 1;
  const paginatedTitles = displayedList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-[#E50914] border-t-transparent rounded-full animate-spin shadow-lg shadow-red-900/30" />
        <p className="text-xs font-bold text-neutral-400 tracking-wider animate-pulse">
          Loading studio catalog...
        </p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-28 max-w-md mx-auto">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#111318] border border-white/10 flex items-center justify-center text-2xl font-black text-[#E50914]">
          <Building2 className="w-8 h-8 text-[#E50914]" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Studio Not Found</h2>
        <p className="text-sm text-neutral-400 mb-6">
          We couldn't find production studio details for this title.
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

  return (
    <div className="min-h-screen pb-20 space-y-8 select-none">
      <SEO
        title={`${company.name} - Movies & TV Series Catalog`}
        description={`Explore all movies and TV shows produced by ${company.name}. Watch in HD with multiple stream servers.`}
      />

      {/* ------------------------------------------------------------- */}
      {/* 1. TOP BREADCRUMB */}
      {/* ------------------------------------------------------------- */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-neutral-400 bg-[#111318]/90 border border-white/[0.07] px-4 py-2.5 rounded-2xl backdrop-blur-md">
        <Link to="/" className="hover:text-white transition-colors">
          Home
        </Link>
        <span className="text-neutral-600">/</span>
        <span className="text-neutral-400">Studios</span>
        <span className="text-neutral-600">/</span>
        <span className="text-white truncate font-bold">{company.name}</span>
      </nav>

      {/* ------------------------------------------------------------- */}
      {/* 2. HERO STUDIO HEADER BANNER */}
      {/* ------------------------------------------------------------- */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#161822] via-[#101217] to-[#0D0E12] border border-white/10 p-6 sm:p-10 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 relative z-10 text-center sm:text-left">
          {/* Logo or Icon Card */}
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-white/5 border border-white/10 p-3 flex items-center justify-center flex-shrink-0 shadow-2xl overflow-hidden">
            {company.logoPath ? (
              <img
                src={getTMDBImageUrl(company.logoPath, 'w300')}
                alt={company.name}
                className="max-h-full max-w-full object-contain filter drop-shadow-md"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center rounded-xl bg-[#E50914]/10 border border-[#E50914]/30 text-[#E50914]">
                <Building2 className="w-10 h-10 mb-1" />
                <span className="text-[10px] font-black uppercase tracking-wider">Studio</span>
              </div>
            )}
          </div>

          {/* Studio Meta Details */}
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <span className="px-3 py-1 rounded-full bg-[#E50914]/15 border border-[#E50914]/40 text-[#E50914] text-xs font-black uppercase tracking-wider">
                Production Studio
              </span>
              {company.originCountry && (
                <span className="px-3 py-1 rounded-full bg-white/10 text-neutral-300 text-xs font-bold">
                  {company.originCountry}
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
              {company.name}
            </h1>

            {company.description ? (
              <p className="text-xs sm:text-sm text-neutral-300 max-w-3xl leading-relaxed">
                {company.description}
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-neutral-400 max-w-3xl leading-relaxed">
                Explore all award-winning feature films, television shows, and blockbusters produced by{' '}
                <strong className="text-white">{company.name}</strong>.
              </p>
            )}

            {/* Quick Metrics Bar */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs font-bold text-neutral-400">
              <span className="flex items-center gap-1.5 text-white">
                <Film className="w-4 h-4 text-[#E50914]" />
                <span>{movies.length} Movies</span>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5 text-white">
                <Tv className="w-4 h-4 text-[#E50914]" />
                <span>{tvShows.length} TV Shows</span>
              </span>
              {company.headquarters && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-neutral-500" />
                    <span>{company.headquarters}</span>
                  </span>
                </>
              )}
              {company.homepage && (
                <>
                  <span>·</span>
                  <a
                    href={company.homepage}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[#E50914] hover:underline"
                  >
                    <span>Website</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. FILTER TABS & SORT CONTROL BAR */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        {/* Media Type Tabs */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-[#111318] border border-white/10 w-fit">
          <button
            type="button"
            onClick={() => {
              setMediaType('all');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              mediaType === 'all'
                ? 'bg-[#E50914] text-white shadow-md shadow-red-900/30'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            All ({allTitles.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setMediaType('movie');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              mediaType === 'movie'
                ? 'bg-[#E50914] text-white shadow-md shadow-red-900/30'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Movies ({movies.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setMediaType('tv');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              mediaType === 'tv'
                ? 'bg-[#E50914] text-white shadow-md shadow-red-900/30'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Series ({tvShows.length})
          </button>
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-neutral-400" />
          <span className="text-xs text-neutral-400 font-bold">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as any);
              setCurrentPage(1);
            }}
            className="bg-[#111318] border border-white/10 text-white text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-[#E50914] cursor-pointer"
          >
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. PRODUCTION TITLES GRID */}
      {/* ------------------------------------------------------------- */}
      {paginatedTitles.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
          {paginatedTitles.map((item) => (
            <MovieCard key={item.id} media={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-[#111318]/50 border border-white/5 rounded-3xl p-8">
          <Film className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No Titles Found</h3>
          <p className="text-xs text-neutral-400">
            No titles match the selected filters for this studio.
          </p>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. PAGINATION CONTROLS */}
      {/* ------------------------------------------------------------- */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            className="p-2.5 rounded-xl bg-[#111318] border border-white/10 hover:bg-white/10 text-white disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-4 py-2 text-xs font-bold text-neutral-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            className="p-2.5 rounded-xl bg-[#111318] border border-white/10 hover:bg-white/10 text-white disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
