use tauri::Manager;
use tauri::{App, WebviewWindow};
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};

pub fn create_launcher(app: &App) -> WebviewWindow {
	// Get launcher window (declared in conf file)
    let window = app.app_handle().get_webview_window("launcher").unwrap();
	// Apply vibrancy to launcher
    #[cfg(target_os = "macos")]
    apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, None)
        .expect("Unsupported platform! 'apply_vibrancy' is only supported on macOS");

    window
}
