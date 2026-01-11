import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSeason } from '../../lib/api/anime';
import { startDownloads } from '../../lib/api/downloads';
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
    mutationFn: startDownloads,
    onSuccess: (data) => {
      showToast(`Added ${data.queued} tasks`, 'success');
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
      selectedEpisodes.includes(ep.episode_number)
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
      {isLoading && <div className="loader">Loading episodes...</div>}
      {error && <div className="error">{error.message}</div>}
      {season && (
        <div className="episodes-grid">
          {season.episodes.map((ep) => (
            <div key={ep.episode_number}>
              <input
                type="checkbox"
                id={`e-${ep.episode_number}`}
                className="ep-checkbox"
                checked={selectedEpisodes.includes(ep.episode_number)}
                onChange={() => toggleEpisode(ep.episode_number)}
              />
              <label
                htmlFor={`e-${ep.episode_number}`}
                className="ep-label"
              >
                {ep.name}
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DetailsView;
