import apiClient from './index';
import type { AnimeSearchResult, Season } from './types';

/**
 * Searches for anime based on a query.
 * @param q The search query.
 * @returns A promise that resolves to an array of search results.
 */
export const searchAnime = async (q: string): Promise<AnimeSearchResult[]> => {
  const response = await apiClient.get<AnimeSearchResult[]>('/search', {
    params: { q },
  });
  return response.data;
};

/**
 * Fetches the season data (title, episodes) for a given anime URL.
 * @param url The URL of the anime season page.
 * @returns A promise that resolves to the season data.
 */
export const getSeason = async (url: string): Promise<Season> => {
  const response = await apiClient.get<Season>('/season', {
    params: { url },
  });
  return response.data;
};
