use serde::{Deserialize, Serialize};

// ============ SCRAPER MODELS ============

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SearchResult {
    pub title: String,
    pub url: String,
    pub image: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Episode {
    pub name: String,
    pub number: u32,
    pub url: String,
    pub gate_id: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AnimeInfo {
    pub title: String,
    pub url: String,
    pub episodes: Vec<Episode>,
    pub related: Vec<SearchResult>,
    // New fields
    pub year: Option<String>,
    pub tags: Option<Vec<String>>,
    pub description: Option<String>,
    pub japanese_title: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ListEntry {
    pub title: String,
    pub url: String,
    pub image: String,
    pub latest_ep: String,
    pub time_ago: String,
    pub rank: Option<u32>,
}

#[derive(Debug, thiserror::Error)]
pub enum ScrapeError {
    #[error("Network request failed: {0}")]
    Request(#[from] reqwest::Error),

    #[error("Parsing failed: {0}")]
    Parse(String),

    #[error("Element not found")]
    NotFound,
}

pub type ScrapeResult<T> = std::result::Result<T, ScrapeError>;

// ============ DOWNLOAD MODELS ============

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadJob {
    pub id: String,
    pub name: String,
    pub tasks: Vec<DownloadTask>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadTask {
    pub id: String,
    pub url: String,
    pub filename: String,
    pub status: TaskStatus,
    pub progress_bytes: u64,
    pub total_bytes: u64,
    pub episode_url: Option<String>,
    pub gate_id: Option<String>,
    pub episode_number: Option<u32>,
    pub segments: Vec<Segment>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Segment {
    pub index: usize,
    pub start: u64,
    pub end: u64,
    pub downloaded: u64,
    pub status: SegmentStatus,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum SegmentStatus {
    Pending,
    Downloading,
    Completed,
    Error,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum TaskStatus {
    Pending,
    Downloading,
    Paused(PauseReason),
    Completed,
    Error(String),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum PauseReason {
    UserRequest,
    LinkExpired,
    NetworkError,
    Unknown,
}
