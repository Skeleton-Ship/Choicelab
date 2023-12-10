import { readTextFile } from "@tauri-apps/api/fs";
import { resolve } from "@tauri-apps/api/path";
import { Project } from "../typings";

export default async function loadProjectData(
  projectPath: string
): Promise<Project | undefined> {
  const dataPath = await resolve(projectPath, "project.json");
  let data;
  try {
    const dataRaw = await readTextFile(dataPath);
    data = JSON.parse(dataRaw);
  } catch {}
  return data;
}
