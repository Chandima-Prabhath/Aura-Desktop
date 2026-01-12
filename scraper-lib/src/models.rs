use serde::{Deserialize, Serialize};

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

pub type Result<T> = std::result::Result<T, ScrapeError>;