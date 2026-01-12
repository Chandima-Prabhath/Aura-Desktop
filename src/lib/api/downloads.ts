import apiClient from './index';
import type {
  DownloadTask,
  StartDownloadRequest,
  StartDownloadResponse,
} from './types';

/**
 * Queues one or more episodes for download.
 * @param payload The request body containing the anime title and episodes.
 * @returns A promise that resolves to the response from the API.
 */
export const startDownloads = async (
  payload: StartDownloadRequest
): Promise<StartDownloadResponse> => {
  const response = await apiClient.post<StartDownloadResponse>(
    '/downloads',
    payload
  );
  return response.data;
};

/**
 * Retrieves the status of all download tasks.
 * @returns A promise that resolves to an array of download tasks.
 */
export const getAllDownloads = async (): Promise<DownloadTask[]> => {
  const response = await apiClient.get<DownloadTask[]>('/downloads');
  return response.data;
};

/**
 * Retrieves the status of a specific download task.
 * @param downloadId The ID of the download task.
 * @returns A promise that resolves to the download task data.
 */
export const getDownload = async (downloadId: string): Promise<DownloadTask> => {
  const response = await apiClient.get<DownloadTask>(`/downloads/${downloadId}`);
  return response.data;
};

/**
 * Pauses a running download.
 * @param downloadId The ID of the download task.
 * @returns A promise that resolves when the request is complete.
 */
export const pauseDownload = async (downloadId: string): Promise<void> => {
  await apiClient.post(`/downloads/${downloadId}/pause`);
};

/**
 * Resumes a paused or failed download.
 * @param downloadId The ID of the download task.
 * @returns A promise that resolves when the request is complete.
 */
export const resumeDownload = async (downloadId: string): Promise<void> => {
  await apiClient.post(`/downloads/${downloadId}/resume`);
};

/**
 * Cancels and deletes a download task.
 * @param downloadId The ID of the download task.
 * @returns A promise that resolves when the request is complete.
 */
export const cancelDownload = async (downloadId: string): Promise<void> => {
  await apiClient.delete(`/downloads/${downloadId}`);
};
