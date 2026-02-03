use crate::file_operations::{
    copy_file, create_binary_file, create_directory, create_text_file, load_preview_files,
    read_text_file,
};
use crate::check_for_updates::update;
use crate::globals::PENDING_FILES;
#[cfg(target_os = "macos")]
use crate::native_bridge_macos::{add_native_menus, set_document_edited_with_title};
use serde::{Serialize};
use serde_json::{from_str, Value};
use std::collections::HashMap;
use std::fs;
use std::sync::{Mutex, OnceLock};
use tauri::Emitter;
use tauri::Listener;
use tauri::Manager;
use tauri::WebviewWindow;
use tauri::menu::{MenuItemKind, IsMenuItem};
#[cfg(target_os = "macos")]
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};


#[derive(Clone, serde::Serialize)]
struct Payload {
    message: String,
}

#[derive(Clone, Serialize)]
struct HistoryPayload {
    message: String,
    version_id: String,
}

fn apply_project_vibrancy(window: WebviewWindow) {
    #[cfg(target_os = "macos")]
    apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, None)
        .expect("Unsupported platform! 'apply_vibrancy' is only supported on macOS");
}

// Global port tracker for preview servers (4090–4099)
static PREVIEW_PORTS: OnceLock<Mutex<[bool; 10]>> = OnceLock::new();
static PORT_LABEL_MAP: OnceLock<Mutex<HashMap<String, u16>>> = OnceLock::new();

fn get_next_available_port() -> Option<u16> {
    let ports = PREVIEW_PORTS.get_or_init(|| Mutex::new([false; 10]));
    let mut ports = ports.lock().unwrap();
    for (i, used) in ports.iter_mut().enumerate() {
        if !*used {
            *used = true;
            return Some(4090 + i as u16);
        }
    }
    None
}

// Returns the port if one is already assigned to the label, else None
fn get_port_for_label(label: &str) -> Option<u16> {
    let map = PORT_LABEL_MAP.get_or_init(|| Mutex::new(HashMap::new()));
    map.lock().unwrap().get(label).copied()
}

fn assign_port_for_label(label: &str, port: u16) {
    let map = PORT_LABEL_MAP.get_or_init(|| Mutex::new(HashMap::new()));
    map.lock().unwrap().insert(label.to_string(), port);
}

fn release_port_for_label(label: &str) {
    let map = PORT_LABEL_MAP.get_or_init(|| Mutex::new(HashMap::new()));
    if let Some(port) = map.lock().unwrap().remove(label) {
        let ports = PREVIEW_PORTS.get_or_init(|| Mutex::new([false; 10]));
        let mut ports = ports.lock().unwrap();
        if port >= 4090 && port <= 4099 {
            ports[(port - 4090) as usize] = false;
        }
    }
}

pub fn open_whats_new_window(app: tauri::AppHandle) {
	if let Some(window) = app.get_window("whatsNew") {
		let _ = window.show();
		let _ = window.set_focus();
	} else {
		let window_index = 1; // matches tauri.conf.json
		let notes_window =
			tauri::WebviewWindowBuilder::from_config(&app, &app.config().app.windows.get(window_index).unwrap())
				.unwrap()
				.build()
				.unwrap();
		let _ = notes_window.show();
		let _ = notes_window.set_focus();
	}
}

pub fn bind_listeners(app: &tauri::App) {
    let app_handle = app.app_handle();
    // Add native menus
    app.listen("set-document-edited", move |event| {
        let json_raw = event.payload();
        let json_value: Result<Value, _> = from_str(json_raw);
        match json_value {
            Ok(json) => {
                let state = json["state"].as_bool().unwrap_or(false);
                let window_title = json["windowTitle"].as_str().unwrap_or("");
                #[cfg(target_os = "macos")]
                set_document_edited_with_title(state, window_title);
            }
            Err(e) => {
                eprintln!("Error parsing JSON: {}", e);
            }
        }
    });
    // Add native menus
    let handle_menus = app_handle.clone();
    app.listen("add-native-menus", move |_event| {
        let _ = handle_menus.run_on_main_thread(|| {
                #[cfg(target_os = "macos")]
            add_native_menus();
        });
    });
let handle_update = app_handle.clone();
	app.listen("handle-update", move |_event| {
		let handle_update = handle_update.clone();
		tauri::async_runtime::spawn(async move {
			if let Err(e) = update(handle_update).await {
				eprintln!("Update failed: {:?}", e);
			}
		});
	});
    // When project is ready, set vibrancy
    let handle_project_open = app_handle.clone();
    app.listen("window-ready", move |event| {
        // Set vibrancy
        let json_raw = event.payload();
        let json_value: Result<Value, _> = from_str(json_raw);
        match json_value {
            Ok(json) => {
                let window_label = json["label"].as_str().unwrap_or("N/A");
                let project_window = handle_project_open
                    .get_webview_window(window_label)
                    .unwrap();
                let _ = handle_project_open
                    .run_on_main_thread(|| apply_project_vibrancy(project_window));
                // Emit any pending files (global, not per window)
                {
                    let mut pending = PENDING_FILES.lock().unwrap();
                    if !pending.is_empty() {
                        let files = pending.drain(..).collect::<Vec<_>>();
                        if let Some(project_window) =
                            handle_project_open.get_webview_window(window_label)
                        {
                            let _ = project_window.emit("opened-files", files);
                        }
                    } else {
                    }
                }

                // If the window label indicates a project, start a preview server for it
                if window_label.starts_with("project_")
                    && !window_label.starts_with("project_settings_")
                {
                    if let Some(existing_port) = get_port_for_label(window_label) {
                        let project_window = handle_project_open
                            .get_webview_window(window_label)
                            .unwrap();
                        let _ = project_window.emit(
                            "preview-port",
                            serde_json::json!({ "port": existing_port, "label": window_label }),
                        );
                    } else if let Some(preview_path) =
                        crate::file_operations::get_preview_path(&window_label)
                    {
                        if let Some(port) = get_next_available_port() {
                            std::thread::spawn(move || {
                                let rt = tokio::runtime::Runtime::new()
                                    .expect("Failed to create Tokio runtime");
                                let fut = crate::preview_server::start_server(preview_path, port);
                                let _ = rt.block_on(async move { fut.await });
                            });
                            let project_window = handle_project_open
                                .get_webview_window(window_label)
                                .unwrap();
                            let _ = project_window.emit(
                                "preview-port",
                                serde_json::json!({ "port": port, "label": window_label }),
                            );
                            assign_port_for_label(window_label, port);
                        } else {
                            eprintln!("No available preview ports (4090–4099)");
                        }
                    } else {
                        eprintln!(
                            "Could not determine preview path for project: {}",
                            window_label
                        );
                    }
                }
            }
            Err(e) => {
                eprintln!("Error parsing JSON: {}", e);
            }
        }
    });
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
                let overwrite = json["overwrite"].as_bool().unwrap_or(false);
                let window_label = json["label"].as_str().unwrap_or("N/A");
                let _ = create_directory(name, path, &overwrite);
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
                        eprintln!("Error reading project file: {}", e);
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
                            let project_window = handle_create_asset
                                .get_webview_window(window_label)
                                .unwrap();
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
                            let project_window = handle_create_asset
                                .get_webview_window(window_label)
                                .unwrap();
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
                let version_id = json["versionId"].as_str().unwrap_or("N/A");
                let window_label = json["label"].as_str().unwrap_or("N/A");
                match read_text_file(version_path) {
                    Ok(contents) => {
                        let main_window = handle_history.get_webview_window(window_label).unwrap();
                        main_window
                            .emit(
                                "receive-history-version",
                                HistoryPayload {
                                    message: contents,
                                    version_id: version_id.to_string(),
                                },
                            )
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
                let project_label = json["projectLabel"].as_str().unwrap_or("N/A");
                let include_assets = json["includeAssets"].as_bool().unwrap_or(false);
                if project_path != "N/A" && project_data != "N/A" {
                    load_preview_files(project_path, project_data, project_label, &include_assets)
                        .unwrap();
                }
            }
            Err(e) => {
                eprintln!("Error parsing JSON: {}", e);
            }
        }
    });
    // Listen for window close to release preview port
    app.listen("tauri://close-requested", move |event| {
        let json_raw = event.payload();
        let json_value: Result<Value, _> = from_str(json_raw);
        if let Ok(json) = json_value {
            let window_label = json["label"].as_str().unwrap_or("");
            if window_label.starts_with("project_") {
                release_port_for_label(window_label);
            }
        }
    });
	
	// listen for what's new window to open
	let handle_whats_new = app_handle.clone();
	app.listen("whatsNew-window", move |_event| {
		open_whats_new_window(handle_whats_new.clone());
	});

    // listen for menu events
    let handle_menu_item_state = app_handle.clone();
    app.listen("set-menu-item-state", move |event| {
        let json_raw = event.payload();
        let json_value: Result<Value, _> = from_str(json_raw);
        match json_value {
            Ok(json) => {
                let submenu_id = json["submenu"].as_str().unwrap_or("N/A").to_string();
                let item_id = json["id"].as_str().unwrap_or("N/A").to_string();
                let enabled: Option<bool> = json["enabled"].as_bool();
                let checked: Option<bool> = json["checked"].as_bool();
                let text = json["text"].as_str().unwrap_or("").to_string();

                let handle = handle_menu_item_state.clone();
                let _ = handle_menu_item_state.run_on_main_thread(move || {
                    // Try to get the menu - on macOS use app menu, on Windows/Linux use window menu
                    let menu_opt = {
                        #[cfg(target_os = "macos")]
                        {
                            handle.app_handle().menu()
                        }
						// TODO: Figure out why this doesn't load the menu on Windows
                        #[cfg(not(target_os = "macos"))]
                        {
                            // Try to get menu from any webview window that has one
                            handle.webview_windows()
                                .values()
                                .find_map(|w| w.menu())
                        }
                    };

                    if let Some(menu) = menu_opt {
                        println!("Menu found! Looking for submenu: {}, item: {}", submenu_id, item_id);
                        let items = menu.items().unwrap_or_default();
                        println!("Menu has {} top-level items", items.len());

                        // Iterate through menu items to find the submenu
                        let mut found_submenu = false;
                        for menu_item in items {
                            if let MenuItemKind::Submenu(submenu) = menu_item.kind() {
                                if submenu.id().as_ref() == submenu_id.as_str() {
                                    println!("Found submenu: {}", submenu_id);
                                    found_submenu = true;

                                    // Get the menu item by ID from the submenu
                                    if let Some(item) = submenu.get(&item_id) {
                                        println!("Found item: {}", item_id);
                                        // Update properties based on what was provided
                                        match item.kind() {
                                            MenuItemKind::MenuItem(menu_item) => {
                                                // Update enabled state if provided
                                                if let Some(enabled_val) = enabled {
                                                    let _ = menu_item.set_enabled(enabled_val);
                                                }
                                                // Update text if provided
                                                if !text.is_empty() {
                                                    let _ = menu_item.set_text(&text);
                                                }
                                            }
                                            MenuItemKind::Check(check_item) => {
                                                // Update enabled state if provided
                                                if let Some(enabled_val) = enabled {
                                                    let _ = check_item.set_enabled(enabled_val);
                                                }
                                                // Update checked state if provided
                                                if let Some(checked_val) = checked {
                                                    let _ = check_item.set_checked(checked_val);
                                                }
                                                // Update text if provided
                                                if !text.is_empty() {
                                                    let _ = check_item.set_text(&text);
                                                }
                                            }
                                            _ => {
                                                eprintln!("Unsupported menu item type for id: {}", item_id);
                                            }
                                        }
                                    } else {
                                        eprintln!("Menu item not found: {}", item_id);
                                    }
                                    break;
                                }
                            }
                        }

                        if !found_submenu {
                            eprintln!("Submenu not found: {}", submenu_id);
                        }
                    } else {
                        eprintln!("No menu found");
                    }
                });
            }
            Err(e) => {
                eprintln!("Error parsing JSON: {}", e);
            }
        }
    });

    // Listen for menu item clicks
    app.on_menu_event(move |app_handle, event| {
        let menu_id = event.id().as_ref();
        println!("Menu item clicked: {}", menu_id);

        // Map menu item IDs to event names
        let event_name = match menu_id {
            "about" => "menu-about",
            "request-quit" => "menu-request-quit",
            "new_project" => "menu-new-project",
            "open_project" => "menu-open-project",
            "save" => "menu-save-project",
            "undo" => "menu-undo",
            "redo" => "menu-redo",
            "show_node_editor" => "menu-show-node-editor",
            "show_variables" => "menu-show-variables",
            "toggle_preview" => "menu-toggle-preview",
            "new_cell" => "menu-new-cell",
            "new_branch" => "menu-new-branch",
            "set_link" => "menu-set-link",
            "disconnect_link" => "menu-disconnect-link",
            "open_in_browser" => "menu-open-preview",
            "delete_nodes" => "menu-delete-nodes",
            "delete_stem" => "menu-delete-stem",
            "project_settings" => "menu-open-project-settings",
            "report_issue" => "menu-report-issue",
            "open_whatsNew" => "whatsNew-window",
            _ => {
                eprintln!("Unknown menu item: {}", menu_id);
                return;
            }
        };

        // Events that should go to all windows (global actions)
        let global_events = ["menu-about", "menu-new-project", "menu-open-project",
                            "menu-report-issue", "whatsNew-window"];

        if global_events.contains(&event_name) {
            // Emit globally for app-wide actions
            let _ = app_handle.emit(event_name, ());
        } else {
            // Emit only to the focused window for window-specific actions
            for window in app_handle.webview_windows().values() {
                if window.is_focused().unwrap_or(false) {
                    let _ = window.emit(event_name, ());
                    return;
                }
            }
            // Fallback: if no focused window found, emit globally
            let _ = app_handle.emit(event_name, ());
        }
    });

}
