mod bind_listeners;
mod file_operations;
mod globals;
mod preview_server;
mod check_for_updates;
#[cfg(target_os = "macos")]
mod native_bridge_macos;

use bind_listeners::bind_listeners;
use file_operations::handle_file_associations;

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#[cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

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

    builder
        .setup(|app| {
            bind_listeners(app);
            #[cfg(target_os = "macos")]
            native_bridge_macos::set_app_handle(app.handle().clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![])
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
