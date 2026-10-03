import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search as SearchIcon, SlidersHorizontal, Film, Tv } from 'lucide-react';
import { tmdbService } from '../services/tmdb';
import { MediaItem } from '../types';
import { getTMDBImageUrl, formatYear } from '../utils/slugify';
import { Pagination } from '../components/Pagination';
import { SEO } from '../components/SEO';

const DIRECTORS = ['All', 'Christopher Nolan', 'Quentin Tarantino', 'Martin Scorsese', 'Denis Villeneuve', 'Steven Spielberg', 'Russo Brothers'];
const COUNTRIES = ['All', 'United States', 'United Kingdom', 'France', 'Japan', 'South Korea'];
const AGE_RATINGS = ['All', 'G', 'PG', 'PG-13', 'R', 'NC-17'];
const QUALITIES = ['All', '4K UHD', '1080p Full HD', '720p HD'];
const NETWORKS = ['All', 'HBO', 'Netflix', 'Apple TV+', 'Amazon Prime', 'Disney+', 'Marvel Studios'];
const ORDERS = ['Default', 'Rating: High to Low', 'Release Date: New to Old', 'Popularity'];
const GENRES = ['All', 'Action', 'Adventure', 'Sci-Fi', 'Drama', 'Thriller', 'Comedy', 'Crime', 'Horror', 'Fantasy', 'Animation'];

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';

  const [inputVal, setInputVal] = useState(queryParam);
  const [mediaType, setMediaType] = useState<'all' | 'movie' | 'tv'>('all');
  const [selectedDirector, setSelectedDirector] = useState('All');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [selectedAge, setSelectedAge] = useState('All');
  const [selectedQuality, setSelectedQuality] = useState('All');
  const [selectedNetwork, setSelectedNetwork] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState('Default');
  const [selectedGenre, setSelectedGenre] = useState('All');

  const [results, setResults] = useState<MediaItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);

  // Sync input value if URL search param changes
  useEffect(() => {
    setInputVal(queryParam);
    setCurrentPage(1);
  }, [queryParam]);

  useEffect(() => {
    setCurrentPage(1);
  }, [mediaType, selectedGenre, selectedOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      setSearchParams({ q: inputVal.trim() });
    }
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const searchTerm = queryParam.trim() || (selectedGenre !== 'All' ? selectedGenre : 'Avengers');

    tmdbService
      .searchMultiPaginated(searchTerm, currentPage)
      .then((data) => {
        if (!mounted) return;
        let filtered = data.results || [];

        // Filter by mediaType
        if (mediaType === 'movie') {
          filtered = filtered.filter((item) => item.type === 'movie');
        } else if (mediaType === 'tv') {
          filtered = filtered.filter((item) => item.type === 'tv');
        }

        // Filter by Genre
        if (selectedGenre !== 'All') {
          filtered = filtered.filter(
            (item) =>
              item.genres &&
              item.genres.some(
                (g) => (typeof g === 'string' ? g : g.name).toLowerCase() === selectedGenre.toLowerCase()
              )
          );
        }

        // Sort results by IMDb rating
        if (selectedOrder === 'Rating: High to Low') {
          filtered.sort((a, b) => ((b.imdbRating || b.voteAverage || 0) - (a.imdbRating || a.voteAverage || 0)));
        } else if (selectedOrder === 'Release Date: New to Old') {
          filtered.sort((a, b) => new Date(b.releaseDate || 0).getTime() - new Date(a.releaseDate || 0).getTime());
        }

        setResults(filtered.length > 0 ? filtered : data.results || []);
        setTotalPages(data.totalPages || 1);
        setTotalItems(data.totalResults || (data.results || []).length);
        setLoading(false);
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [queryParam, mediaType, selectedGenre, selectedOrder, currentPage]);

  const displayTitle = queryParam
    ? `The search results for "${queryParam}"`
    : selectedGenre !== 'All'
    ? `Genre results for "${selectedGenre}"`
    : 'Discover Movies & Series';

  return (
    <div className="space-y-8 py-4">
      <SEO
        title={`${queryParam ? `Search: ${queryParam}` : 'Advanced Search'} - T.Movie`}
        description="Search thousands of movies, TV shows, and series with full TMDB accuracy on T.Movie."
      />

      {/* Top Search Bar & Filter Panel (Image 7) */}
      <div className="rounded-3xl bg-[#16171E] border border-white/5 p-6 sm:p-8 space-y-6 shadow-2xl">
        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <SearchIcon className="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Type any movie, series or character (e.g. Avengers, Batman, Game of Thrones)..."
            className="w-full pl-12 pr-28 py-3.5 rounded-2xl bg-[#0E0F12] border border-white/10 focus:border-[#F5C518] text-sm text-white placeholder-neutral-500 transition-all outline-hidden shadow-inner font-medium"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 rounded-xl bg-[#F5C518] hover:bg-[#E5B508] text-black text-xs font-black transition-colors cursor-pointer shadow-md shadow-[#F5C518]/20"
          >
            Search
          </button>
        </form>

        {/* Row 1: Type switch (All / Movie / Series) + Dropdowns */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Movie / Series Toggle Pill (Image 7) */}
          <div className="flex items-center p-1 rounded-2xl bg-[#0E0F12] border border-white/5">
            <button
              type="button"
              onClick={() => setMediaType('all')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                mediaType === 'all'
                  ? 'bg-[#F5C518] text-black shadow-md shadow-[#F5C518]/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setMediaType('movie')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                mediaType === 'movie'
                  ? 'bg-[#F5C518] text-black shadow-md shadow-[#F5C518]/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Movie
            </button>
            <button
              type="button"
              onClick={() => setMediaType('tv')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                mediaType === 'tv'
                  ? 'bg-[#F5C518] text-black shadow-md shadow-[#F5C518]/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Series
            </button>
          </div>

          {/* Dropdown Filters Grid (Image 7) */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {/* Genre */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Genre
              </label>
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-[#0E0F12] border border-white/10 text-xs text-[#F5C518] font-bold outline-hidden cursor-pointer"
              >
                {GENRES.map((g) => (
                  <option key={g} value={g} className="bg-[#16171E] text-white">
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Order / Sort */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Order
              </label>
              <select
                value={selectedOrder}
                onChange={(e) => setSelectedOrder(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-[#0E0F12] border border-white/10 text-xs text-white outline-hidden cursor-pointer"
              >
                {ORDERS.map((o) => (
                  <option key={o} value={o} className="bg-[#16171E]">
                    {o}
                  </option>
                ))}
              </select>
            </div>

            {/* Country */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Country
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-[#0E0F12] border border-white/10 text-xs text-white outline-hidden cursor-pointer"
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c} className="bg-[#16171E]">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Age Rating */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Age rating
              </label>
              <select
                value={selectedAge}
                onChange={(e) => setSelectedAge(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-[#0E0F12] border border-white/10 text-xs text-white outline-hidden cursor-pointer"
              >
                {AGE_RATINGS.map((a) => (
                  <option key={a} value={a} className="bg-[#16171E]">
                    {a}
                  </option>
                ))}
              </select>
            </div>

            {/* Quality */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Quality
              </label>
              <select
                value={selectedQuality}
                onChange={(e) => setSelectedQuality(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-[#0E0F12] border border-white/10 text-xs text-white outline-hidden cursor-pointer"
              >
                {QUALITIES.map((q) => (
                  <option key={q} value={q} className="bg-[#16171E]">
                    {q}
                  </option>
                ))}
              </select>
            </div>

            {/* Network */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Network
              </label>
              <select
                value={selectedNetwork}
                onChange={(e) => setSelectedNetwork(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-[#0E0F12] border border-white/10 text-xs text-white outline-hidden cursor-pointer"
              >
                {NETWORKS.map((n) => (
                  <option key={n} value={n} className="bg-[#16171E]">
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Heading: The search results for "..." (Image 7) */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
          {displayTitle}
        </h2>
        <span className="text-xs text-neutral-400 font-bold">
          {results.length} titles found
        </span>
      </div>

      {/* Results Grid with horizontal card rows matching Image 7 */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Loading Results...</span>
        </div>
      ) : results.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-[#16171E] border border-white/5 p-8">
          <p className="text-neutral-400 text-sm">No titles match your search &quot;{queryParam}&quot;.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {results.map((item) => (
              <Link
                key={item.id}
                to={item.type === 'movie' ? `/movie/${item.slug}` : `/tv/${item.slug}`}
                className="flex items-center gap-4 p-3 rounded-2xl bg-[#16171E] border border-white/5 hover:border-[#F5C518]/40 transition-all duration-300 group shadow-lg"
              >
                <div className="w-20 sm:w-24 aspect-[2/3] rounded-xl overflow-hidden bg-black/40 shrink-0">
                  <img
                    src={getTMDBImageUrl(item.posterPath, 'w300')}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-black/50 text-[#F5C518] border border-white/5">
                      {item.type === 'tv' ? 'Series' : 'Movie'}
                    </span>
                    <p className="text-xs text-neutral-400">
                      {formatYear(item.releaseDate)}
                    </p>
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-[#F5C518] transition-colors truncate">
                    {item.title}
                  </h3>

                  {/* Golden IMDb rating badge (Image 7) */}
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#0E0F12] border border-[#F5C518]/30 text-white text-xs font-bold">
                    <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-[#F5C518] text-black">
                      IMDb
                    </span>
                    <span>{item.imdbRating ? Number(item.imdbRating).toFixed(1) : (item.voteAverage ? item.voteAverage.toFixed(1) : '7.5')}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </>
      )}
    </div>
  );
}
