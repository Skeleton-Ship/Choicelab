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