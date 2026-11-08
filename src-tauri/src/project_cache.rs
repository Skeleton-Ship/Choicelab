//! Each open project gets a folder in the app's cache directory for its
//! autosave, undo history, and preview files. This module is the only place
//! that decides where that folder is; the frontend asks for it with
//! `get_project_cache_dir`.

use crate::file_operations::{create_text_file, FileError, FileErrorCode};
use std::path::{Component, Path, PathBuf};
use tauri::Manager;

/// 64-bit FNV-1a. Used instead of `DefaultHasher`, whose output isn't
/// guaranteed to stay the same between Rust versions; a changed hash would
/// orphan existing autosaves.
fn fnv1a_64(bytes: &[u8]) -> u64 {
    let mut hash: u64 = 0xcbf2_9ce4_8422_2325;
    for byte in bytes {
        hash ^= u64::from(*byte);
        hash = hash.wrapping_mul(0x0000_0100_0000_01b3);
    }
    hash
}

/// The cache folder's name: a fixed-length hash of the project path.
///
/// Folders used to be named after the window label, which embeds the whole
/// project path. That could pass the 255-character limit on a single file
/// name, and different paths could produce the same label (e.g. "My Story"
/// and "My_Story"), sharing one autosave.
pub fn project_cache_dir_name(project_path: &str) -> String {
    format!("project_{:016x}", fnv1a_64(project_path.trim().as_bytes()))
}

pub fn project_cache_dir(app: &tauri::AppHandle, project_path: &str) -> Option<PathBuf> {
    let cache = app.path().app_cache_dir().ok()?;
    Some(cache.join("Projects").join(project_cache_dir_name(project_path)))
}

/// Where the cache folder was before 1.2. Only read for autosave recovery and
/// cleanup; nothing new is written here.
pub fn legacy_project_cache_dir(app: &tauri::AppHandle, project_path: &str) -> Option<PathBuf> {
    let cache = app.path().app_cache_dir().ok()?;
    Some(
        cache
            .join("Projects")
            .join(crate::project_window_label(project_path)),
    )
}

/// True if `name` is a single, ordinary path segment, so it can't point
/// outside the cache folder.
fn is_plain_segment(name: &str) -> bool {
    let mut components = Path::new(name).components();
    matches!(components.next(), Some(Component::Normal(_))) && components.next().is_none()
}

#[tauri::command]
pub fn get_project_cache_dir(app: tauri::AppHandle, project_path: String) -> Result<String, String> {
    let dir = project_cache_dir(&app, &project_path)
        .ok_or_else(|| "Couldn't find the app cache folder".to_string())?;
    dir.to_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "Cache folder path isn't valid UTF-8".to_string())
}

/// Write a file into the project's cache folder (optionally in a subfolder),
/// reporting a typed error if it fails.
#[tauri::command]
pub async fn write_project_cache_file(
    app: tauri::AppHandle,
    project_path: String,
    subdir: Option<String>,
    name: String,
    contents: String,
) -> Result<(), FileError> {
    let invalid = |message: &str| FileError::new(FileErrorCode::InvalidName, message);
    if !is_plain_segment(&name) || subdir.as_deref().is_some_and(|s| !is_plain_segment(s)) {
        return Err(invalid("File name must be a single path segment"));
    }
    let mut dir = project_cache_dir(&app, &project_path).ok_or_else(|| {
        FileError::new(FileErrorCode::NotFound, "Couldn't find the app cache folder")
    })?;
    if let Some(subdir) = subdir {
        dir.push(subdir);
    }
    let dir = dir
        .to_str()
        .ok_or_else(|| invalid("Cache folder path isn't valid UTF-8"))?
        .to_string();
    // Retries sleep the thread (and the disk name lookup should run off the UI
    // thread), so keep this off the async runtime's workers
    tauri::async_runtime::spawn_blocking(move || {
        create_text_file(&name, &contents, &dir).map_err(|e| FileError::for_path(e, Path::new(&dir)))
    })
    .await
    .map_err(|e| FileError::new(FileErrorCode::Unknown, &e.to_string()))?
}

/// Remove the project's cache folder, including one left at the pre-1.2
/// location. Called when a project window closes normally.
#[tauri::command]
pub fn clear_project_cache(app: tauri::AppHandle, project_path: String) {
    for dir in [
        project_cache_dir(&app, &project_path),
        legacy_project_cache_dir(&app, &project_path),
    ]
    .into_iter()
    .flatten()
    {
        let _ = std::fs::remove_dir_all(dir);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn name_is_fixed_length_and_stable() {
        let long_path = "/Users/someone/".to_string() + &"Deeply Nested Folder/".repeat(30);
        assert_eq!(project_cache_dir_name(&long_path).len(), "project_".len() + 16);
        // Pinned so an accidental change to the hash (which would orphan
        // existing autosaves) fails loudly
        assert_eq!(project_cache_dir_name(""), "project_cbf29ce484222325");
    }

    #[test]
    fn similar_paths_get_different_folders() {
        assert_ne!(
            project_cache_dir_name("/Stories/My Story"),
            project_cache_dir_name("/Stories/My_Story")
        );
    }

    #[test]
    fn path_is_trimmed_like_window_labels() {
        assert_eq!(
            project_cache_dir_name("  /Stories/A  "),
            project_cache_dir_name("/Stories/A")
        );
    }

    #[test]
    fn rejects_non_plain_segments() {
        assert!(is_plain_segment("autosave.clx"));
        assert!(!is_plain_segment("../autosave.clx"));
        assert!(!is_plain_segment("History/abc"));
        assert!(!is_plain_segment(""));
        assert!(!is_plain_segment(".."));
    }
}
