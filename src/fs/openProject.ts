import { open } from "@tauri-apps/api/dialog";
import loadProject from "./loadProject";

export default async function openProject() {
  const selected = await open({
    directory: true,
    multiple: false,
    filters: [
      {
        name: "",
        extensions: [""],
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
