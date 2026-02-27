use aura_core::{
    manager::DownloadManager,
    models::{DownloadJob, DownloadTask, PauseReason, TaskStatus},
};
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
    let manager = DownloadManager::new(Some(config_path.clone())).unwrap();
    
    // Update settings to allow small segments
    let mut settings = manager.get_settings();
    settings.segments_per_file = 1; // Single segment to avoid complex Range mocking
    settings.download_dir = temp_dir.path().to_path_buf();
    manager.update_settings(settings).unwrap();
    
    // Create Job
    let expected_file = temp_dir.path().join("Test Download").join("Ep01.mp4");
    let job_url = mock_server.uri() + "/anime";
    let video_url = mock_server.uri() + "/video.mp4";
    
    let job = DownloadJob {
        id: job_url.clone(),
        name: "Test Download".to_string(),
        tasks: vec![DownloadTask {
                id: "task1".to_string(),
                url: video_url,
                filename: "Ep01.mp4".to_string(),
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
    let content = std::fs::read(expected_file).unwrap();
    assert_eq!(content.len(), 1000);
    assert_eq!(String::from_utf8(content).unwrap(), file_content);
}

#[tokio::test]
async fn test_pause_then_resume_download_flow() {
    let _ = tracing_subscriber::fmt()
        .with_env_filter("debug")
        .with_test_writer()
        .try_init();

    let mock_server = MockServer::start().await;
    let file_content = "0123456789".repeat(800_000); // 8MB
    let body: Vec<u8> = file_content.as_bytes().to_vec();

    Mock::given(method("GET"))
        .and(path("/video_pause.mp4"))
        .respond_with(
            ResponseTemplate::new(200)
                .set_delay(std::time::Duration::from_millis(500))
                .set_body_bytes(body),
        )
        .mount(&mock_server)
        .await;

    Mock::given(method("HEAD"))
        .and(path("/video_pause.mp4"))
        .respond_with(ResponseTemplate::new(200).set_body_bytes(vec![0u8; file_content.len()]))
        .mount(&mock_server)
        .await;

    let temp_dir = tempfile::tempdir().unwrap();
    let config_path = temp_dir.path().to_string_lossy().to_string();

    let manager = DownloadManager::new(Some(config_path)).unwrap();
    let mut settings = manager.get_settings();
    settings.segments_per_file = 1;
    settings.download_dir = temp_dir.path().to_path_buf();
    manager.update_settings(settings).unwrap();

    let expected_file = temp_dir
        .path()
        .join("Pause Resume Test")
        .join("EpPause.mp4");
    let job_url = mock_server.uri() + "/anime_pause";
    let task_id = "task-pause".to_string();
    let video_url = mock_server.uri() + "/video_pause.mp4";

    manager.add_job(DownloadJob {
        id: job_url.clone(),
        name: "Pause Resume Test".to_string(),
        tasks: vec![DownloadTask {
            id: task_id.clone(),
            url: video_url,
            filename: "EpPause.mp4".to_string(),
            total_bytes: 0,
            progress_bytes: 0,
            status: TaskStatus::Pending,
            segments: vec![],
            episode_url: None,
            gate_id: None,
            episode_number: Some(1),
        }],
    });

    manager.start_download(job_url.clone()).await.unwrap();
    tokio::time::sleep(std::time::Duration::from_millis(80)).await;
    manager.pause(job_url.clone(), Some(task_id.clone()));

    let mut paused = false;
    for _ in 0..60 {
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;
        let jobs = manager.get_jobs();
        let task = jobs[0].tasks.iter().find(|t| t.id == task_id).unwrap();
        if task.status == TaskStatus::Paused(PauseReason::UserRequest) {
            paused = true;
            break;
        }
    }
    assert!(paused, "task did not enter paused status");

    manager
        .resume(job_url.clone(), Some(task_id.clone()))
        .await
        .unwrap();

    let mut completed = false;
    for _ in 0..120 {
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;
        let jobs = manager.get_jobs();
        let task = jobs[0].tasks.iter().find(|t| t.id == task_id).unwrap();
        if task.status == TaskStatus::Completed {
            completed = true;
            break;
        }
    }
    assert!(completed, "task did not resume to completion");

    let content = std::fs::read(expected_file).unwrap();
    assert_eq!(content.len(), file_content.len());
    assert_eq!(String::from_utf8(content).unwrap(), file_content);
}

#[tokio::test]
async fn test_expired_link_without_metadata_pauses_task() {
    let _ = tracing_subscriber::fmt()
        .with_env_filter("debug")
        .with_test_writer()
        .try_init();

    let mock_server = MockServer::start().await;

    Mock::given(method("HEAD"))
        .and(path("/expired.mp4"))
        .respond_with(ResponseTemplate::new(403))
        .mount(&mock_server)
        .await;

    let temp_dir = tempfile::tempdir().unwrap();
    let config_path = temp_dir.path().to_string_lossy().to_string();
    let manager = DownloadManager::new(Some(config_path)).unwrap();

    let mut settings = manager.get_settings();
    settings.segments_per_file = 1;
    settings.download_dir = temp_dir.path().to_path_buf();
    manager.update_settings(settings).unwrap();

    let job_url = mock_server.uri() + "/anime_expired";
    manager.add_job(DownloadJob {
        id: job_url.clone(),
        name: "Expired Link".to_string(),
        tasks: vec![DownloadTask {
            id: "task-expired".to_string(),
            url: mock_server.uri() + "/expired.mp4",
            filename: "Ep01.mp4".to_string(),
            total_bytes: 0,
            progress_bytes: 0,
            status: TaskStatus::Pending,
            segments: vec![],
            episode_url: None,
            gate_id: None,
            episode_number: Some(1),
        }],
    });

    manager.start_download(job_url).await.unwrap();

    let mut paused = false;
    for _ in 0..30 {
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;
        let jobs = manager.get_jobs();
        let task = &jobs[0].tasks[0];
        if task.status == TaskStatus::Paused(PauseReason::LinkExpired) {
            paused = true;
            break;
        }
    }

    assert!(paused, "expected task to pause with LinkExpired");
}
