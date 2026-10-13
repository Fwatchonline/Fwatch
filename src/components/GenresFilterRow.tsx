import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tmdbService } from '../services/tmdb';
import { MediaItem } from '../types';
import { MovieCard } from './MovieCard';

const CATEGORIES = [
  { label: 'Comedy', id: 35 },
  { label: 'Drama', id: 18 },
  { label: 'Historical', id: 36 },
  { label: 'Action', id: 28 },
  { label: 'Love', id: 10749 },
  { label: 'Animation', id: 16 },
  { label: 'Imaginary', id: 14 },
  { label: 'Criminal', id: 80 },
];

export function GenresFilterRow() {
  const [selectedGenreId, setSelectedGenreId] = useState<number>(18); // Default Drama (active in screenshot!)
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    tmdbService
      .getByGenre(selectedGenreId, 'movie')
      .then((items) => {
        if (active) {
          setItems(items.slice(0, 10));
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedGenreId]);

  return (
    <section className="my-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Genres</h2>
        <Link
          to="/genres"
          className="text-xs sm:text-sm font-bold text-[#E50914] hover:text-[#B81D24] transition-colors flex items-center gap-1 group"
        >
          <span>View All</span>
          <span className="transform group-hover:translate-x-0.5 transition-transform">→</span>
        </Link>
      </div>

      {/* Filter Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3">
        {CATEGORIES.map((cat) => {
          const isActive = cat.id === selectedGenreId;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedGenreId(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#E50914] text-white shadow-lg shadow-red-900/30 scale-105'
                  : 'bg-[#181920] text-neutral-400 hover:text-white hover:bg-white/5 border border-white/5'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Items list */}
      {loading ? (
        <div className="flex items-center space-x-4 overflow-x-auto py-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="w-36 sm:w-44 md:w-48 lg:w-52 aspect-[2/3] rounded-2xl bg-white/5 animate-pulse flex-shrink-0"
            />
          ))}
        </div>
      ) : (
        <div className="flex items-start space-x-4 sm:space-x-5 overflow-x-auto no-scrollbar scroll-smooth py-2">
          {items.map((item) => (
            <MovieCard
              key={item.id}
              media={item}
              className="w-36 sm:w-44 md:w-48 lg:w-52 flex-shrink-0"
            />
          ))}
        </div>
      )}
    </section>
  );
}
