import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import AuraLoader from '../AuraLoader';
import { searchAnime, getPopularAnime, getNewAnime } from '../../lib/api/tauri';

interface HomeViewProps {
  onNavigate: (view: string, data?: any) => void;
  showToast: (
    message: string,
    type: 'success' | 'warning' | 'error' | 'info'
  ) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ onNavigate, showToast }) => {
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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
    setSearchQuery(inputValue);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const {
    data: popularAnime,
    isLoading: isLoadingPopular,
    error: errorPopular,
  } = useQuery({
    queryKey: ['popularAnime'],
    queryFn: getPopularAnime,
  });

  const {
    data: newAnime,
    isLoading: isLoadingNew,
    error: errorNew,
  } = useQuery({
    queryKey: ['newAnime'],
    queryFn: getNewAnime,
  });

  useEffect(() => {
    if (errorPopular) {
      showToast(errorPopular.message, 'error');
    }
    if (errorNew) {
      showToast(errorNew.message, 'error');
    }
  }, [errorPopular, errorNew, showToast]);

  if (isLoadingPopular || isLoadingNew) {
    return <AuraLoader />;
  }

  return (
    <div id="view-home" className="view-container active">
      <div className="search-section">
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="What do you want to watch?"
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
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

      {searchQuery.length === 0 && !isLoading && (
        <>
          <div id="popular-section">
            <div className="section-header">Popular Today</div>
            <div className="featured-grid">
              {popularAnime?.map((anime) => (
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
          <div id="new-section" style={{ marginTop: '40px' }}>
            <div className="section-header">Newly Released</div>
            <div className="featured-grid">
              {newAnime?.map((anime) => (
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
        </>
      )}

      {isSuccess && data && (
        <div id="results-section">
          <div className="section-header">Search Results</div>
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
                  <div className="anime-meta">
                    <span className="badge">HD</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isSuccess && data?.length === 0 && (
        <div className="no-results">No results found.</div>
      )}
    </div>
  );
};

export default HomeView;
