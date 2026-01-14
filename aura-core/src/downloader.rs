use anyhow::Result;
use reqwest::header::{RANGE, USER_AGENT};
use std::path::Path;
use tokio::fs::OpenOptions;
use tokio::io::{AsyncSeekExt, AsyncWriteExt};

/// Get file size with fallback for servers that block HEAD
pub async fn get_content_length(
    client: &reqwest::Client,
    url: &str,
    user_agent: &str,
) -> Result<u64> {
    // Try HEAD first
    let head_resp = client
        .head(url)
        .header(USER_AGENT, user_agent)
        .send()
        .await?;

    tracing::debug!("HEAD status: {}", head_resp.status());
    tracing::debug!("HEAD headers: {:?}", head_resp.headers());

    if head_resp.status().is_success() {
        if let Some(len) = head_resp.content_length() {
            if len > 0 {
                return Ok(len);
            }
        }
        // Fallback: Check header manually (fixes issue with WireMock sending chunked + content-length)
        // reqwest::Response::content_length() returns None if chunked encoding is set
        if let Some(val) = head_resp.headers().get(reqwest::header::CONTENT_LENGTH) {
            if let Ok(str_val) = val.to_str() {
                if let Ok(len) = str_val.parse::<u64>() {
                    if len > 0 {
                        return Ok(len);
                    }
                }
            }
        }
    }

    // Fallback: GET with Range 0-0
    let get_resp = client
        .get(url)
        .header(USER_AGENT, user_agent)
        .header(RANGE, "bytes=0-0")
        .send()
        .await?;

    tracing::debug!("GET fallback status: {}", get_resp.status());
    tracing::debug!("GET fallback headers: {:?}", get_resp.headers());

    if get_resp.status().is_success() {
        if let Some(range) = get_resp.headers().get(reqwest::header::CONTENT_RANGE) {
            let range_str = range.to_str()?;
            if let Some(total) = range_str.split('/').last() {
                return Ok(total.parse::<u64>()?);
            }
        }
    }

    anyhow::bail!("Could not determine file size")
}

/// Download a specific chunk range and write it to the file at the correct offset
pub async fn download_range(
    client: &reqwest::Client,
    url: &str,
    user_agent: &str,
    start: u64,
    end: u64,
    filename: &Path,
) -> Result<()> {
    let range_header = format!("bytes={}-{}", start, end);

    let mut resp = client
        .get(url)
        .header(RANGE, range_header)
        .header(USER_AGENT, user_agent)
        .send()
        .await?;

    let status = resp.status();
    if !status.is_success() {
        if status == 403 || status == 404 || status == 410 {
            anyhow::bail!("ExpiredLink");
        }
        anyhow::bail!("Segment download failed: {}", status);
    }

    let mut file = OpenOptions::new()
        .write(true)
        .create(false)
        .open(filename)
        .await?;

    file.seek(std::io::SeekFrom::Start(start)).await?;

    while let Some(chunk) = resp.chunk().await? {
        file.write_all(&chunk).await?;
    }

    file.flush().await?;

    Ok(())
}
