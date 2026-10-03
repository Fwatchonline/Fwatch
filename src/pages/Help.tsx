import { useState, useMemo } from 'react';
import {
  HelpCircle,
  Search,
  Tv,
  Bookmark,
  Star,
  Monitor,
  ChevronDown,
  ArrowRight,
  Headphones,
  CheckCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';

interface FAQItem {
  id: string;
  category: 'playback' | 'watchlist' | 'ratings' | 'devices';
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: 'server-switch',
    category: 'playback',
    question: 'How do I switch streaming servers if a video is buffering or fails to load?',
    answer:
      'On the watch page, click on any of the alternative server buttons under the video player (VidLink, VidUP, AutoEmbed, 2Embed, VidCloud). Switching servers takes just 1 click and automatically migrates your playback session to a high-speed CDN without reloading the page.',
  },
  {
    id: 'subtitles',
    category: 'playback',
    question: 'How do I activate subtitles or change the audio language?',
    answer:
      'Most servers include built-in multi-language subtitles. Click the CC / Subtitles icon inside the video player controls to select English, Spanish, French, German, or international subtitles. You can also adjust font size and background opacity directly in the player menu.',
  },
  {
    id: 'stream-quality',
    category: 'playback',
    question: 'What video resolutions are available (4K, 1080p)?',
    answer:
      'Our adaptive HLS stream pipeline automatically serves the highest possible resolution available for the title (up to 4K Ultra HD for latest releases and 1080p Full HD for classic titles). If your connection drops speed, it gracefully adjusts bitrates to avoid buffering.',
  },
  {
    id: 'watchlist-storage',
    category: 'watchlist',
    question: 'How does the Watchlist work and where are my movies saved?',
    answer:
      'Your Watchlist is stored locally in your browser’s high-speed local storage. You do not need to log in to save titles. Simply click the Bookmark icon on any movie or TV series card to save it instantly. You can access all your saved items anytime under "Watchlist" in the sidebar.',
  },
  {
    id: 'watchlist-backup',
    category: 'watchlist',
    question: 'Can I export or backup my saved Watchlist?',
    answer:
      'Yes! Head to Settings -> Data & Storage, where you can download your entire watchlist as a JSON backup file or restore it onto another device with 1 click.',
  },
  {
    id: 'imdb-ratings',
    category: 'ratings',
    question: 'Where do the IMDb ratings come from and are they authentic?',
    answer:
      'All ratings displayed across T.Movie are 100% authentic IMDb scores fetched and synchronized directly via official IMDb identifiers (e.g. IMDb 9.0 for The Dark Knight, 8.8 for Fight Club, 9.5 for Breaking Bad). Episode ratings reflect actual episode-by-episode scores.',
  },
  {
    id: 'episodes-sync',
    category: 'ratings',
    question: 'How quickly are new TV episodes updated after they air?',
    answer:
      'New TV episodes are synced directly from TMDB broadcast schedules within 1-2 hours of their premiere. You can browse the latest weekly broadcast additions directly in the "New Episodes" section.',
  },
  {
    id: 'cast-profiles',
    category: 'ratings',
    question: 'How do I explore an actor or director’s complete filmography?',
    answer:
      'Click on "Popular People" in the left sidebar or click any actor’s name on a movie details page. You will see their biography, birthday, and full list of acting and directing credits sorted by popularity.',
  },
  {
    id: 'smart-tv-cast',
    category: 'devices',
    question: 'Can I stream or cast T.Movie to my Smart TV, Chromecast, or Apple TV?',
    answer:
      'Yes! Open the video player in full screen and click the Cast / AirPlay icon in the player or use your browser’s native casting feature to beam the stream straight to your Samsung, LG, Sony TV, or Apple TV device.',
  },
  {
    id: 'mobile-support',
    category: 'devices',
    question: 'Does T.Movie work on mobile devices without installing an app?',
    answer:
      'T.Movie is fully responsive and optimized for iOS Safari, Android Chrome, and tablets. You can also "Add to Home Screen" to install it as a lightweight Progressive Web App for full-screen playback.',
  },
];

export function Help() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'playback' | 'watchlist' | 'ratings' | 'devices'>('all');
  const [openIds, setOpenIds] = useState<string[]>(['server-switch', 'watchlist-storage']);

  const toggleOpen = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredFAQs = useMemo(() => {
    return FAQ_DATA.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  return (
    <div className="min-h-screen bg-[#08090c] pt-24 pb-16">
      <SEO
        title="Help Center & FAQ - T.Movie"
        description="Find answers to common questions about video playback, servers, subtitles, watchlist, and device compatibility on T.Movie."
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'Help Center', item: '/help' },
        ]}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex p-3 rounded-2xl bg-[#F5C518]/15 text-[#F5C518] border border-[#F5C518]/25 shadow-lg shadow-[#F5C518]/10">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            How can we help you?
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            Search our knowledge base or browse categories below for instant troubleshooting.
          </p>

          {/* Search Box */}
          <div className="relative pt-2">
            <Search className="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search answers (e.g., buffering, server, subtitles, 4K)..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-[#151820] border border-white/10 focus:border-[#F5C518] focus:bg-[#1a1e28] text-sm text-white placeholder-neutral-500 outline-none transition-all shadow-inner"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-[#F5C518] text-black font-extrabold shadow-md shadow-[#F5C518]/25'
                : 'bg-[#151820] text-neutral-400 hover:text-white border border-white/5'
            }`}
          >
            All Questions ({FAQ_DATA.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('playback')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'playback'
                ? 'bg-[#F5C518] text-black font-extrabold shadow-md shadow-[#F5C518]/25'
                : 'bg-[#151820] text-neutral-400 hover:text-white border border-white/5'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Playback &amp; Servers</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('watchlist')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'watchlist'
                ? 'bg-[#F5C518] text-black font-extrabold shadow-md shadow-[#F5C518]/25'
                : 'bg-[#151820] text-neutral-400 hover:text-white border border-white/5'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Watchlist &amp; Data</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('ratings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'ratings'
                ? 'bg-[#F5C518] text-black font-extrabold shadow-md shadow-[#F5C518]/25'
                : 'bg-[#151820] text-neutral-400 hover:text-white border border-white/5'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>IMDb Ratings</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('devices')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'devices'
                ? 'bg-[#F5C518] text-black font-extrabold shadow-md shadow-[#F5C518]/25'
                : 'bg-[#151820] text-neutral-400 hover:text-white border border-white/5'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Devices &amp; Cast</span>
          </button>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-16 bg-[#12141a] rounded-3xl border border-white/5">
              <p className="text-neutral-400 text-sm">No answers match your search term.</p>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setActiveCategory('all');
                }}
                className="mt-3 text-xs text-[#F5C518] hover:underline font-bold"
              >
                Reset filters
              </button>
            </div>
          ) : (
            filteredFAQs.map((faq) => {
              const isOpen = openIds.includes(faq.id);

              return (
                <div
                  key={faq.id}
                  className="rounded-2xl bg-[#12141a] border border-white/5 overflow-hidden transition-all shadow-md"
                >
                  <button
                    type="button"
                    onClick={() => toggleOpen(faq.id)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <span className="text-sm sm:text-base font-bold text-white pr-2">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 flex-shrink-0 text-[#F5C518] transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-neutral-300 leading-relaxed border-t border-white/5">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Still Need Help Footer Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#171a24] via-[#1a1e2b] to-[#12141a] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-1.5 text-center sm:text-left">
            <h3 className="text-lg sm:text-xl font-black text-white flex items-center justify-center sm:justify-start gap-2">
              <Headphones className="w-5 h-5 text-[#F5C518]" />
              <span>Still have questions or need assistance?</span>
            </h3>
            <p className="text-xs text-neutral-400 max-w-lg leading-relaxed">
              Our support team is available 24/7 to solve streaming issues, take title requests, or answer questions.
            </p>
          </div>

          <Link
            to="/contact"
            className="px-6 py-3 rounded-xl bg-[#F5C518] hover:bg-[#E5B508] text-black text-xs sm:text-sm font-extrabold tracking-wide transition-all shadow-lg shadow-[#F5C518]/25 flex items-center gap-2 flex-shrink-0 cursor-pointer hover:scale-105 active:scale-95"
          >
            <span>Contact Support</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
