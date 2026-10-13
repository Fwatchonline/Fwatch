import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Theater,
  Award,
  Calendar,
  Globe,
  Users,
} from 'lucide-react';
import { tmdbService } from '../services/tmdb';
import { TMDBPerson } from '../types';
import { getTMDBImageUrl, parseSlug } from '../utils/slugify';
import { MovieCard } from '../components/MovieCard';
import { Pagination } from '../components/Pagination';
import { SEO } from '../components/SEO';

export function Actor() {
  const { slug } = useParams<{ slug: string }>();
  const [person, setPerson] = useState<TMDBPerson | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Works' | 'Information'>('Works');
  const [worksFilter, setWorksFilter] = useState<'All' | 'Movie' | 'Series'>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [worksFilter, slug]);

  useEffect(() => {
    let mounted = true;
    if (!slug) return;

    setLoading(true);
    const { tmdbId } = parseSlug(slug);

    if (tmdbId) {
      tmdbService.getPerson(tmdbId).then((res) => {
        if (mounted) {
          setPerson(res);
          setLoading(false);
        }
      });
    } else {
      tmdbService.getPopularActors(1).then((res) => {
        if (mounted) {
          setPerson(res.results?.[0] || null);
          setLoading(false);
        }
      });
    }

    return () => {
      mounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#E50914] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!person) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white mb-2">Artist Not Found</h2>
        <Link to="/artists" className="text-[#E50914] font-semibold hover:underline">
          Return to Artists
        </Link>
      </div>
    );
  }

  const allCredits = [...(person.movieCredits || []), ...(person.tvCredits || [])];
  // If combined_credits was empty, also check knownFor
  const effectiveWorks = allCredits.length > 0 ? allCredits : person.knownFor || [];

  const filteredWorks = effectiveWorks.filter((item) => {
    if (worksFilter === 'All') return true;
    if (worksFilter === 'Movie') return item.type === 'movie';
    if (worksFilter === 'Series') return item.type === 'tv';
    return true;
  });

  return (
    <div className="space-y-8 py-4">
      <SEO
        title={`${person.name} - Tstream`}
        description={person.biography?.slice(0, 150) || `Explore ${person.name}'s filmography on Tstream.`}
      />

      {/* Top Hero Section */}
      <div className="rounded-3xl bg-[#16171E] border border-white/5 p-6 sm:p-10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start gap-8">
        {/* Large Portrait */}
        <div className="w-48 sm:w-56 md:w-64 aspect-[3/4] rounded-2xl overflow-hidden bg-black/40 border border-white/10 flex-shrink-0 shadow-xl">
          <img
            src={getTMDBImageUrl(person.profilePath, 'w500', 'avatar')}
            alt={person.name}
            className="w-full h-full object-cover object-top"
          />
        </div>

        {/* Right Info Details */}
        <div className="flex-1 space-y-4 relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#E50914] tracking-tight">
                {person.name}
              </h1>
              <p className="text-sm font-semibold text-neutral-400 mt-1">
                {person.knownForDepartment || 'Acting'} • Artist
              </p>
            </div>
            <Theater className="w-12 h-12 text-white/10 hidden sm:block" />
          </div>

          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-3xl">
            {person.biography || `${person.name} is a renowned ${person.knownForDepartment?.toLowerCase() || 'artist'} recognized worldwide for exceptional cinema and television performances.`}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400 pt-2">
            {person.placeOfBirth && (
              <span className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-[#E50914]" />
                {person.placeOfBirth}
              </span>
            )}
            {person.birthday && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#E50914]" />
                {person.birthday}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation (Works, Information) */}
      <div className="border-b border-[#2b2d38] flex items-center gap-8 text-sm font-bold">
        {(['Works', 'Information'] as const).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`py-3 relative transition-colors cursor-pointer ${
                isActive ? 'text-[#E50914]' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>{tab}</span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E50914] rounded-full shadow-sm shadow-red-900/50" />
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Works Grid */}
      {activeTab === 'Works' && (
        <div className="rounded-3xl bg-[#16171E] border border-white/5 p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-white">Filmography &amp; Credits ({filteredWorks.length})</h3>

            {/* Filter pills: All, Movie, Series */}
            <div className="flex items-center gap-2 p-1 rounded-xl bg-[#0E0F12] border border-white/5">
              {(['All', 'Movie', 'Series'] as const).map((filter) => {
                const isActive = worksFilter === filter;
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setWorksFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      isActive ? 'bg-[#E50914] text-white shadow shadow-red-900/40' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>
          </div>

          {filteredWorks.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                {filteredWorks
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((work) => (
                    <MovieCard key={work.id} media={work} />
                  ))}
              </div>

              {filteredWorks.length > itemsPerPage && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(filteredWorks.length / itemsPerPage)}
                  totalItems={filteredWorks.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={(p) => setCurrentPage(p)}
                />
              )}
            </>
          ) : (
            <p className="text-sm text-neutral-400 py-8 text-center">No credits found for this category.</p>
          )}
        </div>
      )}

      {/* TAB 2: Information Grid */}
      {activeTab === 'Information' && (
        <div className="rounded-3xl bg-[#16171E] border border-white/5 p-6 sm:p-8 space-y-6">
          <h3 className="text-lg font-bold text-white">Artist Details</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12 text-xs sm:text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <span className="text-neutral-400 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#E50914]" />
                Full Name
              </span>
              <span className="font-semibold text-white">{person.name}</span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <span className="text-neutral-400 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#E50914]" />
                Birthday
              </span>
              <span className="font-semibold text-white">{person.birthday || 'N/A'}</span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <span className="text-neutral-400 flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#E50914]" />
                Place of Birth
              </span>
              <span className="font-semibold text-white">{person.placeOfBirth || 'N/A'}</span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <span className="text-neutral-400 flex items-center gap-2">
                <Award className="w-4 h-4 text-[#E50914]" />
                Known Department
              </span>
              <span className="font-semibold text-white">{person.knownForDepartment || 'Acting'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
