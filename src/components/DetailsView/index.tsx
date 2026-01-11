// src/components/DetailsView/index.tsx
import React, { useState, useEffect } from 'react';

interface Anime {
    id: number;
    title: string;
    eps: number;
    img: string;
    desc: string;
}

interface DetailsViewProps {
    anime: Anime | null;
    onAddDownloads: (anime: Anime, episodes: number[]) => void;
}

const DetailsView: React.FC<DetailsViewProps> = ({ anime, onAddDownloads }) => {
    const [selectedEpisodes, setSelectedEpisodes] = useState<number[]>([]);

    useEffect(() => {
        // Reset selected episodes when the anime changes
        setSelectedEpisodes([]);
    }, [anime]);

    if (!anime) {
        return <div id="view-details" className="view-container"></div>;
    }

    const toggleEpisode = (ep: number) => {
        setSelectedEpisodes(prev =>
            prev.includes(ep) ? prev.filter(e => e !== ep) : [...prev, ep]
        );
    };

    const toggleAll = (state: boolean) => {
        if (state) {
            setSelectedEpisodes(Array.from({ length: anime.eps }, (_, i) => i + 1));
        } else {
            setSelectedEpisodes([]);
        }
    };

    const handleAddDownloads = () => {
        onAddDownloads(anime, selectedEpisodes);
    };

    const episodeGrid = Array.from({ length: anime.eps }, (_, i) => i + 1).map(ep => (
        <div key={ep}>
            <input
                type="checkbox"
                id={`e-${ep}`}
                className="ep-checkbox"
                checked={selectedEpisodes.includes(ep)}
                onChange={() => toggleEpisode(ep)}
            />
            <label htmlFor={`e-${ep}`} className="ep-label">Ep {ep}</label>
        </div>
    ));

    return (
        <div id="view-details" className="view-container active">
            <div className="details-header">
                <img src={anime.img} className="details-poster" alt={anime.title} />
                <div className="details-content" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div className="details-title">{anime.title}</div>
                    <div className="details-desc">{anime.desc}</div>

                    <div className="control-bar">
                        <input type="text" className="input-pill" placeholder="e.g. 1-5" />
                        <button className="btn btn-ghost" onClick={() => toggleAll(true)}>All</button>
                        <button className="btn btn-ghost" onClick={() => toggleAll(false)}>None</button>
                        <div style={{ flex: 1 }}></div>
                        <button className="btn btn-primary" onClick={handleAddDownloads}>
                            Download ({selectedEpisodes.length})
                        </button>
                    </div>
                </div>
            </div>
            <div className="episodes-grid">{episodeGrid}</div>
        </div>
    );
};

export default DetailsView;
