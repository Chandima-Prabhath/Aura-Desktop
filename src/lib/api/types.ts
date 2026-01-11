export interface AnimeSearchResult {
  title: string;
  url: string;
  image: string;
}

export interface AnimeListEntry {
  title: string;
  url: string;
  image: string;
  title_jp: string;
  latest_ep_number: string;
  time_ago: string;
  rank: number | null;
  popularity_delta: string;
}

export interface Episode {
  episode_number: number;
  name: string;
  raw_name: string;
  url: string;
  gate_id: string;
}

export interface Season {
  title: string;
  url: string;
  episodes: Episode[];
  related: any[]; // The type for 'related' is not specified in the docs
}

export interface EpisodePayload {
  url: string;
  gate_id?: string | null;
  episode_number: number;
  name: string;
}

export interface StartDownloadRequest {
  anime_title: string;
  episodes: EpisodePayload[];
}

export interface StartDownloadResponse {
  queued: number;
  task_ids: string[];
  errors: { [key: string]: any }[];
}

export interface DownloadTask {
  id: string;
  url: string;
  dest_folder: string;
  filename?: string | null;
  episode_url?: string | null;
  anime_title?: string | null;
  status: string;
  downloaded_bytes: number;
  total_bytes: number;
  speed: number;
  progress: number;
  error_message?: string | null;
}

export interface Settings {
  download_path: string;
  max_concurrent_downloads: number;
  download_threads: number;
  log_level: string;
}

export interface SettingsUpdateRequest {
  download_path?: string | null;
  max_concurrent_downloads?: number | null;
  download_threads?: number | null;
  log_level?: string | null;
}

export interface HealthCheckResponse {
  status: string;
  message: string;
  api_version: string;
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface HTTPValidationError {
  detail: ValidationError[];
}
