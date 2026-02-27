import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AuraLoader from '../AuraLoader';
import { getDownloadBuckets, pauseDownload, resumeDownload } from '../../lib/api/tauri';
import { DownloadJob, DownloadTask, parseTaskStatus } from '../../lib/api/types';

const DownloadsView: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: buckets, isLoading } = useQuery({
    queryKey: ['downloads'],
    queryFn: getDownloadBuckets,
    refetchInterval: 2000,
  });

  const pauseMutation = useMutation({
    mutationFn: ({ jobId, taskId }: { jobId: string; taskId?: string }) => pauseDownload(jobId, taskId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['downloads'] }),
  });

  const resumeMutation = useMutation({
    mutationFn: ({ jobId, taskId }: { jobId: string; taskId?: string }) => resumeDownload(jobId, taskId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['downloads'] }),
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderStatus = (status: DownloadTask['status']) => {
    const parsed = parseTaskStatus(status);
    if (parsed.kind === 'Paused') {
      return `Paused (${parsed.detail})`;
    }
    if (parsed.kind === 'Error') {
      return `Error (${parsed.detail})`;
    }
    return parsed.kind;
  };

  const canPause = (task: DownloadTask) => {
    const kind = parseTaskStatus(task.status).kind;
    return kind === 'Pending' || kind === 'Downloading';
  };

  const canResume = (task: DownloadTask) => {
    const kind = parseTaskStatus(task.status).kind;
    return kind === 'Paused' || kind === 'Error';
  };

  const isCompleted = (task: DownloadTask) =>
    parseTaskStatus(task.status).kind === 'Completed';

  if (isLoading) {
    return <AuraLoader />;
  }

  return (
    <div id="view-downloads" className="view-container active">
      <div className="downloads-list">
        <div className="section-header">Active Downloads</div>
        {!buckets || buckets.active.length === 0 ? (
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
          [...buckets.active].reverse().map((job: DownloadJob) => (
            <div key={job.id} className="download-group">
              <div className="download-group-header">
                <span>{job.name}</span>
                <div className="download-group-actions">
                  <button
                    className="dl-action-btn"
                    disabled={pauseMutation.isPending || resumeMutation.isPending}
                    onClick={() => pauseMutation.mutate({ jobId: job.id })}
                  >
                    Pause All
                  </button>
                  <button
                    className="dl-action-btn"
                    disabled={pauseMutation.isPending || resumeMutation.isPending}
                    onClick={() => resumeMutation.mutate({ jobId: job.id })}
                  >
                    Resume All
                  </button>
                </div>
              </div>
              {job.tasks.filter((t) => !isCompleted(t)).map((d: DownloadTask) => {
                const progress = d.total_bytes > 0 ? (d.progress_bytes / d.total_bytes) * 100 : 0;
                return (
                  <div key={d.id} className="download-item">
                    <div className="dl-top">
                      <div className="dl-name">{d.filename}</div>
                      <div className="dl-status">{renderStatus(d.status)}</div>
                    </div>
                    <div className="progress-bg">
                      <div
                        className="progress-bar"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="dl-bottom">
                      <div className="dl-meta">
                        {formatBytes(d.progress_bytes)} /{' '}
                        {formatBytes(d.total_bytes)}
                      </div>
                      {/* Speed is not currently exposed in DownloadTask model in aura-core v0.1.0 without extra calculation or field */}
                      <div className="dl-speed"></div>
                      <div className="dl-actions">
                        <button
                          className="dl-action-btn"
                          disabled={!canPause(d) || pauseMutation.isPending || resumeMutation.isPending}
                          onClick={() => pauseMutation.mutate({ jobId: job.id, taskId: d.id })}
                        >
                          Pause
                        </button>
                        <button
                          className="dl-action-btn"
                          disabled={!canResume(d) || pauseMutation.isPending || resumeMutation.isPending}
                          onClick={() => resumeMutation.mutate({ jobId: job.id, taskId: d.id })}
                        >
                          Resume
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}

        <div className="section-header" style={{ marginTop: '20px' }}>
          Completed Downloads
        </div>
        {!buckets || buckets.completed.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: 'var(--text-muted)',
              padding: '20px 40px 40px',
            }}
          >
            No completed downloads yet
          </div>
        ) : (
          [...buckets.completed].reverse().map((job: DownloadJob) => (
            <div key={`completed-${job.id}`} className="download-group">
              <div className="download-group-header">
                <span>{job.name}</span>
              </div>
              {job.tasks.map((d: DownloadTask) => (
                <div key={d.id} className="download-item">
                  <div className="dl-top">
                    <div className="dl-name">{d.filename}</div>
                    <div className="dl-status">Completed</div>
                  </div>
                  <div className="progress-bg">
                    <div className="progress-bar" style={{ width: '100%' }}></div>
                  </div>
                  <div className="dl-bottom">
                    <div className="dl-meta">
                      {formatBytes(d.total_bytes)} / {formatBytes(d.total_bytes)}
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
