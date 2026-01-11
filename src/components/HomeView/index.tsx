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

const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const HomeView: React.FC<HomeViewProps> = ({ onNavigate, showToast }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const { data, isLoading, error, isSuccess } = useQuery({
    queryKey: ['animeSearch', debouncedSearchQuery],
    queryFn: () => searchAnime(debouncedSearchQuery),
    enabled: debouncedSearchQuery.length > 0,
  });

  useEffect(() => {
    if (error) {
      showToast(error.message, 'error');
    }
  }, [error, showToast]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
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
            value={searchQuery}
            onChange={handleInputChange}
          />
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
