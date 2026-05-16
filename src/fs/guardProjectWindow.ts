import { ask } from "@tauri-apps/plugin-dialog";
import { emit, once } from "@tauri-apps/api/event";
import { getDialogText } from "../utils/dialogText";

export type ProjectWindowStatus = {
  exists: boolean;
  label: string;
  title: string;
};

export async function checkProjectWindow(): Promise<ProjectWindowStatus> {
  return new Promise<ProjectWindowStatus>((resolve) => {
    once("project-window-status", (event) => {
      resolve(event.payload as ProjectWindowStatus);
    });
    emit("check-project-window", {});
  });
}

export default async function guardProjectWindow(
  action: "create" | "open"
): Promise<boolean> {
  const status = await checkProjectWindow();

  if (!status.exists) return true;

  const verb = action === "create" ? "create" : "open";
  const okLabel =
    action === "create" ? "Close and Create New" : "Close and Open Another";
  const projectName = status.title || "the current project";
  const text = getDialogText(
    "Close project to continue",
    `To ${verb} another project, you'll need to close "${projectName}" first.`,
    ""
  );
  const confirmed = await ask(text.message, {
    title: text.title,
    okLabel,
    cancelLabel: "Cancel",
  });

  if (!confirmed) return false;

  emit("set-pending-close", { label: status.label });
  return true;
}
