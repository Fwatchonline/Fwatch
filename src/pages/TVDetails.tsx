import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Play,
  Bookmark,
  Star,
  Film,
  Tv,
  X,
  ChevronLeft,
  ChevronRight,
  Globe,
  Clock,
  Calendar,
  Subtitles,
  Award,
} from 'lucide-react';
import { tmdbService } from '../services/tmdb';
import { MediaItem, TMDBSeason, TMDBEpisode } from '../types';
import { getTMDBImageUrl } from '../utils/slugify';
import { useWatchlist } from '../hooks/useWatchlist';
import { SEO } from '../components/SEO';
import { MovieCard } from '../components/MovieCard';

const DEFAULT_STARS = [
  { name: 'Olivia Cooke', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', role: 'Alicent Hightower' },
  { name: 'Matt Smith', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', role: 'Daemon Targaryen' },
  { name: 'Milly Alcock', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', role: 'Young Rhaenyra' },
  { name: 'Rhys Ifans', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80', role: 'Otto Hightower' },
  { name: 'Emma D’Arcy', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80', role: 'Rhaenyra Targaryen' },
  { name: 'Harry Collett', image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&q=80', role: 'Jacaerys Velaryon' },
  { name: 'Bill Paterson', image: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80', role: 'Lord Lyman Beesbury' },
];

export function TVDetails() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  const [tvShow, setTvShow] = useState<MediaItem | null>(null);
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState(1);
  const [currentSeason, setCurrentSeason] = useState<TMDBSeason | null>(null);
  const [similar, setSimilar] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Information' | 'Episodes' | 'More Like This' | 'Reviews'>('Information');
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!slug) return;

    setLoading(true);
    tmdbService.resolveMediaBySlug('tv', slug).then((res) => {
      if (mounted) {
        setTvShow(res);
        setLoading(false);
        if (res?.tmdbId) {
          tmdbService.getSeason(res.tmdbId, 1).then((s) => {
            if (mounted) setCurrentSeason(s);
          });
          tmdbService.getSimilar('tv', res.tmdbId).then((sim) => {
            if (mounted) setSimilar(sim);
          });
        }
      }
    });

    return () => {
      mounted = false;
    };
  }, [slug]);

  const handleSeasonChange = (num: number) => {
    if (!tvShow) return;
    setSelectedSeasonNumber(num);
    tmdbService.getSeason(tvShow.tmdbId, num).then((s) => {
      setCurrentSeason(s);
    });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!tvShow) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white mb-2">Series Not Found</h2>
        <Link to="/tv" className="text-[#F5C518] font-semibold hover:underline">
          Return to Series
        </Link>
      </div>
    );
  }

  const isSaved = isInWatchlist(tvShow.tmdbId, 'tv');
  const totalSeasons = tvShow.numberOfSeasons || 2;
  const seasonsList = Array.from({ length: totalSeasons }, (_, i) => i + 1);

  return (
    <div className="space-y-8 py-4">
      <SEO
        title={`${tvShow.title} - T.Movie`}
        description={tvShow.overview || `Watch ${tvShow.title} online.`}
      />

      {/* Top Ornate Media Showcase Card (Image 2) */}
      <div className="rounded-3xl bg-[#16171E] border border-white/5 p-6 sm:p-10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-8">
        {/* Background ambient poster glow */}
        <div className="absolute inset-0 z-0 opacity-15 pointer-events-none">
          <img
            src={getTMDBImageUrl(tvShow.backdropPath || tvShow.posterPath, 'original', 'backdrop')}
            alt={tvShow.title}
            className="w-full h-full object-cover blur-2xl"
          />
        </div>

        {/* Left: Poster inside curved corner box */}
        <div className="relative z-10 w-52 sm:w-60 md:w-68 aspect-[2/3] rounded-3xl overflow-hidden bg-black/40 border-2 border-[#F5C518]/30 shadow-2xl flex-shrink-0 group">
          <img
            src={getTMDBImageUrl(tvShow.posterPath, 'w500')}
            alt={tvShow.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        {/* Right: Title, Metrics, Overview & Action Buttons */}
        <div className="relative z-10 flex-1 space-y-4 text-center md:text-left">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {tvShow.title}{' '}
              <span className="text-neutral-500 font-normal text-2xl">
                ({tvShow.releaseDate ? tvShow.releaseDate.slice(0, 4) : '2022'}-)
              </span>
            </h1>

            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2 text-xs font-bold">
              <span className="px-2 py-0.5 rounded-md bg-white/10 text-neutral-300">16-18+</span>
              <span className="px-2 py-0.5 rounded-md bg-white/10 text-neutral-300">1080p</span>
              <span className="px-2 py-0.5 rounded-md bg-white/10 text-neutral-300">
                Season {selectedSeasonNumber}
              </span>
            </div>
          </div>

          {/* Genre Chips */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            {(tvShow.genres && tvShow.genres.length > 0
              ? tvShow.genres
              : ['Action', 'Adventure', 'Drama']
            ).map((g) => (
              <span
                key={typeof g === 'string' ? g : g.name}
                className="px-3 py-1 rounded-xl bg-[#0E0F12] border border-white/5 text-xs font-semibold text-neutral-300"
              >
                {typeof g === 'string' ? g : g.name}
              </span>
            ))}
          </div>

          {/* Rating Metrics (Image 2: IMDb 8.4, Rotten Tomatoes 88%, Letterboxd, Metacritic) */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 py-1 text-xs font-extrabold">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#F5C518] text-black font-black">
              <span className="text-xs tracking-tight">IMDb</span>
              <span className="text-sm">{tvShow.imdbRating ? Number(tvShow.imdbRating).toFixed(1) : (tvShow.voteAverage ? tvShow.voteAverage.toFixed(1) : '8.4')}</span>
              <Star className="w-3.5 h-3.5 fill-black" />
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0E0F12] border border-white/10 text-neutral-200">
              <span className="text-red-500">🍅</span>
              <span>88% Rotten Tomatoes</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0E0F12] border border-white/10 text-neutral-200">
              <span className="text-emerald-400">⭐</span>
              <span>2.6 Letterboxd</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0E0F12] border border-white/10 text-neutral-200">
              <span className="text-amber-400">📊</span>
              <span>79 Metacritic</span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-2xl">
            {tvShow.overview ||
              'The Targaryen dynasty is at the absolute apex of its power, with more than 15 dragons under their yoke. Most empires crumble from such heights; in the case of the Targaryens, their slow fall begins when King Viserys breaks with a century of tradition by naming his daughter Rhaenyra heir to the Iron Throne.'}
          </p>

          {/* Play & Trailer Buttons */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
            <Link
              to={`/watch/tv/${tvShow.slug}/season/${selectedSeasonNumber}/episode/1`}
              className="py-2.5 px-6 rounded-xl bg-[#F5C518] hover:bg-[#E5B508] text-black text-xs sm:text-sm font-extrabold tracking-wide transition-all shadow-lg shadow-[#F5C518]/25 flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>Play next Episode</span>
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
              onClick={() => toggleWatchlist(tvShow)}
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

      {/* Tab Navigation (Information, Episodes, More Like This) */}
      <div className="border-b border-[#2b2d38] flex items-center gap-8 text-sm font-bold">
        {(['Information', 'Episodes', 'More Like This'] as const).map((tab) => {
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

      {/* TAB 1: Information Section & Stars (Image 2) */}
      {(activeTab === 'Information' || activeTab === 'Episodes') && (
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
                <span className="font-semibold text-white">Ryan Condal</span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <span className="text-neutral-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#F5C518]" />
                  Release Date
                </span>
                <span className="font-semibold text-white">
                  {tvShow.releaseDate || 'August 21, 2022'}
                </span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <span className="text-neutral-400 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#F5C518]" />
                  Runtime
                </span>
                <span className="font-semibold text-white">110m</span>
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

              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <span className="text-neutral-400 flex items-center gap-2">
                  <Tv className="w-4 h-4 text-[#F5C518]" />
                  Network
                </span>
                <span className="font-semibold text-white">HBO</span>
              </div>
            </div>
          </div>

          {/* Stars (Cast Avatars with gold ring - Image 2) */}
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

      {/* TAB 2: Episodes Section (Image 2) */}
      {(activeTab === 'Episodes' || activeTab === 'Information') && (
        <div className="rounded-3xl bg-[#16171E] border border-white/5 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">Episodes</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Season {selectedSeasonNumber} • {currentSeason?.episodes?.length || 0} Episodes available
              </p>
            </div>

            {/* Season Selector Pills: season 1, season 2 (Image 2) */}
            <div className="flex items-center gap-2 p-1 rounded-xl bg-[#0E0F12] border border-white/5 flex-wrap">
              {seasonsList.map((num) => {
                const isActive = selectedSeasonNumber === num;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleSeasonChange(num)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      isActive ? 'bg-[#F5C518] text-black shadow' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    season {num}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Episode Cards Grid: Allows seeing all episodes cleanly */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-2">
            {(currentSeason?.episodes || []).map((ep) => (
              <Link
                key={ep.id}
                to={`/watch/tv/${tvShow.slug}/season/${selectedSeasonNumber}/episode/${ep.episodeNumber}`}
                className="rounded-2xl overflow-hidden bg-[#0E0F12] border border-white/5 hover:border-[#F5C518]/40 transition-all group flex flex-col shadow-lg"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-black/40">
                  <img
                    src={getTMDBImageUrl(ep.stillPath || tvShow.backdropPath, 'w500')}
                    alt={ep.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold text-[#F5C518]">
                    EP {ep.episodeNumber}
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-[#F5C518] text-black flex items-center justify-center shadow-lg">
                      <Play className="w-4 h-4 fill-black ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="p-3">
                  <h4 className="text-xs font-bold text-white group-hover:text-[#F5C518] transition-colors truncate">
                    {ep.name || `Episode ${ep.episodeNumber}`}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-1">
                    <span>{ep.runtime || 58}m</span>
                    <span className="flex items-center gap-1">
                      <span className="text-[9px] font-black px-1 py-0.2 rounded bg-[#F5C518] text-black">IMDb</span>
                      <span className="font-semibold text-neutral-200">{ep.voteAverage ? ep.voteAverage.toFixed(1) : '8.5'}</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: More Like This (Image 2) */}
      {(activeTab === 'More Like This' || activeTab === 'Information') && (
        <div className="rounded-3xl bg-[#16171E] border border-white/5 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">More Like This</h3>
            <Link
              to="/tv"
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
              src="https://www.youtube.com/embed/DotnJ7tTA34?autoplay=1"
              title={`${tvShow.title} Trailer`}
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
