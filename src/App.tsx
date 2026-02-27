// src/App.tsx
import { useState, useEffect, useCallback } from 'react';
import { useResponsive } from './hooks/use-responsive';
import Sidebar from './components/Sidebar';
import BottomNavBar from './components/BottomNavBar';
import TopBar from './components/TopBar';
import HomeView from './components/HomeView';
import SearchView from './components/SearchView';
import DetailsView from './components/DetailsView';
import DownloadsView from './components/DownloadsView';
import SettingsView from './components/SettingsView';
import type { AnimeSearchResult } from './lib/api/types';

type ViewName = 'home' | 'search' | 'details' | 'downloads' | 'settings';

type SearchViewData = { query?: string };
type ViewState =
    | { view: 'home'; key: number }
    | { view: 'search'; key: number; data?: SearchViewData }
    | { view: 'details'; key: number; data: AnimeSearchResult }
    | { view: 'downloads'; key: number }
    | { view: 'settings'; key: number };

interface Toast {
    id: number;
    message: string;
    type: 'success' | 'warning' | 'error' | 'info';
}

function App() {
    const { isMobile } = useResponsive();

    // Navigation Stack
    // Initialize with Home
    const [history, setHistory] = useState<ViewState[]>([{ view: 'home', key: Date.now() }]);

    // Current Active View is the last one in history
    const currentView = history[history.length - 1];

    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = (message: string, type: Toast['type']) => {
        const newToast: Toast = { id: Date.now(), message, type };
        setToasts(prev => [...prev, newToast]);
        setTimeout(() => {
            setToasts(allToasts => allToasts.filter(t => t.id !== newToast.id));
        }, 3500);
    };

    // --- Navigation Logic ---

    const pushView = useCallback((view: ViewName, data?: SearchViewData | AnimeSearchResult) => {
        setHistory(prev => {
            // Prevent duplicate adjacent views if needed, or just push
            // If pushing the same view type, we generally want to allow it? 
            // For this app, maybe not navigating to 'settings' twice.
            if (prev[prev.length - 1].view === view && view !== 'details') {
                return prev;
            }
            // For Details, always push new (could be different animes)

            // Interaction with Browser History for Android Back Button:
            // We push a state to the window.history so that the hardware back button
            // will trigger a 'popstate' event instead of exiting the app.
            window.history.pushState({ view }, "");

            if (view === 'details') {
                return [...prev, { view, data: data as AnimeSearchResult, key: Date.now() }];
            }
            if (view === 'search') {
                return [...prev, { view, data: data as SearchViewData | undefined, key: Date.now() }];
            }
            return [...prev, { view, key: Date.now() }];
        });
    }, []);

    // Handle initial history state
    useEffect(() => {
        // Replace initial state to establish a base
        window.history.replaceState({ view: 'home' }, "");

        const handlePopState = (event: PopStateEvent) => {
            // User pressed Back Button (Hardware or Browser)
            // We interpret this as "Go Back" in our app history
            setHistory(prev => {
                if (prev.length > 1) {
                    return prev.slice(0, -1);
                } else {
                    // We are at root. 
                    // If we want to allow exit, we don't prevent default.
                    // But popstate happens AFTER the change.
                    // If we are here, it means we popped the initial state?
                    return prev;
                }
            });
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);


    const handleNavigate = (view: string, data?: SearchViewData | AnimeSearchResult) => {
        // If navigation comes from Sidebar/BottomBar, usually we want to 'Reset' stack to that root?
        // OR simply Push it?
        // Standard mobile app pattern: Tab change switches root context or pushes?
        // Let's implement Tab Switching:
        // If view is 'home', 'downloads', 'settings', these are "Roots".
        // Switching to them might clear stack or just push??
        // simpler for now: properties specific navigation.

        if (['home', 'search', 'downloads', 'settings'].includes(view)) {
            // If we are clicking a Tab, we generally check if we are already there
            if (currentView.view === view) return;

            // Optional: If switching tabs, maybe clear stack to just [Tab]?
            // Let's try just pushing for now, but that builds infinite stack.
            // Better: If switching to a main Tab, Reset stack to [Tab].

            const rootState: ViewState =
                view === 'home'
                    ? { view: 'home', key: Date.now() }
                    : view === 'search'
                        ? { view: 'search', key: Date.now() }
                        : view === 'downloads'
                            ? { view: 'downloads', key: Date.now() }
                            : { view: 'settings', key: Date.now() };

            setHistory([rootState]);
            // Reset window history to keep it clean? 
            // This is tricky with Android back button.
            // Simple approach: Just pushTab.
        } else {
            pushView(view as ViewName, data);
        }
    };

    const handleDownloadsAdded = () => {
        // Special case: Go to Downloads tab (Reset stack?)
        setHistory([{ view: 'downloads', key: Date.now() }]);
    };

    const renderCurrentView = () => {
        switch (currentView.view) {
            case 'home':
                return <HomeView onNavigate={(v, d) => pushView(v as ViewName, d)} showToast={showToast} />;
            case 'search':
                return (
                    <SearchView
                        onNavigate={(v, d) => pushView(v as ViewName, d)}
                        showToast={showToast}
                        initialQuery={currentView.view === 'search' ? currentView.data?.query : undefined}
                        onSearch={(query) => {
                            setHistory((prev) => {
                                const newHistory = [...prev];
                                const currentIndex = newHistory.length - 1;
                                if (newHistory[currentIndex].view === 'search') {
                                    newHistory[currentIndex] = {
                                        ...newHistory[currentIndex],
                                        data: { ...newHistory[currentIndex].data, query },
                                    };
                                }
                                return newHistory;
                            });
                        }}
                    />
                );
            case 'details':
                return <DetailsView
                    anime={currentView.view === 'details' ? currentView.data : null}
                    onDownloadsAdded={handleDownloadsAdded}
                    showToast={showToast}
                />;
            case 'downloads':
                return <DownloadsView />;
            case 'settings':
                return <SettingsView showToast={showToast} />;
            default:
                return <div>Unknown View</div>;
        }
    };

    const pageTitle = currentView.view.charAt(0).toUpperCase() + currentView.view.slice(1);

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            {isMobile ? (
                <BottomNavBar activeView={currentView.view} onNavigate={handleNavigate} />
            ) : (
                <Sidebar activeView={currentView.view} onNavigate={handleNavigate} />
            )}
            <main className="main-content">
                <TopBar
                    pageTitle={pageTitle}
                    canGoBack={history.length > 1}
                    onGoBack={() => {
                        if (history.length > 1) {
                            window.history.back();
                        }
                    }}
                />
                {renderCurrentView()}
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
