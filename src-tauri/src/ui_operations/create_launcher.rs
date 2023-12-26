use tauri::Window;
use tauri::TitleBarStyle;
use tauri::Manager;
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};

pub fn create_launcher(app: &tauri::App) -> Window {
	
	let launcher = tauri::WindowBuilder::new(app, "launcher", tauri::WindowUrl::App("index.html?window_type=launcher".into()))
	.inner_size(600.0, 400.0)
	.minimizable(false)
	.maximizable(false)
	.resizable(false)
	.title_bar_style(TitleBarStyle::Overlay.clone())
	.title("")
	.transparent(true)
	.build()
	.unwrap();
	
	// Apply vibrancy to launcher
	let window = app.get_window("launcher").unwrap();
	#[cfg(target_os = "macos")]
	apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, None).expect("Unsupported platform! 'apply_vibrancy' is only supported on macOS");	
	
	return launcher;
}