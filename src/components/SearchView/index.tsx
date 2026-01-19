import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import AuraLoader from '../AuraLoader';
import { searchAnime } from '../../lib/api/tauri';

interface SearchViewProps {
    initialQuery?: string;
    onSearch?: (query: string) => void;
    onNavigate: (view: string, data?: any) => void;
    showToast: (
        message: string,
        type: 'success' | 'warning' | 'error' | 'info'
    ) => void;
}

const SearchView: React.FC<SearchViewProps> = ({ initialQuery, onSearch, onNavigate, showToast }) => {
    const [inputValue, setInputValue] = useState(initialQuery || '');
    const [searchQuery, setSearchQuery] = useState(initialQuery || '');

    // If initialQuery changes (e.g. from history nav), update state
    useEffect(() => {
        if (initialQuery) {
            setInputValue(initialQuery);
            setSearchQuery(initialQuery);
        }
    }, [initialQuery]);

    const { data, isLoading, error, isSuccess } = useQuery({
        queryKey: ['animeSearch', searchQuery],
        queryFn: () => searchAnime(searchQuery),
        enabled: searchQuery.length > 0,
    });

    useEffect(() => {
        if (error) {
            showToast(error.message, 'error');
        }
    }, [error, showToast]);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);
    };

    const handleSearch = () => {
        if (inputValue.trim()) {
            const query = inputValue.trim();
            setSearchQuery(query);
            if (onSearch) {
                onSearch(query);
            }
        }
    };

    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div id="view-search" className="view-container active">
            <div className="search-section">
                <div className="search-box">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search for anime..."
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        autoFocus
                    />
                    <button className="search-btn" onClick={handleSearch} aria-label="Search">
                        <svg className="icon" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                            <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0"></path>
                            <path d="M21 21l-6 -6"></path>
                        </svg>
                    </button>
                </div>
            </div>

            {isLoading && <AuraLoader />}

            {!searchQuery && !isLoading && (
                <div className="search-placeholder">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1" opacity="0.5">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                    </svg>
                    <p style={{ color: 'var(--text-muted)', marginTop: '16px' }}>
                        Enter a title to search
                    </p>
                </div>
            )}

            {isSuccess && data && data.length > 0 && (
                <div id="results-section">
                    <div className="section-header">Results for "{searchQuery}"</div>
                    <div className="featured-grid">
                        {data.map((anime) => (
                            <div
                                key={anime.url}
                                className="anime-card"
                                onClick={() => onNavigate('details', anime)}
                            >
                                <div className="poster-wrapper">
                                    <img
                                        src={anime.image}
                                        className="anime-poster"
                                        loading="lazy"
                                        alt={anime.title}
                                    />
                                </div>
                                <div className="anime-info">
                                    <div className="anime-title">{anime.title}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isSuccess && data?.length === 0 && (
                <div className="no-results" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No results found for "{searchQuery}"
                </div>
            )}
        </div>
    );
};

export default SearchView;
