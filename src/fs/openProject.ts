import { open } from "@tauri-apps/plugin-dialog";
import { emit } from "@tauri-apps/api/event";
import loadProject from "./loadProject";
import guardProjectWindow from "./guardProjectWindow";

export default async function openProject() {
  console.log("Requested open");
  if (!(await guardProjectWindow("open"))) return;
  console.log("Passed guard");
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
    emit("clear-pending-close", {});
  } else {
    if (typeof selected === "string") {
      loadProject(selected);
    }
  }
}
