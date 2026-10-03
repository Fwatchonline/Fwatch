import { useState, useCallback } from 'react';
import { WatchProgressItem } from '../types';

const PROGRESS_STORAGE_KEY = 'fwatch_watch_progress';

export function useWatchProgress() {
  const [progressList, setProgressList] = useState<WatchProgressItem[]>(() => {
    try {
      const stored = localStorage.getItem(PROGRESS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const saveProgress = useCallback((items: WatchProgressItem[]) => {
    setProgressList(items);
    try {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save progress to localStorage', e);
    }
  }, []);

  const updateProgress = useCallback(
    (item: Omit<WatchProgressItem, 'percentage' | 'updatedAt'>) => {
      if (!item.duration || item.duration <= 0) return;
      const percentage = Math.min(100, Math.round((item.currentTime / item.duration) * 100));

      // Don't save if watched less than 5 seconds or already finished (> 95%)
      if (item.currentTime < 5) return;

      const progressItem: WatchProgressItem = {
        ...item,
        percentage,
        updatedAt: Date.now(),
      };

      const existingIndex = progressList.findIndex((p) => p.id === item.id);
      let updated: WatchProgressItem[];

      if (percentage >= 96) {
        // Mark as finished: remove or keep at end
        updated = progressList.filter((p) => p.id !== item.id);
      } else if (existingIndex >= 0) {
        updated = [...progressList];
        updated[existingIndex] = progressItem;
        // Move to front
        const [moved] = updated.splice(existingIndex, 1);
        updated.unshift(moved);
      } else {
        updated = [progressItem, ...progressList].slice(0, 20); // Keep max 20 recent
      }

      saveProgress(updated);
    },
    [progressList, saveProgress]
  );

  const getProgress = useCallback(
    (id: string): WatchProgressItem | undefined => {
      return progressList.find((p) => p.id === id);
    },
    [progressList]
  );

  const removeProgress = useCallback(
    (id: string) => {
      const filtered = progressList.filter((p) => p.id !== id);
      saveProgress(filtered);
    },
    [progressList, saveProgress]
  );

  const clearAllProgress = useCallback(() => {
    saveProgress([]);
  }, [saveProgress]);

  return {
    progressList,
    updateProgress,
    getProgress,
    removeProgress,
    clearAllProgress,
  };
}
