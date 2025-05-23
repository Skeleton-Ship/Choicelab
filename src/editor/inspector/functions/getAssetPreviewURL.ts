import { convertFileSrc } from "@tauri-apps/api/core";
import { resolve as path_resolve, appCacheDir } from "@tauri-apps/api/path";
import { emit, once } from "@tauri-apps/api/event";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { getStore } from "../../../data/dataStore";
import { v4 as uuidv4 } from "uuid";
import { getProjectWindowLabel } from "../../../utils/getProjectWindowLabel";

export default async function getAssetPreviewURL(
  fileName: string,
  fileType: string
) {
  return new Promise((resolve, reject) => {
    try {
      const store = getStore();
      path_resolve(store.projectPath, "./assets", fileName).then(
        async (filePath) => {
          const fileId = uuidv4();
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
            id: fileId,
            label: getProjectWindowLabel(store.projectPath),
          });
          once(`asset-ready-${fileId}`, async () => {
            const filePath = await path_resolve(
              cacheBase,
              "Projects",
              store.project.id,
              "assets",
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
