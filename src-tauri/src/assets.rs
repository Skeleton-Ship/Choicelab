use crate::file_operations::find_file_in_dir;
use percent_encoding::percent_decode_str;
use serde::Serialize;
use std::fs::{self, File};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::time::UNIX_EPOCH;
use tauri::ipc::{InvokeBody, Request};
use tauri::Manager;

/// Reads a percent-encoded header (header values must be ASCII, but file names
/// and paths may not be).
fn header(request: &Request<'_>, name: &str) -> Result<String, String> {
    let raw = request
        .headers()
        .get(name)
        .ok_or_else(|| format!("Missing header: {}", name))?
        .to_str()
        .map_err(|e| e.to_string())?;
    percent_decode_str(raw)
        .decode_utf8()
        .map(|s| s.into_owned())
        .map_err(|e| e.to_string())
}

/// Rejects names that could point outside the target directory.
fn validate_file_name(file_name: &str) -> Result<(), String> {
    if file_name.is_empty()
        || file_name.contains(['/', '\\'])
        || file_name == "."
        || file_name == ".."
    {
        return Err(format!("Invalid file name: {}", file_name));
    }
    Ok(())
}

/// Writes to a temporary file and renames it into place, so a failed or
/// interrupted write never leaves a partial file behind (or one that the
/// preview server could serve half-written).
fn write_atomic(dir: &Path, file_name: &str, contents: &[u8]) -> Result<(), String> {
    fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    let temp_path = dir.join(format!(".{}.tmp", file_name));
    let result = File::create(&temp_path)
        .and_then(|mut file| file.write_all(contents))
        .and_then(|_| fs::rename(&temp_path, dir.join(file_name)));
    if let Err(e) = result {
        let _ = fs::remove_file(&temp_path);
        return Err(e.to_string());
    }
    Ok(())
}

fn raw_body<'a>(request: &'a Request<'_>) -> Result<&'a [u8], String> {
    match request.body() {
        InvokeBody::Raw(contents) => Ok(contents),
        _ => Err("Expected raw file contents".to_string()),
    }
}

/// Saves an uploaded file into the project's Assets folder. The file's bytes are
/// sent as the raw request body, so no encoding round trip is needed.
///
/// Returns the asset's path relative to the Assets folder. If a file with the
/// same name already exists anywhere in Assets, that file is used instead.
#[tauri::command]
pub async fn create_asset(request: Request<'_>) -> Result<String, String> {
    let file_name = header(&request, "x-file-name")?;
    let assets_path = header(&request, "x-assets-path")?;
    let contents = raw_body(&request)?;
    validate_file_name(&file_name)?;
    let assets_dir = Path::new(&assets_path);
    if let Some(existing) = find_file_in_dir(assets_dir, &file_name) {
        return Ok(existing);
    }
    write_atomic(assets_dir, &file_name, contents)?;
    Ok(file_name)
}

/// Writes a binary file (e.g. a font for the preview or an export) from the raw
/// request body, replacing any existing file with the same name.
#[tauri::command]
pub async fn save_binary_file(request: Request<'_>) -> Result<(), String> {
    let file_name = header(&request, "x-file-name")?;
    let dir_path = header(&request, "x-dir-path")?;
    let contents = raw_body(&request)?;
    validate_file_name(&file_name)?;
    write_atomic(Path::new(&dir_path), &file_name, contents)
}

#[derive(Serialize)]
pub struct AssetPreview {
    path: PathBuf,
    /// Last-modified time in milliseconds, for cache busting
    modified: u64,
}

/// Grants the asset protocol access to a single file in the project's Assets
/// folder, so the editor can preview it in place without copying it.
#[tauri::command]
pub fn allow_asset_preview(
    app: tauri::AppHandle,
    project_path: String,
    file_name: String,
) -> Result<AssetPreview, String> {
    let assets_dir = Path::new(&project_path).join("Assets");
    let path = assets_dir.join(&file_name);
    // Only files inside Assets can be exposed. Compare canonical paths (which
    // resolve `..` and symlinks), but return the plain one: on Windows,
    // canonical paths use the `\\?\` prefix, which convertFileSrc can't handle.
    let canonical_dir = assets_dir.canonicalize().map_err(|e| e.to_string())?;
    let canonical_path = path.canonicalize().map_err(|e| e.to_string())?;
    if !canonical_path.starts_with(&canonical_dir) || !canonical_path.is_file() {
        return Err(format!("Not an asset: {}", file_name));
    }
    let modified = fs::metadata(&path)
        .and_then(|meta| meta.modified())
        .ok()
        .and_then(|time| time.duration_since(UNIX_EPOCH).ok())
        .map(|duration| duration.as_millis() as u64)
        .unwrap_or(0);
    app.asset_protocol_scope()
        .allow_file(&path)
        .map_err(|e| e.to_string())?;
    Ok(AssetPreview { path, modified })
}

/// Asset previews used to be copied into `$APPCACHE/Projects/{project id}/Assets`
/// and were never cleaned up. Those folders are named by project UUID, unlike
/// the per-window cache folders (`project_…`), so they can be removed safely.
pub fn remove_legacy_asset_cache(app: &tauri::AppHandle) {
    let Ok(cache_dir) = app.path().app_cache_dir() else {
        return;
    };
    let Ok(entries) = fs::read_dir(cache_dir.join("Projects")) else {
        return;
    };
    for entry in entries.flatten() {
        let name = entry.file_name();
        let is_uuid = name.to_str().is_some_and(|name| {
            name.len() == 36
                && name.char_indices().all(|(i, c)| match i {
                    8 | 13 | 18 | 23 => c == '-',
                    _ => c.is_ascii_hexdigit(),
                })
        });
        if is_uuid && entry.path().is_dir() {
            let _ = fs::remove_dir_all(entry.path());
        }
    }
}
