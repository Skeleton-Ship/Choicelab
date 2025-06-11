import { open } from "@tauri-apps/plugin-dialog";
import loadProject from "./loadProject";

export default async function openProject() {
  const selected = await open({
    directory: false,
    multiple: false,
    filters: [
      {
        name: "",
        extensions: ["clx"],
      },
    ],
  });
  if (selected === null) {
  } else {
    if (typeof selected === "string") {
      loadProject(selected);
    }
  }
}
