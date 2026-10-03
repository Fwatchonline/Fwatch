import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, UserCheck } from 'lucide-react';
import { tmdbService } from '../services/tmdb';
import { TMDBPerson } from '../types';
import { getTMDBImageUrl } from '../utils/slugify';
import { useDebounce } from '../hooks/useDebounce';
import { Pagination } from '../components/Pagination';
import { SEO } from '../components/SEO';

type FilterCategory = 'All' | 'Actor' | 'Actress' | 'Director' | 'Writer' | 'Producer';

export function Artists() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [filterRole, setFilterRole] = useState<FilterCategory>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [artists, setArtists] = useState<TMDBPerson[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch TMDB people whenever search or currentPage changes
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const fetchPromise = debouncedSearch.trim()
      ? tmdbService.searchPeople(debouncedSearch.trim(), currentPage)
      : tmdbService.getPopularActors(currentPage);

    fetchPromise
      .then((data) => {
        if (!mounted) return;
        setArtists(data.results || []);
        setTotalPages(Math.min(data.totalPages || 1, 50));
        setLoading(false);
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [debouncedSearch, currentPage]);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  // Client-side category filtering
  const filteredArtists = artists.filter((artist) => {
    if (filterRole === 'All') return true;
    const dept = (artist.knownForDepartment || '').toLowerCase();
    const role = (artist.role || '').toLowerCase();
    const roles = (artist.roles || []).map((r) => r.toLowerCase());

    if (filterRole === 'Actor') {
      return role === 'actor' || dept === 'acting';
    }
    if (filterRole === 'Actress') {
      return role === 'actress' || (dept === 'acting' && artist.role === 'Actress');
    }
    if (filterRole === 'Director') {
      return dept.includes('direct') || roles.includes('director');
    }
    if (filterRole === 'Writer') {
      return dept.includes('writ') || roles.includes('writer');
    }
    if (filterRole === 'Producer') {
      return dept.includes('produc') || roles.includes('producer');
    }
    return true;
  });

  const filterTabs: FilterCategory[] = [
    'All',
    'Actor',
    'Actress',
    'Director',
    'Writer',
    'Producer',
  ];

  return (
    <div className="space-y-8 py-4">
      <SEO
        title="Popular People & Celebrities - T.Movie"
        description="Explore popular movie and TV series actors, actresses, directors, writers, and producers with complete TMDB profiles on T.Movie."
      />

      {/* Page Title */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Popular People
        </h1>
        <p className="text-xs text-neutral-400">
          Directly synced with TMDB popular people
        </p>
      </div>

      {/* Search Input */}
      <div className="max-w-2xl mx-auto relative">
        <Search className="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search the Actors, Actresses, Directors..."
          className="w-full pl-12 pr-4 py-3 rounded-2xl bg-[#16171E] border border-white/5 focus:border-[#F5C518] focus:bg-[#1c1d26] text-sm text-white placeholder-neutral-500 transition-all outline-hidden shadow-inner"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {/* Filter Tabs (All, Actor, Actress, Director, Writer, Producer) */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar py-2">
        {filterTabs.map((tab) => {
          const isActive = filterRole === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setFilterRole(tab)}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#F5C518] text-black shadow-lg shadow-[#F5C518]/25 scale-105'
                  : 'bg-[#16171E] text-neutral-400 hover:text-white hover:bg-white/5 border border-white/5'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
            Loading Artists from TMDB...
          </span>
        </div>
      ) : filteredArtists.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-[#16171E] border border-white/5 p-8 max-w-xl mx-auto">
          <UserCheck className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No artists found</h3>
          <p className="text-xs text-neutral-400">
            Try adjusting your search query or filter selection.
          </p>
        </div>
      ) : (
        /* Grid of Artists */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredArtists.map((artist) => {
            const roleBadge = artist.role || artist.knownForDepartment || 'Actor';
            const photoUrl = artist.profilePath
              ? getTMDBImageUrl(artist.profilePath, 'w500')
              : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80';

            return (
              <Link
                key={artist.id}
                to={`/actor/${artist.slug}`}
                className="group relative rounded-2xl overflow-hidden bg-[#16171E] border border-white/5 hover:border-[#F5C518]/40 transition-all duration-300 shadow-lg flex flex-col"
              >
                {/* Aspect Portrait Container */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/40">
                  <img
                    src={photoUrl}
                    alt={artist.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 ease-out"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#16171E] via-transparent to-black/60" />

                  {/* Top Role Badge */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex flex-wrap gap-1 z-10">
                    <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-bold text-neutral-200">
                      {roleBadge}
                    </span>
                    {artist.knownForDepartment && artist.knownForDepartment !== roleBadge && (
                      <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-bold text-[#F5C518]">
                        {artist.knownForDepartment}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Info */}
                <div className="p-3 text-center bg-[#16171E] border-t border-white/5">
                  <h3 className="text-sm font-bold text-white group-hover:text-[#F5C518] transition-colors truncate">
                    {artist.name}
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {artist.movieCount ? `${artist.movieCount} titles` : 'Popular artist'}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination (Working Dynamic TMDB pagination) */}
      {!loading && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}
    </div>
  );
}
