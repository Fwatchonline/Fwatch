import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { tmdbService } from '../services/tmdb';
import { MediaItem, TMDBGenre } from '../types';
import { MovieCard } from '../components/MovieCard';
import { Pagination } from '../components/Pagination';
import { SEO } from '../components/SEO';

export function Genre() {
  const { slug } = useParams<{ slug: string }>();
  const [currentGenre, setCurrentGenre] = useState<TMDBGenre | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCurrentPage(1);
  }, [slug]);

  useEffect(() => {
    let mounted = true;
    if (!slug) return;

    setLoading(true);
    const allGenres = tmdbService.getGenres();
    const matched = allGenres.find(
      (g) => g.slug === slug || g.name.toLowerCase() === slug.toLowerCase()
    );

    if (matched) {
      setCurrentGenre(matched);
      tmdbService
        .getByGenrePaginated(matched.id, 'all', currentPage)
        .then((data) => {
          if (mounted) {
            setMediaItems(data.results || []);
            setTotalPages(data.totalPages || 1);
            setTotalItems(data.totalResults || (data.results || []).length);
            setLoading(false);
          }
        })
        .catch(() => {
          if (mounted) setLoading(false);
        });
    } else {
      if (mounted) setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [slug, currentPage]);

  if (loading && mediaItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#08090c] pt-28 pb-16 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentGenre) {
    return (
      <div className="min-h-screen bg-[#08090c] pt-28 pb-16 max-w-7xl mx-auto px-4 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Genre Not Found</h2>
        <Link to="/genres" className="text-[#F5C518] font-semibold hover:underline">
          View All Genres
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08090c] pt-24 pb-16">
      <SEO
        title={`${currentGenre.name} Movies & Series - Watch Online | T.Movie`}
        description={`Stream the highest rated and trending ${currentGenre.name} movies and TV shows in 4K on T.Movie.`}
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'Genres', item: '/genres' },
          { name: currentGenre.name, item: `/genre/${currentGenre.slug}` },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <Link
              to="/genres"
              className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to all genres</span>
            </Link>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-wide">
              {currentGenre.name} Movies &amp; Shows
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              Showing top rated and trending titles in {currentGenre.name}
            </p>
          </div>

          <span className="px-3 py-1 bg-[#F5C518]/20 border border-[#F5C518]/40 text-[#F5C518] text-xs font-bold rounded-full">
            {totalItems || mediaItems.length} Titles Available
          </span>
        </div>

        {mediaItems.length === 0 ? (
          <div className="py-20 text-center text-neutral-400">
            No media titles found for this genre.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
              {mediaItems.map((item) => (
                <MovieCard key={item.id} media={item} />
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </>
        )}
      </div>
    </div>
  );
}
