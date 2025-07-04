import { getVersion } from "@tauri-apps/api/app";
import { resolve, appConfigDir } from "@tauri-apps/api/path";
import {
  readTextFile,
  writeTextFile,
  mkdir,
  exists,
} from "@tauri-apps/plugin-fs";

async function createAppPreferences() {
  const appConfigDirPath = await appConfigDir();
  const configPathExists = await exists(appConfigDirPath);
  if (!configPathExists) await mkdir(appConfigDirPath);
  const preferencesPath = await resolve(appConfigDirPath, "Preferences.json");
  const version = await getVersion();
  const preferencesObj = { versionNotesSeen: version };
  await writeTextFile(
    preferencesPath,
    JSON.stringify(preferencesObj, null, 2),
    { create: true }
  );
}

export async function getAppPreferences(): Promise<{
  versionNotesSeen: string;
}> {
  const appConfigDirPath = await appConfigDir();
  const preferencesPath = await resolve(appConfigDirPath, "Preferences.json");
  const fileExists = await exists(preferencesPath);
  if (fileExists) {
    const fileContent = await readTextFile(preferencesPath);
    const preferencesObj = JSON.parse(fileContent);
    return preferencesObj;
  } else {
    await createAppPreferences();
    return getAppPreferences();
  }
}

export async function setAppPreferences(newProps: Record<string, any>) {
  const appConfigDirPath = await appConfigDir();
  const preferencesPath = await resolve(appConfigDirPath, "Preferences.json");
  let preferencesObj = await getAppPreferences();
  preferencesObj = { ...preferencesObj, ...newProps };
  await writeTextFile(preferencesPath, JSON.stringify(preferencesObj, null, 2));
}
