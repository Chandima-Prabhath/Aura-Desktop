// src/App.tsx
import { useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import HomeView from './components/HomeView';
import DetailsView from './components/DetailsView';
import DownloadsView from './components/DownloadsView';
import SettingsView from './components/SettingsView';
import PopularView from './components/PopularView';
import NewView from './components/NewView';
import { AnimeSearchResult } from './lib/api/types';

type View = 'home' | 'details' | 'downloads' | 'settings' | 'popular' | 'new';

function App() {
    const [currentView, setCurrentView] = useState<View>('home');
    const [activeAnime, setActiveAnime] = useState<AnimeSearchResult | null>(null);

    const showToast = (
        message: string,
        type: 'success' | 'warning' | 'error' | 'info'
    ) => {
        switch (type) {
            case 'success':
                toast.success(message);
                break;
            case 'error':
                toast.error(message);
                break;
            case 'warning':
                toast(message, { icon: '⚠️' });
                break;
            case 'info':
                toast.custom(message);
                break;
        }
    };

    const handleNavigate = (view: string, data?: any) => {
        setCurrentView(view as View);
        if (view === 'details' && data) {
            setActiveAnime(data);
        }
    };

    const handleDownloadsAdded = () => {
        setCurrentView('downloads');
    };

    const renderView = () => {
        switch (currentView) {
            case 'home':
                return <HomeView onNavigate={handleNavigate} showToast={showToast} />;
            case 'details':
                return <DetailsView anime={activeAnime} onDownloadsAdded={handleDownloadsAdded} showToast={showToast} />;
            case 'downloads':
                return <DownloadsView onNavigate={handleNavigate} />;
            case 'settings':
                return <SettingsView showToast={showToast} />;
            case 'popular':
                return <PopularView onNavigate={handleNavigate} showToast={showToast} />;
            case 'new':
                return <NewView onNavigate={handleNavigate} showToast={showToast} />;
            default:
                return <HomeView onNavigate={handleNavigate} showToast={showToast} />;
        }
    };

    const getPageTitle = () => {
        switch (currentView) {
            case 'home':
                return 'Home';
            case 'details':
                return 'Details';
            case 'downloads':
                return 'Downloads';
            case 'settings':
                return 'Settings';
            case 'popular':
                return 'Popular';
            case 'new':
                return 'New';
            default:
                return 'Aura';
        }
    };

    const pageTitle = getPageTitle();

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            <Toaster position="bottom-right" />
            <Sidebar activeView={currentView} onNavigate={handleNavigate} />
            <main className="main-content">
                <TopBar pageTitle={getPageTitle()} />
                {renderView()}
            </main>
        </div>
    );
}

export default App;
