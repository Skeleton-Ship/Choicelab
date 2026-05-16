use std::fs;
use std::path::Path;
use tauri::Manager;

fn recent_files_path(app: &tauri::AppHandle) -> Option<std::path::PathBuf> {
    app.path().app_config_dir().ok().map(|dir| dir.join("RecentFiles.json"))
}

// Read the raw list from disk without pruning. Used by click handlers that need
// index-stable access to the list as it was when the menu was built.
pub fn read_recent_files_raw(app: &tauri::AppHandle) -> Vec<String> {
    let path = match recent_files_path(app) {
        Some(p) => p,
        None => return vec![],
    };
    let contents = match fs::read_to_string(&path) {
        Ok(c) => c,
        Err(_) => return vec![],
    };
    serde_json::from_str(&contents).unwrap_or_default()
}

// Read the list, prune paths that no longer exist, write the pruned list back,
// and return it. Used when building or rebuilding the menu.
pub fn read_recent_files(app: &tauri::AppHandle) -> Vec<String> {
    let pruned: Vec<String> = read_recent_files_raw(app)
        .into_iter()
        .filter(|p| Path::new(p).exists())
        .collect();
    if let Some(path) = recent_files_path(app) {
        if let Ok(json) = serde_json::to_string_pretty(&pruned) {
            let _ = fs::write(&path, json);
        }
    }
    pruned
}

pub fn add_recent_file(app: &tauri::AppHandle, file_path: &str) {
    let path = match recent_files_path(app) {
        Some(p) => p,
        None => return,
    };
    if let Some(parent) = path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    let mut files = read_recent_files(app);
    files.retain(|p| p != file_path);
    files.insert(0, file_path.to_string());
    files.truncate(10);
    if let Ok(json) = serde_json::to_string_pretty(&files) {
        let _ = fs::write(&path, json);
    }
}

pub fn remove_recent_file(app: &tauri::AppHandle, file_path: &str) {
    let path = match recent_files_path(app) {
        Some(p) => p,
        None => return,
    };
    let mut files = read_recent_files_raw(app);
    files.retain(|p| p != file_path);
    if let Ok(json) = serde_json::to_string_pretty(&files) {
        let _ = fs::write(&path, json);
    }
}

pub fn clear_recent_files(app: &tauri::AppHandle) {
    let path = match recent_files_path(app) {
        Some(p) => p,
        None => return,
    };
    if let Some(parent) = path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    let _ = fs::write(&path, "[]");
}
