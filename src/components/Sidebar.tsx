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
  Crown,
  Play,
  Sparkles,
} from 'lucide-react';
import { useUI } from '../context/UIContext';
import { useWatchlist } from '../hooks/useWatchlist';

export function Sidebar() {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar, setPlansModalOpen } = useUI();
  const { watchlist } = useWatchlist();

  const isRouteActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { label: 'Discover', path: '/', icon: Compass },
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
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#E5B508] to-[#F5C518] flex items-center justify-center shadow-lg shadow-[#F5C518]/20 group-hover:scale-105 transition-transform flex-shrink-0">
              <span className="font-extrabold text-black text-xl tracking-tighter flex items-center">
                T<Play className="w-3.5 h-3.5 fill-black ml-0.5" />
              </span>
            </div>
            {!sidebarCollapsed && (
              <span className="text-xl font-bold tracking-tight text-white flex items-center">
                T<span className="text-[#F5C518]">.Movie</span>
              </span>
            )}
          </Link>

          {/* Collapse/Expand Toggle Button */}
          <button
            type="button"
            onClick={toggleSidebar}
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            className="w-7 h-7 rounded-full bg-[#1b1c24] hover:bg-[#F5C518] text-neutral-400 hover:text-black border border-white/10 flex items-center justify-center transition-colors absolute -right-3.5 top-6 z-50 shadow-md"
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
                      ? 'bg-[#1e2029] text-[#F5C518] font-semibold'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#F5C518] rounded-r-full" />
                  )}
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${
                      active ? 'text-[#F5C518]' : 'text-neutral-400 group-hover:text-white'
                    }`}
                  />
                  {!sidebarCollapsed && (
                    <span className="flex-1 truncate">{item.label}</span>
                  )}
                  {!sidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#F5C518]/20 text-[#F5C518]">
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
                      ? 'bg-[#1e2029] text-[#F5C518] font-semibold'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${
                      active ? 'text-[#F5C518]' : 'text-neutral-400 group-hover:text-white'
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

      {/* Bottom Subscription CTA Card */}
      <div className="p-3 mb-2">
        {!sidebarCollapsed ? (
          <div className="p-3.5 rounded-2xl bg-[#191a22] border border-[#2b2d38] text-center">
            <p className="text-[11px] text-neutral-400 leading-relaxed mb-3">
              Click the button below to see the plans
            </p>
            <button
              type="button"
              onClick={() => setPlansModalOpen(true)}
              className="w-full py-2 px-3 rounded-xl bg-transparent hover:bg-[#F5C518]/10 border border-[#F5C518] text-[#F5C518] text-xs font-bold transition-all flex items-center justify-center gap-2 group shadow-sm hover:shadow-[#F5C518]/20"
            >
              <Crown className="w-4 h-4 text-[#F5C518] group-hover:scale-110 transition-transform" />
              <span>see plans</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setPlansModalOpen(true)}
            title="See Plans"
            className="w-12 h-12 mx-auto rounded-xl border border-[#F5C518] bg-[#F5C518]/10 text-[#F5C518] flex items-center justify-center hover:bg-[#F5C518] hover:text-black transition-colors"
          >
            <Crown className="w-5 h-5" />
          </button>
        )}
      </div>
    </aside>
  );
}
