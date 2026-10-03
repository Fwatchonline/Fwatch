import React, { createContext, useContext, useState, useEffect } from 'react';

interface NotificationItem {
  id: string;
  title: string;
  mediaTitle: string;
  type: 'episode' | 'movie' | 'system';
  time: string;
  image: string;
  read: boolean;
  link: string;
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
  userDropdownOpen: boolean;
  setUserDropdownOpen: (v: boolean) => void;
}

const initialNotifications: NotificationItem[] = [
  {
    id: '1',
    title: 'Season 2, Episode 3 has been released.',
    mediaTitle: 'The Lord of the Rings: The Rings of Power',
    type: 'episode',
    time: '2 hours ago',
    image: 'https://image.tmdb.org/t/p/w300/mYLOqiStMxDK3fYZQl98457ExHO.jpg',
    read: false,
    link: '/tv/76479-the-lord-of-the-rings-the-rings-of-power/season/2/episode/3',
  },
  {
    id: '2',
    title: 'Episode 4, has been released.',
    mediaTitle: 'Bad Monkey',
    type: 'episode',
    time: '5 hours ago',
    image: 'https://image.tmdb.org/t/p/w300/49zoxL7u8cR9V4q70fK7U79s1wJ.jpg',
    read: false,
    link: '/tv/157202-bad-monkey/season/1/episode/4',
  },
  {
    id: '3',
    title: 'Episode 9, has been released.',
    mediaTitle: 'Sunny',
    type: 'episode',
    time: '1 day ago',
    image: 'https://image.tmdb.org/t/p/w300/87O4fXfK9yA2K7t2W6v8tM4K5.jpg',
    read: true,
    link: '/tv/194766-sunny/season/1/episode/9',
  },
  {
    id: '4',
    title: 'The film, has been released.',
    mediaTitle: 'The Greatest Hits',
    type: 'movie',
    time: '2 days ago',
    image: 'https://image.tmdb.org/t/p/w300/bAXMqn0j13o1c6P0aG2K9mZ7xYt.jpg',
    read: true,
    link: '/movie/1143183-the-greatest-hits',
  },
];

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('tmovie_sidebar_collapsed') === 'true';
  });

  const [plansModalOpen, setPlansModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);

  useEffect(() => {
    localStorage.setItem('tmovie_sidebar_collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
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
