import { Link, useLocation } from 'react-router-dom';
import {
  Compass,
  Bookmark,
  FileText,
  Users,
  Headphones,
  HelpCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  Play,
  Sparkles,
  Tv,
} from 'lucide-react';
import { useUI } from '../context/UIContext';
import { useWatchlist } from '../hooks/useWatchlist';

export function Sidebar() {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar } = useUI();
  const { watchlist } = useWatchlist();

  const isRouteActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { label: 'Discover', path: '/', icon: Compass },
    { label: 'New Episodes', path: '/episodes', icon: Tv },
    { label: 'Anime', path: '/anime', icon: Sparkles },
    { label: 'Watchlist', path: '/watchlist', icon: Bookmark, badge: watchlist.length },
    { label: 'Popular People', path: '/people', icon: Users },
  ];

  const subItems = [
    { label: 'Contact Us', path: '/contact', icon: Headphones },
    { label: 'Help Center', path: '/help', icon: HelpCircle },
    { label: 'Setting', path: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-[#14151a] border-r border-[#22242c] transition-all duration-300 flex flex-col justify-between select-none ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Brand & Toggle */}
      <div>
        <div className="h-18 px-5 flex items-center justify-between border-b border-[#22242c]/50 relative">
          <Link to="/" className="flex items-center gap-2.5 group" aria-label="Tstream Home">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#B81D24] to-[#E50914] flex items-center justify-center shadow-lg shadow-red-900/40 group-hover:scale-105 transition-transform flex-shrink-0">
              <span className="font-extrabold text-white text-xl tracking-tighter flex items-center">
                T<Play className="w-3.5 h-3.5 fill-white ml-0.5" />
              </span>
            </div>
            {!sidebarCollapsed && (
              <span className="text-xl font-black tracking-tight text-white flex items-center">
                T<span className="text-[#E50914]">stream</span>
              </span>
            )}
          </Link>

          {/* Collapse/Expand Toggle Button */}
          <button
            type="button"
            onClick={toggleSidebar}
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            className="w-7 h-7 rounded-full bg-[#1b1c24] hover:bg-[#E50914] text-neutral-400 hover:text-white border border-white/10 flex items-center justify-center transition-colors absolute -right-3.5 top-6 z-50 shadow-md cursor-pointer"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Primary Menu */}
        <div className="px-3 pt-6">
          {!sidebarCollapsed && (
            <p className="px-3 text-[11px] font-semibold tracking-wider uppercase text-neutral-500 mb-2">
              Menu
            </p>
          )}

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isRouteActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                    active
                      ? 'bg-[#E50914]/15 text-[#E50914] font-bold shadow-sm'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#E50914] rounded-r-full shadow-sm shadow-red-500/50" />
                  )}
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${
                      active ? 'text-[#E50914]' : 'text-neutral-400 group-hover:text-white'
                    }`}
                  />
                  {!sidebarCollapsed && (
                    <span className="flex-1 truncate">{item.label}</span>
                  )}
                  {!sidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#E50914]/20 text-[#E50914]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Divider */}
        <div className="my-5 border-t border-[#22242c] mx-4" />

        {/* Secondary Submenu */}
        <div className="px-3">
          <nav className="space-y-1">
            {subItems.map((item) => {
              const Icon = item.icon;
              const active = isRouteActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    active
                      ? 'bg-[#E50914]/15 text-[#E50914] font-bold shadow-sm'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${
                      active ? 'text-[#E50914]' : 'text-neutral-400 group-hover:text-white'
                    }`}
                  />
                  {!sidebarCollapsed && (
                    <span className="flex-1 truncate">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Sidebar bottom spacing / footer */}
      <div className="p-3 mb-2" />
    </aside>
  );
}
