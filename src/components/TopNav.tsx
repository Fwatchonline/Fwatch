import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Bell,
  SlidersHorizontal,
  ChevronDown,
  X,
  Star,
  Film,
  Menu,
} from 'lucide-react';
import { useUI } from '../context/UIContext';
import { useDebounce } from '../hooks/useDebounce';
import { tmdbService } from '../services/tmdb';
import { MediaItem } from '../types';
import { getTMDBImageUrl } from '../utils/slugify';
import { NotificationDrawer } from './NotificationDrawer';
import { UserDropdown } from './UserDropdown';

const GENRES_LIST = [
  { name: 'Action', slug: 'action' },
  { name: 'Adventure', slug: 'adventure' },
  { name: 'Animation', slug: 'animation' },
  { name: 'Comedy', slug: 'comedy' },
  { name: 'Crime', slug: 'crime' },
  { name: 'Documentary', slug: 'documentary' },
  { name: 'Drama', slug: 'drama' },
  { name: 'Fantasy', slug: 'fantasy' },
  { name: 'Horror', slug: 'horror' },
  { name: 'Mystery', slug: 'mystery' },
  { name: 'Romance', slug: 'romance' },
  { name: 'Sci-Fi', slug: 'sci-fi' },
  { name: 'Thriller', slug: 'thriller' },
  { name: 'Western', slug: 'western' },
];

export function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    sidebarCollapsed,
    toggleSidebar,
    notificationsOpen,
    setNotificationsOpen,
    notifications,
    userDropdownOpen,
    setUserDropdownOpen,
  } = useUI();

  const [genresDropdownOpen, setGenresDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const debouncedQuery = useDebounce(searchQuery, 250);
  const genresDropdownRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      if (
        genresDropdownRef.current &&
        !genresDropdownRef.current.contains(e.target as Node)
      ) {
        setGenresDropdownOpen(false);
      }
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, []);

  // Debounced TMDB search
  useEffect(() => {
    let active = true;
    if (debouncedQuery.trim().length >= 2) {
      setIsSearching(true);
      tmdbService
        .multiSearch(debouncedQuery)
        .then((res) => {
          if (active) {
            setSearchResults(res.slice(0, 6));
            setIsSearching(false);
          }
        })
        .catch(() => {
          if (active) setIsSearching(false);
        });
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
    return () => {
      active = false;
    };
  }, [debouncedQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchFocused(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navLinks = [
    { label: 'All', path: '/' },
    { label: 'Movie', path: '/movies' },
    { label: 'Series', path: '/tv' },
    { label: 'New Episodes', path: '/episodes' },
    { label: 'Anime', path: '/anime' },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 w-full h-18 px-4 sm:px-8 bg-[#0E0F12]/90 backdrop-blur-md border-b border-[#22242c]/50 flex items-center justify-between transition-all">
      {/* Left Navigation Links */}
      <div className="flex items-center gap-6">
        <button
          type="button"
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav className="flex items-center gap-6 text-sm font-semibold">
          {navLinks.map((item) => {
            const active =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`transition-colors relative py-1 ${
                  active
                    ? 'text-white font-bold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F5C518] rounded-full" />
                )}
              </Link>
            );
          })}

          {/* Genres Dropdown */}
          <div ref={genresDropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setGenresDropdownOpen((prev) => !prev)}
              className="flex items-center gap-1 text-neutral-400 hover:text-neutral-200 transition-colors py-1"
            >
              <span>Genres</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${
                  genresDropdownOpen ? 'rotate-180 text-[#F5C518]' : ''
                }`}
              />
            </button>

            {genresDropdownOpen && (
              <div className="absolute top-10 left-0 w-64 p-3 rounded-2xl bg-[#181920] border border-[#2b2d38] shadow-2xl z-50 grid grid-cols-2 gap-1 animate-slide-up">
                {GENRES_LIST.map((g) => (
                  <Link
                    key={g.slug}
                    to={`/genre/${g.slug}`}
                    onClick={() => setGenresDropdownOpen(false)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-300 hover:text-[#F5C518] hover:bg-white/5 transition-colors"
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Right Controls: Search, Notifications, Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Search Input Container */}
        <div ref={searchContainerRef} className="relative w-48 sm:w-72 md:w-84">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder="Search the series, movies .."
              className="w-full pl-9 pr-9 py-2 rounded-full bg-[#181920] border border-white/10 hover:border-white/20 focus:border-[#F5C518] focus:bg-[#1f2029] text-xs sm:text-sm text-white placeholder-neutral-500 transition-all outline-hidden"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/search')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#F5C518] transition-colors"
                title="Advanced Filter"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Search Autocomplete Suggestions Popup (Image 9) */}
          {searchFocused && searchQuery.trim().length >= 2 && (
            <div className="absolute top-12 left-0 right-0 rounded-2xl bg-[#181920] border border-[#2b2d38] shadow-2xl p-2.5 z-50 animate-slide-up max-h-96 overflow-y-auto divide-y divide-white/5">
              {isSearching ? (
                <div className="py-6 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-[#F5C518] rounded-full animate-spin" />
                  <span>Searching TMDB...</span>
                </div>
              ) : searchResults.length > 0 ? (
                <>
                  {searchResults.map((item) => (
                    <Link
                      key={item.id}
                      to={item.type === 'movie' ? `/movie/${item.slug}` : `/tv/${item.slug}`}
                      onClick={() => setSearchFocused(false)}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group"
                    >
                      <img
                        src={getTMDBImageUrl(item.posterPath, 'w300')}
                        alt={item.title}
                        className="w-10 h-14 object-cover rounded-md flex-shrink-0 border border-white/10"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white group-hover:text-[#F5C518] transition-colors truncate">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-400">
                          <span className="flex items-center gap-1">
                            <span className="text-[9px] font-black px-1 py-0.2 rounded bg-[#F5C518] text-black tracking-tight leading-tight">IMDb</span>
                            <span className="font-semibold text-neutral-200">
                              {item.imdbRating ? Number(item.imdbRating).toFixed(1) : (item.voteAverage ? item.voteAverage.toFixed(1) : '7.5')}
                            </span>
                          </span>
                          <span>•</span>
                          <span className="uppercase text-[10px] px-1 rounded bg-white/10">
                            {item.type}
                          </span>
                          <span>•</span>
                          <span>{item.releaseDate ? item.releaseDate.slice(0, 4) : '2024'}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={handleSearchSubmit}
                      className="text-xs font-bold text-[#F5C518] hover:underline"
                    >
                      Show all results →
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-6 text-center text-xs text-neutral-400">
                  No matching titles found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <button
          type="button"
          onClick={() => setNotificationsOpen(!notificationsOpen)}
          title="Notifications"
          className="relative p-2.5 rounded-full bg-[#181920] border border-white/10 hover:border-white/20 text-neutral-300 hover:text-white transition-colors"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F5C518] animate-pulse" />
          )}
        </button>

        {/* User Profile Avatar */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#F5C518] hover:scale-105 transition-transform flex-shrink-0 cursor-pointer shadow-md shadow-[#F5C518]/20"
          >
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </button>
          <UserDropdown />
        </div>
      </div>

      <NotificationDrawer />
    </header>
  );
}
