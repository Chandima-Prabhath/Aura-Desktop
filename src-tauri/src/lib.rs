use std::sync::Arc;
use anime_scraper::{AnimeScraper, Episode, ListEntry, SearchResult, AnimeInfo};
use tokio::sync::Mutex; // Use Tokio Mutex

// ------------------------------------------------------------------
// 1. Shared State
// ------------------------------------------------------------------
struct AppState {
    scraper: Arc<Mutex<AnimeScraper>>,
}

// ------------------------------------------------------------------
// 2. Tauri Commands
// ------------------------------------------------------------------

/// Search for anime by query
#[tauri::command]
async fn search_anime(state: tauri::State<'_, AppState>, query: String) -> Result<Vec<SearchResult>, String> {
    // Use lock().await for Tokio mutex
    let scraper = state.scraper.lock().await;
    scraper.search(&query).await.map_err(|e| e.to_string())
}

/// Fetch season details and episode list
#[tauri::command]
async fn get_season_data(state: tauri::State<'_, AppState>, url: String) -> Result<AnimeInfo, String> {
    let scraper = state.scraper.lock().await;
    scraper.get_season(&url).await.map_err(|e| e.to_string())
}

/// Resolve the direct MP4 download link
#[tauri::command]
async fn resolve_link(state: tauri::State<'_, AppState>, episode: Episode) -> Result<String, String> {
    let scraper = state.scraper.lock().await;
    scraper.get_download_link(&episode).await.map_err(|e| e.to_string())
}

/// Fetch 'New Releases' list
#[tauri::command]
async fn get_new_releases(state: tauri::State<'_, AppState>) -> Result<Vec<ListEntry>, String> {
    let scraper = state.scraper.lock().await;
    scraper.get_new().await.map_err(|e| e.to_string())
}

/// Fetch 'Popular Today' list
#[tauri::command]
async fn get_popular(state: tauri::State<'_, AppState>) -> Result<Vec<ListEntry>, String> {
    let scraper = state.scraper.lock().await;
    scraper.get_popular().await.map_err(|e| e.to_string())
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
        
        .manage(AppState {
            scraper: Arc::new(Mutex::new(AnimeScraper::new())),
        })
        
        .setup(|_app| {
            println!("[Aura] Native Scraper initialized.");
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
            // Also prefixed _app_handle here as it's unused
            if let tauri::RunEvent::ExitRequested { .. } = event {
                println!("[Aura] Shutting down...");
            }
        });
}