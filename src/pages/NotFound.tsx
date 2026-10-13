import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';

export function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16 space-y-8 select-none">
      <SEO
        title="404 - Not Found - Tstream"
        description="Oops! The page you're looking for cannot be found."
        noIndex={true}
      />

      {/* Subtitle in Red */}
      <h2 className="text-base sm:text-lg font-bold text-[#E50914]">
        Oops! The page you&apos;re looking for cannot be found.
      </h2>

      {/* Giant 404 with Film Collage Clipping Mask */}
      <div className="relative my-4">
        <h1
          className="text-8xl sm:text-[160px] md:text-[200px] font-black tracking-widest leading-none uppercase select-none font-sans"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'contrast(140%) grayscale(100%) drop-shadow(0 0 20px rgba(0,0,0,0.8))',
          }}
        >
          404
        </h1>
      </div>

      {/* GO HOME button */}
      <div>
        <Link
          to="/"
          className="inline-block px-10 py-3 rounded-2xl bg-[#0E0F12] hover:bg-[#E50914] border border-[#E50914] text-[#E50914] hover:text-white text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all duration-300 shadow-lg shadow-red-900/30"
        >
          GO HOME
        </Link>
      </div>
    </div>
  );
}
