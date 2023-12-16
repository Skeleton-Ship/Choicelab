use tauri::Window;
use tauri::Manager;
use tauri::{CustomMenuItem, Menu, MenuItem, Submenu};
use tauri::AboutMetadata;
use std::fs;
use std::fs::File;
use std::error::Error;
use std::io::{self, Write, Read};
use serde_json::{Value, from_str};

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#[cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// the payload type must implement `Serialize` and `Clone`.
#[derive(Clone, serde::Serialize)]
struct Payload {
  message: String,
}

fn write_to_file(file_name: &str, contents: &str, path: &str) -> io::Result<()> {
	// Combine the specified path and the file name
	let full_path = format!("{}/{}", path, file_name);

	// Create a new file at the specified path
	let mut file = File::create(&full_path)?;

	// Write the contents to the file
	file.write_all(contents.as_bytes())?;

	// println!("File '{}' successfully written to '{}'", file_name, full_path);

	Ok(())
}

fn write_directory(directory_name: &str, path: &str) -> io::Result<()> {
	
	let full_path = format!("{}/{}", path, directory_name);
	// Create the directory
	fs::create_dir(&full_path)?;
	
	Ok(())
}

fn read_file(file_path: &str) -> Result<String, Box<dyn Error>> {
	// Attempt to open the file
	let mut file = File::open(file_path)?;

	// Read the contents of the file into a String
	let mut contents = String::new();
	file.read_to_string(&mut contents)?;

	Ok(contents)
}

fn create_launcher(app: &tauri::App) -> Window {
	
	let launcher = tauri::WindowBuilder::new(app, "launcher", tauri::WindowUrl::App("index.html?window_type=launcher".into()))
	.inner_size(600.0, 400.0)
	.minimizable(false)
	.maximizable(false)
	.resizable(false)
	.title("Choicelab")
	.build()
	.unwrap();
	
	return launcher;
}

// Set up menu
fn create_app_menu() -> Menu {
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
	.add_item(CustomMenuItem::new("new_project", "New Project").accelerator("Cmd+Shift+N"))
	.add_item(CustomMenuItem::new("open_project", "Open Project").accelerator("Cmd+O"))
	.add_native_item(MenuItem::Separator)
	.add_item(CustomMenuItem::new("save_project", "Save").accelerator("Cmd+S"))
	.add_native_item(MenuItem::Separator)
	.add_native_item(MenuItem::CloseWindow)
	);
	let edit_menu = Submenu::new("Edit", Menu::new()
	.add_item(CustomMenuItem::new("undo", "Undo").accelerator("Cmd+Z").disabled())
	.add_item(CustomMenuItem::new("redo", "Redo").accelerator("Cmd+Shift+Z").disabled())
	.add_native_item(MenuItem::Separator)
	.add_item(CustomMenuItem::new("cut", "Cut").accelerator("Cmd+X"))
	.add_item(CustomMenuItem::new("copy", "Copy").accelerator("Cmd+C"))
	.add_item(CustomMenuItem::new("paste", "Paste").accelerator("Cmd+V"))
	);
	let view_menu = Submenu::new("View", Menu::new()
	.add_native_item(MenuItem::EnterFullScreen)
	);
	let project_menu = Submenu::new("Project", Menu::new()
	.add_item(CustomMenuItem::new("new_cell", "New Cell").accelerator("Cmd+N"))
	.add_item(CustomMenuItem::new("new_branch", "New Branch").accelerator("Cmd+B"))
	.add_native_item(MenuItem::Separator)
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

fn main() {
	let menu = create_app_menu();
	// Run default method
    tauri::Builder::default()
	.menu(menu)
	.on_menu_event(|event| {
	  match event.menu_item_id() {
		  "new_project" => {
			  event.window().emit("menu-new-project", ()).unwrap();
		  }
		  "open_project" => {
			  event.window().emit("menu-open-project", ()).unwrap();
		  }
		  "save_project" => {
			  event.window().emit("menu-save-project", ()).unwrap();			  
		  }
		  "undo" => {
			  event.window().emit("menu-undo", ()).unwrap();
		  }
		  "redo" => {
			  event.window().emit("menu-redo", ()).unwrap();
		  }
		  "cut" => {
			  event.window().emit("menu-cut", ()).unwrap();
		  }
		  "copy" => {
			  event.window().emit("menu-copy", ()).unwrap();
		  }
		  "paste" => {
			  event.window().emit("menu-paste", ()).unwrap();
		  }
		  "new_cell" => {
			  event.window().emit("menu-new-cell", ()).unwrap();
		  }		 
		  "new_branch" => {
			  event.window().emit("menu-new-branch", ()).unwrap();
		  }		  
		  "delete_nodes" => {
			  event.window().emit("menu-delete-nodes", ()).unwrap();
		  }
		  "disconnect_link" => {
			  event.window().emit("menu-disconnect-link", ()).unwrap();
		  }		  
		  _ => {}
	  }
	})
	.setup(|app| {
		
		// Create launcher window
		create_launcher(app);
		
		let handle_menu = app.handle();
		let handle_history = app.handle();
		let handle_request_project = app.handle();
		let handle_text_file = app.handle();
		let handle_project_dir = app.handle();
		
		// Listen to menu item enable/disable
		app.listen_global("enable-menu-item", move |event| {
			let json_raw = event.payload().unwrap();
			let json_value: Result<Value, _> = from_str(json_raw);
			match json_value {
				Ok(json) => {
					let main_window = handle_menu.get_focused_window().unwrap();
					let menu_handle = main_window.menu_handle();
					let item_name = json["item"].as_str().unwrap_or("N/A");
					let item_state = json["state"].as_str().unwrap_or("N/A");
					if item_state == "enable" {
						let _ = menu_handle.get_item(item_name).set_enabled(true);
					} else {
						let _ = menu_handle.get_item(item_name).set_enabled(false);
					}
				}
				Err(e) => {
					eprintln!("Error parsing JSON: {}", e);
				}
			}
		});
		
		// listen to text file saves (emitted on any window)
		app.listen_global("save-text-file", move |event| {
			let json_raw = event.payload().unwrap();
			let json_value: Result<Value, _> = from_str(json_raw);
			match json_value {
				Ok(json) => {
					let name = json["name"].as_str().unwrap_or("N/A");
					let contents = json["contents"].as_str().unwrap_or("N/A");
					let project_path = json["projectPath"].as_str().unwrap_or("N/A");
					let _ = write_to_file(name, contents, project_path);
					// Do callback
					let callback = json["callback"].as_str().unwrap_or("N/A");
					if callback != "N/A" && callback != "" {
  						let main_window = handle_text_file.get_focused_window().unwrap();
  						main_window.emit(callback, Payload { message: "success".to_string() }).unwrap();			  
					}
				}
				Err(e) => {
					eprintln!("Error parsing JSON: {}", e);
				}
			}
		  });
		  
		  // listen to directory creation requests
		  app.listen_global("create-directory", move |event| {
			  let json_raw = event.payload().unwrap();
			  let json_value: Result<Value, _> = from_str(json_raw);
			  match json_value {
			  Ok(json) => {
				  let name = json["name"].as_str().unwrap_or("N/A");
				  let path = json["path"].as_str().unwrap_or("N/A");
				  let _ = write_directory(name, path);
				  // Do callback
				  let callback = json["callback"].as_str().unwrap_or("N/A");
				  if callback != "N/A" && callback != "" {
					  let main_window = handle_project_dir.get_focused_window().unwrap();
					  main_window.emit(callback, Payload { message: "success".to_string() }).unwrap();			  
				  }
			  }
			  Err(e) => {
				  eprintln!("Error parsing JSON: {}", e);
			  }
		  }
		  });
		  
		  app.listen_global("request-project-file", move |event| {
			  let json_raw = event.payload().unwrap();
				let json_value: Result<Value, _> = from_str(json_raw);
				match json_value {
					Ok(json) => {
						let version_path = json["path"].as_str().unwrap_or("N/A");
						match read_file(version_path) {
							Ok(contents) => {
								let main_window = handle_request_project.get_focused_window().unwrap();
							  main_window.emit("receive-project-file", Payload { message: contents }).unwrap();			  
							}
							Err(e) => {
								eprintln!("Error parsing version: {}", e);
							}
						}
					}
					Err(e) => {
						eprintln!("Error parsing JSON: {}", e);
					}
				}
		  });
		  
		  // listen for 
		  app.listen_global("request-history-version", move |event| {
			  let json_raw = event.payload().unwrap();
			  let json_value: Result<Value, _> = from_str(json_raw);
			  match json_value {
				  Ok(json) => {
					  let version_path = json["versionPath"].as_str().unwrap_or("N/A");
					  match read_file(version_path) {
						  Ok(contents) => {
					  		let main_window = handle_history.get_focused_window().unwrap();
							main_window.emit("receive-history-version", Payload { message: contents }).unwrap();			  
						  }
						  Err(e) => {
							  eprintln!("Error parsing version: {}", e);
						  }
					  }
				  }
				  Err(e) => {
					  eprintln!("Error parsing JSON: {}", e);
				  }
			  }
			});
		  
		Ok(())
	})
	// This is where you pass in your commands
	.invoke_handler(tauri::generate_handler![])
	// Run the thing
    .run(tauri::generate_context!())
    .expect("Error while running Tauri application.");
}
