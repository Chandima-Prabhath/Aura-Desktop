import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllDownloads,
  pauseDownload,
  resumeDownload,
  cancelDownload,
} from '../../lib/api/downloads';
import { DownloadTask } from '../../lib/api/types';

const statusPriority: Record<string, number> = {
  Downloading: 1,
  Paused: 2,
  Queued: 2,
  Completed: 3,
  Cancelled: 4,
  Error: 4,
};

const getGroupStatus = (downloads: DownloadTask[]): number => {
  return Math.min(
    ...downloads.map((d) => statusPriority[d.status] || 99)
  );
};

const DownloadsView: React.FC = () => {
  const queryClient = useQueryClient();
  const [completedGroups, setCompletedGroups] = useState<Record<string, number>>({});

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

  useEffect(() => {
    if (downloads) {
      const now = Date.now();
      const updatedCompleted = { ...completedGroups };

      for (const groupTitle in groupedDownloads) {
        const groupDownloads = groupedDownloads[groupTitle];
        const isCompleted = groupDownloads.every(
          (d) => d.status === 'Completed'
        );

        if (isCompleted && !updatedCompleted[groupTitle]) {
          updatedCompleted[groupTitle] = now;
        } else if (!isCompleted && updatedCompleted[groupTitle]) {
          delete updatedCompleted[groupTitle];
        }
      }
      setCompletedGroups(updatedCompleted);
    }
  }, [downloads]);

  const groupedDownloads = downloads?.reduce((acc, d) => {
    const title = d.anime_title || 'Unknown Anime';
    if (!acc[title]) {
      acc[title] = [];
    }
    acc[title].push(d);
    return acc;
  }, {} as Record<string, DownloadTask[]>);

  const sortedAndFilteredDownloads = groupedDownloads
    ? Object.entries(groupedDownloads)
        .filter(([title]) => {
          const completedTime = completedGroups[title];
          if (!completedTime) return true;
          return Date.now() - completedTime < 60000; // 1 minute
        })
        .sort(([, a], [, b]) => getGroupStatus(a) - getGroupStatus(b))
    : [];

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
          sortedAndFilteredDownloads.map(([title, downloads]) => (
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
