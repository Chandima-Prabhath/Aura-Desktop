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
    <div id="view-settings" className="view-container active settings-page">
      <div className="settings-header">
        <h2 className="settings-title">Settings</h2>
        <p className="settings-desc">
          Manage your download preferences and application configuration.
        </p>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">
          <svg
            className="icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Downloads
        </div>

        <div className="settings-row">
          <label className="settings-label">Download Path</label>
          <div className="settings-input-group">
            <input
              type="text"
              name="download_dir"
              className="settings-input"
              value={formData.download_dir || ''}
              readOnly={isAndroid}
              onChange={handleInputChange}
              style={{ opacity: isAndroid ? 0.7 : 1 }}
            />
            <button
              className="btn-download-primary"
              style={{
                width: 'auto',
                padding: '12px 24px',
                fontSize: '14px',
                whiteSpace: 'nowrap',
              }}
              onClick={handleBrowse}
            >
              {isAndroid ? 'Set Public' : 'Browse'}
            </button>
          </div>
          {isAndroid && (
            <p className="settings-hint">
              On Android, downloads are restricted to public folders.
            </p>
          )}
        </div>

        <div className="settings-row">
          <label className="settings-label">Max Concurrent Downloads</label>
          <input
            type="number"
            name="max_concurrent_downloads"
            className="settings-input"
            value={formData.max_concurrent_downloads || ''}
            onChange={handleInputChange}
            min="1"
            max="10"
          />
          <p className="settings-hint">
            Recommended: 3-5 for stable performance.
          </p>
        </div>

        <div className="settings-row">
          <label className="settings-label">Segments Per File</label>
          <input
            type="number"
            name="segments_per_file"
            className="settings-input"
            value={formData.segments_per_file || ''}
            onChange={handleInputChange}
            min="1"
            max="16"
          />
          <p className="settings-hint">
            Higher segments can increase speed but consume more resources.
          </p>
        </div>
      </div>

      <div className="settings-actions">
        <button
          className="btn-download-primary"
          onClick={handleSaveChanges}
          disabled={isPending}
          style={{ width: '100%', padding: '16px', fontSize: '16px' }}
        >
          {isPending ? 'Saving Preferences...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default SettingsView;
