use crate::models::{AnimeInfo, Episode, ListEntry, SearchResult, ScrapeError, ScrapeResult};
use reqwest::{Client, ClientBuilder};
use scraper::{Html, Selector};
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::Mutex;

lazy_static::lazy_static! {
    static ref SEL_SEARCH_ITEM: Selector = Selector::parse(".similarimg").unwrap();
    static ref SEL_SEARCH_LINK: Selector = Selector::parse("a[href*='anime.php']").unwrap();
    static ref SEL_SEARCH_IMG: Selector = Selector::parse("img.coverimg").unwrap();
    static ref SEL_SEARCH_NAME: Selector = Selector::parse(".similarname a").unwrap();

    static ref SEL_CHART_ITEM: Selector = Selector::parse(".chart").unwrap();
    static ref SEL_CHART_LINK: Selector = Selector::parse(".chartimg a").unwrap();
    static ref SEL_CHART_IMG: Selector = Selector::parse("img.coverimg").unwrap();
    static ref SEL_CHART_TITLE: Selector = Selector::parse(".charttitle a").unwrap();
    static ref SEL_CHART_TIME: Selector = Selector::parse(".charttimer").unwrap();
    static ref SEL_CHART_EP: Selector = Selector::parse(".chartepm").unwrap();

    static ref SEL_INFO_TITLE: Selector = Selector::parse(".infotitle").unwrap();
    static ref SEL_EPISODE_LINK: Selector = Selector::parse(".linetitle2 a").unwrap();

    static ref SEL_DOWNLOAD_LINK: Selector = Selector::parse("a").unwrap();

    static ref SEL_INFO_YEAR: Selector = Selector::parse(".infoyear").unwrap();
    static ref SEL_INFO_TAGS: Selector = Selector::parse(".infotags .boxitem").unwrap();
    static ref SEL_INFO_DES: Selector = Selector::parse(".infodes").unwrap();
    static ref SEL_INFO_TITLE_JP: Selector = Selector::parse(".infotitlejp").unwrap();
}

struct AnimeClient {
    client: Client,
    base_url: String,
}

impl AnimeClient {
    fn new() -> ScrapeResult<Self> {
        let client = ClientBuilder::new()
            .cookie_store(true)
            .timeout(Duration::from_secs(30))
            .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
            .build()?;

        Ok(Self {
            client,
            base_url: "https://animeheaven.me/".to_string(),
        })
    }

    async fn get_text(&self, path: &str) -> ScrapeResult<String> {
        let url = format!("{}{}", self.base_url, path);
        let response = self
            .client
            .get(&url)
            .header("Referer", "https://animeheaven.me/")
            .send()
            .await?
            .text()
            .await?;
        Ok(response)
    }
}

pub struct AnimeScraper {
    client: Arc<Mutex<AnimeClient>>,
}

impl AnimeScraper {
    pub fn new() -> Self {
        Self {
            client: Arc::new(Mutex::new(
                AnimeClient::new().expect("Failed to create HTTP client"),
            )),
        }
    }

    pub async fn search(&self, query: &str) -> ScrapeResult<Vec<SearchResult>> {
        let client = self.client.lock().await;
        let html = client.get_text(&format!("/search.php?s={}", query)).await?;
        parse_search(&html)
    }

    pub async fn get_season(&self, url: &str) -> ScrapeResult<AnimeInfo> {
        let client = self.client.lock().await;
        let path = if url.starts_with("http") {
            url.replacen("https://animeheaven.me", "", 1)
        } else {
            url.to_string()
        };

        let html = client.get_text(&path).await?;
        parse_season(&html, &path)
    }

    pub async fn get_download_link(&self, episode: &Episode) -> ScrapeResult<String> {
        let client_lock = self.client.lock().await;
        let http_client = &client_lock.client;

        let url = format!("https://animeheaven.me/{}", episode.url);

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
            None => Err(ScrapeError::Parse("Download link not found".into())),
        }
    }

    pub async fn get_new(&self) -> ScrapeResult<Vec<ListEntry>> {
        let client = self.client.lock().await;
        let html = client.get_text("/new.php").await?;
        parse_list(&html, false)
    }

    pub async fn get_popular(&self) -> ScrapeResult<Vec<ListEntry>> {
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

// ============ PARSING FUNCTIONS ============

fn parse_search(html: &str) -> ScrapeResult<Vec<SearchResult>> {
    let document = Html::parse_document(html);
    let mut results = Vec::new();

    for item in document.select(&SEL_SEARCH_ITEM) {
        let link = item
            .select(&SEL_SEARCH_LINK)
            .next()
            .ok_or(ScrapeError::NotFound)?;
        let href = link.value().attr("href").ok_or(ScrapeError::NotFound)?;

        let img = item
            .select(&SEL_SEARCH_IMG)
            .next()
            .ok_or(ScrapeError::NotFound)?;
        let src = img.value().attr("src").ok_or(ScrapeError::NotFound)?;
        let alt = img.value().attr("alt").unwrap_or("Unknown");

        let name_el = item.select(&SEL_SEARCH_NAME).next();
        let title = name_el
            .map(|n| n.inner_html().trim().to_string())
            .unwrap_or_else(|| alt.to_string());

        results.push(SearchResult {
            title,
            url: href.to_string(),
            image: src.to_string(),
        });
    }
    Ok(results)
}

fn parse_list(html: &str, is_popular: bool) -> ScrapeResult<Vec<ListEntry>> {
    let document = Html::parse_document(html);
    let mut results = Vec::new();

    for (idx, item) in document.select(&SEL_CHART_ITEM).enumerate() {
        let link = item
            .select(&SEL_CHART_LINK)
            .next()
            .ok_or(ScrapeError::NotFound)?;
        let href = link.value().attr("href").ok_or(ScrapeError::NotFound)?;

        let img = item
            .select(&SEL_CHART_IMG)
            .next()
            .ok_or(ScrapeError::NotFound)?;
        let src = img.value().attr("src").ok_or(ScrapeError::NotFound)?;

        let title_el = item
            .select(&SEL_CHART_TITLE)
            .next()
            .ok_or(ScrapeError::NotFound)?;
        let title = title_el.inner_html().trim().to_string();

        let time_el = item.select(&SEL_CHART_TIME).next();
        let time_ago = time_el
            .map(|e| e.text().collect::<String>().trim().to_string())
            .unwrap_or_default();

        let ep_el = item.select(&SEL_CHART_EP).next();
        let latest_ep = ep_el
            .map(|e| e.inner_html().trim().to_string())
            .unwrap_or_default();

        results.push(ListEntry {
            title,
            url: href.to_string(),
            image: src.to_string(),
            latest_ep,
            time_ago,
            rank: if is_popular {
                Some((idx + 1) as u32)
            } else {
                None
            },
        });
    }
    Ok(results)
}

fn parse_season(html: &str, url: &str) -> ScrapeResult<AnimeInfo> {
    let document = Html::parse_document(html);

    let title_el = document
        .select(&SEL_INFO_TITLE)
        .next()
        .ok_or(ScrapeError::NotFound)?;
    let title = title_el.inner_html().trim().to_string();

    let mut episodes: Vec<Episode> = Vec::new();

    let gate_re = regex::Regex::new(r#"gate\("([^"]+)"\)"#).unwrap();

    let sel_watch2 = Selector::parse(".watch2").unwrap();
    let sel_watch1 = Selector::parse(".watch1").unwrap();

    for ep in document.select(&SEL_EPISODE_LINK) {
        let onclick = ep.value().attr("onclick").unwrap_or("");
        let href = ep.value().attr("href").unwrap_or("").to_string();

        let gate_id = gate_re
            .captures(onclick)
            .and_then(|c| c.get(1))
            .map(|m| m.as_str().to_string())
            .unwrap_or_default();

        let number_str = ep
            .select(&sel_watch2)
            .next()
            .map(|d| d.inner_html().trim().to_string())
            .unwrap_or_else(|| "0".to_string());

        let number: u32 = number_str.parse().unwrap_or(0);

        if number > 0 {
            let watch1_items: Vec<_> = ep.select(&sel_watch1).collect();
            let time_str = watch1_items
                .last()
                .map(|d| d.inner_html().trim().to_string())
                .unwrap_or_default();

            let clean_name = format!("Episode {} {}", number_str, time_str);

            episodes.push(Episode {
                name: clean_name,
                number,
                url: href,
                gate_id,
            });
        }
    }

    episodes.sort_by_key(|e| e.number);

    // Extract new fields
    let year_el = document.select(&SEL_INFO_YEAR).next();
    let year = if let Some(el) = year_el {
        let text = el.text().collect::<String>();
        // Text format: "Episodes: 24 Year: 2018-2019 Score: 8.7"
        // Simple regex to capture text between "Year:" and "Score" or end
        let re = regex::Regex::new(r"Year:\s*(.*?)(?:Score|$)").unwrap();
        re.captures(&text)
            .and_then(|c| c.get(1))
            .map(|m| m.as_str().trim().to_string())
    } else {
        None
    };

    let tags = document
        .select(&SEL_INFO_TAGS)
        .map(|el| el.text().collect::<String>().trim().to_string())
        .filter(|s| !s.is_empty())
        .collect::<Vec<String>>();
    
    let tags = if tags.is_empty() { None } else { Some(tags) };

    let description = document
        .select(&SEL_INFO_DES)
        .next()
        .map(|el| el.text().collect::<String>().trim().to_string());

    let japanese_title = document
        .select(&SEL_INFO_TITLE_JP)
        .next()
        .map(|el| el.text().collect::<String>().trim().to_string());

    Ok(AnimeInfo {
        title,
        url: url.to_string(),
        episodes,
        related: vec![],
        year,
        tags,
        description,
        japanese_title,
    })
}

fn parse_download_link(html: &str) -> Option<String> {
    let document = Html::parse_document(html);

    for a in document.select(&SEL_DOWNLOAD_LINK) {
        let text = a.inner_html().to_lowercase();
        let href = a.value().attr("href").unwrap_or("");

        if text.contains("download") && href.contains("video.mp4") {
            return Some(href.to_string());
        }
    }
    None
}
