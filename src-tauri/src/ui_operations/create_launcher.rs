use tauri::Window;
use tauri::TitleBarStyle;

pub fn create_launcher(app: &tauri::App) -> Window {
	
	let launcher = tauri::WindowBuilder::new(app, "launcher", tauri::WindowUrl::App("index.html?window_type=launcher".into()))
	.inner_size(600.0, 400.0)
	.minimizable(false)
	.maximizable(false)
	.resizable(false)
	.title_bar_style(TitleBarStyle::Overlay.clone())
	.title("")
	.build()
	.unwrap();
	
	return launcher;
}