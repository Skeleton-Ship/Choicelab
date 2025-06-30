use crate::globals::PENDING_FILES;
use home::home_dir;
use std::error::Error;
use std::fs;
use std::fs::File;
use std::io::{self, Read, Write};
use std::path::Path;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

pub fn create_binary_file(
    file_name: &str,
    contents: &str,
    directory: &str,
) -> Result<(), std::io::Error> {
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

pub fn get_preview_path(id: &str) -> Option<PathBuf> {
    // Get the user's home directory
    if let Some(home_path) = home_dir() {
        let preview_path: PathBuf = home_path
            .join("Library/Caches/com.choicelab.choicelab/Projects/".to_owned() + id + "/Preview");
        // Return the preview path
        Some(preview_path)
    } else {
        println!("Could not determine the home directory");
        None
    }
}

pub fn load_preview_files(
    input_folder: &str,
    project_data: &str,
    project_label: &str,
    include_assets: &bool,
) -> std::io::Result<()> {
    // Convert the input folder string to a PathBuf
    let input_folder: PathBuf = Path::new(input_folder).to_path_buf();

    // Get the output folder using get_preview_path
    let output_folder = match get_preview_path(project_label) {
        Some(path) => path,
        None => {
            return Err(std::io::Error::new(
                std::io::ErrorKind::NotFound,
                "Output folder not found",
            ))
        }
    };

    // Define the project subfolder path
    let project_subfolder = output_folder.join("project");

    // Ensure the output folder and project subfolder exist
    fs::create_dir_all(&project_subfolder)?;

    // Write `project_data` to `project.clx` in the `project` subfolder
    let project_json_dest = project_subfolder.join("project.clx");
    let mut file = File::create(project_json_dest)?;
    file.write_all(project_data.as_bytes())?;

    // Copy the `assets` folder to the `project` subfolder in the output folder
    if *include_assets {
        let assets_folder_src = input_folder.join("Assets");
        let assets_folder_dest = project_subfolder.join("Assets");
        fs::create_dir_all(&assets_folder_dest)?;
        for entry in fs::read_dir(assets_folder_src)? {
            let entry = entry?;
            let file_name = entry.file_name();
            let dest_path = assets_folder_dest.join(file_name);
            if entry.path().is_dir() {
                fs::create_dir_all(&dest_path)?;
                fs::copy(entry.path(), dest_path)?;
            } else {
                fs::copy(entry.path(), dest_path)?;
            }
        }
    }

    Ok(())
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
    let mut pending = PENDING_FILES.lock().unwrap();
    pending.extend(files_js);
}
