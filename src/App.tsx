// src/App.tsx
import { useState } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import HomeView from './components/HomeView';
import DetailsView from './components/DetailsView';
import DownloadsView from './components/DownloadsView';
import SettingsView from './components/SettingsView';

// Mock Data as defined in the mockui.html
const MOCK_DB = [
    { id: 1, title: "Cyberpunk: Edgerunners", eps: 10, img: "https://picsum.photos/seed/cyber/300/420", desc: "In a dystopia riddled with corruption and cybernetic implants, a talented but reckless street kid strives to become a mercenary outlaw." },
    { id: 2, title: "That Time I Got Reincarnated", eps: 48, img: "https://picsum.photos/seed/slime/300/420", desc: "Corporate worker Mikami Satoru is stabbed by a random killer, and is reborn into an alternate world." },
    { id: 3, title: "Attack on Titan", eps: 87, img: "https://picsum.photos/seed/titan/300/420", desc: "After his hometown is destroyed and his mother is killed, young Eren Jaeger vows to cleanse the earth of the giant humanoid Titans." },
    { id: 4, title: "Jujutsu Kaisen", eps: 48, img: "https://picsum.photos/seed/jjk/300/420", desc: "A boy swallows a cursed talisman - the finger of a demon - and becomes cursed himself." },
    { id: 5, title: "Demon Slayer: Kimetsu no Yaiba", eps: 55, img: "https://picsum.photos/seed/ds/300/420", desc: "A family is attacked by demons and only two members survive - Tanjiro and his sister Nezuko." },
    { id: 6, title: "Solo Leveling", eps: 12, img: "https://picsum.photos/seed/solo/300/420", desc: "In a world where hunters must battle deadly monsters to protect humanity, Sung Jinwoo is the weakest of them all." },
];

type View = 'home' | 'details' | 'downloads' | 'settings';

interface Anime {
    id: number;
    title: string;
    eps: number;
    img: string;
    desc: string;
}

interface Download {
    id: number;
    title: string;
    prog: number;
}

interface Toast {
    id: number;
    message: string;
    type: 'success' | 'warning' | 'error' | 'info';
}

function App() {
    const [currentView, setCurrentView] = useState<View>('home');
    const [activeAnime, setActiveAnime] = useState<Anime | null>(null);
    const [downloads, setDownloads] = useState<Download[]>([]);
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

    const handleAddDownloads = (anime: Anime, episodes: number[]) => {
        if (episodes.length === 0) {
            showToast('Select episodes first', 'warning');
            return;
        }
        const newDownloads = episodes.map(ep => ({
            id: Math.random(),
            title: `${anime.title} Ep ${ep}.mp4`,
            prog: 0
        }));
        setDownloads(prev => [...prev, ...newDownloads]);
        showToast(`Added ${episodes.length} tasks`, 'success');
        setCurrentView('downloads');
    };

    const renderView = () => {
        switch (currentView) {
            case 'home':
                return <HomeView onNavigate={handleNavigate} showToast={showToast} />;
            case 'details':
                return <DetailsView anime={activeAnime} onAddDownloads={handleAddDownloads} />;
            case 'downloads':
                return <DownloadsView downloads={downloads} setDownloads={setDownloads} />;
            case 'settings':
                return <SettingsView showToast={showToast} />;
            default:
                return <HomeView MOCK_DB={MOCK_DB} onNavigate={handleNavigate} showToast={showToast} />;
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
