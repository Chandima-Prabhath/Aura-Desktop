import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { open } from '@tauri-apps/plugin-dialog';
import { platform } from '@tauri-apps/plugin-os';
import { getSettings, updateSettings } from '../../lib/api/tauri';
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
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    const osPlatform = platform();
    setIsAndroid(osPlatform === 'android');
  }, []);

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

      // Android Auto-Path Logic:
      // If on Android and the path is NOT the public downloads folder (e.g., it's the default internal/hidden app data dir),
      // auto-switch it to Public Downloads for better UX.
      if (platform() === 'android') {
        const publicPath = '/storage/emulated/0/Download';
        // Check if current setting is empty or seemingly private (contains com.aura.app) or just not the public one
        if (settings.download_dir !== publicPath) {
          console.log("[Android] Auto-switching to Public Downloads folder");
          // Update local form state
          setFormData(prev => ({ ...prev, download_dir: publicPath }));
          // Trigger actual save immediately
          saveSettings({ ...settings, download_dir: publicPath });
        }
      }
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
    if (formData) {
      if (settings) {
        const merged = { ...settings, ...formData };
        saveSettings(merged);
      }
    }
  };

  const handleBrowse = async () => {
    if (isAndroid) {
      // Android-specific logic: Toggle between public downloads and app data
      const publicPath = '/storage/emulated/0/Download';
      const current = formData.download_dir || '';

      if (current === publicPath) {
        showToast('Already using Public Downloads', 'info');
      } else {
        // Simple toggle/set for now. In a real app we might show a modal.
        setFormData(prev => ({ ...prev, download_dir: publicPath }));
        showToast('Set to Public Downloads folder', 'success');
      }
      return;
    }

    try {
      const result = await open({
        directory: true,
        multiple: false,
        title: 'Select Download Folder',
      });

      if (typeof result === 'string') {
        setFormData((prev) => ({ ...prev, download_dir: result }));
      }
    } catch (error) {
      console.error('Failed to open dialog:', error);
      showToast('Folder selection is not supported on this device', 'warning');
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
                name="download_dir"
                className="input-pill"
                value={formData.download_dir || ''}
                readOnly={isAndroid} // Read-only on Android to prevent manual errors
                onChange={handleInputChange}
                style={{ width: '100%', flex: 1, opacity: isAndroid ? 0.7 : 1 }}
              />
              <button className="btn btn-ghost" onClick={handleBrowse}>
                {isAndroid ? 'Set Public' : 'Browse'}
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
            <input
              type="number"
              name="max_concurrent_downloads"
              className="input-pill"
              value={formData.max_concurrent_downloads || ''}
              onChange={handleInputChange}
              min="1"
              max="10"
              style={{ width: '100%' }}
            />
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
              Segments Per File
            </label>
            <input
              type="number"
              name="segments_per_file"
              className="input-pill"
              value={formData.segments_per_file || ''}
              onChange={handleInputChange}
              min="1"
              max="16"
              style={{ width: '100%' }}
            />
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
