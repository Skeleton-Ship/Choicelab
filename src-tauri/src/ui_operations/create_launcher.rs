use tauri::Manager;
use tauri::{App, WebviewWindow};
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};

pub fn create_launcher(app: &App) -> WebviewWindow {
    // Create the window using the stable `create_window` API
    /*
    app.create_webview_window("launcher", "index.html?window_type=launcher", |win| {
        win
            .inner_size(600.0, 400.0)
            .minimizable(false)
            .maximizable(false)
            .resizable(false)
            .title_bar_style(TitleBarStyle::Overlay.clone())
            .title("")
            .transparent(true)
    })
    .expect("Failed to create launcher window");
    */

    // Apply vibrancy to launcher
    let window = app.app_handle().get_webview_window("launcher").unwrap();
    #[cfg(target_os = "macos")]
    apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, None)
        .expect("Unsupported platform! 'apply_vibrancy' is only supported on macOS");

    window
}
