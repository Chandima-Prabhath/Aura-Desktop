import React from 'react';
import { useQuery } from '@tanstack/react-query';
import AuraLoader from '../AuraLoader';
import { getDownloads } from '../../lib/api/tauri';
import { DownloadJob, DownloadTask } from '../../lib/api/types';

const DownloadsView: React.FC = () => {


  const { data: downloads, isLoading } = useQuery({
    queryKey: ['downloads'],
    queryFn: getDownloads,
    refetchInterval: 2000,
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderStatus = (status: any) => {
    if (typeof status === 'string') return status;
    if (typeof status === 'object') {
      return Object.keys(status)[0];
    }
    return 'Unknown';
  };

  if (isLoading) {
    return <AuraLoader />;
  }

  return (
    <div id="view-downloads" className="view-container active">
      <div className="section-header">Active Downloads</div>
      <div className="downloads-list">
        {!downloads || downloads.length === 0 ? (
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
          [...downloads].reverse().map((job: DownloadJob) => (
            <div key={job.id} className="download-group">
              <div className="download-group-header">{job.name}</div>
              {job.tasks.map((d: DownloadTask) => {
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
                        {/* Actions not yet implemented in backend */}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DownloadsView;
