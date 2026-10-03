import { Link } from 'react-router-dom';
import { Play, Film, Tv, ShieldCheck, Heart, Sparkles } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#050608] border-t border-white/10 pt-16 pb-12 text-neutral-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/5">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5 group inline-flex" aria-label="T.Movie Home">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#E5B508] to-[#F5C518] flex items-center justify-center shadow-lg shadow-[#F5C518]/20">
                <span className="font-extrabold text-black text-lg tracking-tighter flex items-center">
                  T<Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                </span>
              </div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center">
                T<span className="text-[#F5C518]">.Movie</span>
              </span>
            </Link>
            <p className="text-neutral-400 text-sm leading-relaxed max-w-sm">
              T.Movie is a cinematic streaming experience featuring real TMDB metadata, direct HLS video streaming, rich artist profiles, and curated recommendations.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-neutral-300">
                <ShieldCheck className="w-3.5 h-3.5 text-[#F5C518]" />
                <span>Direct HLS High Speed Edge</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-neutral-300">
                <Sparkles className="w-3.5 h-3.5 text-[#F5C518]" />
                <span>4K HDR Ready</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Discover</h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/" className="hover:text-white transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/movies" className="hover:text-white transition-colors">Movies</Link>
              </li>
              <li>
                <Link to="/tv" className="hover:text-white transition-colors">TV Shows</Link>
              </li>
              <li>
                <Link to="/people" className="hover:text-white transition-colors">Popular People</Link>
              </li>
              <li>
                <Link to="/trending" className="hover:text-white transition-colors">Trending</Link>
              </li>
              <li>
                <Link to="/watchlist" className="hover:text-white transition-colors">My Watchlist</Link>
              </li>
            </ul>
          </div>

          {/* Top Genres */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Popular Genres</h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/genre/action" className="hover:text-white transition-colors">Action</Link>
              </li>
              <li>
                <Link to="/genre/comedy" className="hover:text-white transition-colors">Comedy</Link>
              </li>
              <li>
                <Link to="/genre/drama" className="hover:text-white transition-colors">Drama</Link>
              </li>
              <li>
                <Link to="/genre/sci-fi" className="hover:text-white transition-colors">Sci-Fi &amp; Fantasy</Link>
              </li>
              <li>
                <Link to="/genre/horror" className="hover:text-white transition-colors">Horror</Link>
              </li>
              <li>
                <Link to="/genres" className="text-[#F5C518] font-semibold hover:underline">All Genres →</Link>
              </li>
            </ul>
          </div>

          {/* Legal & Policy */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Support &amp; Info</h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link>
              </li>
              <li>
                <Link to="/help" className="hover:text-white transition-colors">Help Center &amp; FAQ</Link>
              </li>
              <li>
                <Link to="/settings" className="hover:text-white transition-colors">Settings &amp; Preferences</Link>
              </li>
              <li>
                <span className="hover:text-white cursor-pointer transition-colors" title="Terms of Service">Terms of Service</span>
              </li>
              <li>
                <span className="hover:text-white cursor-pointer transition-colors" title="Privacy Policy">Privacy Policy</span>
              </li>
            </ul>
          </div>
        </div>

        {/* TMDB Attribution & Copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div className="flex items-center gap-3">
            {/* Official TMDB Logo Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded">
              <span className="font-extrabold text-[#01b4e4] tracking-tighter text-sm">TMDB</span>
            </div>
            <p>
              This product uses the TMDB API but is not endorsed or certified by TMDB.
            </p>
          </div>
          <div className="flex items-center gap-1">
            <span>© {new Date().getFullYear()} FWATCH. Designed with</span>
            <Heart className="w-3.5 h-3.5 text-[#ef174f] inline fill-[#ef174f]" />
            <span>for cinema lovers.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
