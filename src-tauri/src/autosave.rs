use crate::project_cache::{legacy_project_cache_dir, project_cache_dir};
use std::time::UNIX_EPOCH;

const AUTOSAVE_FILE_NAME: &str = "autosave.clx";

/// The autosave to recover, if any. Checks the pre-1.2 cache location too, so
/// an autosave left by a crash in an older version can still be recovered.
fn autosave_path(app: &tauri::AppHandle, project_path: &str) -> Option<std::path::PathBuf> {
    let current = project_cache_dir(app, project_path)?.join(AUTOSAVE_FILE_NAME);
    if current.exists() {
        return Some(current);
    }
    legacy_project_cache_dir(app, project_path)
        .map(|dir| dir.join(AUTOSAVE_FILE_NAME))
        .filter(|legacy| legacy.exists())
        .or(Some(current))
}

#[tauri::command]
pub fn check_autosave(
    app: tauri::AppHandle,
    project_path: String,
    file_name: String,
) -> Option<serde_json::Value> {
    let autosave = autosave_path(&app, &project_path)?;
    if !autosave.exists() {
        return None;
    }
    let saved = std::path::Path::new(&project_path).join(&file_name);
    let autosave_mtime = std::fs::metadata(&autosave)
        .ok()?
        .modified()
        .ok()?
        .duration_since(UNIX_EPOCH)
        .ok()?
        .as_millis() as i64;
    let saved_mtime = std::fs::metadata(&saved)
        .ok()?
        .modified()
        .ok()?
        .duration_since(UNIX_EPOCH)
        .ok()?
        .as_millis() as i64;
    if autosave_mtime <= saved_mtime {
        return None;
    }
    Some(serde_json::json!({
        "autosaveMtimeMs": autosave_mtime,
        "savedMtimeMs": saved_mtime,
    }))
}

#[tauri::command]
pub fn read_autosave_file(
    app: tauri::AppHandle,
    project_path: String,
) -> Result<String, String> {
    let path = autosave_path(&app, &project_path)
        .ok_or_else(|| "no cache dir".to_string())?;
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_autosave(app: tauri::AppHandle, project_path: String) {
    if let Some(dir) = project_cache_dir(&app, &project_path) {
        let _ = std::fs::remove_file(dir.join(AUTOSAVE_FILE_NAME));
    }
    // Nothing else uses the pre-1.2 folder, so remove all of it
    if let Some(dir) = legacy_project_cache_dir(&app, &project_path) {
        let _ = std::fs::remove_dir_all(dir);
    }
}

#[tauri::command]
pub async fn show_autosave_recovery_dialog(
    app: tauri::AppHandle,
    title: String,
    body: String,
) -> Result<bool, String> {
    let (tx, rx) = tokio::sync::oneshot::channel::<bool>();
    #[cfg(target_os = "macos")]
    {
        let _ = app;
        std::thread::spawn(move || {
            let result = crate::native_bridge_macos::show_guard_dialog(
                &title,
                &body,
                "Auto-saved",
                "Saved",
            );
            let _ = tx.send(result);
        });
    }
    #[cfg(not(target_os = "macos"))]
    {
        use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};
        app.dialog()
            .message(&body)
            .title(&title)
            .kind(MessageDialogKind::Info)
            .buttons(MessageDialogButtons::OkCancelCustom(
                "Auto-saved".into(),
                "Saved".into(),
            ))
            .show(move |result| {
                let _ = tx.send(result);
            });
    }
    rx.await.map_err(|e| e.to_string())
}
