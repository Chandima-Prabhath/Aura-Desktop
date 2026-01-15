use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Settings {
    pub download_dir: PathBuf,
    pub max_concurrent_downloads: usize,
    pub segments_per_file: usize,
    pub user_agent: String,
}

impl Default for Settings {
    fn default() -> Self {
        let download_dir = if cfg!(target_os = "android") {
            PathBuf::from("/storage/emulated/0/Download")
        } else {
            dirs::download_dir().unwrap_or_else(|| PathBuf::from("."))
        };

        Self {
            download_dir,
            max_concurrent_downloads: 3,
            segments_per_file: 4,
            user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Aura/1.0".to_string(),
        }
    }
}

impl Settings {
    pub fn load(custom_path: Option<&std::path::Path>) -> anyhow::Result<Self> {
        let config_dir = if let Some(path) = custom_path {
            path.to_path_buf()
        } else {
             dirs::config_dir()
                .ok_or_else(|| anyhow::anyhow!("Could not find config directory"))?
                .join("aura")
        };

        std::fs::create_dir_all(&config_dir)?;

        let config_file = config_dir.join("settings.toml");
        println!("[Aura] Loading settings from: {:?}", config_file);

        if config_file.exists() {
            let contents = std::fs::read_to_string(&config_file)?;
            let settings: Settings = toml::from_str(&contents)?;
            Ok(settings)
        } else {
            let settings = Settings::default();
            settings.save(Some(&config_dir))?;
            Ok(settings)
        }
    }

    pub fn save(&self, custom_path: Option<&std::path::Path>) -> anyhow::Result<()> {
        let config_dir = if let Some(path) = custom_path {
             path.to_path_buf()
        } else {
             dirs::config_dir()
                .ok_or_else(|| anyhow::anyhow!("Could not find config directory"))?
                .join("aura")
        };
        
        // Ensure directory exists
        std::fs::create_dir_all(&config_dir)?;

        let config_file = config_dir.join("settings.toml");
        println!("[Aura] Saving settings to: {:?}", config_file);
        
        let toml_string = toml::to_string_pretty(self)?;
        std::fs::write(&config_file, toml_string)?;
        Ok(())
    }
}
