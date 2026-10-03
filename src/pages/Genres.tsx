import { Compass } from 'lucide-react';
import { tmdbService } from '../services/tmdb';
import { GenreCard } from '../components/GenreCard';
import { SEO } from '../components/SEO';

export function Genres() {
  const genres = tmdbService.getGenres();

  return (
    <div className="min-h-screen bg-[#08090c] pt-24 pb-16">
      <SEO
        title="Movie &amp; TV Genres - Browse Catalog | FWATCH"
        description="Browse FWATCH streaming library by categories: Action, Comedy, Sci-Fi, Horror, Drama, Animation, and more."
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'Genres', item: '/genres' },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-center gap-2.5 pb-6 border-b border-white/10">
          <div className="p-2 rounded-xl bg-[#F5C518]/15 text-[#F5C518] border border-[#F5C518]/25">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
              Browse by Genre
            </h1>
            <p className="text-xs text-neutral-400">
              Discover stories categorized by your preferred genre
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {genres.map((genre) => (
            <GenreCard key={genre.id} genre={genre} />
          ))}
        </div>
      </div>
    </div>
  );
}
