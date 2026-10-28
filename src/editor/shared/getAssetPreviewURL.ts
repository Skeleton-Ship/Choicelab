import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { getStore } from "../../data/dataStore";
import { getAsset } from "../../data/getData";

/*
 * Resolves an asset for previewing in the editor. The file is served in place
 * from the project's Assets folder via the asset protocol (no copy is made).
 * Binary files resolve to a URL; text files resolve to their contents.
 */
export default async function getAssetPreviewURL(
  assetId: string,
  fileType: string
): Promise<string> {
  const store = getStore();
  const asset = getAsset(assetId, store);
  if (!asset) {
    throw new Error(`Asset not found: ${assetId}`);
  }
  const { path, modified } = await invoke<{ path: string; modified: number }>(
    "allow_asset_preview",
    { projectPath: store.projectPath, fileName: asset.fileName }
  );
  // The modified time changes the URL whenever the file does
  const assetUrl = convertFileSrc(path) + `?v=${modified}`;
  if (fileType === "text") {
    const response = await fetch(assetUrl);
    if (!response.ok) {
      throw new Error(`Couldn't read asset: ${asset.fileName}`);
    }
    return response.text();
  }
  return assetUrl;
}
