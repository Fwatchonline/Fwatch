import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Film,
  Tv,
  Globe,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Star,
  Flame,
  Calendar,
  Layers,
} from 'lucide-react';
import { tmdbService } from '../services/tmdb';
import { MediaItem } from '../types';
import { MovieCard } from '../components/MovieCard';
import { SEO } from '../components/SEO';
import { getCountryBySlugOrCode, COUNTRY_REGISTRY } from '../utils/countryHelper';
import { GENRES_LIST } from '../services/curatedData';

export function Country() {
  const { slug } = useParams<{ slug: string }>();

  const countryInfo = getCountryBySlugOrCode(slug || 'united-states');

  const [titles, setTitles] = useState<MediaItem[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [mediaType, setMediaType] = useState<'all' | 'movie' | 'tv'>('all');
  const [sortBy, setSortBy] = useState<'popularity.desc' | 'vote_average.desc' | 'primary_release_date.desc'>('popularity.desc');
  const [selectedGenre, setSelectedGenre] = useState<number | 'all'>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [slug, mediaType, sortBy, selectedGenre]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const genreParam = selectedGenre === 'all' ? undefined : selectedGenre;

    tmdbService
      .getTitlesByCountry(
        countryInfo.code,
        currentPage,
        mediaType,
        sortBy,
        genreParam
      )
      .then((data) => {
        if (!mounted) return;
        setTitles(data.results || []);
        setTotalResults(data.totalResults || 0);
        setTotalPages(Math.min(data.totalPages || 1, 50));
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [countryInfo.code, currentPage, mediaType, sortBy, selectedGenre]);

  return (
    <div className="space-y-8 pb-16">
      <SEO
        title={`Movies & TV Series Filmed in ${countryInfo.name} | Tstream`}
        description={`Explore full list of movies and series produced and filmed in ${countryInfo.name}. High definition streaming with IMDb ratings and subtitles.`}
      />

      {/* Hero Header Card */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#181B24] via-[#12141A] to-[#0A0B0E] border border-white/10 shadow-2xl p-6 sm:p-10">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <span className="text-neutral-500">Origin Country</span>
              <span>/</span>
              <span className="text-[#E50914] font-bold">{countryInfo.shortName}</span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-4xl sm:text-5xl select-none">{countryInfo.flag}</span>
              <div>
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                  <span>{countryInfo.name}</span>
                </h1>
                <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                  Films &amp; TV series filmed, created, and produced in {countryInfo.name}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3 self-start md:self-auto bg-black/40 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 shadow-inner">
            <Globe className="w-5 h-5 text-[#E50914]" />
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                ISO Code
              </span>
              <span className="text-sm font-black text-white tracking-wide">
                {countryInfo.code}
              </span>
            </div>
            <div className="w-px h-8 bg-white/10 mx-2" />
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                Catalog Titles
              </span>
              <span className="text-sm font-black text-[#E50914]">
                {totalResults > 0 ? totalResults.toLocaleString() : '1,000+'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Sorting Controls */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-[#14161E] border border-white/5">
          {/* Media Type Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/50 border border-white/10 w-fit">
            <button
              type="button"
              onClick={() => setMediaType('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mediaType === 'all'
                  ? 'bg-[#E50914] text-white shadow-md shadow-red-900/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Titles</span>
            </button>
            <button
              type="button"
              onClick={() => setMediaType('movie')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mediaType === 'movie'
                  ? 'bg-[#E50914] text-white shadow-md shadow-red-900/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Movies</span>
            </button>
            <button
              type="button"
              onClick={() => setMediaType('tv')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mediaType === 'tv'
                  ? 'bg-[#E50914] text-white shadow-md shadow-red-900/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>TV Series</span>
            </button>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-neutral-400 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#E50914]" />
              <span>Sort by:</span>
            </span>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-black/60 border border-white/15 text-white text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-[#E50914] cursor-pointer"
            >
              <option value="popularity.desc">🔥 Most Popular</option>
              <option value="vote_average.desc">⭐ Highest IMDb Rating</option>
              <option value="primary_release_date.desc">📅 Newest Release Date</option>
            </select>
          </div>
        </div>

        {/* Quick Genre Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            type="button"
            onClick={() => setSelectedGenre('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              selectedGenre === 'all'
                ? 'bg-[#E50914] text-white shadow shadow-red-900/40'
                : 'bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/5'
            }`}
          >
            All Genres
          </button>
          {GENRES_LIST.slice(0, 12).map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setSelectedGenre(g.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                selectedGenre === g.id
                  ? 'bg-[#E50914] text-white shadow shadow-red-900/40'
                  : 'bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/5'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Results */}
      {loading ? (
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 py-16">
          <div className="w-10 h-10 border-4 border-[#E50914] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-neutral-400 tracking-wider">
            Loading titles filmed in {countryInfo.name}...
          </p>
        </div>
      ) : titles.length === 0 ? (
        <div className="text-center py-24 space-y-4 max-w-md mx-auto">
          <Globe className="w-12 h-12 text-neutral-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">No titles found for this filter</h2>
          <p className="text-xs text-neutral-400">
            Try switching the genre or category filter to discover more titles from {countryInfo.name}.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedGenre('all');
              setMediaType('all');
            }}
            className="px-4 py-2 rounded-xl bg-[#E50914] hover:bg-[#B81D24] text-white font-extrabold text-xs cursor-pointer shadow shadow-red-900/40"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {titles.map((item) => (
              <MovieCard key={item.id} media={item} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                type="button"
                onClick={() => {
                  setCurrentPage((p) => Math.max(1, p - 1));
                  window.scrollTo({ top: 300, behavior: 'smooth' });
                }}
                disabled={currentPage <= 1}
                className="p-2.5 rounded-xl bg-[#14161E] border border-white/10 text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-bold text-neutral-300 px-4 py-2 rounded-xl bg-[#14161E] border border-white/10">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => {
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: 300, behavior: 'smooth' });
                }}
                disabled={currentPage >= totalPages}
                className="p-2.5 rounded-xl bg-[#14161E] border border-white/10 text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
