import { useState, useEffect } from 'react';
import { Film, Star, TrendingUp, Sparkles, Flame } from 'lucide-react';
import { tmdbService } from '../services/tmdb';
import { MediaItem, TMDBGenre } from '../types';
import { MovieCard } from '../components/MovieCard';
import { Pagination } from '../components/Pagination';
import { SEO } from '../components/SEO';

type SortFilter = 'popular' | 'trending' | 'top_rated' | 'newest';

export function Movies() {
  const [movies, setMovies] = useState<MediaItem[]>([]);
  const [genres, setGenres] = useState<TMDBGenre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<number | 'all'>('all');
  const [activeSort, setActiveSort] = useState<SortFilter>('popular');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setGenres(tmdbService.getGenres());
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGenre, activeSort]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const data = await tmdbService.getMoviesPaginated({
          sort: activeSort,
          genreId: selectedGenre,
          page: currentPage,
        });

        if (mounted) {
          setMovies(data.results || []);
          setTotalPages(data.totalPages || 1);
          setTotalItems(data.totalResults || data.results.length);
          setLoading(false);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [selectedGenre, activeSort, currentPage]);

  const sortTabs: { id: SortFilter; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'popular', label: 'Popular', icon: Flame },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'top_rated', label: 'Top Rated', icon: Star },
    { id: 'newest', label: 'New Releases', icon: Sparkles },
  ];

  return (
    <div className="space-y-8 py-4">
      <SEO
        title="Movies - Discover & Stream Full HD Films - T.Movie"
        description="Stream full HD movies across Action, Sci-Fi, Drama, Thriller, and Comedy with real TMDB metadata on T.Movie."
      />

      {/* Header Banner */}
      <div className="rounded-3xl bg-[#16171E] border border-white/5 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F5C518] text-black flex items-center justify-center font-black shadow-lg shadow-[#F5C518]/20 shrink-0">
            <Film className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Explore Movies
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              Hollywood blockbusters, international cinema, and award-winning features
            </p>
          </div>
        </div>

        {/* Controls: Sort pills and Genre filter */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Sort Tabs */}
          <div className="flex items-center p-1 rounded-2xl bg-[#0E0F12] border border-white/5">
            {sortTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSort === tab.id && selectedGenre === 'all';
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSelectedGenre('all');
                    setActiveSort(tab.id);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#F5C518] text-black shadow-md shadow-[#F5C518]/20'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Genre Dropdown */}
          <select
            value={selectedGenre}
            onChange={(e) =>
              setSelectedGenre(e.target.value === 'all' ? 'all' : Number(e.target.value))
            }
            className="bg-[#0E0F12] border border-white/10 rounded-2xl px-4 py-2 text-xs font-bold text-[#F5C518] outline-hidden cursor-pointer focus:border-[#F5C518]"
          >
            <option value="all" className="bg-[#16171E] text-white">All Genres</option>
            {genres.map((g) => (
              <option key={g.id} value={g.id} className="bg-[#16171E] text-white">
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Movies Grid */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
            Loading Movies...
          </span>
        </div>
      ) : movies.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-[#16171E] border border-white/5 p-8">
          <p className="text-neutral-400 text-sm">No movies found for the selected category.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {movies.map((movie) => (
              <MovieCard key={movie.id} media={movie} />
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
