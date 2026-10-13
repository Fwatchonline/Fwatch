import React, { createContext, useContext, useState, useEffect } from 'react';
import { tmdbService } from '../services/tmdb';

export interface NotificationItem {
  id: string;
  title: string;
  mediaTitle: string;
  episodeName?: string;
  type: 'episode' | 'movie' | 'system';
  time: string;
  image: string;
  read: boolean;
  link: string;
  seasonNumber?: number;
  episodeNumber?: number;
}

interface UIContextType {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  toggleSidebar: () => void;
  plansModalOpen: boolean;
  setPlansModalOpen: (v: boolean) => void;
  notificationsOpen: boolean;
  setNotificationsOpen: (v: boolean) => void;
  notifications: NotificationItem[];
  markAllNotificationsRead: () => void;
  markNotificationRead: (id: string) => void;
  userDropdownOpen: boolean;
  setUserDropdownOpen: (v: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('tmovie_sidebar_collapsed') === 'true';
  });

  const [plansModalOpen, setPlansModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    localStorage.setItem('tmovie_sidebar_collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Load live episodes airing today
  useEffect(() => {
    let mounted = true;
    const readIds: string[] = JSON.parse(
      localStorage.getItem('tmovie_read_notifications') || '[]'
    );

    tmdbService.getEpisodesAiringToday().then((todayEpisodes) => {
      if (!mounted) return;
      if (todayEpisodes && todayEpisodes.length > 0) {
        const formatted: NotificationItem[] = todayEpisodes.map((ep) => ({
          ...ep,
          read: readIds.includes(ep.id),
        }));
        setNotifications(formatted);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      try {
        localStorage.setItem(
          'tmovie_read_notifications',
          JSON.stringify(updated.map((n) => n.id))
        );
      } catch {}
      return updated;
    });
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      try {
        const readIds: string[] = JSON.parse(
          localStorage.getItem('tmovie_read_notifications') || '[]'
        );
        if (!readIds.includes(id)) {
          readIds.push(id);
          localStorage.setItem('tmovie_read_notifications', JSON.stringify(readIds));
        }
      } catch {}
      return updated;
    });
  };

  return (
    <UIContext.Provider
      value={{
        sidebarCollapsed,
        setSidebarCollapsed,
        toggleSidebar,
        plansModalOpen,
        setPlansModalOpen,
        notificationsOpen,
        setNotificationsOpen,
        notifications,
        markAllNotificationsRead,
        markNotificationRead,
        userDropdownOpen,
        setUserDropdownOpen,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) {
    throw new Error('useUI must be used within UIProvider');
  }
  return ctx;
}
