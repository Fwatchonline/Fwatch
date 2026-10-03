import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Play,
  Bookmark,
  Star,
  Film,
  X,
  Globe,
  Clock,
  Calendar,
  Subtitles,
  Award,
} from 'lucide-react';
import { tmdbService } from '../services/tmdb';
import { MediaItem } from '../types';
import { getTMDBImageUrl } from '../utils/slugify';
import { useWatchlist } from '../hooks/useWatchlist';
import { SEO } from '../components/SEO';
import { MovieCard } from '../components/MovieCard';

const DEFAULT_STARS = [
  { name: 'Cillian Murphy', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', role: 'Lead Actor' },
  { name: 'Emily Blunt', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', role: 'Supporting' },
  { name: 'Matt Damon', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80', role: 'Supporting' },
  { name: 'Robert Downey Jr.', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80', role: 'Supporting' },
  { name: 'Florence Pugh', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', role: 'Supporting' },
];

export function MovieDetails() {
  const { slug } = useParams<{ slug: string }>();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  const [movie, setMovie] = useState<MediaItem | null>(null);
  const [similar, setSimilar] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Information' | 'More Like This'>('Information');
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!slug) return;

    setLoading(true);
    tmdbService.resolveMediaBySlug('movie', slug).then((res) => {
      if (mounted) {
        setMovie(res);
        setLoading(false);
        if (res?.tmdbId) {
          tmdbService.getSimilar('movie', res.tmdbId).then((sim) => {
            if (mounted) setSimilar(sim);
          });
        }
      }
    });

    return () => {
      mounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white mb-2">Movie Not Found</h2>
        <Link to="/movies" className="text-[#F5C518] font-semibold hover:underline">
          Return to Movies
        </Link>
      </div>
    );
  }

  const isSaved = isInWatchlist(movie.tmdbId, 'movie');

  return (
    <div className="space-y-8 py-4">
      <SEO
        title={`${movie.title} - T.Movie`}
        description={movie.overview || `Watch ${movie.title} online.`}
      />

      {/* Top Ornate Media Showcase Card (Image 2) */}
      <div className="rounded-3xl bg-[#16171E] border border-white/5 p-6 sm:p-10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-8">
        <div className="absolute inset-0 z-0 opacity-15 pointer-events-none">
          <img
            src={getTMDBImageUrl(movie.backdropPath || movie.posterPath, 'original', 'backdrop')}
            alt={movie.title}
            className="w-full h-full object-cover blur-2xl"
          />
        </div>

        {/* Poster in curved frame */}
        <div className="relative z-10 w-52 sm:w-60 md:w-68 aspect-[2/3] rounded-3xl overflow-hidden bg-black/40 border-2 border-[#F5C518]/30 shadow-2xl flex-shrink-0 group">
          <img
            src={getTMDBImageUrl(movie.posterPath, 'w500')}
            alt={movie.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        {/* Title, Badges, Metrics & Buttons */}
        <div className="relative z-10 flex-1 space-y-4 text-center md:text-left">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {movie.title}{' '}
              <span className="text-neutral-500 font-normal text-2xl">
                ({movie.releaseDate ? movie.releaseDate.slice(0, 4) : '2024'})
              </span>
            </h1>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2 text-xs font-bold">
              <span className="px-2 py-0.5 rounded-md bg-white/10 text-neutral-300">16-18+</span>
              <span className="px-2 py-0.5 rounded-md bg-white/10 text-neutral-300">4K UHD</span>
              <span className="px-2 py-0.5 rounded-md bg-white/10 text-neutral-300">
                {movie.runtime ? `${movie.runtime}m` : '124m'}
              </span>
            </div>
          </div>

          {/* Genre Chips */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            {(movie.genres && movie.genres.length > 0
              ? movie.genres
              : ['Action', 'Thriller', 'Drama']
            ).map((g) => (
              <span
                key={typeof g === 'string' ? g : g.name}
                className="px-3 py-1 rounded-xl bg-[#0E0F12] border border-white/5 text-xs font-semibold text-neutral-300"
              >
                {typeof g === 'string' ? g : g.name}
              </span>
            ))}
          </div>

          {/* Ratings */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 py-1 text-xs font-extrabold">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#F5C518] text-black font-black">
              <span className="text-xs tracking-tight">IMDb</span>
              <span className="text-sm">{movie.imdbRating ? Number(movie.imdbRating).toFixed(1) : (movie.voteAverage ? movie.voteAverage.toFixed(1) : '8.2')}</span>
              <Star className="w-3.5 h-3.5 fill-black" />
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0E0F12] border border-white/10 text-neutral-200">
              <span className="text-red-500">🍅</span>
              <span>91% Rotten Tomatoes</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0E0F12] border border-white/10 text-neutral-200">
              <span className="text-emerald-400">⭐</span>
              <span>4.1 Letterboxd</span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-2xl">
            {movie.overview ||
              'A medical courier unwittingly finds himself fighting for survival as one fateful, horrifying night collapses around him in chaos.'}
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
            <Link
              to={`/watch/movie/${movie.slug}`}
              className="py-2.5 px-6 rounded-xl bg-[#F5C518] hover:bg-[#E5B508] text-black text-xs sm:text-sm font-extrabold tracking-wide transition-all shadow-lg shadow-[#F5C518]/25 flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>Play Movie</span>
            </Link>

            <button
              type="button"
              onClick={() => setShowTrailer(true)}
              className="py-2.5 px-6 rounded-xl bg-black/40 hover:bg-black/60 border border-[#F5C518]/40 hover:border-[#F5C518] text-white text-xs sm:text-sm font-bold tracking-wide transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Film className="w-4 h-4 text-[#F5C518]" />
              <span>Watch Trailer</span>
            </button>

            <button
              type="button"
              onClick={() => toggleWatchlist(movie)}
              className={`p-2.5 rounded-xl border transition-colors ${
                isSaved
                  ? 'bg-[#F5C518] border-[#F5C518] text-black'
                  : 'bg-black/40 border-white/10 hover:border-[#F5C518] text-white'
              }`}
              title={isSaved ? 'Remove from Watchlist' : 'Add to Watchlist'}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-black' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-[#2b2d38] flex items-center gap-8 text-sm font-bold">
        {(['Information', 'More Like This'] as const).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`py-3 relative transition-colors cursor-pointer ${
                isActive ? 'text-[#F5C518]' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>{tab}</span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F5C518] rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Information Tab & Stars */}
      {(activeTab === 'Information') && (
        <div className="rounded-3xl bg-[#16171E] border border-white/5 p-6 sm:p-8 space-y-8">
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-12 text-xs sm:text-sm">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <span className="text-neutral-400 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#F5C518]" />
                  Country
                </span>
                <span className="font-semibold text-white">United States</span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <span className="text-neutral-400 flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#F5C518]" />
                  Director
                </span>
                <span className="font-semibold text-white">Christopher Nolan</span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <span className="text-neutral-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#F5C518]" />
                  Release Date
                </span>
                <span className="font-semibold text-white">
                  {movie.releaseDate || '2024'}
                </span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <span className="text-neutral-400 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#F5C518]" />
                  Runtime
                </span>
                <span className="font-semibold text-white">{movie.runtime || 125}m</span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <span className="text-neutral-400 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#F5C518]" />
                  Language
                </span>
                <span className="font-semibold text-white">English ⌵</span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <span className="text-neutral-400 flex items-center gap-2">
                  <Subtitles className="w-4 h-4 text-[#F5C518]" />
                  Closed-caption
                </span>
                <span className="font-semibold text-white">English ⌵</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-4">Stars</h4>
            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-2">
              {DEFAULT_STARS.map((star) => (
                <div key={star.name} className="flex flex-col items-center text-center flex-shrink-0 group">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#F5C518]/50 group-hover:border-[#F5C518] group-hover:scale-105 transition-all shadow-md shadow-[#F5C518]/10 mb-2">
                    <img src={star.image} alt={star.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs font-bold text-white group-hover:text-[#F5C518] transition-colors truncate max-w-[90px]">
                    {star.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* More Like This Tab */}
      {(activeTab === 'More Like This' || activeTab === 'Information') && (
        <div className="rounded-3xl bg-[#16171E] border border-white/5 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">More Like This</h3>
            <Link
              to="/movies"
              className="text-xs sm:text-sm font-bold text-[#F5C518] hover:text-[#E5B508] transition-colors"
            >
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {similar.slice(0, 5).map((item) => (
              <MovieCard key={item.id} media={item} />
            ))}
          </div>
        </div>
      )}

      {/* Trailer Modal */}
      {showTrailer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-4xl aspect-video bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowTrailer(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/70 hover:bg-black text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <iframe
              src="https://www.youtube.com/embed/uYPbbksJxIg?autoplay=1"
              title={`${movie.title} Trailer`}
              allow="autoplay; encrypted-media"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        </div>
      )}
    </div>
  );
}
