import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Trash2, Film, Tv, Play } from 'lucide-react';
import { useWatchlist } from '../hooks/useWatchlist';
import { getTMDBImageUrl, formatRating, formatYear } from '../utils/slugify';
import { Pagination } from '../components/Pagination';
import { SEO } from '../components/SEO';

export function Favorites() {
  const { watchlist, removeFromWatchlist, clearWatchlist } = useWatchlist();
  const [filter, setFilter] = useState<'all' | 'movie' | 'tv'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const perPage = 18;

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const filtered = watchlist.filter((item) => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginatedItems = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <div className="min-h-screen bg-[#08090c] pt-24 pb-16">
      <SEO
        title="My Saved Watchlist - Tstream"
        description="Your personal watchlist on Tstream. Keep track of all movies and TV shows you plan to watch."
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'Watchlist', item: '/watchlist' },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-950/60 text-[#E50914] border border-red-500/30 shadow-md shadow-red-950/30">
              <Bookmark className="w-6 h-6 fill-[#E50914]/30" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                My Saved Watchlist
              </h1>
              <p className="text-xs text-neutral-400">
                {watchlist.length} {watchlist.length === 1 ? 'title' : 'titles'} saved locally
              </p>
            </div>
          </div>

          {watchlist.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-[#151820] border border-white/10 rounded-xl p-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filter === 'all'
                      ? 'bg-[#E50914] text-white shadow-md shadow-red-900/40 font-extrabold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  All ({watchlist.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('movie')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filter === 'movie'
                      ? 'bg-[#E50914] text-white shadow-md shadow-red-900/40 font-extrabold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Movies ({watchlist.filter((i) => i.type === 'movie').length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('tv')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filter === 'tv'
                      ? 'bg-[#E50914] text-white shadow-md shadow-red-900/40 font-extrabold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  TV Series ({watchlist.filter((i) => i.type === 'tv').length})
                </button>
              </div>

              <button
                type="button"
                onClick={clearWatchlist}
                className="p-2.5 text-xs text-neutral-400 hover:text-red-400 border border-white/10 hover:border-red-400/40 rounded-xl transition-colors cursor-pointer"
                title="Clear entire watchlist"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {watchlist.length === 0 ? (
          <div className="py-24 text-center space-y-4 max-w-sm mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-red-950/60 border border-red-500/30 flex items-center justify-center text-[#E50914] mx-auto shadow-lg shadow-red-950/30">
              <Bookmark className="w-8 h-8 fill-[#E50914]/20" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Your Watchlist is Empty</h3>
              <p className="text-xs text-neutral-400">
                Tap the bookmark icon on any movie or TV series card to save it here for later.
              </p>
            </div>
            <Link
              to="/movies"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#E50914] hover:bg-[#B81D24] text-white text-xs font-extrabold rounded-xl shadow-lg shadow-red-900/40 transition-all hover:scale-105 active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Browse Movies Now</span>
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-neutral-400">
            No items in this category.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
              {paginatedItems.map((item) => {
                const detailUrl = item.type === 'movie' ? `/movie/${item.slug}` : `/tv/${item.slug}`;

                return (
                  <div key={item.id} className="group relative flex flex-col">
                    <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#151820] border border-white/10 group-hover:border-[#E50914]/60 group-hover:shadow-2xl group-hover:shadow-red-900/20 transition-all duration-300">
                      <img
                        src={getTMDBImageUrl(item.posterPath, 'w500')}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Overlay Actions */}
                      <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeFromWatchlist(item.tmdbId, item.type);
                          }}
                          className="self-end p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                          title="Remove from Watchlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <Link
                          to={detailUrl}
                          className="w-11 h-11 rounded-full bg-[#E50914] hover:bg-[#B81D24] text-white flex items-center justify-center shadow-lg shadow-red-900/40 mx-auto transition-transform hover:scale-110 active:scale-95"
                          title="View Details"
                        >
                          <Play className="w-5 h-5 fill-white ml-0.5" />
                        </Link>

                        <div className="flex items-center justify-center gap-1.5 text-xs">
                          <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-[#E50914] text-white">IMDb</span>
                          <span className="text-neutral-100 font-bold">{formatRating(item.imdbRating || item.voteAverage)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 space-y-0.5">
                      <Link
                        to={detailUrl}
                        className="text-sm font-semibold text-white group-hover:text-[#E50914] transition-colors truncate block"
                      >
                        {item.title}
                      </Link>
                      <div className="flex items-center justify-between text-xs text-neutral-400">
                        <span>{formatYear(item.releaseDate)}</span>
                        <span className="uppercase text-[10px] px-1 py-0.2 rounded bg-white/10 font-bold">
                          {item.type}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filtered.length}
              itemsPerPage={perPage}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </>
        )}
      </div>
    </div>
  );
}
