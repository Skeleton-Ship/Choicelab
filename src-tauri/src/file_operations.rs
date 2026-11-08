use crate::globals::{APP_READY, PENDING_FILES};
use std::sync::atomic::Ordering;
use std::collections::HashSet;
use serde_json;
use std::error::Error;
use std::fs;
use std::fs::File;
use std::io::{self, Read, Write};
use std::path::Path;
use std::path::PathBuf;
use tauri::{AppHandle, Emitter, Manager};

/// Delays between attempts when a write fails for a reason that's likely to
/// clear up on its own. Only transient errors are retried (see
/// `is_transient_error`), so a write that's going to keep failing isn't held up.
const WRITE_RETRY_DELAYS_MS: [u64; 3] = [50, 150, 400];

/// Write a text file, retrying a few times if the failure looks temporary.
pub fn create_text_file(file_name: &str, contents: &str, path: &str) -> io::Result<()> {
    let mut result = create_text_file_once(file_name, contents, path);
    for delay in WRITE_RETRY_DELAYS_MS {
        match &result {
            Err(e) if is_transient_error(e) => {
                std::thread::sleep(std::time::Duration::from_millis(delay));
                result = create_text_file_once(file_name, contents, path);
            }
            _ => break,
        }
    }
    result
}

fn create_text_file_once(file_name: &str, contents: &str, path: &str) -> io::Result<()> {
    // Combine the specified path and the file name
    let full_path = format!("{}/{}", path, file_name);

    // Create the destination directory if it doesn't exist
    fs::create_dir_all(path)?;

    // Skip the write when nothing changed, so files served to the preview
    // (index.html, choicelab.js, choicelab.css) aren't touched on every refresh
    if let Ok(existing) = fs::read(&full_path) {
        if existing == contents.as_bytes() {
            return Ok(());
        }
    }

    // Write to a temporary file and rename it into place. Truncating the real
    // file first would let the preview server serve an empty or partial file.
    let temp_path = format!("{}/.{}.tmp", path, file_name);
    let result = File::create(&temp_path)
        .and_then(|mut file| file.write_all(contents.as_bytes()))
        .and_then(|_| fs::rename(&temp_path, &full_path));
    if result.is_err() {
        // Don't leave a partial temp file behind
        let _ = fs::remove_file(&temp_path);
    }
    result
}

/// Why a file couldn't be written, as a stable code the frontend maps to
/// user-facing text (see `src/fs/fileErrorText.ts`).
#[derive(serde::Serialize, Debug, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum FileErrorCode {
    PermissionDenied,
    NotFound,
    StorageFull,
    ReadOnly,
    NameTooLong,
    InvalidName,
    Busy,
    Unknown,
}

/// A failed file operation, as sent to the frontend.
#[derive(serde::Serialize, Debug)]
pub struct FileError {
    pub code: FileErrorCode,
    /// The OS's own description, for logs and "copy details"; not user copy.
    pub message: String,
    /// The display name of the disk, for errors about the disk itself (full or
    /// read-only), if it could be found.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub drive: Option<String>,
}

impl FileError {
    pub fn new(code: FileErrorCode, message: &str) -> Self {
        FileError {
            code,
            message: message.to_string(),
            drive: None,
        }
    }

    /// Build from an I/O error while writing to `path`, naming the disk when
    /// the error is about the disk itself.
    pub fn for_path(e: io::Error, path: &Path) -> Self {
        let mut error = FileError::from(e);
        if matches!(error.code, FileErrorCode::StorageFull | FileErrorCode::ReadOnly) {
            error.drive = crate::volume_name::volume_display_name(path);
        }
        error
    }
}

impl From<io::Error> for FileError {
    fn from(e: io::Error) -> Self {
        FileError::new(classify_io_error(&e), &e.to_string())
    }
}

/// Sort an I/O error into a `FileErrorCode`. OS error numbers are checked
/// first, because some (like "file name too long") share an `ErrorKind` with
/// others that need different copy.
pub fn classify_io_error(e: &io::Error) -> FileErrorCode {
    use FileErrorCode::*;
    if let Some(code) = e.raw_os_error() {
        #[cfg(target_os = "windows")]
        match code {
            5 => return PermissionDenied, // ERROR_ACCESS_DENIED
            2 | 3 => return NotFound,     // ERROR_FILE_NOT_FOUND, ERROR_PATH_NOT_FOUND
            19 => return ReadOnly,        // ERROR_WRITE_PROTECT
            32 | 33 => return Busy,       // ERROR_SHARING_VIOLATION, ERROR_LOCK_VIOLATION
            39 | 112 => return StorageFull, // ERROR_HANDLE_DISK_FULL, ERROR_DISK_FULL
            206 => return NameTooLong,    // ERROR_FILENAME_EXCED_RANGE
            123 | 161 => return InvalidName, // ERROR_INVALID_NAME, ERROR_BAD_PATHNAME
            _ => {}
        }
        #[cfg(target_os = "macos")]
        match code {
            63 => return NameTooLong, // ENAMETOOLONG
            69 => return StorageFull, // EDQUOT
            _ => {}
        }
        #[cfg(target_os = "linux")]
        match code {
            36 => return NameTooLong,  // ENAMETOOLONG
            122 => return StorageFull, // EDQUOT
            _ => {}
        }
        #[cfg(unix)]
        match code {
            1 | 13 => return PermissionDenied, // EPERM, EACCES
            2 => return NotFound,              // ENOENT
            16 | 26 => return Busy,            // EBUSY, ETXTBSY
            28 => return StorageFull,          // ENOSPC
            30 => return ReadOnly,             // EROFS
            _ => {}
        }
        let _ = code;
    }
    match e.kind() {
        io::ErrorKind::PermissionDenied => PermissionDenied,
        io::ErrorKind::NotFound => NotFound,
        io::ErrorKind::StorageFull => StorageFull,
        io::ErrorKind::ReadOnlyFilesystem => ReadOnly,
        io::ErrorKind::InvalidFilename => InvalidName,
        io::ErrorKind::ResourceBusy => Busy,
        _ => Unknown,
    }
}

/// Errors worth retrying: something briefly holding the file (antivirus,
/// search indexing, sync tools), or a folder removed mid-write by a cleanup
/// tool (the retry recreates it).
fn is_transient_error(e: &io::Error) -> bool {
    matches!(
        e.kind(),
        io::ErrorKind::Interrupted | io::ErrorKind::WouldBlock
    ) || matches!(
        classify_io_error(e),
        FileErrorCode::Busy | FileErrorCode::NotFound
    )
}

pub fn read_text_file(file_path: &str) -> Result<String, Box<dyn Error>> {
    // Attempt to open the file
    let mut file = File::open(file_path)?;

    // Read the contents of the file into a String
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;

    Ok(contents)
}

pub fn copy_directory_contents(src: &str, dst: &str) -> io::Result<()> {
    let src_path = Path::new(src);
    let dst_path = Path::new(dst);
    fs::create_dir_all(dst_path)?;
    copy_dir_recursive(src_path, dst_path)
}

fn copy_dir_recursive(src: &Path, dst: &Path) -> io::Result<()> {
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let src_child = entry.path();
        let dst_child = dst.join(entry.file_name());
        if src_child.is_dir() {
            fs::create_dir_all(&dst_child)?;
            copy_dir_recursive(&src_child, &dst_child)?;
        } else if src_child.extension().and_then(|e| e.to_str()) != Some("clx") {
            fs::copy(&src_child, &dst_child)?;
        }
    }
    Ok(())
}

pub fn create_directory(directory_name: &str, path: &str, overwrite: &bool) -> io::Result<()> {
    let full_path = format!("{}/{}", path, directory_name);
    let full_path = Path::new(&full_path);

    if *overwrite && full_path.exists() {
        fs::remove_dir_all(full_path)?;
    }

    // Create the directory
    fs::create_dir(&full_path)?;

    Ok(())
}

// Recursively searches `root` for a file named `file_name`.
// Returns the path relative to `root` (e.g. "subdir/logo.png") if found.
pub fn find_file_in_dir(root: &Path, file_name: &str) -> Option<String> {
    find_file_recursive(root, root, file_name)
}

fn find_file_recursive(root: &Path, dir: &Path, file_name: &str) -> Option<String> {
    let entries = fs::read_dir(dir).ok()?;
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            if let Some(found) = find_file_recursive(root, &path, file_name) {
                return Some(found);
            }
        } else if path.file_name().and_then(|n| n.to_str()) == Some(file_name) {
            if let Ok(rel) = path.strip_prefix(root) {
                return rel.to_str().map(|s| s.replace('\\', "/"));
            }
        }
    }
    None
}

pub fn get_preview_path(app: &AppHandle, project_path: &str) -> Option<PathBuf> {
    crate::project_cache::project_cache_dir(app, project_path).map(|dir| dir.join("Preview"))
}

fn write_project_files(
    input_folder: &Path,
    project_data: &str,
    output_dir: &PathBuf,
    include_assets: bool,
) -> std::io::Result<()> {
    let project_subfolder = output_dir.join("project");
    fs::create_dir_all(&project_subfolder)?;

    // Write atomically so the preview never fetches a truncated project.json
    let project_json_path = project_subfolder.join("project.json");
    let project_json_temp = project_subfolder.join(".project.json.tmp");
    {
        let mut file = File::create(&project_json_temp)?;
        file.write_all(project_data.as_bytes())?;
    }
    fs::rename(&project_json_temp, &project_json_path)?;

    if include_assets {
        let assets_src = input_folder.join("Assets");
        if !assets_src.exists() {
            return Ok(());
        }
        let assets_dest = project_subfolder.join("Assets");
        let referenced: HashSet<String> = serde_json::from_str::<serde_json::Value>(project_data)
            .ok()
            .and_then(|v| v["assets"].as_array().cloned())
            .unwrap_or_default()
            .iter()
            .filter_map(|a| a["fileName"].as_str().map(|s| s.to_string()))
            .collect();
        for file_name in &referenced {
            let src = assets_src.join(file_name);
            if src.exists() {
                let dest = assets_dest.join(file_name);
                if let Some(parent) = dest.parent() {
                    fs::create_dir_all(parent)?;
                }
                fs::copy(&src, &dest)?;
            }
        }
    }

    Ok(())
}

pub fn load_preview_files(
    app: &AppHandle,
    input_folder: &str,
    project_data: &str,
) -> std::io::Result<()> {
    let output_dir = match get_preview_path(app, input_folder) {
        Some(path) => path,
        None => {
            return Err(std::io::Error::new(
                std::io::ErrorKind::NotFound,
                "Output folder not found",
            ))
        }
    };
    // Assets aren't copied: the preview server serves them from the project folder
    write_project_files(Path::new(input_folder), project_data, &output_dir, false)
}

pub fn export_project_files(
    input_folder: &str,
    project_data: &str,
    export_dir: &str,
) -> std::io::Result<()> {
    write_project_files(Path::new(input_folder), project_data, &PathBuf::from(export_dir), true)
}

pub fn handle_file_associations(app: AppHandle, files: Vec<PathBuf>) {
    // This is for the `asset:` protocol to work:
    let asset_protocol_scope = app.asset_protocol_scope();
    for file in &files {
        let _ = asset_protocol_scope.allow_file(file);
    }
    let files_js = files
        .iter()
        .map(|f| f.to_string_lossy().replace('\\', "\\\\"))
        .collect::<Vec<_>>();

    if APP_READY.load(Ordering::SeqCst) {
        // App is already running — emit directly to the first available window.
        // Every window listens for opened-files, so whichever is open will handle it.
        let windows = app.webview_windows();
        let target = windows
            .get("launcher")
            .or_else(|| windows.values().next());
        if let Some(window) = target {
            let _ = window.emit("opened-files", &files_js);
        }
    } else {
        // Cold start — queue for the window-ready drain path.
        let mut pending = PENDING_FILES.lock().unwrap();
        pending.extend(files_js);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_dir(name: &str) -> String {
        let dir = std::env::temp_dir().join(format!("choicelab-test-{}-{}", name, std::process::id()));
        fs::create_dir_all(&dir).unwrap();
        dir.to_str().unwrap().to_string()
    }

    #[test]
    fn writes_and_leaves_no_temp_file() {
        let dir = temp_dir("write");
        create_text_file("a.txt", "hello", &dir).unwrap();
        assert_eq!(fs::read_to_string(format!("{}/a.txt", dir)).unwrap(), "hello");
        assert!(!Path::new(&format!("{}/.a.txt.tmp", dir)).exists());
        let _ = fs::remove_dir_all(dir);
    }

    #[test]
    fn classifies_name_too_long() {
        let dir = temp_dir("long");
        let err = create_text_file(&"x".repeat(300), "", &dir).unwrap_err();
        assert_eq!(classify_io_error(&err), FileErrorCode::NameTooLong);
        let _ = fs::remove_dir_all(dir);
    }

    #[cfg(unix)]
    #[test]
    fn classifies_permission_denied_without_retrying() {
        use std::os::unix::fs::PermissionsExt;
        let dir = temp_dir("perm");
        fs::set_permissions(&dir, fs::Permissions::from_mode(0o500)).unwrap();
        let started = std::time::Instant::now();
        let err = create_text_file("a.txt", "x", &dir).unwrap_err();
        assert_eq!(classify_io_error(&err), FileErrorCode::PermissionDenied);
        // Permanent errors shouldn't wait through the retry delays
        assert!(started.elapsed().as_millis() < 50);
        fs::set_permissions(&dir, fs::Permissions::from_mode(0o700)).unwrap();
        let _ = fs::remove_dir_all(dir);
    }
}
