use crate::models::{AnimeInfo, Episode, ListEntry, Result, SearchResult, ScrapeError};
use regex::Regex;
use scraper::{Html, Selector};

// --- Selectors ---
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
}

// --- Parsing Functions ---

pub fn parse_search(html: &str) -> Result<Vec<SearchResult>> {
    let document = Html::parse_document(html);
    let mut results = Vec::new();

    for item in document.select(&SEL_SEARCH_ITEM) {
        let link = item.select(&SEL_SEARCH_LINK).next().ok_or(ScrapeError::NotFound)?;
        let href = link.value().attr("href").ok_or(ScrapeError::NotFound)?;
        
        let img = item.select(&SEL_SEARCH_IMG).next().ok_or(ScrapeError::NotFound)?;
        let src = img.value().attr("src").ok_or(ScrapeError::NotFound)?;
        let alt = img.value().attr("alt").unwrap_or("Unknown");
        
        let name_el = item.select(&SEL_SEARCH_NAME).next();
        let title = name_el.map(|n| n.inner_html().trim().to_string())
            .unwrap_or_else(|| alt.to_string());

        results.push(SearchResult {
            title,
            url: href.to_string(),
            image: src.to_string(),
        });
    }
    Ok(results)
}

pub fn parse_list(html: &str, is_popular: bool) -> Result<Vec<ListEntry>> {
    let document = Html::parse_document(html);
    let mut results = Vec::new();

    for (idx, item) in document.select(&SEL_CHART_ITEM).enumerate() {
        let link = item.select(&SEL_CHART_LINK).next().ok_or(ScrapeError::NotFound)?;
        let href = link.value().attr("href").ok_or(ScrapeError::NotFound)?;
        
        let img = item.select(&SEL_CHART_IMG).next().ok_or(ScrapeError::NotFound)?;
        let src = img.value().attr("src").ok_or(ScrapeError::NotFound)?;
        
        let title_el = item.select(&SEL_CHART_TITLE).next().ok_or(ScrapeError::NotFound)?;
        let title = title_el.inner_html().trim().to_string();
        
        let time_el = item.select(&SEL_CHART_TIME).next();
        let time_ago = time_el.map(|e| e.inner_html().trim().to_string()).unwrap_or_default();
        
        let ep_el = item.select(&SEL_CHART_EP).next();
        let latest_ep = ep_el.map(|e| e.inner_html().trim().to_string()).unwrap_or_default();

        results.push(ListEntry {
            title,
            url: href.to_string(),
            image: src.to_string(),
            latest_ep,
            time_ago,
            rank: if is_popular { Some((idx + 1) as u32) } else { None },
        });
    }
    Ok(results)
}

pub fn parse_season(html: &str, url: &str) -> Result<AnimeInfo> {
    let document = Html::parse_document(html);
    
    let title_el = document.select(&SEL_INFO_TITLE).next().ok_or(ScrapeError::NotFound)?;
    let title = title_el.inner_html().trim().to_string();

    let mut episodes: Vec<Episode> = Vec::new();
    
    let gate_re = Regex::new(r#"gate\("([^"]+)"\)"#).unwrap();
    
    let sel_watch2 = Selector::parse(".watch2").unwrap();
    let sel_watch1 = Selector::parse(".watch1").unwrap();

    for ep in document.select(&SEL_EPISODE_LINK) {
        let onclick = ep.value().attr("onclick").unwrap_or("");
        let href = ep.value().attr("href").unwrap_or("").to_string();

        let gate_id = gate_re.captures(onclick)
            .and_then(|c| c.get(1))
            .map(|m| m.as_str().to_string())
            .unwrap_or_default();
            
        // FIX: Convert to owned String
        let number_str = ep.select(&sel_watch2)
            .next()
            .map(|d| d.inner_html().trim().to_string()) 
            .unwrap_or_else(|| "0".to_string());
            
        let number: u32 = number_str.parse().unwrap_or(0);

        if number > 0 {
            let watch1_items: Vec<_> = ep.select(&sel_watch1).collect();
            
            // FIX: Convert to owned String
            let time_str = watch1_items.last().map(|d| d.inner_html().trim().to_string()).unwrap_or_default();
            
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

    Ok(AnimeInfo {
        title,
        url: url.to_string(),
        episodes,
        related: vec![], 
    })
}

pub fn parse_download_link(html: &str) -> Option<String> {
    let document = Html::parse_document(html);
    
    for a in document.select(&SEL_DOWNLOAD_LINK) {
        let text = a.inner_html().to_lowercase();
        let href = a.value().attr("href").unwrap_or("");
        
        // Look for link containing "Download" and ending in video extension or parameters
        if text.contains("download") && href.contains("video.mp4") {
            return Some(href.to_string());
        }
    }
    None
}