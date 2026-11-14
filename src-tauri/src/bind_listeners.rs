use crate::file_operations::{
    create_directory, create_text_file,
    load_preview_files, read_text_file,
};
use crate::globals::{mark_app_ready, FOCUSED_WINDOW};
#[cfg(target_os = "macos")]
use crate::native_bridge_macos::{add_native_menus, set_document_edited_for_window};
use serde::{Serialize};
use serde_json::{from_str, Value};
use std::collections::HashMap;
use std::path::Path;
use std::sync::{Mutex, OnceLock};
use tauri::Emitter;
use tauri::Listener;
use tauri::Manager;
use tauri::WebviewWindow;
use tauri::menu::{MenuItemKind, IsMenuItem};
#[cfg(not(target_os = "macos"))]
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};
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

fn apply_project_vibrancy(_window: WebviewWindow) {
    #[cfg(target_os = "macos")]
    apply_vibrancy(&_window, NSVisualEffectMaterial::HudWindow, None, None)
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
    crate::globals::PREVIEW_ASSET_DIRS.lock().unwrap().remove(label);
    let map = PORT_LABEL_MAP.get_or_init(|| Mutex::new(HashMap::new()));
    if let Some(port) = map.lock().unwrap().remove(label) {
        let ports = PREVIEW_PORTS.get_or_init(|| Mutex::new([false; 10]));
        let mut ports = ports.lock().unwrap();
        if port >= 4090 && port <= 4099 {
            ports[(port - 4090) as usize] = false;
        }
    }
}


/// A window that only shows static content (release notes, license, etc.),
/// whose label is also its `window_type` in the frontend.
struct StaticWindow {
	label: &'static str,
	title: &'static str,
	size: (f64, f64),
	position: Option<(f64, f64)>,
	resizable: bool,
	minimizable: bool,
	maximizable: bool,
	/// macOS only: hide the title in the title bar
	#[cfg_attr(not(target_os = "macos"), allow(dead_code))]
	hidden_title: bool,
}

/// Focuses the window if it's already open, or opens it if not.
fn open_static_window(app: &tauri::AppHandle, config: StaticWindow) {
	if let Some(window) = app.get_webview_window(config.label) {
		let _ = window.show();
		let _ = window.set_focus();
		return;
	}
	let url = format!("index.html?window_type={}", config.label);
	let mut builder =
		tauri::WebviewWindowBuilder::new(app, config.label, tauri::WebviewUrl::App(url.into()))
			.title(config.title)
			.inner_size(config.size.0, config.size.1)
			.resizable(config.resizable)
			.minimizable(config.minimizable)
			.maximizable(config.maximizable)
			.transparent(true)
			// Links open in the default browser (see openExternalLinks.ts);
			// never load them in the window itself
			.on_navigation(|url| crate::is_allowed_navigation(url));
	if let Some((x, y)) = config.position {
		builder = builder.position(x, y);
	}
	#[cfg(target_os = "macos")]
	{
		builder = builder
			.hidden_title(config.hidden_title)
			.title_bar_style(tauri::TitleBarStyle::Overlay);
	}
	match builder.build() {
		Ok(window) => {
			let _ = window.show();
			let _ = window.set_focus();
		}
		Err(e) => eprintln!("Failed to open window: {}", e),
	}
}

pub fn open_whats_new_window(app: tauri::AppHandle) {
	open_static_window(
		&app,
		StaticWindow {
			label: "whatsNew",
			title: "What's New in Choicelab",
			size: (600.0, 400.0),
			position: Some((600.0, 400.0)),
			resizable: false,
			minimizable: true,
			maximizable: true,
			hidden_title: true,
		},
	);
}

pub fn open_license_window(app: tauri::AppHandle) {
	open_static_window(
		&app,
		StaticWindow {
			label: "license",
			title: "Choicelab License",
			size: (620.0, 560.0),
			position: None,
			resizable: true,
			minimizable: true,
			maximizable: true,
			hidden_title: false,
		},
	);
}

pub fn open_about_window(app: tauri::AppHandle) {
	open_static_window(
		&app,
		StaticWindow {
			label: "about",
			title: "About Choicelab",
			size: (295.0, 310.0),
			position: None,
			resizable: false,
			minimizable: false,
			maximizable: false,
			hidden_title: true,
		},
	);
}

pub fn open_acknowledgments_window(app: tauri::AppHandle) {
	open_static_window(
		&app,
		StaticWindow {
			label: "acknowledgments",
			title: "Acknowledgments",
			size: (620.0, 520.0),
			position: None,
			resizable: true,
			minimizable: true,
			maximizable: true,
			hidden_title: false,
		},
	);
}

/// Rust equivalent of getDialogText() from src/utils/dialogText.ts.
/// On macOS the bold header is line1 and the body is line2 (short_title is unused).
/// On other platforms the title is short_title and the body is line1 + " " + line2.
fn get_dialog_texts(_short_title: &str, line1: &str, line2: &str) -> (String, String) {
    #[cfg(target_os = "macos")]
    {
        (line1.trim().to_string(), line2.trim().to_string())
    }
    #[cfg(not(target_os = "macos"))]
    {
        (
            _short_title.trim().to_string(),
            format!("{} {}", line1.trim(), line2.trim()),
        )
    }
}

/// Mirrors `getProjectWindowLabel()` in JS: the label is derived from the project's folder.
fn project_window_label_for_file(file_path: &str) -> Option<String> {
    let dir = std::path::Path::new(file_path).parent()?.to_str()?.trim().to_string();
    let mut sanitized: String = dir
        .chars()
        .map(|c| if c.is_ascii_alphanumeric() || c == '-' || c == '_' { c } else { '_' })
        .collect();
    if sanitized.starts_with('_') {
        sanitized.remove(0);
    }
    Some(format!("project_{}", sanitized))
}

fn find_open_project_label(app: &tauri::AppHandle) -> Option<String> {
    app.webview_windows()
        .into_keys()
        .find(|label| {
            label.starts_with("project_")
                && !label.starts_with("project_settings_")
                && !label.starts_with("project_assets_")
        })
}

pub fn bind_listeners(app: &tauri::App) {
    let app_handle = app.app_handle();
    let _handle_doc_edited = app_handle.clone();
    app.listen("set-document-edited", move |event| {
        let json_raw = event.payload();
        let json_value: Result<Value, _> = from_str(json_raw);
        match json_value {
            Ok(json) => {
                let _state = json["state"].as_bool().unwrap_or(false);
                let window_label = json["windowLabel"].as_str().unwrap_or("").to_string();
                if window_label.is_empty() { return; }
                #[cfg(target_os = "macos")]
                if let Some(window) = _handle_doc_edited.get_webview_window(&window_label) {
                    let _ = _handle_doc_edited.run_on_main_thread(move || {
                        set_document_edited_for_window(&window, _state);
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
                // The window may have closed since it sent this
                let Some(project_window) = handle_project_open.get_webview_window(window_label)
                else {
                    eprintln!("window-ready: window not found: {}", window_label);
                    return;
                };
                let vibrancy_window = project_window.clone();
                let _ = handle_project_open
                    .run_on_main_thread(move || apply_project_vibrancy(vibrancy_window));

                // If the window label indicates a project, start a preview server for it
                if window_label.starts_with("project_")
                    && !window_label.starts_with("project_settings_")
                {
                    if let Some(existing_port) = get_port_for_label(window_label) {
                        let _ = project_window.emit(
                            "preview-port",
                            serde_json::json!({ "port": existing_port, "label": window_label }),
                        );
                    } else if let Some(preview_path) = json["projectPath"]
                        .as_str()
                        .and_then(|project_path| {
                            crate::file_operations::get_preview_path(
                                &handle_project_open,
                                project_path,
                            )
                        })
                    {
                        if let Some(port) = get_next_available_port() {
                            let label_for_server = window_label.to_string();
                            std::thread::spawn(move || {
                                let rt = tokio::runtime::Runtime::new()
                                    .expect("Failed to create Tokio runtime");
                                let fut = crate::preview_server::start_server(
                                    preview_path,
                                    label_for_server,
                                    port,
                                );
                                let _ = rt.block_on(async move { fut.await });
                            });
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
                if let Err(e) = create_text_file(name, contents, path) {
                    eprintln!("Error writing {}/{}: {}", path, name, e);
                }
                // Do callback
                let callback = json["callback"].as_str().unwrap_or("N/A");
                if callback != "N/A" && callback != "" {
                    if let Some(main_window) = handle_text_file.get_webview_window(window_label) {
                        let _ = main_window.emit(
                            callback,
                            Payload {
                                message: "success".to_string(),
                            },
                        );
                    }
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
                    if let Some(main_window) = handle_project_dir.get_webview_window(window_label) {
                        let _ = main_window.emit(
                            callback,
                            Payload {
                                message: "success".to_string(),
                            },
                        );
                    }
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
                let Some(project_window) = handle_request_project.get_webview_window(window_label)
                else {
                    eprintln!("request-project-file: window not found: {}", window_label);
                    return;
                };
                match read_text_file(version_path) {
                    Ok(contents) => {
                        let encoded = serde_json::to_string(&contents).unwrap_or_else(|_| "\"\"".to_string());
                        let script_text = format!("window.__CHOICELAB_DATA_RAW__ = {};", encoded);
                        let _ = project_window.eval(&script_text);
                        let _ = project_window
                            .emit("receive-project-file", Payload { message: contents });
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
                        if let Some(main_window) = handle_history.get_webview_window(window_label) {
                            let _ = main_window.emit(
                                "receive-history-version",
                                HistoryPayload {
                                    message: contents,
                                    version_id: version_id.to_string(),
                                },
                            );
                        } else {
                            eprintln!("History response: window not found: {}", window_label);
                        }
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


    // listen for preview mode
    let handle_preview = app_handle.clone();
    app.listen("update-preview", move |event| {
        let json_raw = event.payload();
        let json_value: Result<Value, _> = from_str(json_raw);
        match json_value {
            Ok(json) => {
                let project_path = json["projectPath"].as_str().unwrap_or("N/A");
                let project_data = json["projectData"].as_str().unwrap_or("N/A");
                let project_label = json["projectLabel"].as_str().unwrap_or("N/A");
                if project_path != "N/A" && project_data != "N/A" {
                    crate::globals::PREVIEW_ASSET_DIRS
                        .lock()
                        .unwrap()
                        .insert(project_label.to_string(), Path::new(project_path).join("Assets"));
                    if let Err(e) = load_preview_files(&handle_preview, project_path, project_data) {
                        eprintln!("Error loading preview files: {}", e);
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
        let (exists, label, title) = match project_entry {
            Some((label, window)) => {
                let title = window.title().unwrap_or_default();
                (true, label.clone(), title)
            }
            None => (false, String::new(), String::new()),
        };
        let _ = handle_check_project.emit(
            "project-window-status",
            serde_json::json!({ "exists": exists, "label": label, "title": title }),
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

	// listen for about window to open
	let handle_about = app_handle.clone();
	app.listen("about-window", move |_event| {
		open_about_window(handle_about.clone());
	});

	// listen for acknowledgments window to open
	let handle_acknowledgments = app_handle.clone();
	app.listen("acknowledgments-window", move |_event| {
		open_acknowledgments_window(handle_acknowledgments.clone());
	});

    // JS signals that a project was successfully opened; update recents and rebuild menus.
    let handle_add_recent = app_handle.clone();
    app.listen("add-recent-file", move |event| {
        let json_raw = event.payload();
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(json_raw) {
            if let Some(path) = json["path"].as_str() {
                crate::preferences::add_recent_file(&handle_add_recent, path);
                // Only rebuild the menu from the focused window so multiple windows don't race
                // to call setAsAppMenu() with different windowTypes.
                let focused_label = FOCUSED_WINDOW.lock().unwrap().clone();
                if let Some(window) = handle_add_recent.get_webview_window(&focused_label) {
                    let _ = window.emit("rebuild-open-recent-menu", ());
                } else {
                    for (_, window) in handle_add_recent.webview_windows() {
                        let _ = window.emit("rebuild-open-recent-menu", ());
                    }
                }
            }
        }
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
                // The window whose state this is
                let label = json["label"].as_str().unwrap_or("").to_string();

                let handle = handle_menu_item_state.clone();
                let _ = handle_menu_item_state.run_on_main_thread(move || {
                    let menu_opt = {
                        // macOS has one app-wide menu, which reflects the focused
                        // window. Ignore state from any other window.
                        #[cfg(target_os = "macos")]
                        {
                            if *FOCUSED_WINDOW.lock().unwrap() != label {
                                return;
                            }
                            handle.app_handle().menu()
                        }
                        // Windows/Linux: each window has its own menu
                        #[cfg(not(target_os = "macos"))]
                        {
                            handle
                                .get_webview_window(&label)
                                .and_then(|w| w.menu())
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
        handle_menu_item(app_handle, event.id().as_ref(), None);
    });
}

/// Run a menu item by ID. Used for menu clicks, and on Windows for keyboard
/// shortcuts, which WebView2 receives before the menu can (see trigger_menu_item).
///
/// `window_label` is the window the command is for. A shortcut knows which
/// window it was pressed in; for a menu click, it's None, and the focused
/// window is used.
pub fn handle_menu_item(app_handle: &tauri::AppHandle, menu_id: &str, window_label: Option<String>) {
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

    // Open Recent: Rust resolves the path and opens the window directly.
    if menu_id.starts_with("open_recent_") {
        let idx: usize = menu_id["open_recent_".len()..].parse().unwrap_or(usize::MAX);
        // Use the raw (unpruned) list so the clicked index matches what was in
        // the menu when it was built, regardless of any files that may have gone
        // missing since then.
        let files = crate::preferences::read_recent_files_raw(app_handle);
        if let Some(file_path) = files.get(idx).cloned() {
            if !std::path::Path::new(&file_path).exists() {
                // Remove the stale entry and trigger a menu rebuild before
                // notifying JS to show the not-found dialog.
                crate::preferences::remove_recent_file(app_handle, &file_path);
                for (_, window) in app_handle.webview_windows() {
                    let _ = window.emit("rebuild-open-recent-menu", ());
                }
                let project_name = std::path::Path::new(&file_path)
                    .file_stem()
                    .and_then(|s| s.to_str())
                    .unwrap_or("Unknown")
                    .to_string();
                #[cfg(target_os = "macos")]
                let file_manager = "Finder";
                #[cfg(not(target_os = "macos"))]
                let file_manager = "Explorer";
                let (dialog_title, dialog_body) = get_dialog_texts(
                    "Couldn't locate project",
                    &format!("\"{}\" couldn't be located.", project_name),
                    &format!("If the file was recently moved, try opening it from {} first.", file_manager),
                );
                #[cfg(target_os = "macos")]
                std::thread::spawn(move || {
                    crate::native_bridge_macos::show_app_message(&dialog_title, &dialog_body);
                });
                #[cfg(not(target_os = "macos"))]
                app_handle
                    .dialog()
                    .message(&dialog_body)
                    .title(&dialog_title)
                    .kind(MessageDialogKind::Info)
                    .show(|_| {});
            } else if find_open_project_label(app_handle).is_some()
                && find_open_project_label(app_handle) == project_window_label_for_file(&file_path)
            {
                // The chosen project is already the open one — nothing to do.
            } else if let Some(existing_label) = find_open_project_label(app_handle) {
                // A project is already open — ask it to handle close/save then open the new one.
                let new_project_name = std::path::Path::new(&file_path)
                    .file_stem()
                    .and_then(|s| s.to_str())
                    .unwrap_or("the new project")
                    .to_string();
                let current_project_name = app_handle
                    .get_webview_window(&existing_label)
                    .and_then(|w| w.title().ok())
                    .unwrap_or_else(|| "the current project".to_string());
                let (dialog_title, dialog_body) = get_dialog_texts(
                    "Open Project",
                    &format!("To open \"{}\", you'll need to close \"{}\" first.", new_project_name, current_project_name),
                    "",
                );
                let handle_guard = app_handle.clone();
                #[cfg(target_os = "macos")]
                {
                    // Spawn a background thread so we can use dispatch_sync to the
                    // main queue without deadlocking (on_menu_event runs on main).
                    std::thread::spawn(move || {
                        let confirmed = crate::native_bridge_macos::show_guard_dialog(
                            &dialog_title,
                            &dialog_body,
                            "Switch Project",
                            "Cancel",
                        );
                        if confirmed {
                            if let Some(window) = handle_guard.get_webview_window(&existing_label) {
                                let _ = window.emit("close-for-project-open", serde_json::json!({ "path": file_path }));
                            }
                        }
                    });
                }
                #[cfg(not(target_os = "macos"))]
                {
                    app_handle
                        .dialog()
                        .message(&dialog_body)
                        .title(&dialog_title)
                        .kind(MessageDialogKind::Info)
                        .buttons(MessageDialogButtons::OkCancelCustom(
                            "OK".into(),
                            "Cancel".into(),
                        ))
                        .show(move |confirmed| {
                            if confirmed {
                                if let Some(window) = handle_guard.get_webview_window(&existing_label) {
                                    let _ = window.emit("close-for-project-open", serde_json::json!({ "path": file_path }));
                                }
                            }
                        });
                }
            } else {
                // No existing project — open directly.
                let handle = app_handle.clone();
                let _ = app_handle.run_on_main_thread(move || {
                    if let Err(e) = crate::open_project_from_path(&handle, &file_path) {
                        eprintln!("Failed to open recent project: {}", e);
                    }
                });
            }
        }
        return;
    }

    // Clear Menu: wipe the list and ask all windows to rebuild their menus.
    if menu_id == "clear_recent" {
        crate::preferences::clear_recent_files(app_handle);
        for (_, window) in app_handle.webview_windows() {
            let _ = window.emit("rebuild-open-recent-menu", ());
        }
        return;
    }

    // Map menu item IDs to event names
    let event_name = match menu_id {
        "about" => "about-window",
        "check_for_updates" => "menu-check-for-updates",
        "new_project" => "menu-new-project",
        "open_project" => "menu-open-project",
        "save" => "menu-save-project",
        "save_as" => "menu-save-as-project",
			"export" => "menu-export-project",
        "undo" => "menu-undo",
        "redo" => "menu-redo",
        "insert_variable" => "menu-insert-variable",
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
        "add_stem" => "menu-add-stem",
        "add_no_match_stem" => "menu-add-no-match-stem",
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

    let label = window_label.unwrap_or_else(|| FOCUSED_WINDOW.lock().unwrap().clone());
    if let Some(window) = app_handle.get_webview_window(&label) {
        let _ = window.emit(event_name, serde_json::json!({ "label": label }));
    }
}
