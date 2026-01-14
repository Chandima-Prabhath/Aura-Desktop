use crate::config::Settings;
use crate::downloader::get_content_length;
use crate::models::{
    DownloadJob, Episode, PauseReason, Segment, SegmentStatus, TaskStatus,
};
use crate::scraper::AnimeScraper;
use anyhow::{anyhow, Result};
use std::fs;
use std::sync::{atomic::{AtomicU64, Ordering}, Arc, Mutex, RwLock};
use std::time::Duration;
use tokio::sync::Semaphore;

const MAX_LINK_REFRESH_ATTEMPTS: u32 = 3;

pub struct DownloadManager {
    pub settings: Arc<RwLock<Settings>>,
    jobs: Arc<Mutex<Vec<DownloadJob>>>,
    semaphore: Arc<Semaphore>,
    jobs_path: String,
    scraper: Arc<AnimeScraper>,
}

impl DownloadManager {
    pub fn new(custom_config_path: Option<String>) -> Result<Self> {
        let config_dir = if let Some(path) = custom_config_path {
            std::path::PathBuf::from(path)
        } else {
            dirs::config_dir()
                .ok_or_else(|| anyhow!("Could not find config directory"))?
                .join("aura")
        };

        fs::create_dir_all(&config_dir)?;

        let settings = Settings::load(Some(&config_dir))?;
        let max_concurrent = settings.max_concurrent_downloads;
        let semaphore = Arc::new(Semaphore::new(max_concurrent));
        let scraper = Arc::new(AnimeScraper::new());

        let jobs_path = config_dir.join("jobs.json").to_string_lossy().to_string();

        let mut jobs: Vec<DownloadJob> = if fs::metadata(&jobs_path).is_ok() {
            let data = fs::read_to_string(&jobs_path)?;
            serde_json::from_str(&data).unwrap_or_default()
        } else {
            vec![]
        };

        // Reset any "Downloading" tasks to "Pending" (app was killed mid-download)
        for job in &mut jobs {
            for task in &mut job.tasks {
                if task.status == TaskStatus::Downloading {
                    task.status = TaskStatus::Pending;
                    // Also reset any downloading segments
                    for seg in &mut task.segments {
                        if seg.status == SegmentStatus::Downloading {
                            seg.status = SegmentStatus::Pending;
                        }
                    }
                }
            }
        }

        Ok(Self {
            settings: Arc::new(RwLock::new(settings)),
            jobs: Arc::new(Mutex::new(jobs)),
            semaphore,
            jobs_path,
            scraper,
        })
    }

    pub fn get_scraper(&self) -> Arc<AnimeScraper> {
        self.scraper.clone()
    }

    pub fn get_jobs(&self) -> Vec<DownloadJob> {
        self.jobs.lock().unwrap().clone()
    }

    /// Get current settings
    pub fn get_settings(&self) -> Settings {
        self.settings.read().unwrap().clone()
    }

    /// Update settings and persist to disk
    pub fn update_settings(&self, new_settings: Settings) -> Result<()> {
        let config_dir = std::path::Path::new(&self.jobs_path).parent();
        new_settings.save(config_dir)?;
        
        let mut settings_guard = self.settings.write().unwrap();
        *settings_guard = new_settings.clone();
        
        // Update semaphore with new concurrency limit? 
        // Note: Replacing the semaphore in Arc is tricky if other threads hold refs to old semaphore.
        // However, since we store Arc<Semaphore> in struct, and workers clone it, 
        // only NEW tasks will use the new semaphore if we replace it here?
        // Actually, DownloadManager struct is immutable (via Arc). 
        // We cannot update `self.semaphore` if `self` is `&self`.
        // We would need to wrap `semaphore` in RwLock or Mutex too if we want to change it dynamically.
        // For now, let's accept that concurrency limit changes require restart, OR wrap semaphore.
        // Given complexity, let's just update settings on disk/memory. App restart might be needed for concurrency change.
        
        Ok(())
    }

    /// Smart add_job: merges with existing job if same ID, updates URLs for incomplete tasks
    pub fn add_job(&self, job: DownloadJob) {
        let mut jobs = self.jobs.lock().unwrap();
        
        if let Some(existing_job) = jobs.iter_mut().find(|j| j.id == job.id) {
            // Merge tasks into existing job
            for new_task in job.tasks {
                // Check if this episode already exists
                let existing_task = existing_job.tasks.iter_mut().find(|t| {
                    t.episode_number == new_task.episode_number && new_task.episode_number.is_some()
                });
                
                if let Some(existing) = existing_task {
                    // Episode exists - check if we need to update it
                    match existing.status {
                        TaskStatus::Completed => {
                            // Already done, skip
                            continue;
                        }
                        TaskStatus::Paused(_) | TaskStatus::Error(_) | TaskStatus::Pending => {
                            // Update URL with fresh link
                            existing.url = new_task.url;
                            existing.episode_url = new_task.episode_url;
                            existing.gate_id = new_task.gate_id;
                            existing.status = TaskStatus::Pending;
                            // Reset segments if they were errored
                            for seg in &mut existing.segments {
                                if seg.status == SegmentStatus::Error {
                                    seg.status = SegmentStatus::Pending;
                                }
                            }
                        }
                        TaskStatus::Downloading => {
                            // Currently downloading, leave it alone
                            continue;
                        }
                    }
                } else {
                    // New episode, add to job
                    existing_job.tasks.push(new_task);
                }
            }
        } else {
            // New job, add it
            jobs.push(job);
        }
        
        drop(jobs);
        self.save_jobs();
    }

    /// Check if an episode file already exists on disk (completed download)
    /// Completed files are named `Ep01.mp4`, in-progress files are `Ep01.downloading.mp4`
    pub fn is_episode_downloaded(&self, anime_folder: &std::path::Path, episode_number: u32) -> bool {
        let filename = format!("Ep{:02}.mp4", episode_number);
        let filepath = anime_folder.join(&filename);
        
        // File exists and is NOT a .downloading file means it's complete
        filepath.exists()
    }

    /// Check if an episode is already in the download queue (pending/downloading)
    pub fn is_episode_in_queue(&self, job_id: &str, episode_number: u32) -> Option<TaskStatus> {
        let jobs = self.jobs.lock().unwrap();
        if let Some(job) = jobs.iter().find(|j| j.id == job_id) {
            if let Some(task) = job.tasks.iter().find(|t| t.episode_number == Some(episode_number)) {
                return Some(task.status.clone());
            }
        }
        None
    }

    /// Clear all completed jobs
    pub fn clear_completed_jobs(&self) {
        let mut jobs = self.jobs.lock().unwrap();
        jobs.retain(|job| {
            !job.tasks.iter().all(|t| t.status == TaskStatus::Completed)
        });
        drop(jobs);
        self.save_jobs();
    }

    /// Remove a specific job
    pub fn remove_job(&self, job_id: &str) {
        let mut jobs = self.jobs.lock().unwrap();
        jobs.retain(|j| j.id != job_id);
        drop(jobs);
        self.save_jobs();
    }

    /// Start downloading all tasks in a job
    pub async fn start_download(&self, job_id: String) -> Result<()> {
        // Get list of task IDs to download
        let task_ids: Vec<String> = {
            let jobs = self.jobs.lock().unwrap();
            let job = jobs
                .iter()
                .find(|j| j.id == job_id)
                .ok_or(anyhow!("Job not found"))?;
            job.tasks.iter().map(|t| t.id.clone()).collect()
        };

        // Spawn a worker for each task
        for task_id in task_ids {
            let jobs_ref = self.jobs.clone();
            let semaphore_ref = self.semaphore.clone();
            let settings_ref = self.settings.clone();
            let scraper_ref = self.scraper.clone();
            let job_id_clone = job_id.clone();
            let jobs_path = self.jobs_path.clone();

            tokio::spawn(async move {
                if let Err(e) = download_task_worker(
                    jobs_ref,
                    job_id_clone,
                    task_id,
                    settings_ref,
                    semaphore_ref,
                    scraper_ref,
                    jobs_path,
                )
                .await
                {
                    tracing::error!("Download failed: {}", e);
                }
            });
        }

        Ok(())
    }

    pub async fn resume(&self, job_id: String, task_id: Option<String>) -> Result<()> {
        {
            let mut jobs = self.jobs.lock().unwrap();
            let job = jobs
                .iter_mut()
                .find(|j| j.id == job_id)
                .ok_or(anyhow!("Job not found"))?;

            for task in &mut job.tasks {
                if task_id.is_none() || task_id.as_ref() == Some(&task.id) {
                    match task.status {
                        TaskStatus::Paused(_) | TaskStatus::Error(_) => {
                            task.status = TaskStatus::Pending;
                            for seg in &mut task.segments {
                                if seg.status == SegmentStatus::Error {
                                    seg.status = SegmentStatus::Pending;
                                }
                            }
                        }
                        _ => {}
                    }
                }
            }
        }
        self.save_jobs();

        self.start_download(job_id).await?;
        Ok(())
    }

    pub fn pause(&self, job_id: String, task_id: Option<String>) {
        let mut jobs = self.jobs.lock().unwrap();
        if let Some(job) = jobs.iter_mut().find(|j| j.id == job_id) {
            for task in &mut job.tasks {
                if task_id.is_none() || task_id.as_ref() == Some(&task.id) {
                    task.status = TaskStatus::Paused(PauseReason::UserRequest);
                }
            }
        }
        drop(jobs);
        self.save_jobs();
    }

    fn save_jobs(&self) {
        let jobs = self.jobs.lock().unwrap();
        if let Ok(data) = serde_json::to_string_pretty(&*jobs) {
            let _ = fs::write(&self.jobs_path, data);
        }
    }
}

/// Worker function that downloads a single task using folder-based parts
async fn download_task_worker(
    jobs: Arc<Mutex<Vec<DownloadJob>>>,
    job_id: String,
    task_id: String,
    settings_store: Arc<RwLock<Settings>>,
    semaphore: Arc<Semaphore>,
    scraper: Arc<AnimeScraper>,
    jobs_path: String,
) -> Result<()> {
    // Helper to save jobs
    let save_jobs = |jobs: &Arc<Mutex<Vec<DownloadJob>>>| {
        let jobs_lock = jobs.lock().unwrap();
        if let Ok(data) = serde_json::to_string_pretty(&*jobs_lock) {
            let _ = fs::write(&jobs_path, data);
        }
    };

    // Get task info
    let (mut url, filename, episode_url, gate_id) = {
        let jobs_lock = jobs.lock().unwrap();
        let job = jobs_lock
            .iter()
            .find(|j| j.id == job_id)
            .ok_or(anyhow!("Job not found"))?;
        let task = job
            .tasks
            .iter()
            .find(|t| t.id == task_id)
            .ok_or(anyhow!("Task not found"))?;

        // Skip if already completed or not pending
        match task.status {
            TaskStatus::Completed => return Ok(()),
            TaskStatus::Downloading => return Ok(()), // Already being downloaded
            TaskStatus::Paused(_) | TaskStatus::Error(_) => return Ok(()),
            TaskStatus::Pending => {} // Continue
        }

        (
            task.url.clone(),
            task.filename.clone(),
            task.episode_url.clone(),
            task.gate_id.clone(),
        )
    };

    // Acquire semaphore permit to limit concurrency
    // This will wait here until a slot is available
    let _permit = semaphore.acquire().await.map_err(|e| anyhow::anyhow!("Semaphore closed: {}", e))?;

    // Setup paths
    let final_path = std::path::PathBuf::from(&filename);
    let file_stem = final_path.file_stem().unwrap_or_default().to_string_lossy();
    let parts_folder_name = format!("{}.downloading", file_stem);
    let parts_folder = final_path.parent()
        .map(|p| p.join(&parts_folder_name))
        .unwrap_or_else(|| std::path::PathBuf::from(&parts_folder_name));

    // Mark as downloading
    {
        let mut jobs_lock = jobs.lock().unwrap();
        if let Some(job) = jobs_lock.iter_mut().find(|j| j.id == job_id) {
            if let Some(task) = job.tasks.iter_mut().find(|t| t.id == task_id) {
                task.status = TaskStatus::Downloading;
            }
        }
    }
    save_jobs(&jobs);

    // Create parts folder
    if let Some(parent) = final_path.parent() {
        tokio::fs::create_dir_all(parent).await?;
    }
    tokio::fs::create_dir_all(&parts_folder).await?;

    // Get total size and initialize segments
    let client = reqwest::Client::new();
    let current_settings = settings_store.read().unwrap().clone();
    let total_size = match get_content_length(&client, &url, &current_settings.user_agent).await {
        Ok(size) => {
            let mut jobs_guard = jobs.lock().unwrap();
            if let Some(job) = jobs_guard.iter_mut().find(|j| j.id == job_id) {
                if let Some(task) = job.tasks.iter_mut().find(|t| t.id == task_id) {
                    task.total_bytes = size;
                    if task.segments.is_empty() {
                        task.segments = create_segments(size, current_settings.segments_per_file);
                    }
                }
            }
            drop(jobs_guard);
            save_jobs(&jobs);
            size
        }
        Err(e) => {
            let mut jobs_guard = jobs.lock().unwrap();
            if let Some(job) = jobs_guard.iter_mut().find(|j| j.id == job_id) {
                if let Some(task) = job.tasks.iter_mut().find(|t| t.id == task_id) {
                    task.status = TaskStatus::Error(e.to_string());
                }
            }
            drop(jobs_guard);
            save_jobs(&jobs);
            return Err(e);
        }
    };

    let num_parts = current_settings.segments_per_file;
    let mut link_refresh_attempts = 0u32;

    // Check which parts already exist (for resume)
    for i in 0..num_parts {
        let part_path = parts_folder.join(format!("part{}.mp4", i));
        if part_path.exists() {
            // Check if part file is complete (expected size)
            let segment_size = total_size / num_parts as u64;
            let expected_size = if i == num_parts - 1 {
                total_size - (i as u64 * segment_size)
            } else {
                segment_size
            };
            
            if let Ok(meta) = tokio::fs::metadata(&part_path).await {
                if meta.len() >= expected_size {
                    // Mark segment as completed
                    let mut jobs_guard = jobs.lock().unwrap();
                    if let Some(job) = jobs_guard.iter_mut().find(|j| j.id == job_id) {
                        if let Some(task) = job.tasks.iter_mut().find(|t| t.id == task_id) {
                            if let Some(seg) = task.segments.iter_mut().find(|s| s.index == i) {
                                seg.status = SegmentStatus::Completed;
                                seg.downloaded = expected_size;
                            }
                        }
                    }
                }
            }
        }
    }
    save_jobs(&jobs);

    // Track progress of current segment
    let current_segment_progress = Arc::new(AtomicU64::new(0));

    // Spawn a background task to update global progress
    let jobs_ref_ticker = jobs.clone();
    let job_id_ticker = job_id.clone();
    let task_id_ticker = task_id.clone();
    let progress_ticker = current_segment_progress.clone();
    
    let ticker_handle = tokio::spawn(async move {
        loop {
            tokio::time::sleep(Duration::from_millis(2000)).await;
            
            let current_inc = progress_ticker.load(Ordering::Relaxed);
            
            let mut jobs_guard = jobs_ref_ticker.lock().unwrap();
            if let Some(job) = jobs_guard.iter_mut().find(|j| j.id == job_id_ticker) {
                if let Some(task) = job.tasks.iter_mut().find(|t| t.id == task_id_ticker) {
                    // Check if task is still active
                    match task.status {
                        TaskStatus::Downloading => {
                            // Calculate total progress: completed_segments + current_part
                            let completed_sum: u64 = task.segments.iter()
                                .filter(|s| s.status == SegmentStatus::Completed)
                                .map(|s| s.downloaded)
                                .sum();
                            task.progress_bytes = completed_sum + current_inc;
                        }
                        _ => break, // Exit if paused/error/completed
                    }
                } else { break; }
            } else { break; }
            drop(jobs_guard);
        }
    });

    // Download loop
    loop {
        // Check if paused or cancelled
        {
            let jobs_guard = jobs.lock().unwrap();
            if let Some(job) = jobs_guard.iter().find(|j| j.id == job_id) {
                if let Some(task) = job.tasks.iter().find(|t| t.id == task_id) {
                    match task.status {
                        TaskStatus::Paused(_) | TaskStatus::Error(_) => {
                             ticker_handle.abort();
                             return Ok(());
                        }
                        TaskStatus::Completed => {
                            ticker_handle.abort();
                            return Ok(());
                        }
                        _ => {}
                    }
                }
            } else {
                ticker_handle.abort();
                return Ok(());
            }
        }

        // Find next pending segment
        let next_segment = {
            let mut jobs_guard = jobs.lock().unwrap();
            let job = match jobs_guard.iter_mut().find(|j| j.id == job_id) {
                Some(j) => j,
                None => {
                    ticker_handle.abort();
                    return Ok(());
                }
            };
            let task = match job.tasks.iter_mut().find(|t| t.id == task_id) {
                Some(t) => t,
                None => {
                    ticker_handle.abort();
                    return Ok(());
                }
            };

            task.segments
                .iter_mut()
                .find(|s| s.status == SegmentStatus::Pending)
                .map(|s| {
                    s.status = SegmentStatus::Downloading;
                    s.clone()
                })
        };

        if let Some(segment) = next_segment {
            let part_path = parts_folder.join(format!("part{}.mp4", segment.index));
            
            // Reset progress for this segment
            current_segment_progress.store(0, Ordering::Relaxed);

            // Download this part to its own file
            let result = download_part_to_file(
                &client,
                &url,
                &current_settings.user_agent,
                segment.start,
                segment.end,
                &part_path,
                current_segment_progress.clone(),
            )
            .await;

            match result {
                Ok(_) => {
                    let mut jobs_guard = jobs.lock().unwrap();
                    if let Some(job) = jobs_guard.iter_mut().find(|j| j.id == job_id) {
                        if let Some(task) = job.tasks.iter_mut().find(|t| t.id == task_id) {
                            if let Some(seg) =
                                task.segments.iter_mut().find(|s| s.index == segment.index)
                            {
                                seg.status = SegmentStatus::Completed;
                                seg.downloaded = segment.end - segment.start + 1;
                                task.progress_bytes = task
                                    .segments
                                    .iter()
                                    .filter(|s| s.status == SegmentStatus::Completed)
                                    .map(|s| s.end - s.start + 1)
                                    .sum();
                            }
                        }
                    }
                    drop(jobs_guard);
                    save_jobs(&jobs);
                    link_refresh_attempts = 0;
                }
                Err(e) => {
                    let err = e.to_string();
                    // Delete partial part file
                    let _ = tokio::fs::remove_file(&part_path).await;
                    
                    if err.contains("ExpiredLink") {
                        // Reset segment
                        {
                            let mut jobs_guard = jobs.lock().unwrap();
                            if let Some(job) = jobs_guard.iter_mut().find(|j| j.id == job_id) {
                                if let Some(task) =
                                    job.tasks.iter_mut().find(|t| t.id == task_id)
                                {
                                    if let Some(seg) = task
                                        .segments
                                        .iter_mut()
                                        .find(|s| s.index == segment.index)
                                    {
                                        seg.status = SegmentStatus::Pending;
                                    }
                                }
                            }
                        }


                        // Try to refresh link
                        if link_refresh_attempts < MAX_LINK_REFRESH_ATTEMPTS {
                            link_refresh_attempts += 1;
                            tracing::info!(
                                "Link expired, attempting refresh ({}/{})",
                                link_refresh_attempts, MAX_LINK_REFRESH_ATTEMPTS
                            );

                            if let (Some(ep_url), Some(g_id)) = (&episode_url, &gate_id) {
                                let episode = Episode {
                                    name: "Refresh".to_string(),
                                    number: 0,
                                    url: ep_url.clone(),
                                    gate_id: g_id.clone(),
                                };

                                match scraper.get_download_link(&episode).await {
                                    Ok(new_url) => {
                                        url = new_url.clone();
                                        let mut jobs_guard = jobs.lock().unwrap();
                                        if let Some(job) =
                                            jobs_guard.iter_mut().find(|j| j.id == job_id)
                                        {
                                            if let Some(task) =
                                                job.tasks.iter_mut().find(|t| t.id == task_id)
                                            {
                                                task.url = new_url;
                                            }
                                        }
                                        drop(jobs_guard);
                                        save_jobs(&jobs);
                                        tracing::info!("Link refreshed successfully");
                                        continue;
                                    }
                                    Err(refresh_err) => {
                                        tracing::error!("Failed to refresh: {}", refresh_err);
                                    }
                                }
                            }
                        }

                        // Max attempts or refresh failed - pause
                        let mut jobs_guard = jobs.lock().unwrap();
                        if let Some(job) = jobs_guard.iter_mut().find(|j| j.id == job_id) {
                            if let Some(task) = job.tasks.iter_mut().find(|t| t.id == task_id) {
                                task.status = TaskStatus::Paused(PauseReason::LinkExpired);
                            }
                        }
                        drop(jobs_guard);
                        save_jobs(&jobs);
                        return Ok(());
                    } else {
                        // Other error - reset segment for retry
                        let mut jobs_guard = jobs.lock().unwrap();
                        if let Some(job) = jobs_guard.iter_mut().find(|j| j.id == job_id) {
                            if let Some(task) = job.tasks.iter_mut().find(|t| t.id == task_id) {
                                if let Some(seg) =
                                    task.segments.iter_mut().find(|s| s.index == segment.index)
                                {
                                    seg.status = SegmentStatus::Pending;
                                }
                            }
                        }
                        drop(jobs_guard);
                        save_jobs(&jobs);
                    }
                }
            }
        } else {
            // No pending segments - check if all completed
            let all_done = {
                let jobs_guard = jobs.lock().unwrap();
                jobs_guard
                    .iter()
                    .find(|j| j.id == job_id)
                    .and_then(|j| j.tasks.iter().find(|t| t.id == task_id))
                    .map(|t| t.segments.iter().all(|s| s.status == SegmentStatus::Completed))
                    .unwrap_or(false)
            };

            if all_done {
                if let Err(e) = combine_parts(&parts_folder, &final_path, num_parts).await {
                    tracing::error!("Failed to combine parts: {}", e);
                }
                
                // Remove parts folder
                let _ = tokio::fs::remove_dir_all(&parts_folder).await;
                
                let mut jobs_guard = jobs.lock().unwrap();
                if let Some(job) = jobs_guard.iter_mut().find(|j| j.id == job_id) {
                    if let Some(task) = job.tasks.iter_mut().find(|t| t.id == task_id) {
                        task.status = TaskStatus::Completed;
                    }
                }
                drop(jobs_guard);
                save_jobs(&jobs);
                break;
            }

            tokio::time::sleep(Duration::from_millis(100)).await;
        }
    }

    Ok(())
}

/// Download a range to a separate file (not seeking within existing file)
async fn download_part_to_file(
    client: &reqwest::Client,
    url: &str,
    user_agent: &str,
    start: u64,
    end: u64,
    filepath: &std::path::Path,
    current_progress: Arc<AtomicU64>,
) -> Result<()> {
    use tokio::io::AsyncWriteExt;
    
    let range_header = format!("bytes={}-{}", start, end);

    let mut resp = client
        .get(url)
        .header(reqwest::header::RANGE, range_header)
        .header(reqwest::header::USER_AGENT, user_agent)
        .send()
        .await?;

    let status = resp.status();
    if !status.is_success() {
        if status == reqwest::StatusCode::FORBIDDEN 
            || status == reqwest::StatusCode::NOT_FOUND 
            || status == reqwest::StatusCode::GONE {
            anyhow::bail!("ExpiredLink");
        }
        anyhow::bail!("Download failed: {}", status);
    }

    let mut file = tokio::fs::File::create(filepath).await?;
    let mut accumulated_progress = 0u64;
    // Batch updates to reduce atomic contention (update every ~512KB)
    const PROGRESS_UPDATE_THRESHOLD: u64 = 512 * 1024; 

    while let Some(chunk) = resp.chunk().await? {
        file.write_all(&chunk).await?;
        accumulated_progress += chunk.len() as u64;
        
        if accumulated_progress >= PROGRESS_UPDATE_THRESHOLD {
            current_progress.fetch_add(accumulated_progress, Ordering::Relaxed);
            accumulated_progress = 0;
        }
    }
    // Flush remaining progress
    if accumulated_progress > 0 {
        current_progress.fetch_add(accumulated_progress, Ordering::Relaxed);
    }
    file.flush().await?;

    Ok(())
}

/// Combine all part files into final file
async fn combine_parts(
    parts_folder: &std::path::Path,
    final_path: &std::path::Path,
    num_parts: usize,
) -> Result<()> {
    use tokio::io::{AsyncReadExt, AsyncWriteExt};
    
    let mut final_file = tokio::fs::File::create(final_path).await?;
    
    for i in 0..num_parts {
        let part_path = parts_folder.join(format!("part{}.mp4", i));
        if part_path.exists() {
            let mut part_file = tokio::fs::File::open(&part_path).await?;
            let mut buffer = vec![0u8; 1024 * 1024]; // 1MB buffer
            
            loop {
                let n = part_file.read(&mut buffer).await?;
                if n == 0 {
                    break;
                }
                final_file.write_all(&buffer[..n]).await?;
            }
        }
    }
    
    final_file.flush().await?;
    Ok(())
}

fn create_segments(total_size: u64, count: usize) -> Vec<Segment> {
    let mut segments = Vec::new();
    let segment_size = total_size / count as u64;

    for i in 0..count {
        let start = i as u64 * segment_size;
        let end = if i == count - 1 {
            total_size - 1
        } else {
            start + segment_size - 1
        };

        segments.push(Segment {
            index: i,
            start,
            end,
            downloaded: 0,
            status: SegmentStatus::Pending,
        });
    }
    segments
}

