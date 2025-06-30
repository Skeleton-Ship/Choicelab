use once_cell::sync::Lazy;
use std::sync::Mutex;

// Global list for pending files (not per window)
pub static PENDING_FILES: Lazy<Mutex<Vec<String>>> = Lazy::new(|| Mutex::new(Vec::new()));
