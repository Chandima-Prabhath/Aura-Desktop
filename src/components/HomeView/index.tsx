// src/components/HomeView/index.tsx
import React, { useState } from 'react';

// Define the types for the props if any, and for the mock data
interface Anime {
    id: number;
    title: string;
    eps: number;
    img: string;
    desc: string;
}

interface HomeViewProps {
    MOCK_DB: Anime[];
    onNavigate: (view: string, data?: any) => void;
    showToast: (message: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

const HomeView: React.FC<HomeViewProps> = ({ MOCK_DB, onNavigate, showToast }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const performSearch = () => {
        const trendingSection = document.getElementById('trending-section');
        const resultsSection = document.getElementById('results-section');
        if (trendingSection && resultsSection) {
            if (searchQuery.length > 0) {
                trendingSection.style.display = 'none';
                resultsSection.style.display = 'block';
            } else {
                trendingSection.style.display = 'block';
                resultsSection.style.display = 'none';
            }
        }
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value);
    };

    const handleEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            performSearch();
        }
    };

    const filteredAnime = MOCK_DB.filter(anime =>
        anime.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div id="view-home" className="view-container active">
            <div className="update-banner" id="update-banner">
                <div className="banner-content">
                    <h4>New Update Available (v0.0.3)</h4>
                    <p>Faster downloads, bug fixes, and UI improvements.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '12px' }} onClick={() => showToast('Update started...', 'info')}>Update Now</button>
                    <div className="close-banner" onClick={() => {
                        const banner = document.getElementById('update-banner');
                        if (banner) banner.style.display = 'none';
                    }}>
                        <svg className="icon" viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
                    </div>
                </div>
            </div>

            <div className="search-section">
                <div className="search-box">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="What do you want to watch?"
                        value={searchQuery}
                        onChange={handleInputChange}
                        onKeyPress={handleEnter}
                    />
                    <button className="search-btn" onClick={performSearch}>
                        <svg className="icon" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
                    </button>
                </div>
            </div>

            <div id="trending-section">
                <div className="section-header">Trending Now</div>
                <div className="featured-grid">
                    {MOCK_DB.slice(0, 4).map(anime => (
                        <div key={anime.id} className="anime-card" onClick={() => onNavigate('details', anime)}>
                            <div className="poster-wrapper">
                                <img src={anime.img} className="anime-poster" loading="lazy" alt={anime.title} />
                            </div>
                            <div className="anime-info">
                                <div className="anime-title">{anime.title}</div>
                                <div className="anime-meta">
                                    <span>{anime.eps} Episodes</span>
                                    <span className="badge">HD</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div id="results-section" style={{ display: 'none' }}>
                <div className="section-header">Search Results</div>
                <div className="featured-grid">
                    {filteredAnime.map(anime => (
                        <div key={anime.id} className="anime-card" onClick={() => onNavigate('details', anime)}>
                            <div className="poster-wrapper">
                                <img src={anime.img} className="anime-poster" loading="lazy" alt={anime.title} />
                            </div>
                            <div className="anime-info">
                                <div className="anime-title">{anime.title}</div>
                                <div className="anime-meta">
                                    <span>{anime.eps} Episodes</span>
                                    <span className="badge">HD</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HomeView;
