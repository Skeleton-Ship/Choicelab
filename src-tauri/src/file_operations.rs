use std::fs;
use std::fs::File;
use std::error::Error;
use std::io::{self, Write, Read};
use std::path::Path;
use std::path::PathBuf;
use home::home_dir;

pub fn create_binary_file(file_name: &str, contents: &str, directory: &str) -> Result<(), std::io::Error> {
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
	// Check if the source file exists
	if !Path::new(src_path).exists() {
		return Err(io::Error::new(io::ErrorKind::NotFound, "File not found"));
	}

	// Create the destination directory if it doesn't exist
	fs::create_dir_all(dest_dir)?;

	// Construct the destination path
	let file_name = Path::new(src_path).file_name().unwrap();
	let dest_path = Path::new(dest_dir).join(file_name);

	// Perform the file copy
	fs::copy(src_path, &dest_path)?;

	Ok(dest_path.to_str().unwrap().to_string())
}

pub fn create_directory(directory_name: &str, path: &str) -> io::Result<()> {
	
	let full_path = format!("{}/{}", path, directory_name);
	// Create the directory
	fs::create_dir(&full_path)?;
	
	Ok(())
}

pub fn get_preview_path() -> Option<PathBuf> {
	// Get the user's home directory
	if let Some(home_path) = home_dir() {
		let preview_path: PathBuf = home_path.join("Library/Caches/com.choicelab.choicelab/Preview");
		// Return the preview path
		Some(preview_path)
	} else {
		println!("Could not determine the home directory");
		None
	}
}

pub fn load_preview_files(input_folder: &str) -> std::io::Result<()> {
	
	// Convert the input folder string to a PathBuf
let input_folder: PathBuf = Path::new(input_folder).to_path_buf();

// Get the output folder using get_preview_path
let output_folder = match get_preview_path() {
	Some(path) => path,
	None => return Err(std::io::Error::new(std::io::ErrorKind::NotFound, "Output folder not found")),
};

// Define the project subfolder path
let project_subfolder = output_folder.join("project");

// Ensure the output folder and project subfolder exist
fs::create_dir_all(&project_subfolder)?;

// Copy `project.json` to the `project` subfolder in the output folder
let project_json_src = input_folder.join("project.json");
let project_json_dest = project_subfolder.join("project.json");
fs::copy(project_json_src, project_json_dest)?;

// Copy the contents of the `.web` folder to the top level of the output folder
let web_folder_src = input_folder.join(".web");
for entry in fs::read_dir(web_folder_src)? {
	let entry = entry?;
	let file_name = entry.file_name();
	let dest_path = output_folder.join(file_name);
	if entry.path().is_dir() {
		fs::create_dir_all(&dest_path)?;
		fs::copy(entry.path(), dest_path)?;
	} else {
		fs::copy(entry.path(), dest_path)?;
	}
}

// Copy the `assets` folder to the `project` subfolder in the output folder
let assets_folder_src = input_folder.join("assets");
let assets_folder_dest = project_subfolder.join("assets");
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

Ok(())
}
