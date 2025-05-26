use objc::{msg_send, sel, sel_impl};
use objc::runtime::Class;

pub fn add_native_menus() {
	unsafe {
		let cls = Class::get("_TtC11NativeMenus17NativeMenusBridge")
			.expect("NativeMenusBridge not found");
		
		let _: () = msg_send![cls, addNativeMenus];
	}
}
