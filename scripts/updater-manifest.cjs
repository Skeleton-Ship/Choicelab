/*
 * Adds each platform's minimum OS version to a release's updater manifest
 * (latest.json), so the app won't offer an update to a machine that can't run it.
 * See src-tauri/src/check_for_updates.rs for the other half.
 *
 * Runs in the release workflow after every platform has built, because each
 * build rewrites latest.json and drops fields it doesn't know about.
 *
 * Requires GITHUB_TOKEN, GITHUB_REPOSITORY ("owner/repo"), and RELEASE_ID.
 */

const fs = require("fs");
const path = require("path");

/*
 * Minimum OS versions, keyed by Rust's std::env::consts::OS.
 *
 * - macOS comes from tauri.conf.json, which is also what macOS itself enforces.
 *   (src-tauri/build.rs has its own copy for the Objective-C bridge; keep them in sync.)
 * - Windows has no equivalent Tauri setting, so it lives here. Use the full
 *   version number, e.g. "10.0.22000" for Windows 11. Leave null for no minimum.
 */
const tauriConf = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../src-tauri/tauri.conf.json"),
    "utf8"
  )
);
const MINIMUM_SYSTEM_VERSIONS = {
  macos: tauriConf.bundle?.macOS?.minimumSystemVersion ?? null,
  windows: null,
};

const MANIFEST_NAME = "latest.json";

async function main() {
  const { GITHUB_TOKEN, GITHUB_REPOSITORY, RELEASE_ID } = process.env;
  if (!GITHUB_TOKEN || !GITHUB_REPOSITORY || !RELEASE_ID) {
    throw new Error("GITHUB_TOKEN, GITHUB_REPOSITORY, and RELEASE_ID are required");
  }
  const api = `https://api.github.com/repos/${GITHUB_REPOSITORY}`;
  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };

  async function request(url, options = {}) {
    const res = await fetch(url, {
      ...options,
      headers: { ...headers, ...options.headers },
    });
    if (!res.ok) {
      throw new Error(`${options.method ?? "GET"} ${url} failed: ${res.status} ${await res.text()}`);
    }
    return res;
  }

  // Find the manifest
  const assets = await (
    await request(`${api}/releases/${RELEASE_ID}/assets?per_page=100`)
  ).json();
  const asset = assets.find((a) => a.name === MANIFEST_NAME);
  if (!asset) throw new Error(`No ${MANIFEST_NAME} found on release ${RELEASE_ID}`);

  const manifest = await (
    await request(`${api}/releases/assets/${asset.id}`, {
      headers: { Accept: "application/octet-stream" },
    })
  ).json();

  // Add the minimum versions, omitting platforms with none
  const minimums = Object.fromEntries(
    Object.entries(MINIMUM_SYSTEM_VERSIONS).filter(([, v]) => v !== null)
  );
  manifest.minimumSystemVersion = minimums;
  console.log("minimumSystemVersion:", minimums);

  // Replace the asset (GitHub can't edit an asset's contents in place)
  await request(`${api}/releases/assets/${asset.id}`, { method: "DELETE" });
  const uploadUrl = `https://uploads.github.com/repos/${GITHUB_REPOSITORY}/releases/${RELEASE_ID}/assets?name=${MANIFEST_NAME}`;
  await request(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(manifest, null, 2),
  });
  console.log(`Updated ${MANIFEST_NAME}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
