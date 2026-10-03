import { useState, useEffect, useCallback } from 'react';
import { WatchlistItem, MediaItem } from '../types';

const WATCHLIST_STORAGE_KEY = 'fwatch_user_watchlist';

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    try {
      const stored = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const saveWatchlist = useCallback((items: WatchlistItem[]) => {
    setWatchlist(items);
    try {
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save watchlist to localStorage', e);
    }
  }, []);

  const isInWatchlist = useCallback(
    (tmdbId: number, type: 'movie' | 'tv') => {
      return watchlist.some((item) => item.tmdbId === tmdbId && item.type === type);
    },
    [watchlist]
  );

  const toggleWatchlist = useCallback(
    (media: MediaItem) => {
      const exists = isInWatchlist(media.tmdbId, media.type);
      if (exists) {
        const next = watchlist.filter(
          (item) => !(item.tmdbId === media.tmdbId && item.type === media.type)
        );
        saveWatchlist(next);
        return false;
      } else {
        const newItem: WatchlistItem = {
          id: `${media.type}:${media.tmdbId}`,
          tmdbId: media.tmdbId,
          type: media.type,
          slug: media.slug,
          title: media.title,
          posterPath: media.posterPath,
          backdropPath: media.backdropPath,
          voteAverage: media.voteAverage,
          releaseDate: media.releaseDate,
          addedAt: Date.now(),
        };
        saveWatchlist([newItem, ...watchlist]);
        return true;
      }
    },
    [watchlist, isInWatchlist, saveWatchlist]
  );

  const removeFromWatchlist = useCallback(
    (tmdbId: number, type: 'movie' | 'tv') => {
      const next = watchlist.filter(
        (item) => !(item.tmdbId === tmdbId && item.type === type)
      );
      saveWatchlist(next);
    },
    [watchlist, saveWatchlist]
  );

  const clearWatchlist = useCallback(() => {
    saveWatchlist([]);
  }, [saveWatchlist]);

  return {
    watchlist,
    isInWatchlist,
    toggleWatchlist,
    removeFromWatchlist,
    clearWatchlist,
  };
}
