mod file_operations;
mod ui_operations {
    pub mod bind_listeners;
    // pub mod bind_menu_events;
    // pub mod create_app_menu;
    pub mod create_launcher;
    pub mod preview_server;
}
use file_operations::get_preview_path;
use ui_operations::{
    bind_listeners::bind_listeners, create_launcher::create_launcher, preview_server::start_server,
};

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#[cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // Run server
    std::thread::spawn(move || {
        if let Some(preview_path) = get_preview_path() {
            start_server(preview_path).unwrap();
        }
    });
    // Run Tauri
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        // your plugins here
        // .menu(tauri::menu::Menu::new()) // start with empty menu
        // .on_menu_event(|event| {
        //    bind_menu_events(event);
        // })
        .setup(|app| {
            create_launcher(app);
            bind_listeners(app);

            // Create and set the full menu here using the `app`
            // let menu = create_app_menu(app);
            // app.set_menu(menu);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
