import apiClient from './index';
import type { AnimeSearchResult, Season, AnimeListEntry } from './types';

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
 * Retrieves the list of newly released anime episodes.
 * @returns A promise that resolves to an array of anime entries.
 */
export const getNewAnime = async (): Promise<AnimeListEntry[]> => {
  const response = await apiClient.get<AnimeListEntry[]>('/new');
  return response.data;
};

/**
 * Retrieves the list of anime currently popular today.
 * @returns A promise that resolves to an array of anime entries.
 */
export const getPopularAnime = async (): Promise<AnimeListEntry[]> => {
  const response = await apiClient.get<AnimeListEntry[]>('/popular');
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
