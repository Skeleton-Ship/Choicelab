import { message } from "@tauri-apps/plugin-dialog";
import { getDialogText } from "../utils/dialogText";
import { getFileErrorText } from "./fileErrorText";

export type SaveErrorChoice = "save-as" | "retry" | "cancel";

const SAVE_AS_LABEL = "Save As…";
const RETRY_LABEL = "Try Again";
const CANCEL_LABEL = "Cancel";

/**
 * Tell the author their project couldn't be saved, and ask what to do next.
 * Save As is the default, since a different location usually works when the
 * original one doesn't.
 */
export async function showSaveErrorDialog(
  error: unknown,
  projectName: string
): Promise<SaveErrorChoice> {
  console.error(`Couldn't save project "${projectName}":`, error);
  const text = getFileErrorText(error, projectName);
  const dialog = getDialogText("Couldn't save project", text.title, text.body);
  const result = await message(dialog.message, {
    title: dialog.title,
    kind: "error",
    buttons: { yes: SAVE_AS_LABEL, no: RETRY_LABEL, cancel: CANCEL_LABEL },
  });
  // Depending on the platform, the result is either the button's label or
  // which slot it was in
  if (result === SAVE_AS_LABEL || result === "Yes") return "save-as";
  if (result === RETRY_LABEL || result === "No") return "retry";
  return "cancel";
}

/**
 * Tell the author a file operation failed, when there's nothing to choose
 * (e.g. an export, which they can just try again). `windowTitle` is only used
 * on Windows, where dialogs have a title bar.
 */
export async function showFileErrorMessage(
  error: unknown,
  name: string,
  windowTitle: string
): Promise<void> {
  console.error(`${windowTitle}:`, error);
  const text = getFileErrorText(error, name);
  const dialog = getDialogText(windowTitle, text.title, text.body);
  await message(dialog.message, { title: dialog.title, kind: "error" });
}
