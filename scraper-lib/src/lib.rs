pub mod client;
pub mod models;
pub mod parser;

use client::AnimeClient;
use parser::{parse_download_link, parse_list, parse_search, parse_season};
use models::Result; // We import Result privately for internal return types

// Public Re-exports: These are available to the CLI and Tauri
pub use models::{AnimeInfo, Episode, ListEntry, SearchResult, ScrapeError};

use std::sync::Arc;
use tokio::sync::Mutex;

pub struct AnimeScraper {
    client: Arc<Mutex<AnimeClient>>,
}

impl AnimeScraper {
    pub fn new() -> Self {
        Self {
            client: Arc::new(Mutex::new(AnimeClient::new().expect("Failed to create HTTP client"))),
        }
    }

    pub async fn search(&self, query: &str) -> Result<Vec<SearchResult>> {
        let client = self.client.lock().await;
        let html = client.get_text(&format!("/search.php?s={}", query)).await?;
        parse_search(&html)
    }

    pub async fn get_season(&self, url: &str) -> Result<AnimeInfo> {
        let client = self.client.lock().await;
        // Ensure we have the relative path
        let path = if url.starts_with("http") { 
            url.replacen("https://animeheaven.me", "", 1)
        } else { 
            url.to_string() 
        };
        
        let html = client.get_text(&path).await?;
        parse_season(&html, &path)
    }

    pub async fn get_download_link(&self, episode: &Episode) -> Result<String> {
        let client_lock = self.client.lock().await;
        let http_client = &client_lock.client; 

        // FIX: Add a slash between domain and path
        let url = format!("https://animeheaven.me/{}", episode.url);
        
        // Construct the request with the specific Cookie header
        let response = http_client
            .get(&url)
            .header("Referer", "https://animeheaven.me/")
            .header("Cookie", format!("key={}", episode.gate_id)) 
            .send()
            .await?
            .text()
            .await?;
            
        match parse_download_link(&response) {
            Some(link) => Ok(link),
            None => Err(ScrapeError::Parse("Download link not found in page".into()))
        }
    }

    pub async fn get_new(&self) -> Result<Vec<ListEntry>> {
        let client = self.client.lock().await;
        let html = client.get_text("/new.php").await?;
        parse_list(&html, false)
    }

    pub async fn get_popular(&self) -> Result<Vec<ListEntry>> {
        let client = self.client.lock().await;
        let html = client.get_text("/popular.php").await?;
        parse_list(&html, true)
    }
}

impl Default for AnimeScraper {
    fn default() -> Self {
        Self::new()
    }
}