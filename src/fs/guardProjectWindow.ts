import { ask } from "@tauri-apps/plugin-dialog";
import { emit, once } from "@tauri-apps/api/event";
import { getViewStore } from "../data/dataStore";
import { getDialogText } from "../utils/dialogText";

export default async function guardProjectWindow(
  action: "create" | "open"
): Promise<boolean> {
  const statusPromise = new Promise<{ exists: boolean; label: string }>(
    (resolve) => {
      once("project-window-status", (event) => {
        resolve(event.payload as { exists: boolean; label: string });
      });
    }
  );

  const projectName = getViewStore().projectName;

  emit("check-project-window", {});

  const status = await statusPromise;

  if (!status.exists) return true;

  const verb = action === "create" ? "create" : "open";
  const okLabel =
    action === "create" ? "Close and Create Another" : "Close and Open Another";
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
