import { open } from "@tauri-apps/plugin-dialog";
import { ask } from "@tauri-apps/plugin-dialog";
import { emitTo } from "@tauri-apps/api/event";
import loadProject from "./loadProject";
import { checkProjectWindow } from "./guardProjectWindow";
import { getDialogText } from "../utils/dialogText";

export default async function openProject() {
  const status = await checkProjectWindow();

  if (status.exists) {
    const projectName = status.title || "the current project";
    const text = getDialogText(
      "Close project to continue",
      `To open another project, you'll need to close "${projectName}" first.`,
      ""
    );
    const confirmed = await ask(text.message, {
      title: text.title,
      okLabel: "Close and Open Another",
      cancelLabel: "Cancel",
    });
    if (!confirmed) return;
  }

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

  if (selected === null || typeof selected !== "string") return;

  if (status.exists) {
    // Hand off to the project window — it runs handleCloseRequest, giving the
    // user a chance to save, then opens the new project and clears its cache.
    emitTo(status.label, "close-for-project-open", { path: selected });
  } else {
    loadProject(selected);
  }
}
