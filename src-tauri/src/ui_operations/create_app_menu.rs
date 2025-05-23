use tauri::{Runtime, AppHandle};
use tauri::menu::{Menu, PredefinedMenuItem, Submenu, MenuItemBuilder, AboutMetadata};

pub fn create_app_menu<R: Runtime>(app: &AppHandle<R>) -> Menu {
	// Create custom menu items
	let request_quit = MenuItemBuilder::new("Quit Choicelab").id("request_quit").accelerator("Cmd+Q");
	let new_project = MenuItemBuilder::new("New Project...").id("new_project").accelerator("Cmd+Shift+N");
	let open_project = MenuItemBuilder::new("Open Project...").id("open_project").accelerator("Cmd+O");
	let save_project = MenuItemBuilder::new("Save").id("save_project").accelerator("Cmd+S");
	let undo = MenuItemBuilder::new("Undo").id("undo").accelerator("Cmd+Z").enabled(false);
	let redo = MenuItemBuilder::new("Redo").id("redo").accelerator("Cmd+Shift+Z").enabled(false);
	let show_node_editor = MenuItemBuilder::new("Show Node Editor").id("show_node_editor").accelerator("Cmd+E").enabled(false);
	let show_variables = MenuItemBuilder::new("Show Variables").id("show_variables").accelerator("Cmd+R").enabled(false);
	let new_cell = MenuItemBuilder::new("New Cell").id("new_cell").accelerator("Cmd+N").enabled(false);
	let new_branch = MenuItemBuilder::new("New Branch").id("new_branch").accelerator("Cmd+B").enabled(false);
	let set_link = MenuItemBuilder::new("Set Link").id("set_link").accelerator("Cmd+L").enabled(false);
	let disconnect_link = MenuItemBuilder::new("Disconnect Link").id("disconnect_link").accelerator("Cmd+D").enabled(false);
	let delete_nodes = MenuItemBuilder::new("Delete Node").id("delete_nodes").accelerator("Cmd+Delete").enabled(false);
	let delete_stem = MenuItemBuilder::new("Delete Branch Stem").id("delete_stem").accelerator("Cmd+Option+Delete").enabled(false);
	let submit_feedback = MenuItemBuilder::new("Report a Problem or Feature Request...").id("submit_feedback");

	// Choicelab menu
	let app_menu = Submenu::new(
		app,
		"Choicelab",
		Menu::new()
			.add_native_item(PredefinedMenuItem::About("Choicelab".to_string(), AboutMetadata::new()))
			.add_native_item(PredefinedMenuItem::Separator)
			.add_native_item(PredefinedMenuItem::Services)
			.add_native_item(PredefinedMenuItem::Separator)
			.add_native_item(PredefinedMenuItem::Hide)
			.add_native_item(PredefinedMenuItem::HideOthers)
			.add_native_item(PredefinedMenuItem::ShowAll)
			.add_native_item(PredefinedMenuItem::Separator)
			.add_item(request_quit),
	);

	// File menu
	let file_menu = Submenu::new(
		app,
		"File",
		Menu::new()
			.add_item(new_project)
			.add_item(open_project)
			.add_native_item(PredefinedMenuItem::Separator)
			.add_item(save_project)
			.add_native_item(PredefinedMenuItem::Separator)
			.add_native_item(PredefinedMenuItem::CloseWindow),
	);

	// Edit menu
	let edit_menu = Submenu::new(
		app,
		"Edit",
		Menu::new()
			.add_item(undo)
			.add_item(redo)
			.add_native_item(PredefinedMenuItem::Separator)
			.add_native_item(PredefinedMenuItem::Cut)
			.add_native_item(PredefinedMenuItem::Copy)
			.add_native_item(PredefinedMenuItem::Paste)
			.add_native_item(PredefinedMenuItem::SelectAll),
	);

	// View menu
	let view_menu = Submenu::new(
		app,
		"View",
		Menu::new()
			.add_item(show_node_editor)
			.add_item(show_variables)
			.add_native_item(PredefinedMenuItem::Separator)
			.add_native_item(PredefinedMenuItem::EnterFullScreen),
	);

	// Project menu
	let project_menu = Submenu::new(
		app,
		"Project",
		Menu::new()
			.add_item(new_cell)
			.add_item(new_branch)
			.add_native_item(PredefinedMenuItem::Separator)
			.add_item(set_link)
			.add_item(disconnect_link)
			.add_native_item(PredefinedMenuItem::Separator)
			.add_item(delete_nodes)
			.add_item(delete_stem),
	);

	// Window menu
	let window_menu = Submenu::new(app, "Window", Menu::new().add_native_item(PredefinedMenuItem::Minimize));

	// Help menu
	let help_menu = Submenu::new(app, "Help", Menu::new().add_item(submit_feedback));

	// Build and return the complete menu
	Menu::new()
		.add_submenu(app_menu)
		.add_submenu(file_menu)
		.add_submenu(edit_menu)
		.add_submenu(view_menu)
		.add_submenu(project_menu)
		.add_submenu(window_menu)
		.add_submenu(help_menu)
}
