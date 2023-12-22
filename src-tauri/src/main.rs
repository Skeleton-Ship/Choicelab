mod file_operations;
mod ui_operations {
	pub mod create_app_menu;
	pub mod create_launcher;
	pub mod bind_menu_events;
	pub mod bind_listeners;
}
use ui_operations::{
	create_app_menu::create_app_menu,
	create_launcher::create_launcher,
	bind_menu_events::bind_menu_events,
	bind_listeners::bind_listeners
};

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#[cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
	let menu = create_app_menu();
	// Run default method
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
