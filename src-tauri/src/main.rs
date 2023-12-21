use tauri::Window;
use tauri::Manager;
use tauri::TitleBarStyle;
use tauri::{CustomMenuItem, Menu, MenuItem, Submenu};
use tauri::AboutMetadata;
use std::fs;
use std::fs::File;
use std::error::Error;
use std::io::{self, Write, Read};
use std::path::Path;
use serde::{Serialize, Deserialize};
use serde_json::{Value, from_str};

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#[cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// the payload type must implement `Serialize` and `Clone`.
#[derive(Clone, serde::Serialize)]
struct Payload {
  message: String,
}

#[derive(Serialize, Deserialize)]
struct Response {
	code: u32,
	message: String,
	path: Option<String>,
}

fn create_binary_file(file_name: &str, contents: &str, directory: &str) -> Result<(), std::io::Error> {
	// Create the full path by joining the directory and filename
	let file_path = Path::new(directory).join(file_name);

	// Create a new file at the specified path
	let mut file = File::create(&file_path)?;
	
	// Convert the binary content string to bytes
	let content_bytes = match hex::decode(contents) {
		Ok(bytes) => bytes,
		Err(_) => {
			return Err(std::io::Error::new(
				std::io::ErrorKind::InvalidInput,
				"Invalid binary content",
			));
		}
	};

	// Write the binary content to the file
	file.write_all(&content_bytes)?;

	// println!("Binary file created successfully at: {:?}", file_path);

	Ok(())
}

fn create_text_file(file_name: &str, contents: &str, path: &str) -> io::Result<()> {
	// Combine the specified path and the file name
	let full_path = format!("{}/{}", path, file_name);

	// Create a new file at the specified path
	let mut file = File::create(&full_path)?;

	// Write the contents to the file
	file.write_all(contents.as_bytes())?;

	// println!("File '{}' successfully written to '{}'", file_name, full_path);

	Ok(())
}

fn read_text_file(file_path: &str) -> Result<String, Box<dyn Error>> {
	// Attempt to open the file
	let mut file = File::open(file_path)?;

	// Read the contents of the file into a String
	let mut contents = String::new();
	file.read_to_string(&mut contents)?;

	Ok(contents)
}

fn copy_file(src_path: &str, dest_dir: &str) -> Result<String, io::Error> {
	// Check if the source file exists
	if !Path::new(src_path).exists() {
		return Err(io::Error::new(io::ErrorKind::NotFound, "File not found"));
	}

	// Create the destination directory if it doesn't exist
	fs::create_dir_all(dest_dir)?;

	// Construct the destination path
	let file_name = Path::new(src_path).file_name().unwrap();
	let dest_path = Path::new(dest_dir).join(file_name);

	// Perform the file copy
	fs::copy(src_path, &dest_path)?;

	Ok(dest_path.to_str().unwrap().to_string())
}

fn create_directory(directory_name: &str, path: &str) -> io::Result<()> {
	
	let full_path = format!("{}/{}", path, directory_name);
	// Create the directory
	fs::create_dir(&full_path)?;
	
	Ok(())
}

fn create_launcher(app: &tauri::App) -> Window {
	
	let launcher = tauri::WindowBuilder::new(app, "launcher", tauri::WindowUrl::App("index.html?window_type=launcher".into()))
	.inner_size(600.0, 400.0)
	.minimizable(false)
	.maximizable(false)
	.resizable(false)
	.title_bar_style(TitleBarStyle::Overlay.clone())
	.title("")
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
			
		// Listen to menu item enable/disable
		let handle_menu = app.handle();
		app.listen_global("enable-menu-item", move |event| {
			let json_raw = event.payload().unwrap();
			let json_value: Result<Value, _> = from_str(json_raw);
			match json_value {
				Ok(json) => {
					let main_window = handle_menu.get_window("project").unwrap();
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
		let handle_text_file = app.handle();
		app.listen_global("save-text-file", move |event| {
			let json_raw = event.payload().unwrap();
			let json_value: Result<Value, _> = from_str(json_raw);
			match json_value {
				Ok(json) => {
					let name = json["name"].as_str().unwrap_or("N/A");
					let contents = json["contents"].as_str().unwrap_or("N/A");
					let project_path = json["projectPath"].as_str().unwrap_or("N/A");
					let _ = create_text_file(name, contents, project_path);
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
		  let handle_project_dir = app.handle();
		  app.listen_global("create-directory", move |event| {
			  let json_raw = event.payload().unwrap();
			  let json_value: Result<Value, _> = from_str(json_raw);
			  match json_value {
			  Ok(json) => {
				  let name = json["name"].as_str().unwrap_or("N/A");
				  let path = json["path"].as_str().unwrap_or("N/A");
				  let _ = create_directory(name, path);
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
		  
		  // listen for project file
		  let handle_request_project = app.handle();
		  app.listen_global("request-project-file", move |event| {
			  let json_raw = event.payload().unwrap();
				let json_value: Result<Value, _> = from_str(json_raw);
				match json_value {
					Ok(json) => {
						let version_path = json["path"].as_str().unwrap_or("N/A");
						match read_text_file(version_path) {
							Ok(contents) => {
								let project_window = handle_request_project.get_window("project").unwrap();
							  project_window.emit("receive-project-file", Payload { message: contents }).unwrap();			  
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
		  
		  // listen for creating new assets
		  let handle_create_asset = app.handle();
		  app.listen_global("create-asset", move |event| {
			  let json_raw = event.payload().unwrap();
			  let json_value: Result<Value, _> = from_str(json_raw);
			  match json_value {
				  Ok(json) => {
					  let file_name = json["fileName"].as_str().unwrap_or("N/A");
					  let file_type = json["fileType"].as_str().unwrap_or("N/A");
					  let contents = json["contents"].as_str().unwrap_or("N/A");
					  let assets_dir = json["assetsPath"].as_str().unwrap_or("N/A");
					  if file_type == "binary" {
					  match create_binary_file(file_name, contents, assets_dir) {
						  Ok(_success) => {
							  let project_window = handle_create_asset.get_window("project").unwrap();
							  let _ = project_window.emit("asset-created", Payload { message: "Asset created successfully".to_string() } );
						  }
						  Err(_e) => {
							  eprintln!("Error creating asset");
						  }
					  }
				  	}
					  // TODO: Add text file creation
				  }
				  Err(e) => {
					  eprintln!("Error parsing JSON: {}", e);
				  }
			  }
		  });
			
		  // listen for reading assets
		  let handle_read_asset = app.handle();
		  app.listen_global("read-asset", move |event| {
			  let json_raw = event.payload().unwrap();
			  let json_value: Result<Value, _> = from_str(json_raw);
			  match json_value {
					Ok(json) => {
						let asset_path = json["assetPath"].as_str().unwrap_or("N/A");
						let dest_path = json["cachePath"].as_str().unwrap_or("N/A");
						match copy_file(asset_path, dest_path) {
							Ok(_success) => {
								let project_window = handle_read_asset.get_window("project").unwrap();
								let _ = project_window.emit("asset-ready", Payload { message: "Asset available in temp".to_string() } );
							}
							Err(_e) => {
								eprintln!("Error reading file");
							}
						}
					}
					Err(e) => {
						eprintln!("Error parsing JSON: {}", e);
					}
				}
		  });
		 
		  // listen for history version
		  let handle_history = app.handle();
		  app.listen_global("request-history-version", move |event| {
			  let json_raw = event.payload().unwrap();
			  let json_value: Result<Value, _> = from_str(json_raw);
			  match json_value {
				  Ok(json) => {
					  let version_path = json["versionPath"].as_str().unwrap_or("N/A");
					  match read_text_file(version_path) {
						  Ok(contents) => {
					  		let main_window = handle_history.get_window("project").unwrap();
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
