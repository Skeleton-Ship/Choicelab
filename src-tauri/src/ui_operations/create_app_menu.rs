use tauri::{AboutMetadata, CustomMenuItem, Menu, MenuItem, Submenu};

// Set up menu
pub fn create_app_menu() -> Menu {
	// Choicelab menu
	let app_menu = Submenu::new("Choicelab", Menu::new()
	.add_native_item(MenuItem::About("Choicelab".to_string(), AboutMetadata::new()))
	.add_native_item(MenuItem::Separator)
	.add_native_item(MenuItem::Services)
	.add_native_item(MenuItem::Separator)
	.add_native_item(MenuItem::Hide)
	.add_native_item(MenuItem::HideOthers)
	.add_native_item(MenuItem::ShowAll)
	.add_native_item(MenuItem::Separator)
	.add_native_item(MenuItem::Quit)
	);
	// File menu
	let file_menu = Submenu::new("File", Menu::new()
	.add_item(CustomMenuItem::new("new_project", "New Project...").accelerator("Cmd+Shift+N"))
	.add_item(CustomMenuItem::new("open_project", "Open Project...").accelerator("Cmd+O"))
	.add_native_item(MenuItem::Separator)
	.add_item(CustomMenuItem::new("save_project", "Save").accelerator("Cmd+S"))
	.add_native_item(MenuItem::Separator)
	.add_native_item(MenuItem::CloseWindow)
	);
	let edit_menu = Submenu::new("Edit", Menu::new()
	.add_item(CustomMenuItem::new("undo", "Undo").accelerator("Cmd+Z").disabled())
	.add_item(CustomMenuItem::new("redo", "Redo").accelerator("Cmd+Shift+Z").disabled())
	.add_native_item(MenuItem::Separator)
	.add_native_item(MenuItem::Cut)
	.add_native_item(MenuItem::Copy)
	.add_native_item(MenuItem::Paste)
	.add_native_item(MenuItem::SelectAll)
	);
	let view_menu = Submenu::new("View", Menu::new()
	.add_item(CustomMenuItem::new("show_node_editor", "Show Node Editor").accelerator("Cmd+E").disabled())
	.add_item(CustomMenuItem::new("show_variables", "Show Variables").accelerator("Cmd+R").disabled())
	.add_native_item(MenuItem::Separator)
	.add_native_item(MenuItem::EnterFullScreen)
	);
	let project_menu = Submenu::new("Project", Menu::new()
	.add_item(CustomMenuItem::new("new_cell", "New Cell").accelerator("Cmd+N"))
	.add_item(CustomMenuItem::new("new_branch", "New Branch").accelerator("Cmd+B"))
	.add_native_item(MenuItem::Separator)
	.add_item(CustomMenuItem::new("set_link", "Set Link").accelerator("Cmd+L"))	
	.add_item(CustomMenuItem::new("disconnect_link", "Disconnect Link").accelerator("Cmd+D"))	
	.add_item(CustomMenuItem::new("delete_nodes", "Delete Items").accelerator("Cmd+Delete"))	
	);
	let window_menu = Submenu::new("Window", Menu::new()
	.add_native_item(MenuItem::Minimize)
	);
	// Build and return it
	let menu = Menu::new()
	.add_submenu(app_menu)
	.add_submenu(file_menu)
	.add_submenu(edit_menu)
	.add_submenu(view_menu)
	.add_submenu(project_menu)
	.add_submenu(window_menu);
	return menu;
}