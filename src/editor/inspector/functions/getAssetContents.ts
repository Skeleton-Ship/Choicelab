import { resolve as path_resolve, appCacheDir } from "@tauri-apps/api/path";
import { emit, once } from "@tauri-apps/api/event";
import {
  readBinaryFile,
  readTextFile,
  BaseDirectory,
} from "@tauri-apps/api/fs";
import { getStore } from "../../../data/dataStore";
import getBase64Prefix from "./getBase64Prefix";

function uint8ToBase64(arr: Uint8Array): string {
  return btoa(
    Array(arr.length)
      .fill("")
      .map((_, i) => String.fromCharCode(arr[i]))
      .join("")
  );
}

function readFileContents(
  fileName: string,
  fileType: string,
  localKey: string,
  iteration: number
) {
  return new Promise((resolve) => {
    if (fileType === "binary") {
      readBinaryFile(fileName, {
        dir: BaseDirectory.AppCache,
      }).then(async (file) => {
        const prefix = getBase64Prefix(fileName);
        let fileSrc = uint8ToBase64(file);
        if (!fileSrc || (fileSrc === "" && iteration < 50)) {
          return readFileContents(fileName, fileType, localKey, iteration + 1);
        } else if (fileSrc && fileSrc !== "") {
          fileSrc = prefix + uint8ToBase64(file);
          resolve(fileSrc);
        } else {
          resolve("");
        }
      });
    } else if (fileType === "text") {
      readTextFile(fileName, {
        dir: BaseDirectory.AppCache,
      }).then(async (fileSrc) => {
        resolve(fileSrc);
      });
    }
  });
}

/**
 * Given an already-stored file, return its contents
 */
async function storeCachedAsset(
  fileName: string,
  fileType: string,
  localKey: string
) {
  return new Promise((resolve, reject) => {
    try {
      const store = getStore();
      path_resolve(store.projectPath, "./assets", fileName).then(
        async (filePath) => {
          const cacheBase = await appCacheDir();
          const cachePath = await path_resolve(
            cacheBase,
            "Projects",
            store.project.id,
            "assets"
          );
          emit("read-asset", {
            assetPath: filePath,
            cachePath: cachePath,
          });
          once("asset-ready", async () => {
            const fileSrc = await readFileContents(
              fileName,
              fileType,
              localKey,
              0
            );
            if (fileSrc !== "") {
              const storage = window.__CHOICELAB_ASSET_CACHE__;
              storage.storeFileContents(localKey, fileSrc);
            }
            resolve(fileSrc);
          });
        }
      );
    } catch (e) {
      reject();
    }
  });
}

export default async function getAssetContents(
  fileName: string,
  fileType: string
) {
  return new Promise((resolve, reject) => {
    const storage = window.__CHOICELAB_ASSET_CACHE__;
    const localKey = encodeURIComponent(`choicelab_asset_${fileName}`);
    try {
      storage.openDatabase().then(async () => {
        let contents;
        try {
          contents = await storage.getFileContents(localKey);
          if (contents === null || !contents) {
            contents = await storeCachedAsset(fileName, fileType, localKey);
          }
          resolve(contents);
        } catch (e) {
          contents = await storeCachedAsset(fileName, fileType, localKey);
          resolve(contents);
        }
      });
    } catch (e) {
      console.error("Failed to open local asset cache.");
      reject();
    }
  });
}
