import { resolve } from "@tauri-apps/api/path";
import { emit, once } from "@tauri-apps/api/event";
import { Project } from "../typings";

export default async function loadProjectData(
  projectPath: string
): Promise<Project | undefined> {
  const dataPath = await resolve(projectPath, "project.json");
  emit("request-project-file", {
    path: dataPath,
  });
  return new Promise((resolveData) => {
    let data;
    once(
      "receive-project-file",
      async (event: { payload: { message: string } }) => {
        const payload = event.payload;
        data = JSON.parse(payload.message);
        resolveData(data);
      }
    );
  });
}
