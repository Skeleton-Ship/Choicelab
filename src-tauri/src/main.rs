mod file_operations;
mod ui_operations {
	pub mod create_app_menu;
	pub mod create_launcher;
	pub mod bind_menu_events;
	pub mod bind_listeners;
	pub mod preview_server;
}
mod read_tauri_config;
use read_tauri_config::read_tauri_config;
use ui_operations::{
	create_app_menu::create_app_menu,
	create_launcher::create_launcher,
	bind_menu_events::bind_menu_events,
	bind_listeners::bind_listeners,
	preview_server::start_server
};
use tauri::api::path::app_cache_dir;

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#[cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
	// Run server
			std::thread::spawn(move || {
				match read_tauri_config() {
					Ok(config) => {
	 					let preview_path = app_cache_dir(&config).unwrap().join("Preview");
	 					println!("Preview path: {}", preview_path.to_string_lossy());
					 start_server(preview_path).unwrap();
					}
					Err(e) => {
						eprintln!("Error reading file: {}", e)
					}
				}
			  });
	  // Run Tauri
	let menu = create_app_menu();
    tauri::Builder::default()
	.menu(menu)
	.on_menu_event(|event| {
		bind_menu_events(event);
	})
	.setup(|app| {
		  
		// Create launcher window
		create_launcher(app);
		
		// Listen to events from front-end
		bind_listeners(app);
		
		Ok(())
	})
	// This is where you pass in your commands
	.invoke_handler(tauri::generate_handler![])
	// Run the thing
    .run(tauri::generate_context!())
    .expect("Error while running Tauri application.");
}
