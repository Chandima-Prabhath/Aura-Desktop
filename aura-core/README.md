# Aura Core

Aura Core is a robust Rust library for scraping anime information from AnimeHeaven and managing video downloads with resume capability, concurrency control, and granular progress reporting.

## Cross-Platform Support

Aura Core is designed to run seamlessly on **Windows**, **Linux**, and **Android**.

### Android Compatibility
- **TLS/SSL**: Uses `rustls` (via `reqwest` features) instead of OpenSSL. This avoids complex cross-compilation linking issues and ensures native behavior on Android without additional C dependencies.
- **File System**: Avoids hardcoded paths. The `DownloadManager::new` and `Settings::load` functions support injecting a custom configuration directory. This is critical for Android's scoped storage, where standard XDG directories (like `~/.config`) are often inaccessible.

### Integrating with Tauri (Android)
When running inside a Tauri application on Android, you must properly resolve the App Data directory and pass it to `aura-core`.

```rust
// In your Tauri command handler::
#[tauri::command]
async fn init_aura(app_handle: tauri::AppHandle) -> Result<(), String> {
    // 1. Resolve Android-safe App Data Directory
    let app_data_dir = app_handle
        .path_resolver()
        .app_data_dir()
        .ok_or("Failed to resolve app data dir")?;
        
    let config_path = app_data_dir.to_string_lossy().to_string();

    // 2. Initialize Manager with Custom Path
    let manager = DownloadManager::new(Some(config_path))
        .map_err(|e| e.to_string())?;
        
    // ... store manager in state ...
    Ok(())
}
```

## Features

- **Robust Scraping**: Search anime, fetch seasonal charts, getting new/popular releases.
- **Detailed Metadata**: Extracts Title, Year, Description, Tags, Japanese Title, and Episode lists.
- **Smart Download Manager**:
  - **Resumable Downloads**: Tracks progress and resumes from where it left off, even after app restarts.
  - **Concurrency Control**: Limits simultaneous downloads to prevent network flooding.
  - **Segmented Downloading**: Optimization for speed and reliability.
  - **Job Persistence**: Automatically saves queue state to JSON.
- **Async/Await**: Built on `tokio` and `reqwest` for high performance.
- **Logging**: Integrated with `tracing` for structured logging.

## Installation

Add `aura-core` to your `Cargo.toml`. Since it's a local crate in this workspace:

```toml
[dependencies]
aura-core = { path = "../aura-core" }
tokio = { version = "1.0", features = ["full"] }
```

## Quick Start

### 1. Initialize Logging

First, set up the logger to capture info and errors.

```rust
use aura_core::logging::init_logging;

fn main() -> anyhow::Result<()> {
    let _guard = init_logging()?;
    // ...
    Ok(())
}
```

### 2. Scraping Anime

Use `AnimeScraper` to search and get details.

```rust
use aura_core::AnimeScraper;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let scraper = AnimeScraper::new();

    // Search
    let results = scraper.search("Slime").await?;
    if let Some(first_match) = results.first() {
        println!("Found: {}", first_match.title);
        
        // Get Full Details (Episodes, Year, Tags, etc.)
        let info = scraper.get_season(&first_match.url).await?;
        println!("Title: {}", info.title);
        println!("Year: {:?}", info.year);
        println!("Description: {:?}", info.description);
        
        // Get Download Link for Episode 1
        if let Some(ep1) = info.episodes.first() {
            let link = scraper.get_download_link(ep1).await?;
            println!("Download Link: {}", link);
        }
    }
    
    Ok(())
}
```

### 3. Managing Downloads

Use `DownloadManager` to handle queues and persistence.

```rust
use aura_core::{DownloadManager, DownloadJob, DownloadTask, TaskStatus};
use std::sync::Arc;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize manager (loads existing jobs from config)
    // Pass 'None' to use default OS config dir, or 'Some(path)' for custom location
    let manager = Arc::new(DownloadManager::new(None)?);

    // Create a job
    // Note: Constructing DownloadJob manually is verbose, usually done via logic helper
    // ... (See CLI implementation for full example)
    
    // Start downloading a job
    manager.start_download("job-id-123".to_string()).await?;

    // Monitor progress
    loop {
        let jobs = manager.get_jobs();
        for job in jobs {
             for task in job.tasks {
                 println!("Task {} progress: {}/{}", task.filename, task.progress_bytes, task.total_bytes);
             }
        }
        tokio::time::sleep(std::time::Duration::from_secs(1)).await;
    }
}
```
## CLI Usage

The `aura-cli` tool provides a command-line interface to the core library.

### Global Arguments

- `--config-dir <PATH>`: Optional. Override the configuration directory (defaults to `%APPDATA%/aura`). Useful for testing or sandboxed environments (like Android/Tauri).

### Commands

- **`search <QUERY>`**: Search for an anime.
  - `-i, --interactive`: Enter interactive mode to select results and queue downloads.
- **`season <URL>`**: View details and download episodes from a season page.
- **`manage`**: interactive view of the download queue status.
- **`new`**: List newly released anime.
- **`popular`**: List popular anime.
- **`download <URL> <GATE_ID>`**: Resolve a direct download link for a specific episode.

## Architecture

- **Manager**: The `DownloadManager` is the central coordinator. It holds a `Mutex` protected list of jobs and manages a `Semaphore` for limiting concurrent downloads.
- **Concurrency**: The semaphore limit (`max_concurrent_downloads`) is strictly enforced. Workers acquire a permit *before* starting the download. Extra tasks remain in `Pending` state until a slot opens.
- **Persistence**: Jobs are saved to `%APPDATA%/aura/jobs.json` (or your custom config dir). When the manager starts, it reloads this state
- **Workers**: Each download task runs in its own tokio task. Large files are downloaded in segments (parts).
- **Progress**: A background ticker inside the worker updates the atomic progress counter every 2 seconds to minimize lock contention.

## Configuration

Settings are stored in `%APPDATA%/aura/settings.json`.
- `max_concurrent_downloads`: Default 3.
- `download_dir`: Default `Downloads/Anime`.

## Modules

- `scraper`: Handles HTML parsing (using `scraper` crate) and HTTP requests.
- `manager`: Core logic for queue management and worker spawning.
- `downloader`: Low-level HTTP download functions (range requests).
- `models`: Shared structs (`AnimeInfo`, `Episode`, `DownloadJob`, etc.).
