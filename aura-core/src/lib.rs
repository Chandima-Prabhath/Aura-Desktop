// aura-core: Unified anime scraper and download manager
//
// Modules:
// - scraper: Website parsing and link extraction
// - downloader: Async file download primitives
// - manager: Download queue management
// - models: Shared data structures
// - config: User settings

pub mod scraper;
pub mod downloader;
pub mod manager;
pub mod models;
pub mod config;
pub mod logging;

// Re-export main types for convenience
pub use config::Settings;
pub use manager::DownloadManager;
pub use models::{
    // Scraper models
    AnimeInfo, Episode, SearchResult, ListEntry, ScrapeError,
    // Download models
    DownloadJob, DownloadTask, TaskStatus, PauseReason, Segment, SegmentStatus,
};
pub use scraper::AnimeScraper;
