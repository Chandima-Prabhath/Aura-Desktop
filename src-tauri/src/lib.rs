use std::fs;
use std::path::Path;

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

    // Check if "locales" subdirectory exists
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

        // Add 'en' to index.ts
        let index_content = fs::read_to_string(&index_path).map_err(|e| e.to_string())?;
        if !index_content.contains("\"en\"") {
            let new_content =
                index_content.replace("const locales = [", "const locales = [\n  \"en\",");
            fs::write(&index_path, new_content).map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}

use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandEvent;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let sidecar_command = app_handle.shell().sidecar("binaries/aura-cli").unwrap();
                let (mut rx, _child) = sidecar_command.spawn().unwrap();

                while let Some(event) = rx.recv().await {
                    match event {
                        CommandEvent::Stdout(line) => {
                            println!("[aura-cli] stdout: {}", String::from_utf8_lossy(&line));
                        }
                        CommandEvent::Stderr(line) => {
                            eprintln!("[aura-cli] stderr: {}", String::from_utf8_lossy(&line));
                        }
                        _ => {}
                    }
                }
            });
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
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
