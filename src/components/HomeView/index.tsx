import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchAnime } from '../../lib/api/anime';
import { AnimeSearchResult } from '../../lib/api/types';

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

  const trendingAnimes: AnimeSearchResult[] = [
    {
      title: 'Solo Leveling',
      url: '',
      image: 'https://picsum.photos/seed/solo/300/420',
    },
    {
      title: 'Jujutsu Kaisen',
      url: '',
      image: 'https://picsum.photos/seed/jjk/300/420',
    },
  ];

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
            <svg className="icon" viewBox="0 0 24 24"><g id="SVGRepo_bgCarrier" strokeWidth="0" />
                <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" />
                <g id="SVGRepo_iconCarrier"> <rect width="24" height="24" fill="none" /> <path fillRule="evenodd" clipRule="evenodd" d="M7.25007 2.38782C8.54878 2.0992 10.1243 2 12 2C13.8757 2 15.4512 2.0992 16.7499 2.38782C18.06 2.67897 19.1488 3.176 19.9864 4.01358C20.824 4.85116 21.321 5.94002 21.6122 7.25007C21.9008 8.54878 22 10.1243 22 12C22 13.8757 21.9008 15.4512 21.6122 16.7499C21.321 18.06 20.824 19.1488 19.9864 19.9864C19.1488 20.824 18.06 21.321 16.7499 21.6122C15.4512 21.9008 13.8757 22 12 22C10.1243 22 8.54878 21.9008 7.25007 21.6122C5.94002 21.321 4.85116 20.824 4.01358 19.9864C3.176 19.1488 2.67897 18.06 2.38782 16.7499C2.0992 15.4512 2 13.8757 2 12C2 10.1243 2.0992 8.54878 2.38782 7.25007C2.67897 5.94002 3.176 4.85116 4.01358 4.01358C4.85116 3.176 5.94002 2.67897 7.25007 2.38782ZM9 11.5C9 10.1193 10.1193 9 11.5 9C12.8807 9 14 10.1193 14 11.5C14 12.8807 12.8807 14 11.5 14C10.1193 14 9 12.8807 9 11.5ZM11.5 7C9.01472 7 7 9.01472 7 11.5C7 13.9853 9.01472 16 11.5 16C12.3805 16 13.202 15.7471 13.8957 15.31L15.2929 16.7071C15.6834 17.0976 16.3166 17.0976 16.7071 16.7071C17.0976 16.3166 17.0976 15.6834 16.7071 15.2929L15.31 13.8957C15.7471 13.202 16 12.3805 16 11.5C16 9.01472 13.9853 7 11.5 7Z" fill="currentColor" /> </g>
            </svg>
          </button>
        </div>
      </div>

      {searchQuery.length === 0 && (
        <div id="trending-section">
          <div className="section-header">Trending Now</div>
          <div className="featured-grid">
            {trendingAnimes.map((anime) => (
              <div
                key={anime.title}
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

      {isLoading && <div className="loader">Loading...</div>}

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