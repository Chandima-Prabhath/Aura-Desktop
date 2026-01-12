import React from 'react';
import { Anime } from '../../lib/api/types';

interface GridViewProps {
  items: Anime[];
  onNavigate: (view: string, data?: any) => void;
}

const GridView: React.FC<GridViewProps> = ({ items, onNavigate }) => {
  return (
    <div className="featured-grid">
      {items.map((anime) => (
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
  );
};

export default GridView;
