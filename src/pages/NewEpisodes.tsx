import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  Play,
  Star,
  Search,
  SlidersHorizontal,
  Flame,
  Calendar,
  Sparkles,
  Info,
  Tv,
  ChevronRight,
  TrendingUp,
  Filter,
} from 'lucide-react';
import { tmdbService } from '../services/tmdb';
import { TMDBEpisode } from '../types';
import { EpisodeCard } from '../components/EpisodeCard';
import { Pagination } from '../components/Pagination';
import { SEO } from '../components/SEO';
import { getTMDBImageUrl, formatDate } from '../utils/slugify';

type FilterTab = 'all' | 'this_week' | 'today';
type SortOption = 'newest' | 'rating' | 'title';

export function NewEpisodes() {
  const navigate = useNavigate();
  const [episodes, setEpisodes] = useState<TMDBEpisode[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);

  // UI state: filter tab, search query, and sort order
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Load live paginated episodes from TMDB
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    tmdbService.getNewEpisodesPaginated(currentPage).then((res) => {
      if (mounted) {
        setEpisodes(res.results || []);
        setTotalPages(Math.max(1, res.totalPages || 1));
        setTotalResults(res.totalResults || res.results?.length || 0);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [currentPage]);

  // Filter & sort episodes locally for instant responsiveness
  const filteredEpisodes = useMemo(() => {
    let list = [...episodes];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (ep) =>
          ep.showTitle.toLowerCase().includes(q) ||
          ep.name.toLowerCase().includes(q) ||
          ep.overview?.toLowerCase().includes(q)
      );
    }

    // Tab filter by air date
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    if (activeTab === 'today') {
      list = list.filter((ep) => ep.airDate === todayStr);
    } else if (activeTab === 'this_week') {
      list = list.filter((ep) => ep.airDate && ep.airDate >= sevenDaysAgoStr);
    }

    // Sort order
    if (sortBy === 'newest') {
      list.sort((a, b) => (b.airDate || '').localeCompare(a.airDate || ''));
    } else if (sortBy === 'rating') {
      list.sort((a, b) => (b.voteAverage || 0) - (a.voteAverage || 0));
    } else if (sortBy === 'title') {
      list.sort((a, b) => a.showTitle.localeCompare(b.showTitle));
    }

    return list;
  }, [episodes, searchQuery, activeTab, sortBy]);

  // Spotlight episode for the top hero banner
  const heroEpisode = episodes.length > 0 ? episodes[0] : null;

  return (
    <div className="space-y-8 py-2">
      <SEO
        title="New Episodes - Recently Aired TV Shows | T.Movie"
        description="Stream the latest aired television episodes and newest season premieres from TMDB. Watch fresh episodes online in high quality on T.Movie."
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'New Episodes', item: '/episodes' },
        ]}
      />

      {/* Page Title & Stats Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#F5C518] text-black text-[11px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md shadow-[#F5C518]/25">
              <Sparkles className="w-3 h-3 fill-black" />
              <span>Live TMDB Feed</span>
            </span>
            <span className="text-xs text-neutral-400 font-medium">
              Television Broadcast Releases
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            New Episodes
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Fresh episodes broadcast this week from top television series across global networks.
          </p>
        </div>

        {totalResults > 0 && (
          <div className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-[#16171E] border border-white/10 text-xs font-bold text-neutral-300">
            <span className="text-[#F5C518] font-extrabold mr-1">
              {totalResults.toLocaleString()}
            </span>
            <span>Episodes Available</span>
          </div>
        )}
      </div>

      {/* Hero Spotlight Banner */}
      {heroEpisode && (
        <div className="relative w-full rounded-3xl overflow-hidden min-h-[340px] sm:min-h-[400px] bg-[#16171E] border border-white/10 shadow-2xl flex flex-col justify-end p-6 sm:p-10 group">
          {/* Backdrop Image */}
          <div className="absolute inset-0">
            <img
              src={
                heroEpisode.stillPath
                  ? getTMDBImageUrl(heroEpisode.stillPath, 'original', 'backdrop')
                  : 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=1280&auto=format&fit=crop&q=80'
              }
              alt={heroEpisode.name}
              className="w-full h-full object-cover object-center scale-105 group-hover:scale-100 transition-transform duration-700 ease-out"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=1280&auto=format&fit=crop&q=80';
              }}
            />
            {/* Cinematic Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0E0F12] via-[#0E0F12]/80 to-black/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0E0F12] via-[#0E0F12]/85 to-transparent w-full md:w-3/4" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 max-w-2xl space-y-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-[#F5C518] text-black text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Flame className="w-3 h-3 fill-black" />
                <span>FEATURED PREMIERE</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[#F5C518] border border-white/10 text-[11px] font-black tracking-wider">
                S{String(heroEpisode.seasonNumber).padStart(2, '0')}E{String(heroEpisode.episodeNumber).padStart(2, '0')}
              </span>
              {heroEpisode.airDate && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-neutral-300 text-[11px] font-bold">
                  <Calendar className="w-3 h-3 text-[#F5C518]" />
                  <span>{formatDate(heroEpisode.airDate)}</span>
                </span>
              )}
              {heroEpisode.voteAverage > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white text-[11px] font-bold">
                  <Star className="w-3 h-3 fill-[#F5C518] text-[#F5C518]" />
                  <span>{heroEpisode.voteAverage.toFixed(1)}</span>
                </span>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-extrabold text-[#F5C518] uppercase tracking-wider">
                {heroEpisode.showTitle}
              </h3>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
                {heroEpisode.name}
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-neutral-300 line-clamp-2 max-w-xl leading-relaxed">
              {heroEpisode.overview ||
                'Stream this high-stakes television episode with multiple direct HLS streaming mirrors and rich subtitle tracks.'}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/watch/tv/${heroEpisode.showSlug}/season/${heroEpisode.seasonNumber}/episode/${heroEpisode.episodeNumber}`
                  )
                }
                className="py-2.5 px-6 rounded-xl bg-[#F5C518] hover:bg-[#E5B508] text-black text-xs sm:text-sm font-extrabold tracking-wide transition-all shadow-lg shadow-[#F5C518]/25 flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>WATCH EPISODE NOW</span>
              </button>

              <button
                type="button"
                onClick={() => navigate(`/tv/${heroEpisode.showSlug}`)}
                className="py-2.5 px-5 rounded-xl bg-black/50 hover:bg-black/70 border border-white/20 text-white text-xs sm:text-sm font-bold tracking-wide transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Tv className="w-4 h-4 text-[#F5C518]" />
                <span>View Full Series</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter, Search & Sort Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-3 rounded-2xl bg-[#14151a] border border-white/5 shadow-inner">
        {/* Timeline Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-[#F5C518] text-black font-extrabold shadow-md shadow-[#F5C518]/20'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            All New Episodes
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('this_week')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'this_week'
                ? 'bg-[#F5C518] text-black font-extrabold shadow-md shadow-[#F5C518]/20'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Broadcast This Week
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('today')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'today'
                ? 'bg-[#F5C518] text-black font-extrabold shadow-md shadow-[#F5C518]/20'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Aired Today
          </button>
        </div>

        {/* Right Controls: Search & Sort */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by series or episode..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/40 border border-white/10 focus:border-[#F5C518] text-xs text-white placeholder-neutral-500 outline-hidden transition-all"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-bold text-neutral-300 focus:border-[#F5C518] outline-hidden cursor-pointer"
            >
              <option value="newest">Newest Air Date</option>
              <option value="rating">Highest Rated</option>
              <option value="title">Series Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
            Fetching latest aired episodes from TMDB...
          </p>
        </div>
      ) : filteredEpisodes.length === 0 ? (
        <div className="text-center py-20 bg-[#14151a] border border-white/5 rounded-3xl p-8 space-y-3">
          <Clock className="w-12 h-12 text-neutral-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No episodes found</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            {searchQuery
              ? `No episodes matching "${searchQuery}". Try a different search keyword.`
              : 'No episodes aired in this specific timeframe. Switch to "All New Episodes" to view recent broadcasts.'}
          </p>
          {(searchQuery || activeTab !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveTab('all');
              }}
              className="px-4 py-2 rounded-xl bg-[#F5C518] text-black text-xs font-extrabold hover:bg-[#E5B508] transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredEpisodes.map((ep) => (
              <EpisodeCard key={ep.id} episode={ep} className="w-full" />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pt-4 border-t border-white/10">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalResults}
                itemsPerPage={16}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
