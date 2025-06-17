use std::sync::Mutex;
use once_cell::sync::Lazy;

// Global list for pending files (not per window)
pub static PENDING_FILES: Lazy<Mutex<Vec<String>>> = Lazy::new(|| Mutex::new(Vec::new()));
