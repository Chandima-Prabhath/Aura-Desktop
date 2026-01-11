// src/components/DownloadsView/index.tsx
import React, { useEffect,  } from 'react';

interface Download {
    id: number;
    title: string;
    prog: number;
}

interface DownloadsViewProps {
    downloads: Download[];
    setDownloads: React.Dispatch<React.SetStateAction<Download[]>>;
}

const DownloadsView: React.FC<DownloadsViewProps> = ({ downloads, setDownloads }) => {
    useEffect(() => {
        const interval = setInterval(() => {
            setDownloads(prevDownloads =>
                prevDownloads.map(d => {
                    if (d.prog < 100) {
                        const newProg = d.prog + Math.random() * 15;
                        return { ...d, prog: Math.min(newProg, 100) };
                    }
                    return d;
                })
            );
        }, 500);

        return () => clearInterval(interval);
    }, [setDownloads]);

    return (
        <div id="view-downloads" className="view-container active">
            <div className="section-header">Active Downloads</div>
            <div className="downloads-list">
                {downloads.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                        No active downloads
                    </div>
                ) : (
                    downloads.map(d => (
                        <div key={d.id} className="download-item">
                            <div className="dl-top">
                                <div className="dl-name">{d.title}</div>
                                <div style={{ fontSize: '12px', color: d.prog === 100 ? 'var(--success)' : 'var(--primary)' }}>
                                    {d.prog === 100 ? 'Completed' : 'Downloading'}
                                </div>
                            </div>
                            <div className="progress-bg">
                                <div className="progress-bar" style={{ width: `${d.prog}%` }}></div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DownloadsView;
