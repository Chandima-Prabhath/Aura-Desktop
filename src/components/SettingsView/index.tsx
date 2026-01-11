import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { open } from '@tauri-apps/plugin-dialog';
import { getSettings, updateSettings } from '../../lib/api/settings';
import { SettingsUpdateRequest } from '../../lib/api/types';

interface SettingsViewProps {
  showToast: (
    message: string,
    type: 'success' | 'warning' | 'error' | 'info'
  ) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ showToast }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<SettingsUpdateRequest>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });

  const { mutate: saveSettings, isPending } = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      showToast('Settings saved successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (error) => {
      showToast(error.message, 'error');
    },
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        typeof prev[name as keyof typeof prev] === 'number'
          ? parseInt(value, 10)
          : value,
    }));
  };

  const handleSaveChanges = () => {
    saveSettings(formData);
  };

  const handleBrowse = async () => {
    const result = await open({
      directory: true,
      multiple: false,
      title: 'Select Download Folder',
    });

    if (typeof result === 'string') {
      setFormData((prev) => ({ ...prev, download_path: result }));
    }
  };

  if (isLoading) {
    return <div className="loader">Loading settings...</div>;
  }

  return (
    <div id="view-settings" className="view-container active">
      <div
        className="details-header"
        style={{ maxWidth: '500px', display: 'block', margin: '0 auto' }}
      >
        <h2 className="details-title" style={{ marginBottom: '20px' }}>
          Settings
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label
              style={{
                color: 'var(--text-muted)',
                fontSize: '12px',
                display: 'block',
                marginBottom: '5px',
              }}
            >
              Download Path
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                name="download_path"
                className="input-pill"
                value={formData.download_path || ''}
                onChange={handleInputChange}
                style={{ width: '100%', flex: 1 }}
              />
              <button className="btn btn-ghost" onClick={handleBrowse}>
                Browse
              </button>
            </div>
          </div>
          <div>
            <label
              style={{
                color: 'var(--text-muted)',
                fontSize: '12px',
                display: 'block',
                marginBottom: '5px',
              }}
            >
              Max Concurrent Downloads
            </label>
            <select
              name="max_concurrent_downloads"
              className="input-pill"
              value={formData.max_concurrent_downloads || ''}
              onChange={handleInputChange}
              style={{ width: '100%' }}
            >
              <option value={1}>1</option>
              <option value={3}>3</option>
              <option value={5}>5</option>
            </select>
          </div>
          <button
            className="btn btn-primary"
            style={{ marginTop: '10px' }}
            onClick={handleSaveChanges}
            disabled={isPending}
          >
            {isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
