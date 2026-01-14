use aura_core::{AnimeInfo, DownloadManager, DownloadJob, DownloadTask, Episode, ListEntry, SearchResult, Settings, TaskStatus};
use std::sync::Arc;
use uuid::Uuid;

// ------------------------------------------------------------------
// 1. Shared State
// ------------------------------------------------------------------
pub struct AppState {
    manager: Arc<DownloadManager>,
}



// ------------------------------------------------------------------
// 2. Core Logic (Testable)
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// 2. Core Logic (Testable)
// ------------------------------------------------------------------

async fn search_anime_impl(
    manager: &Arc<DownloadManager>,
    query: &str,
) -> Result<Vec<SearchResult>, String> {
    let mut results = manager.get_scraper().search(query).await.map_err(|e| e.to_string())?;
    for r in &mut results {
        if !r.image.starts_with("http") {
             r.image = format!("https://animeheaven.me/{}", r.image);
        }
    }
    Ok(results)
}

async fn get_season_data_impl(manager: &Arc<DownloadManager>, url: &str) -> Result<AnimeInfo, String> {
    manager.get_scraper().get_season(url).await.map_err(|e| e.to_string())
}

async fn resolve_link_impl(manager: &Arc<DownloadManager>, episode: Episode) -> Result<String, String> {
    manager
        .get_scraper()
        .get_download_link(&episode)
        .await
        .map_err(|e| e.to_string())
}

async fn get_new_releases_impl(manager: &Arc<DownloadManager>) -> Result<Vec<ListEntry>, String> {
    let mut results = manager.get_scraper().get_new().await.map_err(|e| e.to_string())?;
    for r in &mut results {
        if !r.image.starts_with("http") {
             r.image = format!("https://animeheaven.me/{}", r.image);
        }
    }
    Ok(results)
}

async fn get_popular_impl(manager: &Arc<DownloadManager>) -> Result<Vec<ListEntry>, String> {
    let mut results = manager.get_scraper().get_popular().await.map_err(|e| e.to_string())?;
    for r in &mut results {
        if !r.image.starts_with("http") {
             r.image = format!("https://animeheaven.me/{}", r.image);
        }
    }
    Ok(results)
}

async fn start_download_impl(
    manager: &Arc<DownloadManager>,
    anime_title: String,
    episodes: Vec<Episode>,
) -> Result<usize, String> {
    let job_id = Uuid::new_v4().to_string();
    let tasks: Vec<DownloadTask> = episodes
        .into_iter()
        .map(|ep| DownloadTask {
            id: Uuid::new_v4().to_string(),
            episode_number: Some(ep.number),
            filename: format!("{} - Episode {}.mp4", anime_title, ep.number),
            url: "pending".to_string(), 
            episode_url: Some(ep.url),
            gate_id: Some(ep.gate_id),
            total_bytes: 0,
            progress_bytes: 0,
            status: TaskStatus::Pending,
            segments: vec![],
        })
        .collect();

    let count = tasks.len();
    if count > 0 {
        let job = DownloadJob {
            id: job_id.clone(),
            name: anime_title,
            tasks,
        };
        manager.add_job(job);
        manager.start_download(job_id).await.map_err(|e| e.to_string())?;
    }

    Ok(count)
}

async fn get_downloads_impl(manager: &DownloadManager) -> Result<Vec<DownloadJob>, String> {
    Ok(manager.get_jobs())
}


// ------------------------------------------------------------------
// 3. Tauri Commands
// ------------------------------------------------------------------

/// Search for anime by query
#[tauri::command]
async fn search_anime(
    state: tauri::State<'_, AppState>,
    query: String,
) -> Result<Vec<SearchResult>, String> {
    search_anime_impl(&state.manager, &query).await
}

/// Fetch season details and episode list
#[tauri::command]
async fn get_season_data(
    state: tauri::State<'_, AppState>,
    url: String,
) -> Result<AnimeInfo, String> {
    get_season_data_impl(&state.manager, &url).await
}

/// Resolve the direct MP4 download link
#[tauri::command]
async fn resolve_link(
    state: tauri::State<'_, AppState>,
    episode: Episode,
) -> Result<String, String> {
    resolve_link_impl(&state.manager, episode).await
}

/// Fetch 'New Releases' list
#[tauri::command]
async fn get_new_releases(state: tauri::State<'_, AppState>) -> Result<Vec<ListEntry>, String> {
    get_new_releases_impl(&state.manager).await
}

/// Fetch 'Popular Today' list
#[tauri::command]
async fn get_popular(state: tauri::State<'_, AppState>) -> Result<Vec<ListEntry>, String> {
    get_popular_impl(&state.manager).await
}

#[tauri::command]
async fn start_download(
    state: tauri::State<'_, AppState>,
    anime_title: String,
    episodes: Vec<Episode>,
) -> Result<usize, String> {
    start_download_impl(&state.manager, anime_title, episodes).await
}

#[tauri::command]
async fn get_downloads(state: tauri::State<'_, AppState>) -> Result<Vec<DownloadJob>, String> {
    get_downloads_impl(&state.manager).await
}

#[tauri::command]
async fn get_settings(state: tauri::State<'_, AppState>) -> Result<Settings, String> {
    Ok(state.manager.get_settings())
}

#[tauri::command]
async fn update_settings(state: tauri::State<'_, AppState>, settings: Settings) -> Result<(), String> {
    state.manager.update_settings(settings).map_err(|e| e.to_string())
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}



// ------------------------------------------------------------------
// 3. App Builder
// ------------------------------------------------------------------

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            use tauri::Manager;
            
            // Resolve App Config Directory (cross-platform, Android-safe)
            let app_config_dir = match app.path().app_config_dir() {
                Ok(path) => path,
                Err(e) => return Err(Box::new(std::io::Error::new(std::io::ErrorKind::Other, format!("Failed to resolve config dir: {}", e)))),
            };
            
            let config_path = app_config_dir.to_string_lossy().to_string();
            println!("[Aura] Using config path: {}", config_path);

            // Initialize DownloadManager with custom path
            let manager = match DownloadManager::new(Some(config_path)) {
                Ok(m) => m,
                Err(e) => return Err(Box::new(std::io::Error::new(std::io::ErrorKind::Other, format!("Failed to initialize manager: {}", e)))),
            };

            app.manage(AppState { manager: Arc::new(manager) });
            
            println!("[Aura] Core initialized with DownloadManager.");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            search_anime,
            get_season_data,
            resolve_link,
            get_new_releases,
            get_popular,
            start_download,
            get_downloads,
            get_settings,
            update_settings,
            greet
        ])
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|_app_handle, event| {
            if let tauri::RunEvent::ExitRequested { .. } = event {
                println!("[Aura] Shutting down...");
            }
        });
}

#[cfg(test)]
mod tests {
    use super::*;
    use aura_core::DownloadManager;

    // Helper to get a manager instance
    fn get_manager() -> DownloadManager {
        DownloadManager::new(None).expect("Failed to create DownloadManager")
    }

    #[tokio::test]
    async fn test_search_anime() {
        let manager = Arc::new(get_manager());
        let query = "Naruto";

        // This is an integration test hitting the real API
        let result = search_anime_impl(&manager, query).await;

        match result {
            Ok(results) => {
                assert!(!results.is_empty(), "Should find some results for Naruto");
                let first = &results[0];
                assert!(!first.title.is_empty());
                assert!(!first.url.is_empty());
            }
            Err(e) => {
                panic!("Search failed: {}", e);
            }
        }
    }

    #[tokio::test]
    async fn test_get_new_releases() {
        let manager = Arc::new(get_manager());
        let result = get_new_releases_impl(&manager).await;

        match result {
            Ok(list) => {
                assert!(!list.is_empty(), "Should find new releases");
            }
            Err(e) => {
                panic!("Get new releases failed: {}", e);
            }
        }
    }
}
