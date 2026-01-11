use std::fs;
use std::path::Path;
use std::sync::{Arc, Mutex};

use tauri::Manager;
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::{CommandEvent, CommandChild};

// Your existing I18n-related types and commands...
#[derive(serde::Serialize, serde::Deserialize)]
struct I18nFile {
    name: String,
    path: String,
    content: serde_json::Value,
}

#[tauri::command]
fn read_i18n_files(dir_path: String) -> Result<Vec<I18nFile>, String> {
    let mut path = Path::new(&dir_path).to_path_buf();
    if !path.exists() || !path.is_dir() {
        return Err(format!("Directory not found: {}", dir_path));
    }

    let locales_path = path.join("locales");
    if locales_path.exists() && locales_path.is_dir() {
        path = locales_path;
    }

    let mut files = Vec::new();
    let entries = fs::read_dir(path).map_err(|e| e.to_string())?;

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("json") {
            let content_str = fs::read_to_string(&path).map_err(|e| e.to_string())?;
            let content: serde_json::Value =
                serde_json::from_str(&content_str).map_err(|e| e.to_string())?;

            files.push(I18nFile {
                name: path.file_name().unwrap().to_string_lossy().to_string(),
                path: path.to_string_lossy().to_string(),
                content,
            });
        }
    }
    Ok(files)
}

#[tauri::command]
fn save_i18n_file(file_path: String, content: serde_json::Value) -> Result<(), String> {
    let content_str = serde_json::to_string_pretty(&content).map_err(|e| e.to_string())?;
    fs::write(file_path, content_str).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn create_i18n_file(file_path: String) -> Result<(), String> {
    if Path::new(&file_path).exists() {
        return Err(format!("File already exists: {}", file_path));
    }
    fs::write(&file_path, "{}").map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn add_lang_to_index(index_path: String, lang_code: String) -> Result<(), String> {
    let mut content = fs::read_to_string(&index_path).map_err(|e| e.to_string())?;

    // Add import
    let import_stmt = format!(
        "import {} from './locales/{}.json';\n",
        lang_code, lang_code
    );
    if !content.contains(&format!("import {} from", lang_code)) {
        if let Some(last_import_idx) = content.rfind("import ") {
            if let Some(newline_idx) = content[last_import_idx..].find('\n') {
                let insert_pos = last_import_idx + newline_idx + 1;
                content.insert_str(insert_pos, &import_stmt);
            }
        } else {
            content.insert_str(0, &import_stmt);
        }
    }

    // Add to resources
    let resource_entry = format!("  {}: {{ translation: {} }},\n", lang_code, lang_code);
    if !content.contains(&format!("{}: {{ translation:", lang_code)) {
        if let Some(resources_idx) = content.find("const resources = {") {
            if let Some(open_brace_idx) = content[resources_idx..].find('{') {
                let insert_pos = resources_idx + open_brace_idx + 1;
                content.insert_str(insert_pos, &format!("\n{}", resource_entry));
            }
        }
    }

    fs::write(&index_path, content).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn delete_i18n_file(file_path: String) -> Result<(), String> {
    fs::remove_file(file_path).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn remove_lang_from_index(index_path: String, lang_code: String) -> Result<(), String> {
    let content = fs::read_to_string(&index_path).map_err(|e| e.to_string())?;

    let lines: Vec<&str> = content.lines().collect();
    let mut new_lines = Vec::new();

    for line in lines {
        if line
            .trim()
            .starts_with(&format!("import {} from", lang_code))
        {
            continue;
        }
        if line
            .trim()
            .starts_with(&format!("{}: {{ translation:", lang_code))
        {
            continue;
        }
        new_lines.push(line);
    }

    fs::write(&index_path, new_lines.join("\n")).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn initialize_project(dir_path: String) -> Result<(), String> {
    let path = Path::new(&dir_path);
    if !path.exists() {
        fs::create_dir_all(path).map_err(|e| e.to_string())?;
    }

    let locales_path = path.join("locales");
    if !locales_path.exists() {
        fs::create_dir_all(&locales_path).map_err(|e| e.to_string())?;
    }

    let index_path = path.join("index.ts");
    if !index_path.exists() {
        let content = "const locales = [\n];\n\nexport default locales;\n";
        fs::write(&index_path, content).map_err(|e| e.to_string())?;
    }

    let en_path = locales_path.join("en.json");
    if !en_path.exists() {
        fs::write(&en_path, "{}").map_err(|e| e.to_string())?;

        let index_content = fs::read_to_string(&index_path).map_err(|e| e.to_string())?;
        if !index_content.contains("\"en\"") {
            let new_content =
                index_content.replace("const locales = [", "const locales = [\n  \"en\",");
            fs::write(&index_path, new_content).map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}

// This helper spawns and monitors the sidecar.
// It mirrors the pattern in the official example:
// https://v2.tauri.app/develop/sidecar
fn spawn_and_monitor_sidecar(
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    // Check if a sidecar is already running
    if let Some(state) = app_handle.try_state::<Arc<Mutex<Option<CommandChild>>>>() {
        let guard = state.lock().unwrap();
        if guard.is_some() {
            println!("[aura-api] Sidecar is already running. Skipping spawn.");
            return Ok(());
        }
    }

    let sidecar_command = app_handle
        .shell()
        .sidecar("aura-api")
        .map_err(|e| e.to_string())?;

    let (mut rx, child) = sidecar_command.spawn().map_err(|e| e.to_string())?;

    // Store the child process in app state
    if let Some(state) = app_handle.try_state::<Arc<Mutex<Option<CommandChild>>>>() {
        *state.lock().unwrap() = Some(child);
    } else {
        return Err("Failed to access app state for sidecar".to_string());
    }

    // Monitor stdout/stderr in the background (like your original code)
    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(line) => {
                    println!("[aura-api] stdout: {}", String::from_utf8_lossy(&line));
                }
                CommandEvent::Stderr(line) => {
                    eprintln!("[aura-api] stderr: {}", String::from_utf8_lossy(&line));
                }
                _ => {}
            }
        }
        println!("[aura-api] Sidecar process exited.");
    });

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        // Manage state as Arc<Mutex<Option<CommandChild>>]
        .manage(Arc::new(Mutex::new(None::<CommandChild>)))
        .setup(|app| {
            let app_handle = app.handle().clone();

            println!("[aura-api] Spawning sidecar on startup...");
            if let Err(e) = spawn_and_monitor_sidecar(app_handle) {
                eprintln!("[aura-api] Failed to spawn sidecar: {}", e);
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            read_i18n_files,
            save_i18n_file,
            create_i18n_file,
            delete_i18n_file,
            add_lang_to_index,
            remove_lang_from_index,
            initialize_project
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            // This matches the Tauri v2 docs pattern for cleanup on app exit
            if let tauri::RunEvent::ExitRequested { .. } = event {
                println!("[aura-api] App exit requested; shutting down sidecar...");

                // 1) Kill the process we spawned via the shell plugin
                if let Some(state) =
                    app_handle.try_state::<Arc<Mutex<Option<CommandChild>>>>()
                {
                    if let Ok(mut guard) = state.lock() {
                        if let Some(process) = guard.take() {
                            if let Err(e) = process.kill() {
                                eprintln!(
                                    "[aura-api] Failed to kill sidecar: {}",
                                    e
                                );
                            } else {
                                println!("[aura-api] Sidecar killed successfully.");
                            }
                        }
                    }
                }

                // 2) PyInstaller workaround: kill all processes by executable name.
                // This ensures we clean up both the parent and child PyInstaller processes.
                // See: https://github.com/tauri-apps/tauri/issues/11686【turn3fetch0】
                #[cfg(target_os = "windows")]
                {
                    println!("[aura-api] Killing all aura-api.exe processes...");
                    match std::process::Command::new("taskkill")
                        .args(&["/F", "/IM", "aura-api.exe"])
                        .output()
                    {
                        Ok(output) => {
                            if output.status.success() {
                                println!(
                                    "[aura-api] All aura-api.exe processes killed successfully."
                                );
                            } else {
                                eprintln!(
                                    "[aura-api] taskkill returned non-zero status (processes may already be dead)."
                                );
                            }
                        }
                        Err(e) => {
                            eprintln!("[aura-api] Failed to run taskkill: {}", e);
                        }
                    }
                }

                #[cfg(target_os = "macos")]
                {
                    println!("[aura-api] Killing all aura-api processes...");
                    match std::process::Command::new("pkill")
                        .args(["-9", "aura-api"])
                        .output()
                    {
                        Ok(output) => {
                            if output.status.success() {
                                println!("[aura-api] All aura-api processes killed successfully.");
                            } else {
                                eprintln!(
                                    "[aura-api] pkill returned non-zero status (processes may already be dead)."
                                );
                            }
                        }
                        Err(e) => {
                            eprintln!("[aura-api] Failed to run pkill: {}", e);
                        }
                    }
                }

                #[cfg(target_os = "linux")]
                {
                    println!("[aura-api] Killing all aura-api processes...");
                    match std::process::Command::new("pkill")
                        .args(["-9", "aura-api"])
                        .output()
                    {
                        Ok(output) => {
                            if output.status.success() {
                                println!("[aura-api] All aura-api processes killed successfully.");
                            } else {
                                eprintln!(
                                    "[aura-api] pkill returned non-zero status (processes may already be dead)."
                                );
                            }
                        }
                        Err(e) => {
                            eprintln!("[aura-api] Failed to run pkill: {}", e);
                        }
                    }
                }
            }
        });
}