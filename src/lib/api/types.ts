// Matches aura_core::SearchResult
export interface AnimeSearchResult {
  title: string;
  url: string;
  image: string;
}

// Matches aura_core::Episode
export interface Episode {
  name: string;
  number: number;
  url: string;
  gate_id: string;
}

// Matches aura_core::AnimeInfo
export interface AnimeInfo {
  title: string;
  url: string;
  episodes: Episode[];
  related: AnimeSearchResult[];
  year?: string | null;
  tags?: string[] | null;
  description?: string | null;
  japanese_title?: string | null;
}

// Matches aura_core::ListEntry
export interface AnimeListEntry {
  title: string;
  url: string;
  image: string;
  latest_ep: string;
  time_ago: string;
  rank?: number | null;
}

export interface DownloadJob {
  id: string;
  name: string;
  tasks: DownloadTask[];
}

export interface DownloadBuckets {
  active: DownloadJob[];
  completed: DownloadJob[];
}

export interface DownloadTask {
  id: string;
  status: RustTaskStatus;
  progress_bytes: number;
  total_bytes: number;
  filename: string;
}

export type PauseReason = 'UserRequest' | 'LinkExpired' | 'NetworkError' | 'Unknown';

export type RustTaskStatus =
  | 'Pending'
  | 'Downloading'
  | 'Completed'
  | { Paused: PauseReason }
  | { Error: string };

export type TaskStatusKind = 'Pending' | 'Downloading' | 'Completed' | 'Paused' | 'Error' | 'Unknown';

export const parseTaskStatus = (status: RustTaskStatus): { kind: TaskStatusKind; detail?: string } => {
  if (typeof status === 'string') {
    return { kind: status };
  }

  if ('Paused' in status) {
    return { kind: 'Paused', detail: status.Paused };
  }

  if ('Error' in status) {
    return { kind: 'Error', detail: status.Error };
  }

  return { kind: 'Unknown' };
};

export interface Settings {
  download_dir: string;
  max_concurrent_downloads: number;
  segments_per_file: number;
  user_agent: string;
}

export interface SettingsUpdateRequest extends Partial<Settings> { }
