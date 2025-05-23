use crate::file_operations::{
    copy_file, create_binary_file, create_directory, create_text_file, load_preview_files,
    read_text_file,
};
use serde::{Deserialize, Serialize};
use serde_json::{from_str, Value};
use std::fs;
use tauri::Emitter;
use tauri::Listener;
use tauri::Manager;
use tauri::WebviewWindow;
// use crate::ui_operations::preview_server::start_server;
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

fn apply_project_vibrancy(window: WebviewWindow) {
    #[cfg(target_os = "macos")]
    apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, None)
        .expect("Unsupported platform! 'apply_vibrancy' is only supported on macOS");
}

pub fn bind_listeners(app: &tauri::App) {
    let app_handle = app.app_handle();
    // Listen to vibrancy
    let handle_project_open = app_handle.clone();
    // let handle_enable_items = handle_project_open.clone();
    app.listen("project-ready", move |event| {
        // Set vibrancy
		let json_raw = event.payload();
		let json_value: Result<Value, _> = from_str(json_raw);
		match json_value {
		Ok(json) => {
			let window_label = json["label"].as_str().unwrap_or("N/A");
			let project_window = handle_project_open
			.get_webview_window(window_label)
			.unwrap();
			let _ = handle_project_open.run_on_main_thread(|| apply_project_vibrancy(project_window));
		}
		Err(e) => {
			eprintln!("Error parsing JSON: {}", e);
		}
	}
        // Enable editor menu items
        // let menu = project_window_menu.menu_handle();
        // let _ = menu.get_item("show_node_editor").set_enabled(true);
        // let _ = menu.get_item("show_variables").set_enabled(true);
        // let _ = menu.get_item("show_node_editor").set_selected(true);
        // let _ = menu.get_item("show_variables").set_selected(false);
    });
    // Listen to menu item select/deselect
    /*
    let handle_select_menu = app.app_handle();
    app.listen("select-menu-items", move |event| {
        let json_raw = event.payload();
        let json_value: Result<Value, _> = from_str(json_raw);
        match json_value {
            Ok(json) => {
                let main_window_wrapped = handle_select_menu.get_focused_window();
                if main_window_wrapped.is_none() {
                    // eprintln!("Could not fetch focused window.");
                    return;
                }
                let main_window = main_window_wrapped.unwrap();
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
    */
    // Listen to menu item enable/disable
    /*
    let handle_menu = app.app_handle();
    app.listen("enable-menu-items", move |event| {
        let json_raw = event.payload();
        let json_value: Result<Value, _> = from_str(json_raw);
        match json_value {
            Ok(json) => {
                let main_window_wrapped = handle_menu.get_focused_window();
                if main_window_wrapped.is_none() {
                    // eprintln!("Could not fetch focused window.");
                    return;
                }
                let main_window = main_window_wrapped.unwrap();
                let menu_handle = main_window.menu_handle();
                if let Some(select_items) = json["enableItems"].as_array() {
                    for select_item in select_items {
                        if let Some(select_item_str) = select_item.as_str() {
                            let item = menu_handle.try_get_item(select_item_str);
                            if item.is_none() {
                                eprintln!("Could not get this item: {}", select_item_str);
                                return;
                            } else {
                                let _ = item.unwrap().set_enabled(true);
                            }
                        }
                    }
                }
                if let Some(deselect_items) = json["disableItems"].as_array() {
                    for deselect_item in deselect_items {
                        if let Some(deselect_item_str) = deselect_item.as_str() {
                            let item = menu_handle.try_get_item(deselect_item_str);
                            if item.is_none() {
                                eprintln!("Could not get this item: {}", deselect_item_str);
                                return;
                            } else {
                                let _ = item.unwrap().set_enabled(false);
                            }
                        }
                    }
                }
            }
            Err(e) => {
                eprintln!("Error parsing JSON: {}", e);
            }
        }
    });
    */
    // listen to text file saves (emitted on any window)
    let handle_text_file = app_handle.clone();
    app.listen("save-text-file", move |event| {
        let json_raw = event.payload();
        let json_value: Result<Value, _> = from_str(json_raw);
        match json_value {
            Ok(json) => {
                let name = json["name"].as_str().unwrap_or("N/A");
                let contents = json["contents"].as_str().unwrap_or("N/A");
                let path = json["path"].as_str().unwrap_or("N/A");
				let window_label = json["label"].as_str().unwrap_or("N/A");
                let _ = create_text_file(name, contents, path);
                // Do callback
                let callback = json["callback"].as_str().unwrap_or("N/A");
                if callback != "N/A" && callback != "" {
                    let main_window = handle_text_file.get_webview_window(window_label).unwrap();
                    main_window
                        .emit(
                            callback,
                            Payload {
                                message: "success".to_string(),
                            },
                        )
                        .unwrap();
                }
            }
            Err(e) => {
                eprintln!("Error parsing JSON: {}", e);
            }
        }
    });

    // listen to directory creation requests
    let handle_project_dir = app_handle.clone();
    app.listen("create-directory", move |event| {
        let json_raw = event.payload();
        let json_value: Result<Value, _> = from_str(json_raw);
        match json_value {
            Ok(json) => {
                let name = json["name"].as_str().unwrap_or("N/A");
                let path = json["path"].as_str().unwrap_or("N/A");
				let window_label = json["label"].as_str().unwrap_or("N/A");
                let _ = create_directory(name, path);
                // Do callback
                let callback = json["callback"].as_str().unwrap_or("N/A");
                if callback != "N/A" && callback != "" {
                    let main_window = handle_project_dir.get_webview_window(window_label).unwrap();
                    main_window
                        .emit(
                            callback,
                            Payload {
                                message: "success".to_string(),
                            },
                        )
                        .unwrap();
                }
            }
            Err(e) => {
                eprintln!("Error parsing JSON: {}", e);
            }
        }
    });

    // listen for project file
    let handle_request_project = app_handle.clone();
    app.listen("request-project-file", move |event| {
        let json_raw = event.payload();
        let json_value: Result<Value, _> = from_str(json_raw);
        match json_value {
            Ok(json) => {
                let version_path = json["path"].as_str().unwrap_or("N/A");
				let window_label = json["label"].as_str().unwrap_or("N/A");
                let script_prefix = "window.__CHOICELAB_DATA_RAW__ = `";
                let script_suffix = "`;";
                let project_window = handle_request_project
                    .get_webview_window(window_label)
                    .unwrap();
                match read_text_file(version_path) {
                    Ok(contents) => {
                        let script_text = format!("{}{}{}", script_prefix, contents, script_suffix);
                        let script_text_ref: &str = &script_text;
                        let _ = project_window.eval(script_text_ref);
                        project_window
                            .emit("receive-project-file", Payload { message: contents })
                            .unwrap();
                    }
                    Err(e) => {
                        let contents = "__INVALID_CHOICELAB_FILE__";
                        let script_text = format!("{}{}{}", script_prefix, contents, script_suffix);
                        let script_text_ref: &str = &script_text;
                        let _ = project_window.eval(script_text_ref);
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
    let handle_create_asset = app_handle.clone();
    app.listen("create-asset", move |event| {
        let json_raw = event.payload();
        let json_value: Result<Value, _> = from_str(json_raw);
        match json_value {
            Ok(json) => {
                let file_name = json["fileName"].as_str().unwrap_or("N/A");
                let file_type = json["fileType"].as_str().unwrap_or("N/A");
                let contents = json["contents"].as_str().unwrap_or("N/A");
				let window_label = json["label"].as_str().unwrap_or("N/A");
                let assets_dir = json["assetsPath"].as_str().unwrap_or("N/A");
                if file_type == "binary" {
                    match create_binary_file(file_name, contents, assets_dir) {
                        Ok(_success) => {
                            let project_window =
                                handle_create_asset.get_webview_window(window_label).unwrap();
                            let _ = project_window.emit(
                                "asset-created",
                                Payload {
                                    message: "Asset created successfully".to_string(),
                                },
                            );
                        }
                        Err(_e) => {
                            eprintln!("Error creating asset");
                        }
                    }
                } else if file_type == "text" {
                    match create_text_file(file_name, contents, assets_dir) {
                        Ok(_success) => {
                            let project_window =
                                handle_create_asset.get_webview_window(window_label).unwrap();
                            let _ = project_window.emit(
                                "asset-created",
                                Payload {
                                    message: "Asset created successfully".to_string(),
                                },
                            );
                        }
                        Err(_e) => {
                            eprintln!("Error creating asset");
                        }
                    }
                }
            }
            Err(e) => {
                eprintln!("Error parsing JSON: {}", e);
            }
        }
    });

    // listen for reading assets
    let handle_read_asset = app_handle.clone();
    app.listen("read-asset", move |event| {
        let json_raw = event.payload();
        let json_value: Result<Value, _> = from_str(json_raw);
        match json_value {
            Ok(json) => {
                let asset_path = json["assetPath"].as_str().unwrap_or("N/A");
                let dest_path = json["cachePath"].as_str().unwrap_or("N/A");
				let window_label = json["label"].as_str().unwrap_or("N/A");
                let id = json["id"].as_str().unwrap_or("N/A");
                match copy_file(asset_path, dest_path) {
                    Ok(_success) => {
                        let project_window =
                            handle_read_asset.get_webview_window(window_label).unwrap();
                        let _ = project_window.emit(
                            &("asset-ready-".to_owned() + id),
                            Payload {
                                message: "Asset available in temp".to_string(),
                            },
                        );
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
    let handle_history = app_handle.clone();
    app.listen("request-history-version", move |event| {
        let json_raw = event.payload();
        let json_value: Result<Value, _> = from_str(json_raw);
        match json_value {
            Ok(json) => {
                let version_path = json["versionPath"].as_str().unwrap_or("N/A");
				let window_label = json["label"].as_str().unwrap_or("N/A");
                match read_text_file(version_path) {
                    Ok(contents) => {
                        let main_window = handle_history.get_webview_window(window_label).unwrap();
                        main_window
                            .emit("receive-history-version", Payload { message: contents })
                            .unwrap();
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

    // listen for cache clear
    app.listen("clear-cache", move |event| {
        let json_raw = event.payload();
        let json_value: Result<Value, _> = from_str(json_raw);
        match json_value {
            Ok(json) => {
                let cache_path = json["path"].as_str().unwrap_or("N/A");
                if cache_path != "N/A" {
                    let _ = fs::remove_dir_all(cache_path);
                }
            }
            Err(e) => {
                eprintln!("Error parsing JSON: {}", e);
            }
        }
    });

    // listen for preview mode
    // let handle_show_preview = app.app_handle();
    app.listen("update-preview", move |event| {
        let json_raw = event.payload();
        let json_value: Result<Value, _> = from_str(json_raw);
        match json_value {
            Ok(json) => {
                let project_path = json["projectPath"].as_str().unwrap_or("N/A");
                let project_data = json["projectData"].as_str().unwrap_or("N/A");
                if project_path != "N/A" && project_data != "N/A" {
                    load_preview_files(project_path, project_data).unwrap();
                }
            }
            Err(e) => {
                eprintln!("Error parsing JSON: {}", e);
            }
        }
    });
}
