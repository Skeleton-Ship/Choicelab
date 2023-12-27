use tauri::Window;
use tauri::Manager;
use serde::{Serialize, Deserialize};
use serde_json::{Value, from_str};
use crate::file_operations::{
	create_binary_file,
	create_text_file,
	read_text_file,
	copy_file,
	create_directory,
};
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};

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

fn apply_project_vibrancy(window: Window) {
	#[cfg(target_os = "macos")]
	apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, None).expect("Unsupported platform! 'apply_vibrancy' is only supported on macOS");	
}

pub fn bind_listeners(app: &tauri::App) {
	// Listen to vibrancy
	let handle_project_open = app.handle();
	let handle_enable_items = app.handle();
	app.listen_global("project-opened", move |_event| {
		// Set vibrancy
		let project_window = handle_project_open.get_window("project").unwrap();
		let _ = handle_project_open.run_on_main_thread( || apply_project_vibrancy(project_window) );
		// Enable editor menu items
		let project_window_menu = handle_enable_items.get_window("project").unwrap();
		let menu = project_window_menu.menu_handle();
		let _ = menu.get_item("show_actions").set_enabled(true);
		let _ = menu.get_item("show_variables").set_enabled(true);
		let _ = menu.get_item("show_actions").set_selected(true);
		let _ = menu.get_item("show_variables").set_selected(false);
	});
	// Listen to menu item select/deselect
	let handle_select_menu = app.handle();	
	app.listen_global("select-menu-items", move |event| {
		let json_raw = event.payload().unwrap();
		let json_value: Result<Value, _> = from_str(json_raw);
		match json_value {
			Ok(json) => {
				let main_window = handle_select_menu.get_window("project").unwrap();
				let menu_handle = main_window.menu_handle();
				if let Some(select_items) = json["selectItems"].as_array() {
					for select_item in select_items {
						if let Some(select_item_str) = select_item.as_str() {
							let _ = menu_handle.get_item(select_item_str).set_selected(true);
						}
					}
				}
				if let Some(deselect_items) = json["deselectItems"].as_array() {
					for deselect_item in deselect_items {
						if let Some(deselect_item_str) = deselect_item.as_str() {
							let _ = menu_handle.get_item(deselect_item_str).set_selected(false);
						}
					}
				}
			}
			Err(e) => {
				eprintln!("Error parsing JSON: {}", e);
			}
		}
	});
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
				  } else if file_type == "text" {
					  match create_text_file(file_name, contents, assets_dir) {
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
}