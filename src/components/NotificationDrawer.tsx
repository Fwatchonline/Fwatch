import { X, Bell, Check, ExternalLink, Play, Tv, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUI } from '../context/UIContext';

export function NotificationDrawer() {
  const {
    notificationsOpen,
    setNotificationsOpen,
    notifications,
    markAllNotificationsRead,
    markNotificationRead,
  } = useUI();

  if (!notificationsOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={() => setNotificationsOpen(false)}
    >
      <div
        className="w-full max-w-sm sm:max-w-md rounded-3xl bg-[#14161E] border border-white/10 shadow-2xl p-5 text-white flex flex-col max-h-[85vh] animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-950/60 border border-red-500/40 text-[#E50914]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-black bg-[#E50914] text-white rounded-full animate-pulse shadow shadow-red-900/40">
                    {unreadCount} New Today
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400 font-medium">
                New series episodes released today
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllNotificationsRead}
                title="Mark all as read"
                className="p-1.5 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1"
              >
                <Check className="w-4 h-4 text-[#E50914]" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setNotificationsOpen(false)}
              className="p-1.5 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 no-scrollbar">
          {notifications.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Tv className="w-10 h-10 text-neutral-600 mx-auto" />
              <p className="text-xs font-bold text-neutral-400">
                Checking today&apos;s broadcasts...
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <Link
                key={item.id}
                to={item.link}
                onClick={() => {
                  markNotificationRead(item.id);
                  setNotificationsOpen(false);
                }}
                className={`group relative flex items-start gap-3 p-3 rounded-2xl border transition-all hover:border-[#E50914]/50 hover:bg-white/5 ${
                  !item.read
                    ? 'bg-[#1A1D27] border-white/10 shadow-sm'
                    : 'bg-[#101218]/60 border-white/5 opacity-80 hover:opacity-100'
                }`}
              >
                {/* Thumbnail image with play hover */}
                <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-black/60 shrink-0 border border-white/10">
                  <img
                    src={item.image}
                    alt={item.mediaTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-7 h-7 rounded-full bg-[#E50914] text-white flex items-center justify-center shadow shadow-red-900/40">
                      <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-wide">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>NEW TODAY</span>
                    </span>
                    <span className="text-[10px] text-neutral-500 font-semibold">{item.time}</span>
                  </div>

                  <h4 className="text-xs font-extrabold text-white truncate group-hover:text-[#E50914] transition-colors">
                    {item.mediaTitle}
                  </h4>

                  <p className="text-[11px] text-neutral-300 font-medium truncate">
                    {item.title}
                  </p>

                  {item.episodeName && (
                    <p className="text-[10px] text-neutral-400 italic truncate">
                      &quot;{item.episodeName}&quot;
                    </p>
                  )}
                </div>

                {!item.read && (
                  <div className="w-2 h-2 rounded-full bg-[#E50914] mt-2 shrink-0 animate-ping" />
                )}
              </Link>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
          <Link
            to="/episodes"
            onClick={() => setNotificationsOpen(false)}
            className="text-xs font-bold text-[#E50914] hover:text-[#B81D24] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>All New Episodes Calendar</span>
            <ExternalLink className="w-3 h-3" />
          </Link>

          <button
            type="button"
            onClick={() => setNotificationsOpen(false)}
            className="text-xs font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
