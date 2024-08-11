const fs = require("fs");
const path = require("path");

// Path to the package.json file
const packageJsonPath = path.join(__dirname, "package.json");

// Path to the TOML file
const tomlFilePath = path.join(__dirname, "/src-tauri/Cargo.toml");

// Read the package.json file
fs.readFile(packageJsonPath, "utf8", (err, data) => {
  if (err) {
    console.error("Error reading package.json:", err);
    return;
  }

  const packageJson = JSON.parse(data);
  const version = packageJson.version;

  if (!version) {
    console.error("Version not found in package.json");
    return;
  }

  // Read the TOML file
  fs.readFile(tomlFilePath, "utf8", (err, tomlData) => {
    if (err) {
      console.error("Error reading TOML file:", err);
      return;
    }

    // Use regex to replace the version in the TOML file
    const updatedTomlData = tomlData.replace(
      /version\s*=\s*"\d+\.\d+\.\d+"/,
      `version = "${version}"`
    );

    // Write the updated TOML file
    fs.writeFile(tomlFilePath, updatedTomlData, "utf8", (err) => {
      if (err) {
        console.error("Error writing TOML file:", err);
        return;
      }

      console.log(`TOML file updated successfully with version ${version}`);
    });
  });
});
