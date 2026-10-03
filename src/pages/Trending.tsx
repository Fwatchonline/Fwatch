import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Flame, Sparkles } from 'lucide-react';
import { tmdbService } from '../services/tmdb';
import { MediaItem } from '../types';
import { MovieCard } from '../components/MovieCard';
import { Pagination } from '../components/Pagination';
import { SEO } from '../components/SEO';

export function Trending() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'all' | 'movies' | 'tv') || 'all';

  const [timeWindow, setTimeWindow] = useState<'day' | 'week'>('day');
  const [tab, setTab] = useState<'all' | 'movies' | 'tv'>(initialTab);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCurrentPage(1);
  }, [timeWindow, tab]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    async function loadTrending() {
      try {
        const data = await tmdbService.getTrendingPaginated(tab, timeWindow, currentPage);

        if (mounted) {
          setItems(data.results || []);
          setTotalPages(data.totalPages || 1);
          setTotalItems(data.totalResults || data.results.length);
          setLoading(false);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    }

    loadTrending();
    return () => {
      mounted = false;
    };
  }, [timeWindow, tab, currentPage]);

  const handleTabChange = (nextTab: 'all' | 'movies' | 'tv') => {
    setTab(nextTab);
    setSearchParams({ tab: nextTab });
  };

  return (
    <div className="min-h-screen bg-[#08090c] pt-24 pb-16">
      <SEO
        title="Trending Today &amp; This Week - Top Movies &amp; TV | FWATCH"
        description="See what the world is watching right now. Daily and weekly trending movies and series on FWATCH."
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'Trending', item: '/trending' },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#F5C518]/15 text-[#F5C518] border border-[#F5C518]/25">
                <Flame className="w-6 h-6 fill-[#F5C518]/20" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                  Trending Stream Content
                </h1>
                <p className="text-xs text-neutral-400">
                  Global real-time streaming charts powered by TMDB
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Time Window: Today vs This Week */}
            <div className="flex items-center bg-[#151820] border border-white/10 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setTimeWindow('day')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  timeWindow === 'day'
                    ? 'bg-[#F5C518] text-black font-extrabold shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setTimeWindow('week')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  timeWindow === 'week'
                    ? 'bg-[#F5C518] text-black font-extrabold shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                This Week
              </button>
            </div>

            {/* Type Tabs: All, Movies, TV */}
            <div className="flex items-center bg-[#151820] border border-white/10 rounded-xl p-1">
              <button
                type="button"
                onClick={() => handleTabChange('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  tab === 'all' ? 'bg-white/15 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('movies')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  tab === 'movies' ? 'bg-white/15 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Movies
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('tv')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  tab === 'tv' ? 'bg-white/15 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                TV Shows
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-24 flex justify-center">
            <div className="w-10 h-10 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center rounded-3xl bg-[#16171E] border border-white/5 p-8">
            <p className="text-neutral-400 text-sm">No trending titles found.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
              {items.map((item) => (
                <MovieCard key={item.id} media={item} />
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
    </div>
  );
}
