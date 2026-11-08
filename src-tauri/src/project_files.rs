//! Saving projects to the location the author chose. Unlike the older
//! `save-text-file` event, these commands report failures to the frontend, so
//! a project is only marked as saved once it actually is.

use crate::file_operations::{
    copy_directory_contents, create_text_file, FileError, FileErrorCode,
};
use std::path::{Component, Path};

fn run_blocking<F>(task: F) -> impl std::future::Future<Output = Result<(), FileError>>
where
    F: FnOnce() -> Result<(), FileError> + Send + 'static,
{
    // Writes may sleep between retries, and the disk name lookup should run
    // off the UI thread, so keep this off the async runtime's workers
    async move {
        tauri::async_runtime::spawn_blocking(task)
            .await
            .map_err(|e| FileError::new(FileErrorCode::Unknown, &e.to_string()))?
    }
}

/// True if `name` is a single path segment ending in `.clx`.
fn is_project_file_name(name: &str) -> bool {
    let mut components = Path::new(name).components();
    matches!(components.next(), Some(Component::Normal(_)))
        && components.next().is_none()
        && name.to_lowercase().ends_with(".clx")
}

/// Write the project file `file_name` (e.g. "My Story.clx") into `directory`.
#[tauri::command]
pub async fn save_project_file(
    directory: String,
    file_name: String,
    contents: String,
) -> Result<(), FileError> {
    if !is_project_file_name(&file_name) {
        return Err(FileError::new(
            FileErrorCode::InvalidName,
            "Project file name must be a single path segment ending in .clx",
        ));
    }
    run_blocking(move || {
        create_text_file(&file_name, &contents, &directory)
            .map_err(|e| FileError::for_path(e, Path::new(&directory)))
    })
    .await
}

/// Copy a project's folder contents (media and other files, but not `.clx`
/// files) into a new project folder, for Save As.
#[tauri::command]
pub async fn copy_project_folder(source: String, destination: String) -> Result<(), FileError> {
    run_blocking(move || {
        copy_directory_contents(&source, &destination)
            .map_err(|e| FileError::for_path(e, Path::new(&destination)))
    })
    .await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_only_plain_clx_names() {
        assert!(is_project_file_name("My Story.clx"));
        assert!(is_project_file_name("My Story.CLX"));
        assert!(!is_project_file_name("My Story.txt"));
        assert!(!is_project_file_name("../My Story.clx"));
        assert!(!is_project_file_name("Folder/My Story.clx"));
        assert!(!is_project_file_name(""));
    }
}
