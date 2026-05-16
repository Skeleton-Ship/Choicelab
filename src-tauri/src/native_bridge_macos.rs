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