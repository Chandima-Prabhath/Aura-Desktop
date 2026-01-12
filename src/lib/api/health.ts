import apiClient from './index';
import type { HealthCheckResponse } from './types';

/**
 * Checks the health of the API.
 * @returns A promise that resolves to the health check response.
 */
export const checkHealth = async (): Promise<HealthCheckResponse> => {
  const response = await apiClient.get<HealthCheckResponse>('/health');
  return response.data;
};
