use std::time::UNIX_EPOCH;
use tauri::Manager;

fn autosave_path(app: &tauri::AppHandle, project_path: &str) -> Option<std::path::PathBuf> {
    let cache = app.path().app_cache_dir().ok()?;
    let label = crate::project_window_label(project_path);
    Some(cache.join("Projects").join(label).join("autosave.clx"))
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
    if let Some(path) = autosave_path(&app, &project_path) {
        let _ = std::fs::remove_file(path);
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
