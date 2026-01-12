import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllDownloads,
  pauseDownload,
  resumeDownload,
  cancelDownload,
} from '../../lib/api/downloads';

const DownloadsView: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: downloads, isLoading } = useQuery({
    queryKey: ['downloads'],
    queryFn: getAllDownloads,
    refetchInterval: 2000, // Poll every 2 seconds
  });

  const { mutate: pause } = useMutation({
    mutationFn: pauseDownload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['downloads'] });
    },
  });

  const { mutate: resume } = useMutation({
    mutationFn: resumeDownload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['downloads'] });
    },
  });

  const { mutate: cancel } = useMutation({
    mutationFn: cancelDownload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['downloads'] });
    },
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const groupedDownloads = downloads?.reduce((acc, d) => {
    const title = d.anime_title || 'Unknown Anime';
    if (!acc[title]) {
      acc[title] = [];
    }
    acc[title].push(d);
    return acc;
  }, {} as Record<string, typeof downloads>);

  return (
    <div id="view-downloads" className="view-container active">
      <div className="section-header">Active Downloads</div>
      <div className="downloads-list">
        {isLoading ? (
          <div className="loader">Loading downloads...</div>
        ) : !groupedDownloads || Object.keys(groupedDownloads).length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: 'var(--text-muted)',
              padding: '40px',
            }}
          >
            No active downloads
          </div>
        ) : (
          Object.entries(groupedDownloads).map(([title, downloads]) => (
            <div key={title} className="download-group">
              <div className="download-group-header">{title}</div>
              {downloads.map((d) => (
                <div key={d.id} className="download-item">
                  <div className="dl-top">
                    <div className="dl-name">{d.filename}</div>
                    <div className="dl-status">{d.status}</div>
                  </div>
                  <div className="progress-bg">
                    <div
                      className="progress-bar"
                      style={{ width: `${d.progress}%` }}
                    ></div>
                  </div>
                  <div className="dl-bottom">
                    <div className="dl-meta">
                      {formatBytes(d.downloaded_bytes)} /{' '}
                      {formatBytes(d.total_bytes)}
                    </div>
                    <div className="dl-speed">{formatBytes(d.speed)}/s</div>
                    <div className="dl-actions">
                      {d.status === 'Downloading' && (
                        <button className="btn-icon" onClick={() => pause(d.id)}>
                          Pause
                        </button>
                      )}
                      {d.status === 'Paused' && (
                        <button
                          className="btn-icon"
                          onClick={() => resume(d.id)}
                        >
                          Resume
                        </button>
                      )}
                      <button className="btn-icon" onClick={() => cancel(d.id)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DownloadsView;
