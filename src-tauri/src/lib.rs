use aura_core::{AnimeInfo, DownloadManager, Episode, ListEntry, SearchResult};
use std::sync::Arc;

// ------------------------------------------------------------------
// 1. Shared State
// ------------------------------------------------------------------
pub struct AppState {
    manager: Arc<DownloadManager>,
}

// ------------------------------------------------------------------
// 2. Core Logic (Testable)
// ------------------------------------------------------------------

async fn search_anime_impl(
    manager: &DownloadManager,
    query: &str,
) -> Result<Vec<SearchResult>, String> {
    let scraper = manager.get_scraper();
    scraper.search(query).await.map_err(|e| e.to_string())
}

async fn get_season_data_impl(manager: &DownloadManager, url: &str) -> Result<AnimeInfo, String> {
    let scraper = manager.get_scraper();
    scraper.get_season(url).await.map_err(|e| e.to_string())
}

async fn resolve_link_impl(manager: &DownloadManager, episode: &Episode) -> Result<String, String> {
    let scraper = manager.get_scraper();
    scraper
        .get_download_link(episode)
        .await
        .map_err(|e| e.to_string())
}

async fn get_new_releases_impl(manager: &DownloadManager) -> Result<Vec<ListEntry>, String> {
    let scraper = manager.get_scraper();
    scraper.get_new().await.map_err(|e| e.to_string())
}

async fn get_popular_impl(manager: &DownloadManager) -> Result<Vec<ListEntry>, String> {
    let scraper = manager.get_scraper();
    scraper.get_popular().await.map_err(|e| e.to_string())
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
    resolve_link_impl(&state.manager, &episode).await
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
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// ------------------------------------------------------------------
// 3. App Builder
// ------------------------------------------------------------------

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize DownloadManager
    // TODO: Pass a custom config directory if needed for Android/Tauri specific paths
    let manager = match DownloadManager::new(None) {
        Ok(m) => Arc::new(m),
        Err(e) => {
            eprintln!("Failed to initialize Aura DownloadManager: {}", e);
            // In a real app, you might want to handle this more gracefully or fallback
            panic!("Failed to initialize Aura DownloadManager: {}", e);
        }
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .manage(AppState { manager })
        .setup(|_app| {
            println!("[Aura] Core initialized with DownloadManager.");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            search_anime,
            get_season_data,
            resolve_link,
            get_new_releases,
            get_popular,
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
        let manager = get_manager();
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
        let manager = get_manager();
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
