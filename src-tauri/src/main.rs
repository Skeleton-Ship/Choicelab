mod file_operations;
mod ui_operations {
	pub mod create_app_menu;
	pub mod create_launcher;
	pub mod bind_menu_events;
	pub mod bind_listeners;
	pub mod preview_server;
}
use ui_operations::{
	create_app_menu::create_app_menu,
	create_launcher::create_launcher,
	bind_menu_events::bind_menu_events,
	bind_listeners::bind_listeners,
	preview_server::start_server
};
use std::path::PathBuf;
use home::home_dir;

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#[cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
	// Run server
			std::thread::spawn(move || {
				// Get the user's home directory
				if let Some(home_path) = home_dir() {
					// Append a relative directory or file path
					let preview_path: PathBuf = home_path.join("Library/Caches/com.choicelab.choicelab/Preview");
   					start_server(preview_path).unwrap();
				} else {
					println!("Could not determine the home directory");
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

