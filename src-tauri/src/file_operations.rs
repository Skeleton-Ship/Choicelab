use crate::globals::{APP_READY, PENDING_FILES};
use std::sync::atomic::Ordering;
use dirs::cache_dir;
use std::collections::HashSet;
use serde_json;
use std::error::Error;
use std::fs;
use std::fs::File;
use std::io::{self, Read, Write};
use std::path::Path;
use std::path::PathBuf;
use tauri::{AppHandle, Emitter, Manager};

pub fn create_binary_file(
    file_name: &str,
    contents: &str,
    directory: &str,
) -> Result<(), std::io::Error> {
    // Create the destination directory if it doesn't exist
    fs::create_dir_all(directory)?;

    // Create the full path by joining the directory and filename
    let file_path = Path::new(directory).join(file_name);

    // Create a new file at the specified path
    let mut file = File::create(&file_path)?;

    // Convert the binary content string to bytes
    let content_bytes = match hex::decode(contents) {
        Ok(bytes) => bytes,
        Err(_) => {
            return Err(std::io::Error::new(
                std::io::ErrorKind::InvalidInput,
                "Invalid binary content",
            ));
        }
    };

    // Write the binary content to the file
    file.write_all(&content_bytes)?;

    // println!("Binary file created successfully at: {:?}", file_path);

    Ok(())
}

pub fn create_text_file(file_name: &str, contents: &str, path: &str) -> io::Result<()> {
    // Combine the specified path and the file name
    let full_path = format!("{}/{}", path, file_name);

    // Create the destination directory if it doesn't exist
    fs::create_dir_all(path)?;

    // Create a new file at the specified path
    let mut file = File::create(&full_path)?;

    // Write the contents to the file
    file.write_all(contents.as_bytes())?;

    // println!("File '{}' successfully written to '{}'", file_name, full_path);

    Ok(())
}

pub fn read_text_file(file_path: &str) -> Result<String, Box<dyn Error>> {
    // Attempt to open the file
    let mut file = File::open(file_path)?;

    // Read the contents of the file into a String
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;

    Ok(contents)
}

pub fn copy_file(src_path: &str, dest_dir: &str) -> Result<String, io::Error> {
    let src_path = Path::new(src_path);
    let dest_dir = Path::new(dest_dir);

    // Check if the source file exists
    if !src_path.exists() {
        return Err(io::Error::new(
            io::ErrorKind::NotFound,
            "Source file not found",
        ));
    }

    // Create the destination directory if it doesn't exist
    if let Err(e) = fs::create_dir_all(dest_dir) {
        return Err(io::Error::new(
            io::ErrorKind::Other,
            format!("Failed to create destination directory: {}", e),
        ));
    }

    // Construct the destination path
    let file_name = src_path
        .file_name()
        .ok_or_else(|| io::Error::new(io::ErrorKind::InvalidInput, "Invalid source file name"))?;
    let dest_path = dest_dir.join(file_name);

    // Perform the file copy
    fs::copy(src_path, &dest_path)
        .map_err(|e| io::Error::new(io::ErrorKind::Other, format!("Failed to copy file: {}", e)))?;

    // Ensure the file was created and has a non-zero size
    if !dest_path.exists() {
        return Err(io::Error::new(io::ErrorKind::Other, "File was not created"));
    }

    let metadata = fs::metadata(&dest_path).map_err(|e| {
        io::Error::new(
            io::ErrorKind::Other,
            format!("Failed to retrieve file metadata: {}", e),
        )
    })?;

    if metadata.len() == 0 {
        return Err(io::Error::new(io::ErrorKind::Other, "Copied file is empty"));
    }

    Ok(dest_path
        .to_str()
        .ok_or_else(|| {
            io::Error::new(
                io::ErrorKind::InvalidData,
                "Failed to convert destination path to string",
            )
        })?
        .to_string())
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

pub fn get_preview_path(id: &str) -> Option<PathBuf> {
    cache_dir().map(|cache| {
        cache
            .join("com.choicelab.choicelab/Projects")
            .join(id)
            .join("Preview")
    })
}

fn write_project_files(
    input_folder: &Path,
    project_data: &str,
    output_dir: &PathBuf,
    include_assets: bool,
) -> std::io::Result<()> {
    let project_subfolder = output_dir.join("project");
    fs::create_dir_all(&project_subfolder)?;

    let mut file = File::create(project_subfolder.join("project.json"))?;
    file.write_all(project_data.as_bytes())?;

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
    input_folder: &str,
    project_data: &str,
    project_label: &str,
    include_assets: &bool,
) -> std::io::Result<()> {
    let output_dir = match get_preview_path(project_label) {
        Some(path) => path,
        None => {
            return Err(std::io::Error::new(
                std::io::ErrorKind::NotFound,
                "Output folder not found",
            ))
        }
    };
    write_project_files(Path::new(input_folder), project_data, &output_dir, *include_assets)
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
