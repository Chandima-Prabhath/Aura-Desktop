// src/components/SettingsView/index.tsx
import React from 'react';

interface SettingsViewProps {
    showToast: (message: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ showToast }) => {
    return (
        <div id="view-settings" className="view-container active">
            <div className="details-header" style={{ maxWidth: '500px', display: 'block', margin: '0 auto' }}>
                <h2 className="details-title" style={{ marginBottom: '20px' }}>Settings</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                        <label style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block', marginBottom: '5px' }}>
                            Download Path
                        </label>
                        <input
                            type="text"
                            className="input-pill"
                            defaultValue="C:UsersChandimaDownloadsAnime"
                            style={{ width: '100%' }}
                        />
                    </div>
                    <div>
                        <label style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block', marginBottom: '5px' }}>
                            Max Concurrent
                        </label>
                        <select className="input-pill" style={{ width: '100%' }} defaultValue="3">
                            <option>1</option>
                            <option>3</option>
                            <option>5</option>
                        </select>
                    </div>
                    <button className="btn btn-primary" style={{ marginTop: '10px' }} onClick={() => showToast('Settings Saved', 'success')}>
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
