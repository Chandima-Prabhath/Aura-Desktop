// src/components/SettingsView/index.tsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { open } from '@tauri-apps/plugin-dialog';
import { getSettings, updateSettings } from '../../lib/api/settings';
import { SettingsUpdateRequest } from '../../lib/api/types';
import { toast } from 'sonner';
import MarshmallowLoader from '../common/MarshmallowLoader';

export default function SettingsView() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<SettingsUpdateRequest>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });

  const { mutate: saveSettings, isPending } = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      toast.success('Settings saved successfully');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (error) => {
      toast.error(error.message);
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
    const isNumber =
      name === 'max_concurrent_downloads' ||
      (settings && typeof settings[name as keyof typeof settings] === 'number');

    setFormData((prev) => ({
      ...prev,
      [name]: isNumber ? parseInt(value, 10) : value,
    }));
  };

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
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
    return <MarshmallowLoader />;
  }

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <h1 className="mb-6 text-3xl font-bold">Settings</h1>
      <form onSubmit={handleSaveChanges} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="download_path" className="text-sm font-medium text-muted-foreground">
            Download Path
          </label>
          <div className="flex gap-2">
            <input
              id="download_path"
              type="text"
              name="download_path"
              className="input-pill flex-grow"
              value={formData.download_path || ''}
              onChange={handleInputChange}
              readOnly
            />
            <button type="button" className="btn btn-ghost" onClick={handleBrowse}>
              Browse
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="max_concurrent_downloads" className="text-sm font-medium text-muted-foreground">
            Max Concurrent Downloads
          </label>
          <select
            id="max_concurrent_downloads"
            name="max_concurrent_downloads"
            className="input-pill w-full"
            value={formData.max_concurrent_downloads || ''}
            onChange={handleInputChange}
          >
            <option value={1}>1</option>
            <option value={3}>3</option>
            <option value={5}>5</option>
          </select>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="btn btn-primary w-full md:w-auto"
            disabled={isPending}
          >
            {isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
