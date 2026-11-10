#![allow(unexpected_cfgs)]
use objc::runtime::{Class, BOOL, NO, YES};
use objc::{msg_send, sel, sel_impl};
use std::sync::OnceLock;
use tauri::WebviewWindow;
use crate::bind_listeners::{open_whats_new_window, open_acknowledgments_window, open_license_window};

pub fn add_native_menus() {
    unsafe {
        let cls = Class::get("NativeBridge").expect("NativeBridge not found");

        let _: () = msg_send![cls, addNativeMenus];
    }
}

pub fn set_document_edited_for_window(window: &WebviewWindow, edited: bool) {
    use objc::runtime::Object;
    if let Ok(ns_window_ptr) = window.ns_window() {
        let flag: BOOL = if edited { YES } else { NO };
        unsafe {
            let ns_window = ns_window_ptr as *mut Object;
            let _: () = msg_send![ns_window, setDocumentEdited: flag];
        }
    }
}

static APP_HANDLE: OnceLock<tauri::AppHandle> = OnceLock::new();

pub fn set_app_handle(handle: tauri::AppHandle) {
    // Only set once; subsequent calls will fail silently.
    if APP_HANDLE.set(handle).is_err() {
        eprintln!("Warning: APP_HANDLE was already set. Ignoring duplicate set.");
    }
}

#[no_mangle]
pub extern "C" fn menu_license_clicked() {
    if let Some(app_handle) = APP_HANDLE.get() {
        tauri::async_runtime::block_on(async {
            open_license_window(app_handle.clone());
        });
    } else {
        eprintln!("ERROR: AppHandle not set. Call set_app_handle() early in your Tauri main function.");
    }
}

#[no_mangle]
pub extern "C" fn menu_release_notes_clicked() {
    if let Some(app_handle) = APP_HANDLE.get() {
        tauri::async_runtime::block_on(async {
			open_whats_new_window(app_handle.clone());
        });
    } else {
        eprintln!("ERROR: AppHandle not set. Call set_app_handle() early in your Tauri main function.");
    }
}

extern "C" {
    fn show_app_icon_dialog(
        title: *const std::ffi::c_char,
        body: *const std::ffi::c_char,
        ok_label: *const std::ffi::c_char,
        cancel_label: *const std::ffi::c_char,
    ) -> i8;

    fn show_unsaved_changes_dialog_native(
        title: *const std::ffi::c_char,
        body: *const std::ffi::c_char,
    ) -> i8;
}

/// Show a native NSAlert with the app icon. Blocks the calling thread until the
/// user responds (internally uses dispatch_sync to the main queue), so this must
/// be called from a background thread, not the main thread.
/// Show a native NSAlert with the app icon and no cancel button (informational only).
/// Must be called from a background thread.
pub fn show_app_message(title: &str, body: &str) {
    use std::ffi::CString;
    let t = CString::new(title.replace('\0', "")).unwrap();
    let b = CString::new(body.replace('\0', "")).unwrap();
    let ok = CString::new("OK").unwrap();
    let empty = CString::new("").unwrap();
    unsafe { show_app_icon_dialog(t.as_ptr(), b.as_ptr(), ok.as_ptr(), empty.as_ptr()); }
}

pub fn show_guard_dialog(title: &str, body: &str, ok_label: &str, cancel_label: &str) -> bool {
    use std::ffi::CString;
    let t = CString::new(title.replace('\0', "")).unwrap();
    let b = CString::new(body.replace('\0', "")).unwrap();
    let ok = CString::new(ok_label).unwrap();
    let cancel = CString::new(cancel_label).unwrap();
    unsafe { show_app_icon_dialog(t.as_ptr(), b.as_ptr(), ok.as_ptr(), cancel.as_ptr()) != 0 }
}

/// Show the standard three-button unsaved-changes sheet (Save / Don't Save / Cancel).
/// Returns "save", "dont_save", or "cancel".
/// Must be called from a background thread.
pub fn show_unsaved_changes_dialog(title: &str, body: &str) -> &'static str {
    use std::ffi::CString;
    let t = CString::new(title.replace('\0', "")).unwrap();
    let b = CString::new(body.replace('\0', "")).unwrap();
    match unsafe { show_unsaved_changes_dialog_native(t.as_ptr(), b.as_ptr()) } {
        0 => "save",
        1 => "dont_save",
        _ => "cancel",
    }
}

#[no_mangle]
pub extern "C" fn menu_acknowledgments_clicked() {
    if let Some(app_handle) = APP_HANDLE.get() {
        tauri::async_runtime::block_on(async {
            open_acknowledgments_window(app_handle.clone());
        });
    } else {
        eprintln!("ERROR: AppHandle not set. Call set_app_handle() early in your Tauri main function.");
    }
}
extern "C" {
    fn get_window_button_bottom_gap() -> f64;
}

// Where the project window's traffic lights and title go, in points from the
// window's top-left corner. Fixed rather than following the system default,
// since they sit in Choicelab's own toolbar, which looks the same on every
// macOS version.
const TRAFFIC_LIGHT_LEFT: f64 = 12.0;
const TRAFFIC_LIGHT_TOP: f64 = 12.0;
const TITLE_LEFT: f64 = 85.0;
const TITLE_TOP: f64 = 11.0;

/// Where the frontend draws the project window's title. AppKit doesn't move
/// its own title along with the traffic lights, so it's hidden.
#[derive(Clone, Copy, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectTitleBarLayout {
    /// The close button's position, in the units `traffic_light_position()`
    /// expects, which puts the button's top edge `y - bottom gap` from the
    /// window's top.
    #[serde(skip)]
    traffic_light_x: f64,
    #[serde(skip)]
    traffic_light_y: f64,
    title_left: f64,
    title_top: f64,
}

static PROJECT_TITLE_BAR_LAYOUT: OnceLock<Option<ProjectTitleBarLayout>> = OnceLock::new();

/// Must be called on the main thread, before any project window opens
/// (project windows opened earlier keep the system layout).
pub fn init_project_title_bar_layout() {
    PROJECT_TITLE_BAR_LAYOUT.get_or_init(|| {
        let bottom_gap = unsafe { get_window_button_bottom_gap() };
        // Anything outside this range means AppKit's title bar isn't laid
        // out the way this expects (e.g. a future macOS changed it)
        if !(bottom_gap > 0.0 && bottom_gap < 30.0) {
            eprintln!(
                "Unexpected title bar measurement ({}); using the system layout.",
                bottom_gap
            );
            return None;
        }
        #[cfg(debug_assertions)]
        println!(
            "Project title bar: traffic lights at ({}, {}), button bottom gap {}",
            TRAFFIC_LIGHT_LEFT, TRAFFIC_LIGHT_TOP, bottom_gap
        );
        Some(ProjectTitleBarLayout {
            traffic_light_x: TRAFFIC_LIGHT_LEFT,
            traffic_light_y: TRAFFIC_LIGHT_TOP + bottom_gap,
            title_left: TITLE_LEFT,
            title_top: TITLE_TOP,
        })
    });
}

pub fn project_title_bar_layout() -> Option<ProjectTitleBarLayout> {
    PROJECT_TITLE_BAR_LAYOUT.get().copied().flatten()
}

/// Starts building a project window with an overlay title bar and inset
/// traffic lights, with the native title hidden so the frontend can draw it in
/// the matching spot. Falls back to the system layout (native title included)
/// if the title bar couldn't be measured.
///
/// Goes through a window config because `traffic_light_position()` on the
/// builder only reaches the webview, which re-applies the position when it
/// redraws, but not when AppKit resets the buttons on a title change. The
/// config also gives it to the window itself, which does handle that.
pub fn project_window_builder<'a, R: tauri::Runtime, M: tauri::Manager<R>>(
    manager: &'a M,
    label: String,
    url: tauri::WebviewUrl,
) -> tauri::Result<tauri::WebviewWindowBuilder<'a, R, M>> {
    use tauri::utils::config::{LogicalPosition, WindowConfig};
    let layout = project_title_bar_layout();
    let config = WindowConfig {
        label,
        url,
        title_bar_style: tauri::TitleBarStyle::Overlay,
        hidden_title: layout.is_some(),
        traffic_light_position: layout.map(|layout| LogicalPosition {
            x: layout.traffic_light_x,
            y: layout.traffic_light_y,
        }),
        ..Default::default()
    };
    tauri::WebviewWindowBuilder::from_config(manager, &config)
}
