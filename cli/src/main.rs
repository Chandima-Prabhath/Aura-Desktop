use aura_core::{
    AnimeScraper, AnimeInfo, DownloadJob, DownloadManager, DownloadTask, Episode, PauseReason,
    TaskStatus,
};
use clap::{Parser, Subcommand};
use console::{Style, Term};
use dialoguer::{theme::ColorfulTheme, Input, Select};
use std::collections::HashSet;
use std::sync::Arc;


#[derive(Parser)]
#[command(name = "aura-cli")]
#[command(about = "AnimeHeaven Scraper CLI", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,

    /// Optional custom configuration directory
    #[arg(long, global = true)]
    config_dir: Option<String>,
}

#[derive(Subcommand)]
enum Commands {
    /// Search for an anime by name
    Search {
        /// The query string (e.g., "Slime")
        query: String,
        /// Enter interactive mode to select an anime and episodes
        #[arg(short, long)]
        interactive: bool,
    },
    /// Get season information and select episodes to download
    Season {
        /// The AnimeHeaven URL (e.g., https://animeheaven.me/anime.php?17c9p)
        url: String,
    },
    /// Manage Downloads (Interactive Status View)
    Manage,
    /// Resolve the direct download link for an episode
    Download {
        /// The gate.php URL of episode
        url: String,
        /// The gate_id (hash) found in the season list
        gate_id: String,
    },
    /// Get new released anime list
    New,
    /// Get popular anime list
    Popular,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();

    // Initialize components
    let manager = Arc::new(DownloadManager::new(cli.config_dir)?);
    println!("Manager initialized.");
    
    let scraper = manager.get_scraper();

    let bold = Style::new().bold();
    let dim = Style::new().dim();

    let mut should_enter_manager = false;

    match cli.command {
        Commands::Search { query, interactive } => {
            println!("Searching for: '{}'...\n", query);
            let results = scraper.search(&query).await?;

            if results.is_empty() {
                println!("No results found.");
            } else if interactive {
                let items: Vec<String> = results
                    .iter()
                    .map(|r| format!("{} - {}", r.title, dim.apply_to(&r.url)))
                    .collect();
                let mut menu_items = items.clone();
                menu_items.push("Cancel / Exit".to_string());

                let selection = Select::with_theme(&ColorfulTheme::default())
                    .with_prompt("Select an anime to view episodes")
                    .items(&menu_items)
                    .default(0)
                    .interact()?;

                if selection < results.len() {
                    let selected = &results[selection];
                    println!("\n{}: {}\n", bold.apply_to("Selected"), selected.title);

                    match scraper.get_season(&selected.url).await {
                        Ok(info) => {
                            display_anime_info(&info, &bold);
                            if handle_download_selection(&scraper, &info, &manager).await? {
                                should_enter_manager = true;
                            }
                        }
                        Err(e) => println!("Error fetching details: {}", e),
                    }
                } else {
                    println!("Cancelled.");
                }
            } else {
                for (i, res) in results.iter().enumerate() {
                    println!("{}. {}", i + 1, res.title);
                    println!("   URL: {}", res.url);
                    println!();
                }
            }
        }

        Commands::Season { url } => {
            println!("Fetching season data...\n");
            let info = scraper.get_season(&url).await?;
            display_anime_info(&info, &bold);
            if handle_download_selection(&scraper, &info, &manager).await? {
                should_enter_manager = true;
            }
        }

        Commands::Manage => {
            should_enter_manager = true;
        }

        Commands::Download { url, gate_id } => {
            let ep = Episode {
                name: "Test Download".to_string(),
                number: 0,
                url,
                gate_id,
            };

            println!("Resolving link for Episode...\n");
            let link = scraper.get_download_link(&ep).await?;

            println!("{}", bold.apply_to("SUCCESS"));
            println!("Download Link: {}", link);
            println!("\nYou can copy this URL into your browser to download the .mp4 file.");
        }

        Commands::New => {
            println!("Fetching New Releases...\n");
            let list = scraper.get_new().await?;
            for item in list {
                println!("{} - Ep {} ({})", item.title, item.latest_ep, item.time_ago);
                println!("   {}\n", item.url);
            }
        }

        Commands::Popular => {
            println!("Fetching Popular Releases...\n");
            let list = scraper.get_popular().await?;
            for item in list {
                println!(
                    "{} - Ep {} ({}) #{}",
                    item.title,
                    item.latest_ep,
                    item.time_ago,
                    item.rank.unwrap_or(0)
                );
                println!("   {}\n", item.url);
            }
        }
    }

    if should_enter_manager {
        monitor_downloads(&manager).await;
    }

    Ok(())
}

fn display_anime_info(info: &AnimeInfo, bold: &Style) {
    println!("Title: {}", bold.apply_to(&info.title));
    if let Some(jp) = &info.japanese_title {
        println!("JP Title: {}", jp);
    }
    if let Some(year) = &info.year {
        println!("Year: {}", year);
    }
    if let Some(tags) = &info.tags {
        if !tags.is_empty() {
            println!("Tags: {}", tags.join(", "));
        }
    }
    if let Some(desc) = &info.description {
        println!("\nDescription:\n{}", Style::new().dim().apply_to(textwrap::fill(desc, 80)));
    }

    println!("\nTotal Episodes: {}\n", info.episodes.len());

    println!("EPISODES LIST:");
    for ep in &info.episodes {
        println!("  Ep {:02}: {}", ep.number, ep.name);
    }
    println!();
}

async fn handle_download_selection(
    scraper: &Arc<AnimeScraper>,
    info: &AnimeInfo,
    manager: &Arc<DownloadManager>,
) -> anyhow::Result<bool> {
    let bold = Style::new().bold();
    let green = Style::new().green();

    // Use a stable ID based on the anime URL for deduplication
    let job_id = info.url.clone();
    let job_name = info.title.clone();

    let download_root = manager.settings.download_dir.clone();
    let safe_anime_name = info
        .title
        .replace(|c: char| !c.is_alphanumeric() && c != ' ' && c != '-', "_");
    let anime_folder_path = download_root.join(&safe_anime_name);

    std::fs::create_dir_all(&anime_folder_path)?;

    // Show episode status with download indicators
    println!("\nEPISODE STATUS:");
    let yellow = Style::new().yellow();
    for ep in &info.episodes {
        let is_downloaded = manager.is_episode_downloaded(&anime_folder_path, ep.number);
        let queue_status = manager.is_episode_in_queue(&job_id, ep.number);
        
        let status = if is_downloaded {
            green.apply_to("[DONE]").to_string()
        } else if let Some(task_status) = queue_status {
            match task_status {
                TaskStatus::Pending => yellow.apply_to("[PEND]").to_string(),
                TaskStatus::Downloading => yellow.apply_to("[DOWN]").to_string(),
                TaskStatus::Paused(_) => yellow.apply_to("[PAUS]").to_string(),
                TaskStatus::Error(_) => Style::new().red().apply_to("[ERR ]").to_string(),
                TaskStatus::Completed => green.apply_to("[DONE]").to_string(),
            }
        } else {
            "[    ]".to_string()
        };
        println!("  {} Ep {:02}: {}", status, ep.number, ep.name);
    }
    println!();

    let input: String = Input::with_theme(&ColorfulTheme::default())
        .with_prompt("Enter episodes to download (e.g. '1-4, 6') - already downloaded will be skipped")
        .allow_empty(true)
        .interact()?;

    if input.trim().is_empty() {
        return Ok(false);
    }

    let selected_numbers = parse_episode_range(&input);
    if selected_numbers.is_empty() {
        return Ok(false);
    }

    println!("\nFetching links and adding to queue...\n");
    println!("Target directory: {}", anime_folder_path.display());

    let mut tasks = Vec::new();
    let mut skipped = 0;

    for ep in &info.episodes {
        if selected_numbers.contains(&ep.number) {
            // Skip already downloaded
            if manager.is_episode_downloaded(&anime_folder_path, ep.number) {
                println!("  [SKIP] Ep {:02} already downloaded.", ep.number);
                skipped += 1;
                continue;
            }

            let filename_full = anime_folder_path.join(format!("Ep{:02}.mp4", ep.number));
            let filename_str = filename_full.to_string_lossy().to_string();

            println!("Fetching link for Ep {:02}...", ep.number);

            if ep.gate_id.is_empty() {
                println!("  [WARN] Gate ID is empty for Ep {}, skipping.", ep.number);
                continue;
            }

            match scraper.get_download_link(ep).await {
                Ok(link) => {
                    println!("  [OK] Link fetched for Ep {:02}.", ep.number);

                    let task_id = format!("{}-ep{}", job_id, ep.number);

                    tasks.push(DownloadTask {
                        id: task_id,
                        url: link,
                        filename: filename_str,
                        status: TaskStatus::Pending,
                        progress_bytes: 0,
                        total_bytes: 0,
                        episode_url: Some(ep.url.clone()),
                        gate_id: Some(ep.gate_id.clone()),
                        episode_number: Some(ep.number),
                        segments: vec![],
                    });
                }
                Err(e) => {
                    println!("  [ERR] Failed to fetch link for Ep {}: {}", ep.number, e);
                }
            }
        }
    }

    if !tasks.is_empty() {
        let count = tasks.len();
        let job = DownloadJob {
            id: job_id.clone(),
            name: job_name,
            tasks,
        };
        manager.add_job(job);
        manager.start_download(job_id).await?;

        let msg = if skipped > 0 {
            format!("Added {} episodes to queue ({} already downloaded).", count, skipped)
        } else {
            format!("Added {} episodes to download queue.", count)
        };
        println!("\n{}", bold.apply_to(msg));
        return Ok(true);
    } else if skipped > 0 {
        println!("\nAll selected episodes are already downloaded!");
    }

    Ok(false)
}

async fn monitor_downloads(manager: &Arc<DownloadManager>) {
    let bold = Style::new().bold();
    let term = Term::stdout();

    loop {
        let _ = term.clear_screen();
        println!("--- Download Manager ---");
        println!("[Watching... Press Ctrl+C to exit]\n");

        let jobs = manager.get_jobs();

        for job in &jobs {
            println!("Job: {}", bold.apply_to(&job.name));
            for task in &job.tasks {
                let status_sym = match &task.status {
                    TaskStatus::Pending => "[WAIT]",
                    TaskStatus::Downloading => "[DOWN]",
                    TaskStatus::Paused(reason) => match reason {
                        PauseReason::UserRequest => "[PAUS]",
                        PauseReason::LinkExpired => "[EXPR]",
                        PauseReason::NetworkError => "[NETE]",
                        PauseReason::Unknown => "[PAUS]",
                    },
                    TaskStatus::Completed => "[DONE]",
                    TaskStatus::Error(_) => "[ERR ]",
                };

                let bytes_on_disk = std::fs::metadata(&task.filename)
                    .map(|m| m.len())
                    .unwrap_or(task.progress_bytes);

                let progress = if task.total_bytes > 0 {
                    format!("{}%", (bytes_on_disk * 100 / task.total_bytes))
                } else {
                    "?%".to_string()
                };

                let display_name = std::path::Path::new(&task.filename)
                    .file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_else(|| task.filename.clone());

                println!(
                    "  {} {} - {} - {} MB",
                    status_sym,
                    display_name,
                    progress,
                    bytes_on_disk / (1024 * 1024)
                );

                if let TaskStatus::Paused(PauseReason::LinkExpired) = &task.status {
                    println!("    ^ Link expired after max refresh attempts");
                }
                if let TaskStatus::Error(ref err_msg) = task.status {
                    println!("    ^ Error: {}", err_msg);
                }
            }
            println!();
        }

        if jobs.is_empty() {
            println!("No active jobs. Add episodes using 'search' or 'season'.");
        }

        tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
    }
}

fn parse_episode_range(input: &str) -> HashSet<u32> {
    let mut selection = HashSet::new();

    for part in input.split(',') {
        let part = part.trim();
        if part.is_empty() {
            continue;
        }

        if part.contains('-') {
            let range_parts: Vec<&str> = part.split('-').collect();
            if range_parts.len() == 2 {
                if let (Ok(start), Ok(end)) = (
                    range_parts[0].trim().parse::<u32>(),
                    range_parts[1].trim().parse::<u32>(),
                ) {
                    for i in start..=end {
                        selection.insert(i);
                    }
                }
            }
        } else if let Ok(num) = part.parse::<u32>() {
            selection.insert(num);
        }
    }
    selection
}