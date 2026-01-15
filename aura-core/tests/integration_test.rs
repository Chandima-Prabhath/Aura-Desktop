use aura_core::{
    manager::DownloadManager,
    models::{DownloadJob, DownloadTask, TaskStatus},
    Settings,
};
use std::sync::Arc;
use tokio::sync::Mutex;
use wiremock::matchers::{method, path};
use wiremock::{Mock, MockServer, ResponseTemplate};

#[tokio::test]
async fn test_job_persistence() {
    let temp_dir = tempfile::tempdir().unwrap();
    let config_path = temp_dir.path().to_string_lossy().to_string();

    // 1. Create manager and add a job
    {
        let manager = DownloadManager::new(Some(config_path.clone())).unwrap();
        let job = DownloadJob {
            id: "http://example.com/anime".to_string(),
            name: "Test Anime".to_string(),
            tasks: vec![DownloadTask {
                id: "task1".to_string(),
                episode_number: Some(1),
                url: "http://example.com/video.mp4".to_string(),
                filename: temp_dir.path().join("Ep01.mp4").to_string_lossy().to_string(),
                total_bytes: 1000,
                progress_bytes: 0,
                status: TaskStatus::Pending,
                segments: vec![],
                episode_url: None,
                gate_id: None,
            }],
        };
        manager.add_job(job);
    } // manager dropped here

    // 2. Create new manager and verify job exists
    {
        let manager = DownloadManager::new(Some(config_path)).unwrap();
        let jobs = manager.get_jobs();
        assert_eq!(jobs.len(), 1);
        assert_eq!(jobs[0].name, "Test Anime");
        assert_eq!(jobs[0].tasks[0].status, TaskStatus::Pending);
    }
}

#[tokio::test]
async fn test_download_flow() {
    // Initialize logging for debugging (ignores error if already init)
    let _ = tracing_subscriber::fmt()
        .with_env_filter("debug")
        .with_test_writer()
        .try_init();

    // Setup Mock Server
    let mock_server = MockServer::start().await;
    let file_content = "0123456789".repeat(100); // 1000 bytes
    let body: Vec<u8> = file_content.as_bytes().to_vec();

    Mock::given(method("GET"))
        .and(path("/video.mp4"))
        .respond_with(ResponseTemplate::new(200).set_body_bytes(body))
        .mount(&mock_server)
        .await;

    Mock::given(method("HEAD"))
        .and(path("/video.mp4"))
        .respond_with(ResponseTemplate::new(200).set_body_bytes(vec![0u8; 1000]))
        .mount(&mock_server)
        .await;

    // Config
    let temp_dir = tempfile::tempdir().unwrap();
    let config_path = temp_dir.path().to_string_lossy().to_string();
    
    // Create Manager with settings pointing to mock server
    let mut manager = DownloadManager::new(Some(config_path.clone())).unwrap();
    
    // Update settings to allow small segments
    let mut settings = manager.get_settings();
    settings.segments_per_file = 1; // Single segment to avoid complex Range mocking
    manager.update_settings(settings).unwrap();
    
    // Create Job
    let download_file = temp_dir.path().join("Ep01.mp4");
    let job_url = mock_server.uri() + "/anime";
    let video_url = mock_server.uri() + "/video.mp4";
    
    let job = DownloadJob {
        id: job_url.clone(),
        name: "Test Download".to_string(),
        tasks: vec![DownloadTask {
                id: "task1".to_string(),
                url: video_url,
                filename: download_file.to_string_lossy().to_string(),
                total_bytes: 0, 
                progress_bytes: 0,
                status: TaskStatus::Pending,
                segments: vec![],
                episode_url: None,
                gate_id: None,
                episode_number: Some(1),
        }],
    };
    
    manager.add_job(job.clone());
    
    // Start Download
    manager.start_download(job_url).await.unwrap();
    
    // Poll for completion (max 5 seconds)
    for _ in 0..50 {
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;
        // Reload jobs to check status
        let jobs = manager.get_jobs(); // manager needs to reload? get_jobs locks and returns memory state
        let task = &jobs[0].tasks[0];
        
        if task.status == TaskStatus::Completed {
            break;
        }
    }
    
    let jobs = manager.get_jobs();
    assert_eq!(jobs[0].tasks[0].status, TaskStatus::Completed);
    
    // Verify file content
    let content = std::fs::read(download_file).unwrap();
    assert_eq!(content.len(), 1000);
    assert_eq!(String::from_utf8(content).unwrap(), file_content);
}
