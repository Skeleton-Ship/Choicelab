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

pub fn set_document_edited(edited: bool) {
	unsafe {
		let cls = Class::get("_TtC12NativeBridge12NativeBridge")
			.expect("NativeBridge not found");

		let flag: BOOL = if edited { YES } else { NO };
		let _: () = msg_send![cls, setDocumentEdited:flag];
	}
}