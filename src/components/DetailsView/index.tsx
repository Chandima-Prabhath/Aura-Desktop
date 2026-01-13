// src/components/DetailsView/index.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSeason } from '../../lib/api/anime';
import { startDownloads } from '../../lib/api/downloads';
import { parseEpisodeRange } from '../../lib/utils';
import { Episode } from '../../lib/api/types';
import { toast } from 'sonner';
import MarshmallowLoader from '../common/MarshmallowLoader';

export default function DetailsView() {
  const { animeId } = useParams<{ animeId: string }>();
  const navigate = useNavigate();
  const [selectedEpisodes, setSelectedEpisodes] = useState<number[]>([]);
  const [rangeInput, setRangeInput] = useState('');
  const queryClient = useQueryClient();

  const animeUrl = animeId ? decodeURIComponent(animeId) : '';

  const {
    data: season,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['season', animeUrl],
    queryFn: () => getSeason(animeUrl),
    enabled: !!animeUrl,
  });

  const { mutate: addDownloads, isPending } = useMutation({
    mutationFn: startDownloads,
    onSuccess: (data) => {
      toast.success(`Added ${data.queued} tasks`);
      queryClient.invalidateQueries({ queryKey: ['downloads'] });
      navigate('/downloads');
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  useEffect(() => {
    setSelectedEpisodes([]);
    setRangeInput('');
  }, [animeUrl]);

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
      toast.warning('No episodes selected');
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

  if (isLoading) return <MarshmallowLoader />;
  if (error) return <div className="p-4 text-red-500">{error.message}</div>;
  if (!season) return <div className="p-4">Anime details not found.</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col gap-8 md:flex-row">
        <img
          src={season.poster_url}
          className="w-full rounded-lg object-cover shadow-lg md:w-1/3"
          alt={season.title}
        />
        <div className="flex flex-1 flex-col gap-4">
          <h1 className="text-4xl font-bold">{season.title}</h1>
          <p className="text-muted-foreground">{season.description}</p>
          <div className="flex items-center gap-4">
            <input
              type="text"
              className="input-pill flex-grow"
              placeholder="e.g. 1-5, 8, 10-12"
              value={rangeInput}
              onChange={handleRangeInputChange}
            />
            <button
              className="btn btn-primary"
              onClick={handleAddDownloads}
              disabled={isPending}
            >
              {isPending ? 'Adding...' : `Download (${selectedEpisodes.length})`}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-2xl font-bold">Episodes</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {season.episodes.map((ep) => (
            <div key={ep.episode_number} className="flex items-center">
              <input
                type="checkbox"
                id={`e-${ep.episode_number}`}
                className="peer hidden"
                checked={selectedEpisodes.includes(ep.episode_number)}
                onChange={() => toggleEpisode(ep.episode_number)}
              />
              <label
                htmlFor={`e-${ep.episode_number}`}
                className="w-full cursor-pointer rounded-md border p-2 text-center transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground"
              >
                {ep.name}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
