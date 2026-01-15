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

  if (isLoading) {
    return <AuraLoader />;
  }

  if (!anime) {
    return <div id="view-details" className="view-container"></div>;
  }

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

  return (
    <div id="view-details" className="view-container active">
      <div className="details-header">
        <img src={anime.image} className="details-poster" alt={anime.title} />
        <div
          className="details-content"
          style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
        >
          <div className="details-title">{anime.title}</div>

          {season && (
            <div style={{ marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {season.japanese_title && (
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  {season.japanese_title}
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                {season.year && <span className="badge" style={{ fontSize: '12px' }}>{season.year}</span>}
                {season.tags && season.tags.map(tag => (
                  <span key={tag} className="badge" style={{ fontSize: '11px', background: 'rgba(102, 252, 241, 0.1)', color: 'var(--primary)' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="control-bar">
            <input
              type="text"
              className="input-pill"
              placeholder="e.g. 1-5, 8, 10-12"
              value={rangeInput}
              onChange={handleRangeInputChange}
            />
            <div style={{ flex: 1 }}></div>
            <button
              className="btn btn-primary"
              onClick={handleAddDownloads}
              disabled={isPending}
            >
              {isPending
                ? 'Adding...'
                : `Download (${selectedEpisodes.length})`}
            </button>
          </div>
        </div>
      </div>
      {error && <div className="error">{error.message}</div>}
      {season && (
        <div className="episodes-grid">
          {season.episodes.map((ep) => (
            <div key={ep.number}>
              <input
                type="checkbox"
                id={`e-${ep.number}`}
                className="ep-checkbox"
                checked={selectedEpisodes.includes(ep.number)}
                onChange={() => toggleEpisode(ep.number)}
              />
              <label
                htmlFor={`e-${ep.number}`}
                className="ep-label"
              >
                {(() => {
                  // Regex to split "Episode X 7 d ago" or similar
                  // Matches: "Episode <number>" then space then "rest"
                  const match = ep.name.match(/^(Episode\s+\d+(\.\d+)?)\s+(.*)$/i);
                  if (match) {
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                        <span className="ep-num">{match[1]}</span>
                        <span className="ep-date">{match[3]}</span>
                      </div>
                    );
                  }
                  // Fallback
                  return <span className="ep-num">{ep.name}</span>;
                })()}
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DetailsView;
