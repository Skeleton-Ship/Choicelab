mod file_operations;
mod native_bridge_macos;
mod bind_listeners;
mod preview_server;
mod globals;

use std::path::PathBuf;

use tauri::{AppHandle, Manager, Emitter};
use bind_listeners::bind_listeners;
use globals::PENDING_FILES;

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#[cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Global map for pending files per window label
// static PENDING_FILES: Lazy<Mutex<HashMap<String, Vec<String>>>> = Lazy::new(|| Mutex::new(HashMap::new()));

fn handle_file_associations(app: AppHandle, files: Vec<PathBuf>) {
  // -- Scope handling start --

  // You can remove this block if you only want to know about the paths, but not actually "use" them in the frontend.

  // This requires the `fs` tauri plugin and is required to make the plugin's frontend work:
  // use tauri_plugin_fs::FsExt;
  // let fs_scope = app.fs_scope();

  // This is for the `asset:` protocol to work:
  let asset_protocol_scope = app.asset_protocol_scope();

  for file in &files {
    // This requires the `fs` plugin:
    // let _ = fs_scope.allow_file(file);

    // This is for the `asset:` protocol:
    let _ = asset_protocol_scope.allow_file(file);
  }

  // -- Scope handling end --

  let files_js = files
    .iter()
    .map(|f| f.to_string_lossy().replace('\\', "\\\\"))
    .collect::<Vec<_>>();

  // Store files globally (not per window)
  let mut pending = PENDING_FILES.lock().unwrap();
  pending.extend(files_js);
}


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
