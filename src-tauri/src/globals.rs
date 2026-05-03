use once_cell::sync::Lazy;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;

// Global list for pending files (not per window)
pub static PENDING_FILES: Lazy<Mutex<Vec<String>>> = Lazy::new(|| Mutex::new(Vec::new()));

// Set to true once the first window-ready fires; used to decide whether
// handle_file_associations should emit directly or queue in PENDING_FILES.
pub static APP_READY: AtomicBool = AtomicBool::new(false);

pub fn mark_app_ready() {
    APP_READY.store(true, Ordering::SeqCst);
}

// Label of the currently-focused window; blank until the first focus event.
pub static FOCUSED_WINDOW: Lazy<Mutex<String>> = Lazy::new(|| Mutex::new(String::new()));
