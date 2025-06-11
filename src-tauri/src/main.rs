mod file_operations;
mod native_bridge_macos;
mod bind_listeners;
mod preview_server;

use bind_listeners::bind_listeners;

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#[cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // Run server
    std::thread::spawn(move || {
		/*
        if let Some(preview_path) = get_preview_path() {
            start_server(preview_path).unwrap();
        }
		*/
    });
    // Run Tauri
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
		.plugin(tauri_plugin_shell::init())
        .setup(|app| {
            bind_listeners(app);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
