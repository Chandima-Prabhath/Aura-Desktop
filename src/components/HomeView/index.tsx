import React, { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import AuraLoader from '../AuraLoader';
import { getPopularAnime, getNewAnime } from '../../lib/api/tauri';

interface HomeViewProps {
  onNavigate: (view: string, data?: any) => void;
  showToast: (
    message: string,
    type: 'success' | 'warning' | 'error' | 'info'
  ) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ onNavigate, showToast }) => {
  const popularScrollRef = useRef<HTMLDivElement>(null);
  const newScrollRef = useRef<HTMLDivElement>(null);

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

  const scroll = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = 400;
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (isLoadingPopular || isLoadingNew) {
    return <AuraLoader />;
  }

  return (
    <div id="view-home" className="view-container active">
      <div className="home-section">
        <div className="section-header-row">
          <div className="section-header">Popular Today</div>
          <div className="scroll-buttons">
            <button className="scroll-btn" onClick={() => scroll(popularScrollRef, 'left')} aria-label="Scroll left">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button className="scroll-btn" onClick={() => scroll(popularScrollRef, 'right')} aria-label="Scroll right">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>
        </div>
        <div className="horizontal-scroll" ref={popularScrollRef}>
          {popularAnime?.map((anime) => (
            <div
              key={anime.url}
              className="anime-card-horizontal"
              onClick={() => onNavigate('details', anime)}
            >
              <img
                src={anime.image}
                className="anime-poster-horizontal"
                loading="lazy"
                alt={anime.title}
              />
              <div className="anime-title-horizontal">{anime.title}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="home-section">
        <div className="section-header-row">
          <div className="section-header">Newly Released</div>
          <div className="scroll-buttons">
            <button className="scroll-btn" onClick={() => scroll(newScrollRef, 'left')} aria-label="Scroll left">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button className="scroll-btn" onClick={() => scroll(newScrollRef, 'right')} aria-label="Scroll right">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>
        </div>
        <div className="horizontal-scroll" ref={newScrollRef}>
          {newAnime?.map((anime) => (
            <div
              key={anime.url}
              className="anime-card-horizontal"
              onClick={() => onNavigate('details', anime)}
            >
              <img
                src={anime.image}
                className="anime-poster-horizontal"
                loading="lazy"
                alt={anime.title}
              />
              <div className="anime-title-horizontal">{anime.title}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeView;
