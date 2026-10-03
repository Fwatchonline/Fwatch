import { User, CreditCard, MessageSquare, PlusCircle, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useUI } from '../context/UIContext';

export function UserDropdown() {
  const { userDropdownOpen, setUserDropdownOpen } = useUI();
  const navigate = useNavigate();

  if (!userDropdownOpen) return null;

  return (
    <div
      className="absolute top-16 right-6 w-60 rounded-2xl bg-[#181920] border border-[#2b2d38] shadow-2xl p-3 z-50 animate-slide-up"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header Profile Info */}
      <div className="flex items-center gap-3 p-2.5 mb-2 rounded-xl bg-white/5 border border-white/5">
        <img
          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
          alt="Sebastian_W"
          className="w-10 h-10 rounded-full object-cover border-2 border-[#F5C518]"
        />
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-white truncate">Sebastian_W</h4>
          <span className="text-[11px] font-semibold text-[#F5C518]">VIP Member</span>
        </div>
      </div>

      {/* Menu Links */}
      <div className="space-y-1">
        <Link
          to="/profile"
          onClick={() => setUserDropdownOpen(false)}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
        >
          <User className="w-4 h-4 text-neutral-400" />
          <span>Edit Profile</span>
        </Link>
        <Link
          to="/purchases"
          onClick={() => setUserDropdownOpen(false)}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
        >
          <CreditCard className="w-4 h-4 text-neutral-400" />
          <span>My Purchases</span>
        </Link>
        <Link
          to="/request"
          onClick={() => setUserDropdownOpen(false)}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
        >
          <PlusCircle className="w-4 h-4 text-neutral-400" />
          <span>Request Titles</span>
        </Link>
      </div>

      {/* Logout / Login Button */}
      <div className="mt-3 pt-2 border-t border-white/10">
        <button
          type="button"
          onClick={() => {
            setUserDropdownOpen(false);
            navigate('/login');
          }}
          className="w-full py-2 px-3 rounded-xl bg-[#F5C518] hover:bg-[#E5B508] text-black text-xs font-bold transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
