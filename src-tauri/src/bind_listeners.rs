use crate::file_operations::{
    copy_file, create_binary_file, create_directory, create_text_file, export_project_files,
    find_file_in_dir, load_preview_files, read_text_file,
};
use crate::check_for_updates::update;
use crate::globals::{mark_app_ready, FOCUSED_WINDOW};
#[cfg(target_os = "macos")]
use crate::native_bridge_macos::{add_native_menus, set_document_edited_for_window};
use serde::{Serialize};
use serde_json::{from_str, Value};
use std::collections::HashMap;
use std::fs;
use std::path::Path;
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
#[serde(rename_all = "camelCase")]
struct AssetCreatedPayload {
    file_name: String,
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
static PENDING_CLOSE_LABEL: OnceLock<Mutex<Option<String>>> = OnceLock::new();

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

pub fn open_launcher_window(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("launcher") {
        let _ = window.show();
        let _ = window.set_focus();
    } else {
        let builder = tauri::WebviewWindowBuilder::new(
            &app,
            "launcher",
            tauri::WebviewUrl::App("index.html?window_type=launcher".into()),
        )
        .title("Launcher")
        .inner_size(650.0, 375.0)
        .resizable(false)
        .transparent(true);
        #[cfg(target_os = "macos")]
        let builder = builder
            .hidden_title(true)
            .title_bar_style(tauri::TitleBarStyle::Overlay);
        let _ = builder.build();
    }
}

pub fn open_whats_new_window(app: tauri::AppHandle) {
	if let Some(window) = app.get_webview_window("whatsNew") {
		let _ = window.show();
		let _ = window.set_focus();
	} else {
		let builder = tauri::WebviewWindowBuilder::new(
			&app,
			"whatsNew",
			tauri::WebviewUrl::App("index.html?window_type=whatsNew".into()),
		)
		.title("What's New in Choicelab")
		.inner_size(600.0, 400.0)
		.position(600.0, 400.0)
		.resizable(false)
		.transparent(true);
		#[cfg(target_os = "macos")]
		let builder = builder
			.hidden_title(true)
			.title_bar_style(tauri::TitleBarStyle::Overlay);
		let window = builder.build().unwrap();
		let _ = window.show();
		let _ = window.set_focus();
	}
}

pub fn open_license_window(app: tauri::AppHandle) {
	if let Some(window) = app.get_webview_window("license") {
		let _ = window.show();
		let _ = window.set_focus();
	} else {
		let builder = tauri::WebviewWindowBuilder::new(
			&app,
			"license",
			tauri::WebviewUrl::App("index.html?window_type=license".into()),
		)
		.title("Choicelab License")
		.inner_size(620.0, 560.0)
		.resizable(true)
		.transparent(true);
		#[cfg(target_os = "macos")]
		let builder = builder
			.title_bar_style(tauri::TitleBarStyle::Overlay);
		let window = builder.build().unwrap();
		let _ = window.show();
		let _ = window.set_focus();
	}
}

pub fn open_acknowledgments_window(app: tauri::AppHandle) {
	if let Some(window) = app.get_webview_window("acknowledgments") {
		let _ = window.show();
		let _ = window.set_focus();
	} else {
		let builder = tauri::WebviewWindowBuilder::new(
			&app,
			"acknowledgments",
			tauri::WebviewUrl::App("index.html?window_type=acknowledgments".into()),
		)
		.title("Acknowledgments")
		.inner_size(620.0, 520.0)
		.resizable(true)
		.transparent(true);
		#[cfg(target_os = "macos")]
		let builder = builder
			.title_bar_style(tauri::TitleBarStyle::Overlay);
		let window = builder.build().unwrap();
		let _ = window.show();
		let _ = window.set_focus();
	}
}

pub fn bind_listeners(app: &tauri::App) {
    let app_handle = app.app_handle();
    let handle_doc_edited = app_handle.clone();
    app.listen("set-document-edited", move |event| {
        let json_raw = event.payload();
        let json_value: Result<Value, _> = from_str(json_raw);
        match json_value {
            Ok(json) => {
                let state = json["state"].as_bool().unwrap_or(false);
                let window_label = json["windowLabel"].as_str().unwrap_or("").to_string();
                if window_label.is_empty() { return; }
                #[cfg(target_os = "macos")]
                if let Some(window) = handle_doc_edited.get_webview_window(&window_label) {
                    let _ = handle_doc_edited.run_on_main_thread(move || {
                        set_document_edited_for_window(&window, state);
                    });
                }
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
			if let Err(e) = update(handle_update.clone()).await {
				eprintln!("Update failed: {:?}", e);
				let _ = handle_update.emit("update-failed", Payload { message: e.to_string() });
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
                mark_app_ready();
                let project_window = handle_project_open
                    .get_webview_window(window_label)
                    .unwrap();
                let _ = handle_project_open
                    .run_on_main_thread(|| apply_project_vibrancy(project_window));

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
                    // Close any project window pending replacement by this one
                    let pending = PENDING_CLOSE_LABEL.get_or_init(|| Mutex::new(None));
                    if let Some(old_label) = pending.lock().unwrap().take() {
                        let app_clone = handle_project_open.clone();
                        let _ = handle_project_open.run_on_main_thread(move || {
                            let suffix = old_label["project_".len()..].to_string();
                            let windows = app_clone.webview_windows();
                            for (win_label, window) in windows.iter() {
                                if *win_label == old_label
                                    || *win_label == format!("project_settings_{}", suffix)
                                    || *win_label == format!("project_assets_{}", suffix)
                                {
                                    let _ = window.close();
                                }
                            }
                        });
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

    // listen to binary file saves (e.g. font files for preview)
    app.listen("save-binary-file", move |event| {
        let json_raw = event.payload();
        let json_value: Result<Value, _> = from_str(json_raw);
        match json_value {
            Ok(json) => {
                let name = json["name"].as_str().unwrap_or("N/A");
                let contents = json["contents"].as_str().unwrap_or("N/A");
                let path = json["path"].as_str().unwrap_or("N/A");
                let _ = create_binary_file(name, contents, path);
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
                let project_window = handle_request_project
                    .get_webview_window(window_label)
                    .unwrap();
                match read_text_file(version_path) {
                    Ok(contents) => {
                        let encoded = serde_json::to_string(&contents).unwrap_or_else(|_| "\"\"".to_string());
                        let script_text = format!("window.__CHOICELAB_DATA_RAW__ = {};", encoded);
                        let _ = project_window.eval(&script_text);
                        project_window
                            .emit("receive-project-file", Payload { message: contents })
                            .unwrap();
                    }
                    Err(e) => {
                        let script_text = "window.__CHOICELAB_DATA_RAW__ = \"__INVALID_CHOICELAB_FILE__\";";
                        let _ = project_window.eval(script_text);
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
                // If the file already exists anywhere in Assets, use that path instead of copying.
                let resolved_name = match find_file_in_dir(Path::new(assets_dir), file_name) {
                    Some(existing) => Some(existing),
                    None => {
                        let result = if file_type == "binary" {
                            create_binary_file(file_name, contents, assets_dir)
                        } else if file_type == "text" {
                            create_text_file(file_name, contents, assets_dir)
                        } else {
                            Err(std::io::Error::new(std::io::ErrorKind::InvalidInput, "Unknown file type"))
                        };
                        match result {
                            Ok(_) => Some(file_name.to_string()),
                            Err(_) => {
                                eprintln!("Error creating asset");
                                None
                            }
                        }
                    }
                };
                if let Some(name) = resolved_name {
                    let project_window = handle_create_asset
                        .get_webview_window(window_label)
                        .unwrap();
                    let _ = project_window.emit(
                        "asset-created",
                        AssetCreatedPayload { file_name: name },
                    );
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
                    if let Err(e) = load_preview_files(project_path, project_data, project_label, &include_assets) {
                        eprintln!("Error loading preview files: {}", e);
                    }
                }
            }
            Err(e) => {
                eprintln!("Error parsing JSON: {}", e);
            }
        }
    });
    app.listen("export-project", move |event| {
        let json_raw = event.payload();
        let json_value: Result<Value, _> = from_str(json_raw);
        match json_value {
            Ok(json) => {
                let project_path = json["projectPath"].as_str().unwrap_or("N/A");
                let project_data = json["projectData"].as_str().unwrap_or("N/A");
                let export_dir = json["exportDir"].as_str().unwrap_or("N/A");
                if project_path != "N/A" && project_data != "N/A" && export_dir != "N/A" {
                    if let Err(e) = export_project_files(project_path, project_data, export_dir) {
                        eprintln!("Error exporting project files: {}", e);
                    }
                }
            }
            Err(e) => {
                eprintln!("Error parsing JSON: {}", e);
            }
        }
    });

    // Check whether a project window is currently open
    let handle_check_project = app_handle.clone();
    app.listen("check-project-window", move |_event| {
        let windows = handle_check_project.webview_windows();
        let project_entry = windows.iter().find(|(label, _)| {
            label.starts_with("project_")
                && !label.starts_with("project_settings_")
                && !label.starts_with("project_assets_")
        });
        let (exists, label) = match project_entry {
            Some((label, _)) => (true, label.clone()),
            None => (false, String::new()),
        };
        let _ = handle_check_project.emit(
            "project-window-status",
            serde_json::json!({ "exists": exists, "label": label }),
        );
    });

    // Store a project window label to close once the next project window opens
    app.listen("set-pending-close", move |event| {
        let json_raw = event.payload();
        let json_value: Result<Value, _> = from_str(json_raw);
        if let Ok(json) = json_value {
            if let Some(label) = json["label"].as_str() {
                let pending = PENDING_CLOSE_LABEL.get_or_init(|| Mutex::new(None));
                *pending.lock().unwrap() = Some(label.to_string());
            }
        }
    });

    // Clear the pending close label (e.g., user cancelled the new/open dialog)
    app.listen("clear-pending-close", move |_event| {
        let pending = PENDING_CLOSE_LABEL.get_or_init(|| Mutex::new(None));
        pending.lock().unwrap().take();
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

	// listen for license window to open
	let handle_license = app_handle.clone();
	app.listen("license-window", move |_event| {
		open_license_window(handle_license.clone());
	});

	// listen for acknowledgments window to open
	let handle_acknowledgments = app_handle.clone();
	app.listen("acknowledgments-window", move |_event| {
		open_acknowledgments_window(handle_acknowledgments.clone());
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
                        #[cfg(not(target_os = "macos"))]
                        {
                            // Try to get menu from any webview window that has one
                            handle.webview_windows()
                                .values()
                                .find_map(|w| w.menu())
                        }
                    };

                    if let Some(menu) = menu_opt {
                        let items = menu.items().unwrap_or_default();

                        // Iterate through menu items to find the submenu
                        let mut found_submenu = false;
                        for menu_item in items {
                            if let MenuItemKind::Submenu(submenu) = menu_item.kind() {
                                if submenu.id().as_ref() == submenu_id.as_str() {
                                    found_submenu = true;

                                    // Get the menu item by ID from the submenu
                                    if let Some(item) = submenu.get(&item_id) {
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

        // Quit is handled directly in Rust: emit to open project windows so they
        // can prompt for unsaved changes. If none are open, exit immediately.
        if menu_id == "request-quit" {
            let all_windows = app_handle.webview_windows();
            let project_windows: Vec<_> = all_windows
                .iter()
                .filter(|(label, _)| {
                    label.starts_with("project_") && !label.starts_with("project_settings_")
                })
                .collect();
            if !project_windows.is_empty() {
                for (win_label, window) in &project_windows {
                    let _ = window.emit("menu-request-quit", serde_json::json!({ "label": win_label }));
                }
            } else {
                app_handle.exit(0);
            }
            return;
        }

        // Map menu item IDs to event names
        let event_name = match menu_id {
            "about" => "menu-about",
            "new_project" => "menu-new-project",
            "open_project" => "menu-open-project",
            "save" => "menu-save-project",
			"export" => "menu-export-project",
            "undo" => "menu-undo",
            "redo" => "menu-redo",
            "show_node_editor" => "menu-show-node-editor",
            "show_variables" => "menu-show-variables",
            "toggle_preview" => "menu-toggle-preview",
            "new_cell" => "menu-new-cell",
            "new_branch" => "menu-new-branch",
            "set_link" => "menu-set-link",
            "disconnect_link" => "menu-disconnect-link",
			"autofill" => "menu-autofill",
            "open_in_browser" => "menu-open-preview",
            "delete_nodes" => "menu-delete-nodes",
            "delete_stem" => "menu-delete-stem",
            "project_settings" => "menu-open-project-settings",
			"open_help" => "menu-open-help",
            "report_issue" => "menu-report-issue",
			"open_choicelab_site" => "menu-open-choicelab-site",
			"open_repo" => "menu-open-repo",
            "open_whatsNew" => "whatsNew-window",
            "open_license" => "license-window",
            "open_acknowledgments" => "acknowledgments-window",
            _ => {
                eprintln!("Unknown menu item: {}", menu_id);
                return;
            }
        };

        let label = FOCUSED_WINDOW.lock().unwrap().clone();
        if let Some(window) = app_handle.get_webview_window(&label) {
            let _ = window.emit(event_name, serde_json::json!({ "label": label }));
        }
    });

}
