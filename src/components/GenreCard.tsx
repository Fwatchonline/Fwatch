import { Link } from 'react-router-dom';
import {
  Flame,
  Laugh,
  Film,
  Ghost,
  Heart,
  Zap,
  Sparkles,
  Rocket,
  Search,
  ShieldAlert,
  Smile,
  Crown,
  Compass,
  BookOpen,
  Music,
  Swords,
  Layers,
} from 'lucide-react';
import { TMDBGenre } from '../types';

interface GenreCardProps {
  genre: TMDBGenre;
}

const GENRE_ICONS: Record<string, any> = {
  action: Flame,
  adventure: Compass,
  animation: Sparkles,
  comedy: Laugh,
  crime: ShieldAlert,
  documentary: BookOpen,
  drama: Film,
  family: Smile,
  fantasy: Crown,
  history: BookOpen,
  horror: Ghost,
  music: Music,
  mystery: Search,
  romance: Heart,
  'sci-fi': Rocket,
  'science-fiction': Rocket,
  thriller: Zap,
  war: Swords,
  western: Compass,
};

export function GenreCard({ genre }: GenreCardProps) {
  const Icon = GENRE_ICONS[genre.slug] || Layers;

  return (
    <Link
      to={`/genre/${genre.slug}`}
      className="group relative flex flex-col items-center justify-center p-4 sm:p-5 rounded-xl bg-[#151820] hover:bg-[#1c202b] border border-white/10 hover:border-[#E50914]/60 transition-all duration-300 flex-shrink-0 w-28 sm:w-36 text-center hover:scale-105 hover:shadow-lg hover:shadow-red-900/20"
    >
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/5 group-hover:bg-[#E50914] flex items-center justify-center text-neutral-300 group-hover:text-white transition-colors mb-2.5">
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
      <span className="text-xs sm:text-sm font-bold text-neutral-200 group-hover:text-white transition-colors truncate w-full">
        {genre.name}
      </span>
    </Link>
  );
}
