import { resolve, appConfigDir } from "@tauri-apps/api/path";
import {
  readTextFile,
  writeTextFile,
  mkdir,
  exists,
} from "@tauri-apps/plugin-fs";

interface AppPreferences {
  versionNotesSeen: string;
}

async function createAppPreferences() {
  const appConfigDirPath = await appConfigDir();
  const configPathExists = await exists(appConfigDirPath);
  if (!configPathExists) await mkdir(appConfigDirPath);
  const preferencesPath = await resolve(appConfigDirPath, "Preferences.json");
  const preferencesObj: AppPreferences = { versionNotesSeen: "0.0.0" };
  await writeTextFile(
    preferencesPath,
    JSON.stringify(preferencesObj, null, 2),
    { create: true }
  );
}

export async function getAppPreferences(): Promise<AppPreferences> {
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

export async function setAppPreferences(newProps: Partial<AppPreferences>) {
  const appConfigDirPath = await appConfigDir();
  const preferencesPath = await resolve(appConfigDirPath, "Preferences.json");
  let preferencesObj = await getAppPreferences();
  preferencesObj = { ...preferencesObj, ...newProps };
  await writeTextFile(preferencesPath, JSON.stringify(preferencesObj, null, 2));
}
