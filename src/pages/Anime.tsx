import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Film,
  Tv,
  Layers,
  Search,
  SlidersHorizontal,
  Flame,
  Star,
  Clock,
  Play,
  Info,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  anilistService,
  cleanDescription,
  generateAnimeSlug,
} from '../services/anilist';
import {
  AnimeMedia,
  AnimeCategoryTab,
  AnimePageInfo,
  AnimeStatus,
} from '../types';
import { AnimeCard } from '../components/AnimeCard';
import { Pagination } from '../components/Pagination';
import { SEO } from '../components/SEO';
import { useDebounce } from '../hooks/useDebounce';

const ANIME_GENRES = [
  'All',
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Fantasy',
  'Horror',
  'Mecha',
  'Mystery',
  'Psychological',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Sports',
  'Supernatural',
  'Thriller',
];

const SORT_OPTIONS = [
  { id: 'TRENDING_DESC', label: 'Trending' },
  { id: 'SCORE_DESC', label: 'Top Rated' },
  { id: 'POPULARITY_DESC', label: 'Most Popular' },
  { id: 'START_DATE_DESC', label: 'Newest' },
  { id: 'FAVOURITES_DESC', label: 'Fan Favorites' },
];

export function Anime() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Tab from URL or default 'all'
  const initialTab = (searchParams.get('tab') as AnimeCategoryTab) || 'all';
  const [activeTab, setActiveTab] = useState<AnimeCategoryTab>(initialTab);

  // Search, Genre, Sort, Status, Page
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const debouncedSearch = useDebounce(searchQuery, 350);

  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [activeSort, setActiveSort] = useState<string>('TRENDING_DESC');
  const [statusFilter, setStatusFilter] = useState<AnimeStatus | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Data state
  const [animeList, setAnimeList] = useState<AnimeMedia[]>([]);
  const [pageInfo, setPageInfo] = useState<AnimePageInfo>({
    total: 0,
    currentPage: 1,
    lastPage: 1,
    hasNextPage: false,
    perPage: 24,
  });
  const [heroAnime, setHeroAnime] = useState<AnimeMedia[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Sync tab with URL search parameter
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as AnimeCategoryTab;
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Load Hero Featured Anime
  useEffect(() => {
    let mounted = true;
    anilistService.getTrendingAnime(6, activeTab).then((res) => {
      if (mounted && res.length > 0) {
        setHeroAnime(res);
      }
    });
    return () => {
      mounted = false;
    };
  }, [activeTab]);

  // Reset to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, debouncedSearch, selectedGenre, activeSort, statusFilter]);

  // Load Anime Grid
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    anilistService
      .getAnimeList({
        page: currentPage,
        perPage: 24,
        tab: activeTab,
        search: debouncedSearch.trim() || undefined,
        genre: selectedGenre === 'All' ? undefined : selectedGenre,
        sort: activeSort,
        status: statusFilter,
      })
      .then((res) => {
        if (!mounted) return;
        setAnimeList(res.media);
        setPageInfo(res.pageInfo);
        setLoading(false);
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [activeTab, currentPage, debouncedSearch, selectedGenre, activeSort, statusFilter]);

  const handleTabChange = (tab: AnimeCategoryTab) => {
    setActiveTab(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (tab === 'all') next.delete('tab');
      else next.set('tab', tab);
      return next;
    });
  };

  // Hero auto-advance timer
  useEffect(() => {
    if (heroAnime.length <= 1) return;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroAnime.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [heroAnime.length]);

  const currentHero = heroAnime[heroIndex];

  return (
    <div className="space-y-8 py-4">
      <SEO
        title="Anime - Stream Anime Movies, Series & OVA | AniList - Tstream"
        description="Stream top anime movies, television series, OVAs, and ONAs powered by AniList. Explore popular, trending, and seasonal anime releases."
      />

      {/* Page Title & Badges */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#E50914] text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md shadow-red-900/40">
              <Sparkles className="w-3 h-3 fill-white" />
              <span>AniList Integration</span>
            </span>
            <span className="text-xs text-neutral-400 font-medium">
              Over 20,000+ Anime Titles
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Anime Catalog
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Discover and stream Japanese animation with official metadata, character voice cast, and ratings.
          </p>
        </div>

        {/* Total results badge */}
        {pageInfo.total > 0 && (
          <div className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-[#16171E] border border-white/10 text-xs font-bold text-neutral-300">
            <span className="text-[#E50914] font-extrabold mr-1">
              {pageInfo.total.toLocaleString()}
            </span>
            <span>Titles</span>
          </div>
        )}
      </div>

      {/* Hero Featured Anime Banner */}
      {currentHero && (
        <div className="relative w-full rounded-3xl overflow-hidden min-h-[360px] sm:min-h-[440px] bg-[#16171E] border border-white/10 shadow-2xl flex flex-col justify-end p-6 sm:p-10 group">
          {/* Backdrop Image with cross-fade */}
          <div className="absolute inset-0">
            <img
              src={
                currentHero.bannerImage ||
                currentHero.coverImage?.extraLarge ||
                'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1280&auto=format&fit=crop&q=80'
              }
              alt={currentHero.title.english || currentHero.title.romaji}
              className="w-full h-full object-cover object-center scale-105 group-hover:scale-100 transition-transform duration-700 ease-out"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1280&auto=format&fit=crop&q=80';
              }}
            />
            {/* Cinematic Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0E0F12] via-[#0E0F12]/75 to-black/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0E0F12] via-[#0E0F12]/80 to-transparent w-full md:w-3/4" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 max-w-2xl space-y-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-[#E50914] text-white text-[10px] font-black uppercase tracking-wider">
                FEATURED ANIME
              </span>
              <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white border border-white/10 text-[10px] font-bold">
                {currentHero.format}
              </span>
              {currentHero.averageScore && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white text-[10px] font-bold">
                  <Star className="w-3 h-3 fill-[#F5C518] text-[#F5C518]" />
                  <span>{(currentHero.averageScore / 10).toFixed(1)}</span>
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight drop-shadow-md">
              {currentHero.title.english || currentHero.title.romaji}
            </h2>

            {currentHero.title.romaji &&
              currentHero.title.english &&
              currentHero.title.romaji !== currentHero.title.english && (
                <p className="text-xs sm:text-sm text-neutral-300 italic font-medium">
                  {currentHero.title.romaji}
                </p>
              )}

            <p className="text-xs sm:text-sm text-neutral-300 line-clamp-3 leading-relaxed max-w-xl">
              {cleanDescription(currentHero.description) ||
                'Immerse in this extraordinary anime story with captivating visuals and gripping narratives.'}
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/anime/${generateAnimeSlug(
                      currentHero.id,
                      currentHero.title.english || currentHero.title.romaji
                    )}`
                  )
                }
                className="py-2.5 px-6 rounded-xl bg-[#E50914] hover:bg-[#B81D24] text-white text-xs sm:text-sm font-extrabold tracking-wide transition-all shadow-lg shadow-red-900/40 flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>WATCH ANIME</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/anime/${generateAnimeSlug(
                      currentHero.id,
                      currentHero.title.english || currentHero.title.romaji
                    )}`
                  )
                }
                className="py-2.5 px-6 rounded-xl bg-black/50 hover:bg-black/70 border border-white/20 text-white text-xs sm:text-sm font-bold tracking-wide transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Info className="w-4 h-4 text-neutral-300" />
                <span>Details &amp; Cast</span>
              </button>
            </div>
          </div>

          {/* Slider Prev / Next Controls */}
          <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setHeroIndex((prev) => (prev - 1 + heroAnime.length) % heroAnime.length)
              }
              aria-label="Previous featured anime"
              className="w-10 h-10 rounded-full bg-black/70 hover:bg-[#E50914] text-white border border-white/10 flex items-center justify-center transition-all cursor-pointer shadow active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setHeroIndex((prev) => (prev + 1) % heroAnime.length)}
              aria-label="Next featured anime"
              className="w-10 h-10 rounded-full bg-black/70 hover:bg-[#E50914] text-white border border-white/10 flex items-center justify-center transition-all cursor-pointer shadow active:scale-95"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* PRIMARY CATEGORY TABS (Movies, TV Series, Others, All) */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-[#16171E] border border-white/5 shadow-inner">
            <button
              type="button"
              onClick={() => handleTabChange('all')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#E50914] text-white shadow-lg shadow-red-900/40 font-extrabold scale-105'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>All Anime</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('movies')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'movies'
                  ? 'bg-[#E50914] text-white shadow-lg shadow-red-900/40 font-extrabold scale-105'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>Movies</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('series')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'series'
                  ? 'bg-[#E50914] text-white shadow-lg shadow-red-900/40 font-extrabold scale-105'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Tv className="w-4 h-4" />
              <span>TV Series</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('others')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'others'
                  ? 'bg-[#E50914] text-white shadow-lg shadow-red-900/40 font-extrabold scale-105'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Others (OVA, ONA, Specials)</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search anime title..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#16171E] border border-white/5 focus:border-[#E50914] text-xs sm:text-sm text-white placeholder-neutral-500 outline-hidden transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Secondary Filter Bar: Genres, Sort, Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Genres Horizontal Scroll Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 max-w-full sm:max-w-2xl">
            {ANIME_GENRES.map((g) => {
              const active = selectedGenre === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSelectedGenre(g)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#E50914] text-white font-bold shadow shadow-red-900/40'
                      : 'bg-[#16171E] text-neutral-400 hover:text-white hover:bg-white/5 border border-white/5'
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>

          {/* Sort & Status Selectors */}
          <div className="flex items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-[#16171E] border border-white/10 text-xs font-semibold text-neutral-300 focus:border-[#E50914] outline-hidden cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="RELEASING">Airing / Releasing</option>
              <option value="FINISHED">Finished Airing</option>
              <option value="NOT_YET_RELEASED">Upcoming</option>
            </select>

            {/* Sort Selector */}
            <select
              value={activeSort}
              onChange={(e) => setActiveSort(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#16171E] border border-white/10 text-xs font-semibold text-neutral-300 focus:border-[#E50914] outline-hidden cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Anime Grid */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-[#E50914] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
            Loading Anime from AniList...
          </span>
        </div>
      ) : animeList.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-[#16171E] border border-white/5 p-8 max-w-xl mx-auto">
          <Sparkles className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No anime found</h3>
          <p className="text-xs text-neutral-400">
            Try adjusting your search query, genre, or category selection.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
            {animeList.map((anime) => (
              <AnimeCard key={anime.id} anime={anime} />
            ))}
          </div>

          {/* Working Dynamic AniList Pagination */}
          <Pagination
            currentPage={pageInfo.currentPage}
            totalPages={pageInfo.lastPage}
            totalItems={pageInfo.total}
            itemsPerPage={pageInfo.perPage}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 380, behavior: 'smooth' });
            }}
          />
        </>
      )}
    </div>
  );
}
