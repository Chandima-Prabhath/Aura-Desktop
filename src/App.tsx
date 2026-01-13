// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import HomeView from './components/HomeView';
import SearchView from './components/SearchView';
import DetailsView from './components/DetailsView';
import DownloadsView from './components/DownloadsView';
import SettingsView from './components/SettingsView';

function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<HomeView />} />
        <Route path="search" element={<SearchView />} />
        <Route path="details/:animeId" element={<DetailsView />} />
        <Route path="downloads" element={<DownloadsView />} />
        <Route path="settings" element={<SettingsView />} />
      </Route>
    </Routes>
  );
}

export default App;
