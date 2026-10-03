import { X, Bell, Check, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUI } from '../context/UIContext';

export function NotificationDrawer() {
  const { notificationsOpen, setNotificationsOpen, notifications, markAllNotificationsRead } = useUI();

  if (!notificationsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-sm rounded-2xl bg-[#181920] border border-[#2b2d38] shadow-2xl p-4 sm:p-5 text-white flex flex-col max-h-[85vh] animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#F5C518]" />
            <h3 className="font-bold text-base">Notifications</h3>
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#F5C518] text-black rounded-full">
              {notifications.filter((n) => !n.read).length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={markAllNotificationsRead}
              title="Mark all as read"
              className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setNotificationsOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 divide-y divide-white/5">
          {notifications.map((item) => (
            <Link
              key={item.id}
              to={item.link}
              onClick={() => setNotificationsOpen(false)}
              className={`flex items-start gap-3 p-2.5 rounded-xl transition-colors hover:bg-white/5 ${
                !item.read ? 'bg-[#F5C518]/5' : ''
              }`}
            >
              <img
                src={item.image}
                alt={item.mediaTitle}
                className="w-12 h-16 rounded-lg object-cover flex-shrink-0 border border-white/10"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-[#F5C518] uppercase tracking-wider">
                    {item.type}
                  </span>
                  <span className="text-[10px] text-neutral-500">{item.time}</span>
                </div>
                <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                <p className="text-xs text-neutral-400 truncate">{item.mediaTitle}</p>
              </div>
              {!item.read && (
                <div className="w-2 h-2 rounded-full bg-[#F5C518] mt-2 flex-shrink-0" />
              )}
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 text-center">
          <button
            type="button"
            onClick={() => setNotificationsOpen(false)}
            className="text-xs font-semibold text-neutral-400 hover:text-[#F5C518] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
