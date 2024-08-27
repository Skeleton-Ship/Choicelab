use std::fs;
use std::io::Read;
use std::path::Path;
use tauri::Config;

pub fn read_tauri_config() -> Result<Config, Box<dyn std::error::Error>> {
	let file_name = "tauri.conf.json";
	let path = Path::new(file_name);

	if path.exists() {
		let mut file = fs::File::open(path)?;
		let mut contents = String::new();
		file.read_to_string(&mut contents)?;

		// Deserialize the JSON string into the Config struct
		let config: Config = serde_json::from_str(&contents)?;
		Ok(config)
	} else {
		Err(Box::new(std::io::Error::new(
			std::io::ErrorKind::NotFound,
			format!("File '{}' not found in the current directory", file_name),
		)))
	}
}