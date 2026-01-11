// src/App.tsx
import { useState } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import HomeView from './components/HomeView';
import DetailsView from './components/DetailsView';
import DownloadsView from './components/DownloadsView';
import SettingsView from './components/SettingsView';
import { AnimeSearchResult } from './lib/api/types';

type View = 'home' | 'details' | 'downloads' | 'settings';

interface Toast {
    id: number;
    message: string;
    type: 'success' | 'warning' | 'error' | 'info';
}

function App() {
    const [currentView, setCurrentView] = useState<View>('home');
    const [activeAnime, setActiveAnime] = useState<AnimeSearchResult | null>(null);
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = (message: string, type: Toast['type']) => {
        const newToast: Toast = { id: Date.now(), message, type };
        setToasts(prev => [...prev, newToast]);
        setTimeout(() => {
            setToasts(allToasts => allToasts.filter(t => t.id !== newToast.id));
        }, 3500);
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
                return <DownloadsView />;
            case 'settings':
                return <SettingsView showToast={showToast} />;
            default:
                return <HomeView onNavigate={handleNavigate} showToast={showToast} />;
        }
    };

    const pageTitle = currentView.charAt(0).toUpperCase() + currentView.slice(1);

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            <Sidebar activeView={currentView} onNavigate={handleNavigate} />
            <main className="main-content">
                <TopBar pageTitle={pageTitle} />
                {renderView()}
            </main>
            <div className="toast-container">
                {toasts.map(toast => (
                    <div key={toast.id} className={`toast toast-${toast.type}`}>
                        {toast.message}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default App;
