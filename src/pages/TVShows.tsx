import { useState, useEffect } from 'react';
import { Tv, Star, TrendingUp, Sparkles, Flame } from 'lucide-react';
import { tmdbService } from '../services/tmdb';
import { MediaItem, TMDBGenre } from '../types';
import { MovieCard } from '../components/MovieCard';
import { Pagination } from '../components/Pagination';
import { SEO } from '../components/SEO';

type SortFilter = 'popular' | 'trending' | 'top_rated' | 'newest';

export function TVShows() {
  const [tvShows, setTvShows] = useState<MediaItem[]>([]);
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
        const data = await tmdbService.getTVShowsPaginated({
          sort: activeSort,
          genreId: selectedGenre,
          page: currentPage,
        });

        if (mounted) {
          setTvShows(data.results || []);
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
    { id: 'newest', label: 'Returning', icon: Sparkles },
  ];

  return (
    <div className="space-y-8 py-4">
      <SEO
        title="TV Series - Watch Returning Seasons & Shows - Tstream"
        description="Stream popular TV series, mini-series, and seasonal premieres with real TMDB metadata on Tstream."
      />

      {/* Header Banner */}
      <div className="rounded-3xl bg-[#16171E] border border-white/5 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#E50914] text-white flex items-center justify-center font-black shadow-lg shadow-red-900/40 shrink-0">
            <Tv className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Explore TV Series
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              Episodic journeys, mini-series, multi-season epics, and new releases
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
                      ? 'bg-[#E50914] text-white shadow-md shadow-red-900/40'
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
            className="bg-[#0E0F12] border border-white/10 rounded-2xl px-4 py-2 text-xs font-bold text-[#E50914] outline-hidden cursor-pointer focus:border-[#E50914]"
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

      {/* Series Grid */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-[#E50914] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
            Loading TV Series...
          </span>
        </div>
      ) : tvShows.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-[#16171E] border border-white/5 p-8">
          <p className="text-neutral-400 text-sm">No series found for the selected category.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {tvShows.map((show) => (
              <MovieCard key={show.id} media={show} />
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
