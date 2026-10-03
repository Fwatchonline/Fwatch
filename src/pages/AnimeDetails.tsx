import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  Play,
  Star,
  Bookmark,
  Calendar,
  Clock,
  Film,
  Tv,
  Layers,
  Sparkles,
  ArrowLeft,
  X,
  Share2,
  Users,
  TvMinimal,
  ExternalLink,
} from 'lucide-react';
import {
  anilistService,
  cleanDescription,
  parseAnimeSlug,
  generateAnimeSlug,
} from '../services/anilist';
import { AnimeMedia } from '../types';
import { AnimeCard } from '../components/AnimeCard';
import { SEO } from '../components/SEO';
import { useWatchlist } from '../hooks/useWatchlist';

export function AnimeDetails() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [anime, setAnime] = useState<AnimeMedia | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const [activeEpisode, setActiveEpisode] = useState(1);
  const [selectedServer, setSelectedServer] = useState<'vidlink' | 'vidsrc' | '2embed'>('vidlink');

  const isWatchMode = searchParams.get('watch') === '1';
  const { watchlist, toggleWatchlist } = useWatchlist();

  useEffect(() => {
    let mounted = true;
    if (!slug) return;

    setLoading(true);
    const { id } = parseAnimeSlug(slug);

    if (id) {
      anilistService.getAnimeById(id).then((res) => {
        if (mounted) {
          setAnime(res);
          setLoading(false);
        }
      });
    } else {
      setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
          Loading Anime Details from AniList...
        </span>
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="text-center py-24 space-y-4 max-w-md mx-auto">
        <h2 className="text-2xl font-black text-white">Anime Not Found</h2>
        <p className="text-xs text-neutral-400">
          The requested anime title could not be retrieved from AniList.
        </p>
        <Link
          to="/anime"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F5C518] text-black font-extrabold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Anime Catalog</span>
        </Link>
      </div>
    );
  }

  const title = anime.title.english || anime.title.romaji || 'Anime';
  const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;
  const isMovie = anime.format === 'MOVIE';
  const totalEpisodes = isMovie ? 1 : anime.episodes || 12;

  const isSaved = watchlist.some((w) => w.tmdbId === anime.id && w.type === 'tv');

  const handleToggleWatchlist = () => {
    toggleWatchlist({
      id: `anime:${anime.id}`,
      tmdbId: anime.id,
      type: 'tv',
      slug: generateAnimeSlug(anime.id, title),
      title,
      posterPath: anime.coverImage?.large || null,
      backdropPath: anime.bannerImage || null,
      voteAverage: anime.averageScore ? anime.averageScore / 10 : 8.5,
      releaseDate: anime.seasonYear ? `${anime.seasonYear}-01-01` : '2024-01-01',
      genres: anime.genres.map((g, i) => ({ id: i + 1, name: g, slug: g.toLowerCase() })),
      overview: cleanDescription(anime.description) || '',
      voteCount: anime.popularity || 1000,
    });
  };

  // Embed stream URLs
  const getEmbedStreamUrl = () => {
    if (selectedServer === 'vidlink') {
      return `https://vidlink.pro/anime/${anime.id}/${activeEpisode}?primaryColor=F5C518`;
    }
    if (selectedServer === 'vidsrc') {
      return `https://vidsrc.to/embed/anime/${anime.id}/${activeEpisode}`;
    }
    return `https://2embed.cc/embed/anime/${anime.id}/${activeEpisode}`;
  };

  return (
    <div className="space-y-10 py-2">
      <SEO
        title={`${title} - Watch Anime Online | T.Movie`}
        description={
          cleanDescription(anime.description).slice(0, 160) ||
          `Stream ${title} on T.Movie with English and Romaji subtitles.`
        }
        ogImage={anime.bannerImage || anime.coverImage?.large}
      />

      {/* Back Link */}
      <div>
        <Link
          to="/anime"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Anime Catalog</span>
        </Link>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* WATCH PLAYER SECTION (when active or watch=1)                 */}
      {/* ------------------------------------------------------------- */}
      {isWatchMode && (
        <div className="space-y-4">
          <div className="relative aspect-video w-full rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl">
            <iframe
              src={getEmbedStreamUrl()}
              title={`Watch ${title} Episode ${activeEpisode}`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          {/* Player Bar: Episode switcher & Server selector */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#16171E] border border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-400">Stream Server:</span>
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/50 border border-white/10">
                {(['vidlink', 'vidsrc', '2embed'] as const).map((srv) => (
                  <button
                    key={srv}
                    type="button"
                    onClick={() => setSelectedServer(srv)}
                    className={`px-3 py-1 rounded-lg text-xs font-extrabold uppercase transition-all cursor-pointer ${
                      selectedServer === srv
                        ? 'bg-[#F5C518] text-black shadow'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {srv === 'vidlink' ? 'VidLink Pro' : srv === 'vidsrc' ? 'VidSrc' : '2Embed'}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-neutral-400">
              Playing <span className="text-white font-bold">{isMovie ? 'Full Movie' : `Episode ${activeEpisode} of ${totalEpisodes}`}</span>
            </div>
          </div>

          {/* Episode List Selector for TV Series */}
          {!isMovie && totalEpisodes > 1 && (
            <div className="p-5 rounded-2xl bg-[#16171E] border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <TvMinimal className="w-4 h-4 text-[#F5C518]" />
                  <span>Select Episode ({totalEpisodes})</span>
                </h3>
                <span className="text-[11px] text-neutral-400">Subbed &amp; Dubbed Available</span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2 max-h-48 overflow-y-auto pr-1">
                {Array.from({ length: totalEpisodes }, (_, i) => i + 1).map((epNum) => {
                  const isActive = activeEpisode === epNum;
                  return (
                    <button
                      key={epNum}
                      type="button"
                      onClick={() => setActiveEpisode(epNum)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#F5C518] text-black font-extrabold shadow-md shadow-[#F5C518]/25 scale-105'
                          : 'bg-black/40 text-neutral-300 hover:bg-white/10 hover:text-white border border-white/5'
                      }`}
                    >
                      Ep {epNum}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* HERO BANNER & MAIN OVERVIEW                                   */}
      {/* ------------------------------------------------------------- */}
      <div className="relative rounded-3xl overflow-hidden bg-[#16171E] border border-white/10 shadow-2xl p-6 sm:p-10">
        {/* Background Backdrop */}
        {anime.bannerImage && (
          <div className="absolute inset-0 z-0">
            <img
              src={anime.bannerImage}
              alt={title}
              className="w-full h-full object-cover opacity-25 filter blur-xs"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#16171E] via-[#16171E]/90 to-transparent" />
          </div>
        )}

        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
          {/* Cover Poster */}
          <div className="w-44 sm:w-56 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden bg-[#0E0F12] border-2 border-white/10 shadow-2xl shadow-black/80">
            <img
              src={
                anime.coverImage?.extraLarge ||
                anime.coverImage?.large ||
                'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=80'
              }
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Overview Info */}
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-[#F5C518] text-black text-[10px] font-black uppercase tracking-wider">
                {anime.format}
              </span>

              {score && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-black/60 border border-[#F5C518]/40 text-[#F5C518] text-xs font-black">
                  <Star className="w-3.5 h-3.5 fill-[#F5C518]" />
                  <span>{score} AniList</span>
                </span>
              )}

              {anime.status && (
                <span className="px-2.5 py-0.5 rounded-md bg-black/50 border border-white/10 text-neutral-300 text-xs font-semibold">
                  {anime.status}
                </span>
              )}

              {anime.seasonYear && (
                <span className="px-2.5 py-0.5 rounded-md bg-black/50 border border-white/10 text-neutral-300 text-xs font-semibold">
                  {anime.season ? `${anime.season} ` : ''}{anime.seasonYear}
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              {title}
            </h1>

            {anime.title.romaji && anime.title.english && anime.title.romaji !== anime.title.english && (
              <p className="text-sm text-[#F5C518] font-semibold italic">
                {anime.title.romaji}
              </p>
            )}

            {/* Quick Metadata Row */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-neutral-300 pt-1">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#F5C518]" />
                <span>{isMovie ? `${anime.duration || 100} minutes` : `${totalEpisodes} Episodes`}</span>
              </span>

              {anime.studios?.nodes?.[0] && (
                <span className="flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-[#F5C518]" />
                  <span>Studio: {anime.studios.nodes[0].name}</span>
                </span>
              )}
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {anime.genres.map((g) => (
                <span
                  key={g}
                  className="px-3 py-1 rounded-xl bg-white/10 border border-white/10 text-xs font-bold text-neutral-200"
                >
                  {g}
                </span>
              ))}
            </div>

            {/* Synopsis */}
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-3xl whitespace-pre-line pt-2">
              {cleanDescription(anime.description) ||
                'No detailed synopsis provided for this anime.'}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setSearchParams({ watch: '1' });
                  window.scrollTo({ top: 80, behavior: 'smooth' });
                }}
                className="py-3 px-7 rounded-xl bg-[#F5C518] hover:bg-[#E5B508] text-black text-xs sm:text-sm font-extrabold tracking-wide transition-all shadow-lg shadow-[#F5C518]/25 flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>WATCH NOW</span>
              </button>

              {anime.trailer?.id && anime.trailer.site === 'youtube' && (
                <button
                  type="button"
                  onClick={() => setShowTrailer(true)}
                  className="py-3 px-6 rounded-xl bg-black/60 hover:bg-black/80 border border-white/20 text-white text-xs sm:text-sm font-bold transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Film className="w-4 h-4 text-[#F5C518]" />
                  <span>Watch Trailer</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleToggleWatchlist}
                className={`py-3 px-5 rounded-xl border text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  isSaved
                    ? 'bg-[#F5C518]/20 border-[#F5C518] text-[#F5C518]'
                    : 'bg-black/40 border-white/20 text-white hover:bg-white/10'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#F5C518]' : ''}`} />
                <span>{isSaved ? 'In Watchlist' : 'Add to Watchlist'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* CHARACTERS & VOICE CAST                                       */}
      {/* ------------------------------------------------------------- */}
      {anime.characters?.edges && anime.characters.edges.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Users className="w-5 h-5 text-[#F5C518]" />
            <h2 className="text-xl font-extrabold text-white">Characters &amp; Voice Cast</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {anime.characters.edges.map((edge) => {
              const char = edge.node;
              return (
                <div
                  key={char.id}
                  className="p-3 rounded-2xl bg-[#16171E] border border-white/5 flex flex-col items-center text-center space-y-2 group"
                >
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-black/40 border border-white/10 group-hover:border-[#F5C518]/40 transition-colors">
                    <img
                      src={
                        char.image?.large ||
                        char.image?.medium ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'
                      }
                      alt={char.name.full}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white line-clamp-1">{char.name.full}</h4>
                    <span className="text-[10px] text-[#F5C518] uppercase font-bold tracking-wider">
                      {edge.role || 'Character'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* RECOMMENDED ANIME                                             */}
      {/* ------------------------------------------------------------- */}
      {anime.recommendations?.nodes && anime.recommendations.nodes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#F5C518]" />
              <h2 className="text-xl font-extrabold text-white">Recommended Anime</h2>
            </div>
            <Link to="/anime" className="text-xs font-bold text-[#F5C518] hover:underline">
              View All
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
            {anime.recommendations.nodes
              .filter((n) => n.mediaRecommendation)
              .slice(0, 6)
              .map((n) => {
                const rec = n.mediaRecommendation!;
                const recSlug = generateAnimeSlug(rec.id, rec.title.english || rec.title.romaji);
                return (
                  <Link
                    key={rec.id}
                    to={`/anime/${recSlug}`}
                    className="group relative flex flex-col transition-all"
                  >
                    <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#151820] border border-white/10 group-hover:border-[#F5C518]/60 transition-all duration-300">
                      <img
                        src={rec.coverImage?.large || rec.coverImage?.medium}
                        alt={rec.title.english || rec.title.romaji}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-black/70 text-[#F5C518] border border-white/10">
                          {rec.format}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 space-y-0.5">
                      <h4 className="text-xs font-bold text-white group-hover:text-[#F5C518] transition-colors line-clamp-1">
                        {rec.title.english || rec.title.romaji}
                      </h4>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TRAILER POPUP MODAL                                           */}
      {/* ------------------------------------------------------------- */}
      {showTrailer && anime.trailer?.id && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-4xl rounded-3xl overflow-hidden bg-[#0E0F12] border border-white/15 shadow-2xl">
            <div className="p-4 flex items-center justify-between border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Film className="w-4 h-4 text-[#F5C518]" />
                <span>{title} - Official Trailer</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowTrailer(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${anime.trailer.id}?autoplay=1`}
                title={`${title} Trailer`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
