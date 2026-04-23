const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const nodeModules = path.join(root, "node_modules");
const fontsDir = path.join(root, "src", "fonts");
const outputDir = path.join(root, "src", "acknowledgments");
const outputPath = path.join(outputDir, "data.json");

// Packages that are Node.js security shims with no meaningful license to show
const SKIP_PACKAGES = new Set(["fs", "path"]);

// ─── Fonts ────────────────────────────────────────────────────────────────────

function extractFontName(licenseText) {
  // First line of OFL licenses usually starts with "Copyright ... The <Name> Project Authors"
  const match = licenseText.match(/Copyright.*?The ([^\n(]+?)(?:\s+Project)?\s+(?:Authors|Project)/i);
  if (match) return match[1].trim();
  return null;
}

function dirNameToTitle(dirName) {
  return dirName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function collectFontEntries() {
  const entries = [];
  const dirs = fs.readdirSync(fontsDir).sort();
  for (const dir of dirs) {
    const licensePath = path.join(fontsDir, dir, "license.txt");
    if (!fs.existsSync(licensePath)) continue;
    const licenseText = fs.readFileSync(licensePath, "utf8").trim();
    const name = extractFontName(licenseText) || dirNameToTitle(dir);
    entries.push({ name, licenseText });
  }
  return entries;
}

// ─── npm packages ─────────────────────────────────────────────────────────────

const LICENSE_FILENAMES = [
  "LICENSE", "LICENSE.md", "LICENSE.txt", "LICENSE.rst",
  "LICENCE", "LICENCE.md", "LICENCE.txt",
  "license", "license.md", "license.txt",
];

function findLicenseText(depDir) {
  for (const filename of LICENSE_FILENAMES) {
    const p = path.join(depDir, filename);
    if (fs.existsSync(p)) return fs.readFileSync(p, "utf8").trim();
  }
  return null;
}

function collectNpmEntries() {
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const deps = Object.keys(packageJson.dependencies || {});
  const entries = [];

  for (const dep of deps) {
    if (SKIP_PACKAGES.has(dep)) continue;
    const depDir = path.join(nodeModules, dep);
    if (!fs.existsSync(depDir)) {
      console.warn(`  Warning: could not find ${depDir}`);
      continue;
    }
    let meta = {};
    try {
      meta = JSON.parse(fs.readFileSync(path.join(depDir, "package.json"), "utf8"));
    } catch {
      console.warn(`  Warning: could not read package.json for ${dep}`);
    }
    const licenseText = findLicenseText(depDir);
    const repo = typeof meta.repository === "object" ? meta.repository.url : meta.repository;
    entries.push({
      name: meta.name || dep,
      version: meta.version || "",
      licenseType: meta.license || "Unknown",
      repository: repo ? repo.replace(/^git\+/, "").replace(/\.git$/, "") : "",
      licenseText,
    });
  }

  return entries.sort((a, b) => a.name.localeCompare(b.name));
}


// ─── Main ─────────────────────────────────────────────────────────────────────

console.log("Generating acknowledgments...");

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const fontEntries = collectFontEntries();
console.log(`  ${fontEntries.length} fonts`);

const npmEntries = collectNpmEntries();
console.log(`  ${npmEntries.length} npm packages`);

const data = { fonts: fontEntries, packages: npmEntries };
fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), "utf8");
console.log(`  Written to ${path.relative(root, outputPath)}`);
