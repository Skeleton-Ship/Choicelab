#![allow(unexpected_cfgs)]
use objc::{msg_send, sel, sel_impl};
use objc::runtime::{Class, BOOL, YES, NO};

pub fn add_native_menus() {
	unsafe {
		let cls = Class::get("_TtC12NativeBridge12NativeBridge")
			.expect("NativeBridge not found");
		
		let _: () = msg_send![cls, addNativeMenus];
	}
}

pub fn set_document_edited_with_title(edited: bool, window_title: &str) {
    use objc::runtime::Object;
    use std::ffi::CString;
    unsafe {
        let cls = Class::get("_TtC12NativeBridge12NativeBridge")
            .expect("NativeBridge not found");
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