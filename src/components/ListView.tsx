import React from 'react';
import { Anime } from '../../lib/api/types';

interface ListViewProps {
  items: Anime[];
  onNavigate: (view: string, data?: any) => void;
}

const ListView: React.FC<ListViewProps> = ({ items, onNavigate }) => {
  return (
    <div className="list-view">
      {items.map((anime) => (
        <div
          key={anime.url}
          className="list-item"
          onClick={() => onNavigate('details', anime)}
        >
          <img
            src={anime.image}
            alt={anime.title}
            className="list-item-image"
            loading="lazy"
          />
          <div className="list-item-info">
            <h3 className="list-item-title">{anime.title}</h3>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ListView;
