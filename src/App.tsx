import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { UIProvider } from './context/UIContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Movies } from './pages/Movies';
import { TVShows } from './pages/TVShows';
import { Anime } from './pages/Anime';
import { AnimeDetails } from './pages/AnimeDetails';
import { MovieDetails } from './pages/MovieDetails';
import { TVDetails } from './pages/TVDetails';
import { WatchMovie } from './pages/WatchMovie';
import { WatchEpisode } from './pages/WatchEpisode';
import { Search } from './pages/Search';
import { Artists } from './pages/Artists';
import { Actor } from './pages/Actor';
import { Genres } from './pages/Genres';
import { Genre } from './pages/Genre';
import { Favorites } from './pages/Favorites';
import { NewEpisodes } from './pages/NewEpisodes';
import { Contact } from './pages/Contact';
import { Help } from './pages/Help';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { EmbedPlayer } from './pages/EmbedPlayer';
import { EmbedApiDocs } from './pages/EmbedApiDocs';
import { NotFound } from './pages/NotFound';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <UIProvider>
        <ScrollToTop />
        <Routes>
          {/* Standalone Login Screen */}
          <Route path="/login" element={<Login />} />

          {/* Standalone Embed Player Routes (100% Fullscreen for External Iframes) */}
          <Route path="/embed/movie/:id" element={<EmbedPlayer type="movie" />} />
          <Route
            path="/embed/tv/:id/:seasonNumber/:episodeNumber"
            element={<EmbedPlayer type="tv" />}
          />
          <Route path="/embed/tv/:id" element={<EmbedPlayer type="tv" />} />

          {/* Standard T.Movie Layout (Sidebar + TopNav + Content + Footer) */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/api" element={<EmbedApiDocs />} />
            <Route path="/embed-api" element={<EmbedApiDocs />} />
            <Route path="/api-docs" element={<EmbedApiDocs />} />
            <Route path="/docs/api" element={<EmbedApiDocs />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/tv" element={<TVShows />} />
            <Route path="/series" element={<TVShows />} />
            <Route path="/anime" element={<Anime />} />
            <Route path="/anime/:slug" element={<AnimeDetails />} />
            <Route path="/watch/anime/:slug" element={<AnimeDetails />} />
            <Route path="/movie/:slug" element={<MovieDetails />} />
            <Route path="/tv/:slug" element={<TVDetails />} />
            <Route path="/tv/:slug/season/:seasonNumber" element={<TVDetails />} />
            <Route
              path="/tv/:slug/season/:seasonNumber/episode/:episodeNumber"
              element={<WatchEpisode />}
            />
            <Route path="/watch/movie/:slug" element={<WatchMovie />} />
            <Route
              path="/watch/tv/:slug/season/:seasonNumber/episode/:episodeNumber"
              element={<WatchEpisode />}
            />
            <Route path="/search" element={<Search />} />
            <Route path="/filter" element={<Search />} />
            <Route path="/people" element={<Artists />} />
            <Route path="/artists" element={<Artists />} />
            <Route path="/actor/:slug" element={<Actor />} />
            <Route path="/artist/:slug" element={<Actor />} />
            <Route path="/genres" element={<Genres />} />
            <Route path="/genre/:slug" element={<Genre />} />
            <Route path="/watchlist" element={<Favorites />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/episodes" element={<NewEpisodes />} />
            <Route path="/new-episodes" element={<NewEpisodes />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/contact-us" element={<Contact />} />
            <Route path="/help" element={<Help />} />
            <Route path="/help-center" element={<Help />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/setting" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </UIProvider>
    </BrowserRouter>
  );
}
