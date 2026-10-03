import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { tmdbService } from '../services/tmdb';
import { TMDBEpisode } from '../types';
import { EpisodeCard } from '../components/EpisodeCard';
import { Pagination } from '../components/Pagination';
import { SEO } from '../components/SEO';

export function NewEpisodes() {
  const [episodes, setEpisodes] = useState<TMDBEpisode[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const perPage = 12;

  useEffect(() => {
    let mounted = true;
    tmdbService.getNewEpisodes().then((res) => {
      if (mounted) {
        setEpisodes(res);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(episodes.length / perPage));
  const currentEpisodes = episodes.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <div className="min-h-screen bg-[#08090c] pt-24 pb-16">
      <SEO
        title="New Episodes - Recently Aired TV Shows | T.Movie"
        description="Catch up with recently aired television episodes and latest season releases on T.Movie."
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'New Episodes', item: '/episodes' },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center gap-2.5 pb-6 border-b border-white/10">
          <div className="p-2 rounded-xl bg-[#F5C518]/15 text-[#F5C518] border border-[#F5C518]/25">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
              Newly Released Episodes
            </h1>
            <p className="text-xs text-neutral-400">
              Fresh episodes broadcast this week from top television series
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-24 flex justify-center">
            <div className="w-10 h-10 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : episodes.length === 0 ? (
          <p className="text-neutral-400 text-center py-20">No new episodes found.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {currentEpisodes.map((ep) => (
                <EpisodeCard key={ep.id} episode={ep} className="w-full" />
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={episodes.length}
              itemsPerPage={perPage}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </>
        )}
      </div>
    </div>
  );
}
