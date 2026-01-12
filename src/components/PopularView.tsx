import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPopularAnime } from '../lib/api/anime';
import Loader from './Loader';
import GridView from './GridView';
import ListView from './ListView';

interface PopularViewProps {
  onNavigate: (view: string, data?: any) => void;
  showToast: (
    message: string,
    type: 'success' | 'warning' | 'error' | 'info'
  ) => void;
}

const PopularView: React.FC<PopularViewProps> = ({ onNavigate, showToast }) => {
  const [viewMode, setViewMode] = useState(
    localStorage.getItem('popularViewMode') || 'grid'
  );

  useEffect(() => {
    localStorage.setItem('popularViewMode', viewMode);
  }, [viewMode]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['popularAnimeAll'],
    queryFn: getPopularAnime,
  });

  useEffect(() => {
    if (error) {
      showToast(error.message, 'error');
    }
  }, [error, showToast]);

  return (
    <div className="view-container">
      <div className="section-header">
        <h2>Popular Today</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 rounded-md ${
              viewMode === 'grid' ? 'bg-primary text-primary-foreground' : ''
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded-md ${
              viewMode === 'list' ? 'bg-primary text-primary-foreground' : ''
            }`}
          >
            List
          </button>
          <button
            onClick={() => onNavigate('home')}
            className="text-primary hover:underline"
          >
            Back
          </button>
        </div>
      </div>
      {isLoading ? (
        <Loader />
      ) : (
        <>
          {viewMode === 'grid' ? (
            <GridView items={data || []} onNavigate={onNavigate} />
          ) : (
            <ListView items={data || []} onNavigate={onNavigate} />
          )}
        </>
      )}
    </div>
  );
};

export default PopularView;
