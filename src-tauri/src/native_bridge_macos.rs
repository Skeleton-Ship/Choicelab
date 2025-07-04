#![allow(unexpected_cfgs)]
use objc::runtime::{Class, BOOL, NO, YES};
use objc::{msg_send, sel, sel_impl};
use std::sync::OnceLock;
use crate::bind_listeners::open_whats_new_window;

pub fn add_native_menus() {
    unsafe {
        let cls = Class::get("_TtC12NativeBridge12NativeBridge").expect("NativeBridge not found");

        let _: () = msg_send![cls, addNativeMenus];
    }
}

pub fn set_document_edited_with_title(edited: bool, window_title: &str) {
    use objc::runtime::Object;
    use std::ffi::CString;
    unsafe {
        let cls = Class::get("_TtC12NativeBridge12NativeBridge").expect("NativeBridge not found");
        let flag: BOOL = if edited { YES } else { NO };
        let nsstring = {
            let cstr = CString::new(window_title).unwrap();
            let nsstring: *mut Object = msg_send![Class::get("NSString").unwrap(), alloc];
            let nsstring: *mut Object = msg_send![nsstring, initWithUTF8String:cstr.as_ptr()];
            nsstring
        };
        let _: () = msg_send![cls, setDocumentEdited:flag windowTitle:nsstring];
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
pub extern "C" fn menu_release_notes_clicked() {
    // Launch or show the Tauri window with label "whats-new"
    if let Some(app_handle) = APP_HANDLE.get() {
        tauri::async_runtime::block_on(async {
			open_whats_new_window(app_handle.clone());
        });
    } else {
        eprintln!(
            "ERROR: AppHandle not set. Call set_app_handle() early in your Tauri main function."
        );
    }
}