import { check } from "@tauri-apps/plugin-updater";
import { emit, once } from "@tauri-apps/api/event";
import { ask } from "@tauri-apps/plugin-dialog";
import { open } from "@tauri-apps/plugin-shell";
import { handleCloseRequest } from "../fs/handleCloseRequest";
import spinner from "../assets/spinner.gif";
import { getDialogText } from "./dialogText";

const WEBSITE_URL = "https://choicelab.xyz";

function revertButtonToFailed(btn: HTMLButtonElement) {
  const spinner = btn.querySelector("img");
  if (spinner) spinner.remove();
  // Clone to strip the old click listener before re-enabling
  const newBtn = btn.cloneNode(false) as HTMLButtonElement;
  newBtn.removeAttribute("disabled");
  newBtn.innerText = "Update on Website";
  newBtn.addEventListener("click", () => open(WEBSITE_URL));
  btn.replaceWith(newBtn);
}

async function showUpdateFailedDialog() {
  const dialog = getDialogText(
    "Problem updating Choicelab",
    "Choicelab couldn't be updated automatically.",
    "You can download the latest version on the Choicelab website."
  );
  const visitWebsite = await ask(dialog.message, {
    title: dialog.title,
    okLabel: "Visit Website",
    cancelLabel: "Dismiss",
  });
  if (visitWebsite) {
    open(WEBSITE_URL);
  }
}

async function updateToolbar(callback: (btn: HTMLButtonElement) => void) {
  const toolbar = document.querySelector("#toolbar #update");
  if (!toolbar) return;
  const btn = document.createElement("button");
  btn.innerText = "Update Ready";
  toolbar.appendChild(btn);
  btn.addEventListener("click", () => {
    handleCloseRequest(() => {
      btn.innerText = "Updating...";
      const progressIndicator = document.createElement("img");
      progressIndicator.src = spinner;
      btn.insertBefore(progressIndicator, btn.firstChild);
      btn.setAttribute("disabled", "");
      callback(btn);
    });
  });
}

export async function checkForUpdates() {
  const update = await check();
  if (update) {
    updateToolbar((btn) => {
      once("update-failed", () => {
        revertButtonToFailed(btn);
        showUpdateFailedDialog();
      });
      emit("handle-update");
    });
  }
}
