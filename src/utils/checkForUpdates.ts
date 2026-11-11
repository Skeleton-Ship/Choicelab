/*
 * App updates. The check itself happens in Rust (src-tauri/src/check_for_updates.rs),
 * which also decides whether this machine's OS is new enough for the update.
 *
 * - On project open, the check is silent: if an installable update exists, an
 *   "Update Ready" button appears in the toolbar. Nothing else is shown.
 * - "Check for Updates..." in the menu reports the result either way, including
 *   when an update exists but this machine can't run it.
 */

import { invoke } from "@tauri-apps/api/core";
import { emitTo } from "@tauri-apps/api/event";
import {
  getAllWebviewWindows,
  getCurrentWebviewWindow,
} from "@tauri-apps/api/webviewWindow";
import { ask, message } from "@tauri-apps/plugin-dialog";
import { open } from "@tauri-apps/plugin-shell";
import { platform as getPlatform } from "@tauri-apps/plugin-os";
import { handleCloseRequest } from "../fs/handleCloseRequest";
import spinner from "../assets/spinner.gif";
import { getDialogText } from "./dialogText";
import { WindowType } from "../typings";

const WEBSITE_URL = "https://choicelab.xyz";
const INSTALL_REQUEST_EVENT = "request-update-install";

function getUpdateButton() {
  return document.querySelector<HTMLButtonElement>(
    "#toolbar #update button"
  );
}

type UpdateStatus =
  | { kind: "upToDate"; currentVersion: string }
  | { kind: "available"; version: string }
  | { kind: "unsupported"; version: string; minimumSystemVersion: string };

function checkForUpdate() {
  return invoke<UpdateStatus>("check_for_update");
}

/*
 * Dialogs
 */

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
  if (visitWebsite) open(WEBSITE_URL);
}

async function showCheckFailedDialog() {
  const dialog = getDialogText(
    "Problem checking for updates",
    "Choicelab couldn't check for updates.",
    "Check your internet connection and try again, or visit the Choicelab website to download the latest version."
  );
  const visitWebsite = await ask(dialog.message, {
    title: dialog.title,
    okLabel: "Visit Website",
    cancelLabel: "Dismiss",
  });
  if (visitWebsite) open(WEBSITE_URL);
}

/** "13.5" -> "macOS 13.5", "10.0.22000" -> "Windows 11" */
function describeSystemVersion(version: string) {
  const platform = getPlatform();
  if (platform === "macos") return `macOS ${version}`;
  if (platform === "windows") {
    const [major, minor, build] = version.split(".").map(Number);
    if (major === 10 && minor === 0 && build >= 22000) {
      return build === 22000 ? "Windows 11" : `Windows 11 (build ${build})`;
    }
    return `Windows ${version}`;
  }
  return version;
}

/*
 * Installing
 */

function startButtonSpinner() {
  const btn = getUpdateButton();
  if (!btn) return;
  btn.innerText = "Updating...";
  const progressIndicator = document.createElement("img");
  progressIndicator.src = spinner;
  btn.insertBefore(progressIndicator, btn.firstChild);
  btn.setAttribute("disabled", "");
}

function revertButtonToFailed() {
  const btn = getUpdateButton();
  if (!btn) return;
  // Clone to strip the old click listener before re-enabling
  const newBtn = btn.cloneNode(false) as HTMLButtonElement;
  newBtn.removeAttribute("disabled");
  newBtn.innerText = "Update on Website";
  newBtn.addEventListener("click", () => open(WEBSITE_URL));
  btn.replaceWith(newBtn);
}

async function install() {
  try {
    // Relaunches the app on success, so nothing after this runs
    await invoke("install_update");
  } catch {
    revertButtonToFailed();
    showUpdateFailedDialog();
  }
}

/** From a project window: handle unsaved changes, then install. */
function installFromProjectWindow() {
  handleCloseRequest(() => {
    startButtonSpinner();
    install();
  });
}

/** From any window: route the install through the open project, if there is one. */
async function requestInstall(windowType: WindowType) {
  if (windowType === "project") {
    installFromProjectWindow();
    return;
  }
  const projectWindow = (await getAllWebviewWindows()).find(
    (w) =>
      w.label.startsWith("project_") &&
      !w.label.startsWith("project_settings_") &&
      !w.label.startsWith("project_assets_")
  );
  if (projectWindow) {
    await projectWindow.setFocus();
    emitTo(projectWindow.label, INSTALL_REQUEST_EVENT);
  } else {
    install();
  }
}

/*
 * Toolbar button
 */

function showUpdateButton() {
  const toolbar = document.querySelector("#toolbar #update");
  if (!toolbar || toolbar.querySelector("button")) return;
  const btn = document.createElement("button");
  btn.innerText = "Update Ready";
  toolbar.appendChild(btn);
  btn.addEventListener("click", installFromProjectWindow);
}

let listeningForInstallRequests = false;

/** Silent check, run when a project window opens. */
export async function checkForUpdates() {
  if (!listeningForInstallRequests) {
    listeningForInstallRequests = true;
    getCurrentWebviewWindow().listen(INSTALL_REQUEST_EVENT, () => {
      showUpdateButton();
      installFromProjectWindow();
    });
  }
  try {
    const status = await checkForUpdate();
    if (status.kind === "available") showUpdateButton();
  } catch {
    // Offline or the server is unreachable; try again next time
  }
}

/** "Check for Updates..." in the menu: always reports the result. */
export async function checkForUpdatesFromMenu(windowType: WindowType) {
  let status: UpdateStatus;
  try {
    status = await checkForUpdate();
  } catch {
    showCheckFailedDialog();
    return;
  }

  switch (status.kind) {
    case "upToDate": {
      const dialog = getDialogText(
        "Check for Updates",
        "You're up to date!",
        `Choicelab ${status.currentVersion} is the latest version.`
      );
      await message(dialog.message, { title: dialog.title });
      break;
    }
    case "unsupported": {
      const system = describeSystemVersion(status.minimumSystemVersion);
      const dialog = getDialogText(
        "Check for Updates",
        `Choicelab ${status.version} requires ${system} or later.`,
        "You have the latest version of Choicelab that supports this computer."
      );
      await message(dialog.message, { title: dialog.title });
      break;
    }
    case "available": {
      if (windowType === "project") showUpdateButton();
      const dialog = getDialogText(
        "Check for Updates",
        `Choicelab ${status.version} is available.`,
        "Choicelab will relaunch once the update is installed."
      );
      const installNow = await ask(dialog.message, {
        title: dialog.title,
        okLabel: "Install and Relaunch",
        cancelLabel: "Later",
      });
      if (installNow) requestInstall(windowType);
      break;
    }
  }
}
