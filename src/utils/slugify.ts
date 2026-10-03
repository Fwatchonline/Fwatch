export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD') // separate accents from letters
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-') // collapse dashes
    .replace(/^-+/, '') // trim - from start of text
    .replace(/-+$/, ''); // trim - from end of text
}

/**
 * Creates canonical slug format for URL routes.
 * e.g., 550, "Fight Club" -> "550-fight-club"
 * Allows immediate deterministic TMDB ID extraction while maintaining clean SEO readable keywords.
 * Also supports clean slug fallback matching!
 */
export function generateMediaSlug(tmdbId: number, title: string): string {
  const clean = slugify(title);
  return `${tmdbId}-${clean || 'item'}`;
}

/**
 * Parses any slug or parameter into possible TMDB ID and clean title slug.
 * Supports:
 * - "550-fight-club" -> { tmdbId: 550, cleanSlug: "fight-club" }
 * - "550" -> { tmdbId: 550, cleanSlug: "550" }
 * - "fight-club" -> { tmdbId: undefined, cleanSlug: "fight-club" }
 */
export function parseSlug(slug: string): { tmdbId?: number; cleanSlug: string } {
  if (!slug) return { cleanSlug: '' };

  const match = slug.match(/^(\d+)(?:-(.*))?$/);
  if (match) {
    const tmdbId = parseInt(match[1], 10);
    const cleanSlug = match[2] || '';
    return { tmdbId, cleanSlug };
  }

  return { cleanSlug: slug };
}

export function formatRuntime(minutes?: number): string {
  if (!minutes || minutes <= 0) return 'N/A';
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

export function formatRating(rating?: number): string {
  if (rating === undefined || rating === null || rating <= 0) return 'NR';
  return rating.toFixed(1);
}

export function formatYear(dateStr?: string): string {
  if (!dateStr) return 'TBA';
  const year = dateStr.split('-')[0];
  return year || 'TBA';
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return 'TBA';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Resolves TMDB Image URL with fallback to high-quality placeholder
 */
export function getTMDBImageUrl(
  path: string | null | undefined,
  size: 'w300' | 'w500' | 'w780' | 'w1280' | 'original' = 'w500',
  fallbackType: 'poster' | 'backdrop' | 'avatar' = 'poster'
): string {
  if (path && (path.startsWith('http://') || path.startsWith('https://'))) {
    return path;
  }
  if (path && path.startsWith('/')) {
    return `https://image.tmdb.org/t/p/${size}${path}`;
  }

  // Graceful visual fallbacks
  if (fallbackType === 'avatar') {
    return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80';
  }
  if (fallbackType === 'backdrop') {
    return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1280&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80';
}
