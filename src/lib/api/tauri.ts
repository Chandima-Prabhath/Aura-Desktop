import { invoke } from '@tauri-apps/api/core';
import type { AnimeSearchResult, AnimeInfo, AnimeListEntry, Episode, DownloadJob, Settings } from './types';

export const searchAnime = async (query: string): Promise<AnimeSearchResult[]> => {
    return await invoke('search_anime', { query });
};

export const getSeason = async (url: string): Promise<AnimeInfo> => {
    return await invoke('get_season_data', { url });
};

export const resolveLink = async (episode: Episode): Promise<string> => {
    return await invoke('resolve_link', { episode });
};

export const getNewAnime = async (): Promise<AnimeListEntry[]> => {
    return await invoke('get_new_releases');
};

export const getPopularAnime = async (): Promise<AnimeListEntry[]> => {
    return await invoke('get_popular');
};

export const startDownload = async (anime_title: string, episodes: Episode[]): Promise<number> => {
    return await invoke('start_download', { animeTitle: anime_title, episodes });
};

export const getDownloads = async (): Promise<DownloadJob[]> => {
    return await invoke('get_downloads');
};

export const getSettings = async (): Promise<Settings> => {
    return await invoke('get_settings');
};

export const updateSettings = async (settings: Settings): Promise<void> => {
    return await invoke('update_settings', { settings });
};
