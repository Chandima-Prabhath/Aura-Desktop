import apiClient from './index';
import type { Settings, SettingsUpdateRequest } from './types';

/**
 * Retrieves all current settings.
 * @returns A promise that resolves to the settings object.
 */
export const getSettings = async (): Promise<Settings> => {
  const response = await apiClient.get<Settings>('/settings');
  return response.data;
};

/**
 * Updates one or more settings.
 * @param payload The settings to update.
 * @returns A promise that resolves to the updated settings object.
 */
export const updateSettings = async (
  payload: SettingsUpdateRequest
): Promise<Settings> => {
  const response = await apiClient.patch<Settings>('/settings', payload);
  return response.data;
};
