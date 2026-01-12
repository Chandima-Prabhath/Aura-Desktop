use crate::models::Result;
use reqwest::{Client, ClientBuilder};
use std::time::Duration;

pub struct AnimeClient {
    pub client: Client,
    base_url: String,
}

impl AnimeClient {
    pub fn new() -> Result<Self> {
        let client = ClientBuilder::new()
            .cookie_store(true)
            .timeout(Duration::from_secs(30))
            .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36")
            .build()?;
            
        Ok(Self {
            client,
            base_url: "https://animeheaven.me/".to_string(), // <--- ADD TRAILING SLASH HERE
        })
    }

    pub async fn get_text(&self, path: &str) -> Result<String> {
        let url = format!("{}{}", self.base_url, path);
        let response = self.client
            .get(&url)
            .header("Referer", "https://animeheaven.me/")
            .send()
            .await?
            .text()
            .await?;
        Ok(response)
    }

    pub async fn post_text(&self, path: &str, body: &[(&str, &str)]) -> Result<String> {
        let url = format!("{}{}", self.base_url, path);
        let response = self.client
            .post(&url)
            .header("Referer", "https://animeheaven.me/")
            .form(body)
            .send()
            .await?
            .text()
            .await?;
        Ok(response)
    }
}