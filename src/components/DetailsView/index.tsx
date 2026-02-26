import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AuraLoader from '../AuraLoader';
import { getSeason, startDownload } from '../../lib/api/tauri';
import { parseEpisodeRange } from '../../lib/utils';
import { AnimeSearchResult, Episode } from '../../lib/api/types';

interface DetailsViewProps {
  anime: AnimeSearchResult | null;
  onDownloadsAdded: () => void;
  showToast: (
    message: string,
    type: 'success' | 'warning' | 'error' | 'info'
  ) => void;
}

const DetailsView: React.FC<DetailsViewProps> = ({
  anime,
  onDownloadsAdded,
  showToast,
}) => {
  const [selectedEpisodes, setSelectedEpisodes] = useState<number[]>([]);
  const [rangeInput, setRangeInput] = useState('');
  const queryClient = useQueryClient();

  const {
    data: season,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['season', anime?.url],
    queryFn: () => getSeason(anime!.url),
    enabled: !!anime?.url,
  });

  const { mutate: addDownloads, isPending } = useMutation({
    mutationFn: (variables: { anime_title: string; episodes: Episode[] }) =>
      startDownload(variables.anime_title, variables.episodes),
    onSuccess: (count) => {
      showToast(`Added ${count} tasks`, 'success');
      queryClient.invalidateQueries({ queryKey: ['downloads'] });
      onDownloadsAdded();
    },
    onError: (err) => {
      showToast(err.message, 'error');
    },
  });

  useEffect(() => {
    setSelectedEpisodes([]);
    setRangeInput('');
  }, [anime]);

  const handleRangeInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { value } = event.target;
    setRangeInput(value);
    if (season?.episodes) {
      const parsed = parseEpisodeRange(value, season.episodes.length);
      setSelectedEpisodes(parsed);
    }
  };

  const toggleEpisode = (epNum: number) => {
    setSelectedEpisodes((prev) =>
      prev.includes(epNum)
        ? prev.filter((e) => e !== epNum)
        : [...prev, epNum]
    );
  };

  const handleAddDownloads = () => {
    if (!season || selectedEpisodes.length === 0) {
      showToast('No episodes selected', 'warning');
      return;
    }
    const episodesToDownload: Episode[] = season.episodes.filter((ep) =>
      selectedEpisodes.includes(ep.number)
    );
    addDownloads({
      anime_title: season.title,
      episodes: episodesToDownload,
    });
  };

  // Helper functions for quick selection
  const selectAll = () => {
    if (season?.episodes) {
      setSelectedEpisodes(season.episodes.map(e => e.number));
    }
  };

  const selectNone = () => {
    setSelectedEpisodes([]);
  };

  const selectFirst10 = () => {
    if (season?.episodes) {
      // Assuming episode numbers are sequential 1..N or just taking first 10 items
      const first10 = season.episodes.slice(0, 10).map(e => e.number);
      setSelectedEpisodes(first10);
    }
  }


  if (isLoading) {
    return <AuraLoader />;
  }

  if (!anime) {
    return <div id="view-details" className="view-container"></div>;
  }

  return (
    <div id="view-details" className="view-container active details-page-container">
      {/* Hero Background - Blurred */}
      <div
        className="details-backdrop"
        style={{ backgroundImage: `url(${anime.image})` }}
      />

      {/* Content Layer */}
      <div className="details-hero">
        <div className="details-hero-content">
          <img src={anime.image} className="details-poster" alt={anime.title} />

          <div className="details-info">
            <h1 className="details-title">{anime.title}</h1>

            {season && (
              <>
                {season.japanese_title && (
                  <div className="details-jap-title">{season.japanese_title}</div>
                )}

                <div className="details-meta-row">
                  {season.year && <span className="meta-badge">{season.year}</span>}
                  {season.tags && season.tags.length > 0 && (
                    <div className="meta-tags">
                      {season.tags.slice(0, 4).map(tag => (
                        <span key={tag} className="meta-tag">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>

                {season.description && (
                  <div className="details-description">
                    {season.description}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>


      <div className="details-body">
        <div className="control-bar-redesigned">
          <div className="control-inputs">
            <input
              type="text"
              className="input-smart"
              placeholder="e.g. 1-5, 8"
              value={rangeInput}
              onChange={handleRangeInputChange}
            />
            <div className="quick-actions">
              <button className="btn-text" onClick={selectAll}>All</button>
              <button className="btn-text" onClick={selectNone}>None</button>
            </div>
          </div>

          <button
            className="btn-download-primary"
            onClick={handleAddDownloads}
            disabled={isPending || selectedEpisodes.length === 0}
          >
            {isPending
              ? 'Adding...'
              : `Download ${selectedEpisodes.length > 0 ? `(${selectedEpisodes.length})` : ''}`}
          </button>
        </div>

        {error && <div className="error-message">{error.message}</div>}

        {season && (
          <div className="episodes-grid-redesigned">
            {season.episodes.map((ep) => {
              const isSelected = selectedEpisodes.includes(ep.number);
              return (
                <div
                  key={ep.number}
                  className={`ep-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleEpisode(ep.number)}
                >
                  <div className="ep-card-num">EP {ep.number}</div>
                  {/* Simplify display logic */}
                  {(() => {
                    const match = ep.name.match(/^(Episode\s+\d+(\.\d+)?)\s+(.*)$/i);
                    const date = match ? match[3] : ep.name;
                    return <div className="ep-card-date">{date}</div>
                  })()}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailsView;
