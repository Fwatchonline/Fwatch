import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Play,
  Search,
  Bookmark,
  Menu,
  X,
  Film,
  Tv,
  Flame,
  Grid,
  Clock,
  Sparkles,
  ChevronRight,
  User,
  Star,
} from 'lucide-react';
import { useWatchlist } from '../hooks/useWatchlist';
import { useDebounce } from '../hooks/useDebounce';
import { tmdbService } from '../services/tmdb';
import { MediaItem } from '../types';
import { getTMDBImageUrl, formatRating, formatYear } from '../utils/slugify';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const debouncedQuery = useDebounce(searchQuery, 300);
  const { watchlist } = useWatchlist();
  const navigate = useNavigate();
  const location = useLocation();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
    setSearchQuery('');
  }, [location.pathname]);

  // Debounced live search
  useEffect(() => {
    let active = true;
    if (debouncedQuery.trim().length >= 2) {
      setIsSearching(true);
      tmdbService.multiSearch(debouncedQuery).then((results) => {
        if (active) {
          setSearchResults(results.slice(0, 6));
          setIsSearching(false);
        }
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
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { name: 'Home', path: '/', icon: Flame },
    { name: 'Movies', path: '/movies', icon: Film },
    { name: 'TV Shows', path: '/tv', icon: Tv },
    { name: 'Anime', path: '/anime', icon: Sparkles },
    { name: 'Top IMDb', path: '/trending?tab=movies', icon: Star },
    { name: 'Trending', path: '/trending', icon: Sparkles },
    { name: 'Genres', path: '/genres', icon: Grid },
    { name: 'New Episodes', path: '/episodes', icon: Clock },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#08090c]/90 backdrop-blur-md border-b border-white/10 shadow-2xl py-3'
            : 'bg-gradient-to-b from-[#08090c]/90 via-[#08090c]/50 to-transparent py-4 sm:py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 group flex-shrink-0"
              aria-label="Tstream Home"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#E50914] to-[#B81D24] flex items-center justify-center shadow-lg shadow-[#E50914]/30 group-hover:scale-105 transition-transform">
                <Play className="w-5 h-5 text-white fill-white ml-0.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-black tracking-wider text-white bebas-font leading-none flex items-center gap-1">
                  Tstream
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E50914] inline-block animate-pulse"></span>
                </span>
                <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold -mt-0.5">
                  Cinema &amp; Series
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
              {navLinks.map((link) => {
                const isActive =
                  link.path === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                      isActive
                        ? 'text-white bg-white/10 shadow-inner'
                        : 'text-neutral-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Header Right Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Desktop Search Trigger / Input */}
              <div className="relative hidden md:block">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <input
                    type="text"
                    placeholder="Search movies, TV..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchOpen(true)}
                    className="w-48 lg:w-64 bg-[#151820]/90 border border-white/10 focus:border-[#E50914] text-sm text-white placeholder-neutral-500 rounded-full pl-9 pr-4 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#E50914] transition-all"
                  />
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5 pointer-events-none" />
                </form>

                {/* Instant Search Dropdown */}
                {searchOpen && searchResults.length > 0 && (
                  <div className="absolute top-full mt-2 right-0 w-80 lg:w-96 glass-dropdown rounded-xl shadow-2xl overflow-hidden z-50 p-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-3 py-1.5 flex justify-between items-center">
                      <span>Quick Results</span>
                      {isSearching && <span className="animate-spin text-xs">⏳</span>}
                    </div>
                    <div className="space-y-1">
                      {searchResults.map((item) => (
                        <Link
                          key={item.id}
                          to={item.type === 'movie' ? `/movie/${item.slug}` : `/tv/${item.slug}`}
                          onClick={() => {
                            setSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors group"
                        >
                          <img
                            src={getTMDBImageUrl(item.posterPath, 'w300')}
                            alt={item.title}
                            className="w-10 h-14 object-cover rounded bg-neutral-800 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-white group-hover:text-[#E50914] truncate">
                              {item.title}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                              <span className="capitalize px-1.5 py-0.2 rounded bg-white/10 text-[10px] uppercase font-bold text-neutral-300">
                                {item.type}
                              </span>
                              <span>{formatYear(item.releaseDate)}</span>
                              <span className="flex items-center gap-1">
                                <span className="text-[9px] font-black px-1 py-0.2 rounded bg-[#F5C518] text-black">IMDb</span>
                                <span className="font-semibold text-neutral-200">{formatRating(item.imdbRating || item.voteAverage)}</span>
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white" />
                        </Link>
                      ))}
                    </div>
                    <Link
                      to={`/search?q=${encodeURIComponent(searchQuery)}`}
                      onClick={() => setSearchOpen(false)}
                      className="block text-center text-xs font-semibold text-[#E50914] hover:underline p-2 border-t border-white/5 mt-1"
                    >
                      View all results for &quot;{searchQuery}&quot;
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile Search Button */}
              <button
                type="button"
                onClick={() => setSearchOpen(!searchOpen)}
                className="md:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors"
                aria-label="Open Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Watchlist Quick Link */}
              <Link
                to="/favorites"
                className="relative p-2 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors"
                aria-label="Watchlist"
                title="Your Watchlist"
              >
                <Bookmark className="w-5 h-5" />
                {watchlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#E50914] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow">
                    {watchlist.length > 99 ? '99+' : watchlist.length}
                  </span>
                )}
              </Link>

              {/* User Profile Button */}
              <div
                className="hidden sm:flex items-center gap-2 p-1 pl-2 rounded-full bg-white/5 border border-white/10 cursor-pointer hover:border-white/20 transition-colors"
                title="Guest Streaming Profile"
              >
                <span className="text-xs font-semibold text-neutral-300">VIP</span>
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#E50914] to-red-600 flex items-center justify-center text-white text-xs font-bold">
                  <User className="w-4 h-4" />
                </div>
              </div>

              {/* Mobile Hamburger Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar Dropdown */}
        {searchOpen && (
          <div className="md:hidden px-4 pt-3 pb-2 bg-[#08090c] border-b border-white/10">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search movies, TV shows, actors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full bg-[#151820] border border-white/15 focus:border-[#E50914] text-sm text-white placeholder-neutral-500 rounded-lg pl-10 pr-10 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#E50914]"
              />
              <Search className="w-5 h-5 text-neutral-400 absolute left-3 top-3 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>

            {/* Mobile Instant Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 divide-y divide-white/5 max-h-60 overflow-y-auto">
                {searchResults.map((item) => (
                  <Link
                    key={item.id}
                    to={item.type === 'movie' ? `/movie/${item.slug}` : `/tv/${item.slug}`}
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="flex items-center gap-3 py-2"
                  >
                    <img
                      src={getTMDBImageUrl(item.posterPath, 'w300')}
                      alt={item.title}
                      className="w-8 h-12 object-cover rounded bg-neutral-800"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{item.title}</div>
                      <div className="text-xs text-neutral-400">
                        {item.type.toUpperCase()} • {formatYear(item.releaseDate)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-16 right-0 bottom-0 w-3/4 max-w-sm bg-[#101217] border-l border-white/10 p-6 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-6">
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Menu
              </div>
              <div className="space-y-2">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive =
                    link.path === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(link.path);
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl text-base font-semibold transition-colors ${
                        isActive
                          ? 'bg-[#E50914] text-white'
                          : 'text-neutral-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{link.name}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-white/10">
                <Link
                  to="/favorites"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-3 rounded-xl bg-white/5 text-neutral-200 font-semibold"
                >
                  <div className="flex items-center gap-3">
                    <Bookmark className="w-5 h-5 text-[#E50914]" />
                    <span>Watchlist</span>
                  </div>
                  <span className="bg-[#E50914] text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    {watchlist.length}
                  </span>
                </Link>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 text-xs text-neutral-500">
              <p>Tstream Platform</p>
              <p className="mt-1">Powered by TMDB Metadata API</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
