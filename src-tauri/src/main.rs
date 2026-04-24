// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod bind_listeners;
mod file_operations;
mod globals;
mod preview_server;
mod check_for_updates;
#[cfg(target_os = "macos")]
mod native_bridge_macos;

use bind_listeners::bind_listeners;
use file_operations::handle_file_associations;
use globals::PENDING_FILES;
#[cfg(target_os = "windows")]
use std::path::PathBuf;
#[cfg(target_os = "windows")]
use tauri::Manager;

#[tauri::command]
fn get_pending_files() -> Vec<String> {
    PENDING_FILES.lock().unwrap().drain(..).collect()
}

#[tauri::command]
fn open_folder(path: String) {
    #[cfg(target_os = "macos")]
    let _ = std::process::Command::new("open").arg(&path).spawn();
    #[cfg(target_os = "windows")]
    let _ = std::process::Command::new("explorer").arg(&path).spawn();
}

#[tauri::command]
fn list_assets_dir(path: String) -> Vec<String> {
    std::fs::read_dir(&path)
        .map(|entries| {
            entries
                .filter_map(|e| e.ok())
                .filter_map(|e| e.file_name().into_string().ok())
                .filter(|name| !name.starts_with('.'))
                .collect()
        })
        .unwrap_or_default()
}

fn main() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init());

    #[cfg(target_os = "macos")]
    let builder = builder.plugin(tauri_plugin_accent_color::init());

    #[cfg(target_os = "windows")]
    let builder = builder.plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
        let files: Vec<PathBuf> = args
            .iter()
            .skip(1)
            .filter(|a| a.to_lowercase().ends_with(".clx"))
            .map(PathBuf::from)
            .collect();
        if !files.is_empty() {
            handle_file_associations(app.clone(), files);
        }
        // Bring the existing instance to the foreground
        let windows = app.webview_windows();
        let target = windows
            .get("launcher")
            .or_else(|| windows.values().next());
        if let Some(window) = target {
            let _ = window.show();
            let _ = window.unminimize();
            let _ = window.set_focus();
        }
    }));

    builder
        .setup(|app| {
            bind_listeners(app);
            #[cfg(target_os = "macos")]
            native_bridge_macos::set_app_handle(app.handle().clone());
            // Windows cold-start: file path arrives as a command-line argument
            #[cfg(target_os = "windows")]
            {
                let files: Vec<PathBuf> = std::env::args()
                    .skip(1)
                    .filter(|a| a.to_lowercase().ends_with(".clx"))
                    .map(PathBuf::from)
                    .collect();
                if !files.is_empty() {
                    handle_file_associations(app.handle().clone(), files);
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_pending_files, list_assets_dir, open_folder])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            #[cfg(any(target_os = "macos", target_os = "ios"))]
            if let tauri::RunEvent::Opened { urls } = event {
                let files = urls
                    .into_iter()
                    .filter_map(|url| url.to_file_path().ok())
                    .collect::<Vec<_>>();
                handle_file_associations(app.clone(), files);
            }
        });
}
