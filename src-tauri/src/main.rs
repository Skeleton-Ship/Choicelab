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
use globals::{FOCUSED_WINDOW, PENDING_FILES};
#[cfg(target_os = "windows")]
use std::path::PathBuf;
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
fn set_focused_window(label: String) {
    *FOCUSED_WINDOW.lock().unwrap() = label;
        // println!("focused window: {:?}", *FOCUSED_WINDOW.lock().unwrap());
}

#[tauri::command]
fn print_focused_window() {
    // println!("focused window: {:?}", *FOCUSED_WINDOW.lock().unwrap());
}

#[tauri::command]
fn create_project_window(
    app: tauri::AppHandle,
    label: String,
    url: String,
    width: f64,
    height: f64,
    transparent: bool,
) -> Result<(), String> {
    let builder = tauri::WebviewWindowBuilder::new(
        &app,
        label,
        tauri::WebviewUrl::App(url.into()),
    )
    .title("")
    .inner_size(width, height)
    .min_inner_size(700.0, 360.0)
    .transparent(transparent)
    .visible(true)
    .on_navigation(|url| {
        // Allow the app's own origins and the preview server port range.
        // Everything else (e.g. accidental back-navigation to an arbitrary URL)
        // is blocked.
        let port = url.port().unwrap_or(0);
        url.scheme() == "tauri" || port == 1420 || (port >= 4090 && port <= 4099)
    });

    #[cfg(target_os = "macos")]
    let builder = builder
        .title_bar_style(tauri::TitleBarStyle::Overlay);

    builder.build().map_err(|e| e.to_string())?;
    Ok(())
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
        .invoke_handler(tauri::generate_handler![get_pending_files, open_folder, set_focused_window, print_focused_window, create_project_window])
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
