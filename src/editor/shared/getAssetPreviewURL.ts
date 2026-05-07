import { convertFileSrc } from "@tauri-apps/api/core";
import { resolve as path_resolve, appCacheDir } from "@tauri-apps/api/path";
import { emit, once } from "@tauri-apps/api/event";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { getStore } from "../../data/dataStore";
import { getAsset } from "../../data/getData";
import { v4 as uuidv4 } from "uuid";
import { getProjectWindowLabel } from "../../utils/getProjectWindowLabel";

export default async function getAssetPreviewURL(
  assetId: string,
  fileType: string
) {
  return new Promise((resolve, reject) => {
    try {
      const store = getStore();
      const asset = getAsset(assetId, store);
      if (!asset) {
        reject();
        return;
      }
      const fileName = asset.fileName;
      path_resolve(store.projectPath, "./Assets", fileName).then(
        async (filePath) => {
          const fileId = uuidv4();
          const cacheBase = await appCacheDir();
          const cacheAssetsBase = await path_resolve(
            cacheBase,
            "Projects",
            store.project.id,
            "Assets"
          );
          const slashIdx = fileName.lastIndexOf("/");
          const cachePath = slashIdx !== -1
            ? await path_resolve(cacheAssetsBase, fileName.substring(0, slashIdx))
            : cacheAssetsBase;
          emit("read-asset", {
            assetPath: filePath,
            cachePath: cachePath,
            id: fileId,
            label: getProjectWindowLabel(store.projectPath),
          });
          once(`asset-ready-${fileId}`, async () => {
            const filePath = await path_resolve(
              cacheBase,
              "Projects",
              store.project.id,
              "Assets",
              fileName
            );
            const assetUrl = convertFileSrc(filePath) + `?i=${fileId}`;
            if (fileType === "binary") {
              resolve(assetUrl);
            } else if (fileType === "text") {
              readTextFile(assetUrl).then(async (fileSrc) => {
                resolve(fileSrc);
              });
            }
          });
        }
      );
    } catch (e) {
      reject();
    }
  });
}
