import { ask } from "@tauri-apps/plugin-dialog";
import { emit, once } from "@tauri-apps/api/event";

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

  emit("check-project-window", {});

  const status = await statusPromise;

  if (!status.exists) return true;

  const verb = action === "create" ? "create" : "open";
  const okLabel =
    action === "create" ? "Close and Create Another" : "Close and Open Another";

  const confirmed = await ask(
    `To ${verb} another project, you'll need to save and close this project first. Continue?`,
    { okLabel, cancelLabel: "Cancel" }
  );

  if (!confirmed) return false;

  emit("set-pending-close", { label: status.label });
  return true;
}
