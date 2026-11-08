import { useEffect, useState } from "preact/hooks";
import { emit } from "@tauri-apps/api/event";
import { getVersion } from "@tauri-apps/api/app";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { platform as getPlatform } from "@tauri-apps/plugin-os";
import { WindowType } from "../typings";
import { exit } from "@tauri-apps/plugin-process";
import { getStore, getViewStore } from "../data/dataStore";
import { flushAutosave } from "../fs/autosave";
import { saveProject } from "../fs/saveProject";
import { saveAsProject } from "../fs/saveAsProject";
import { handleCloseRequest, handleQuit } from "../fs/handleCloseRequest";

const appWindow = getCurrentWebviewWindow();

type AutosaveStatus = "saving" | "saved" | "failed" | "not-needed";

interface CrashScreenProps {
  error: unknown;
  windowType: WindowType;
}

/** Whether the project's data is readable, so it can be auto-saved. */
function hasReadableProject(): boolean {
  try {
    return getStore()?.project !== undefined;
  } catch {
    return false;
  }
}

/**
 * Whether there may be unsaved changes worth auto-saving. If that can't be
 * told (the view store is missing, or is what broke) but the project data is
 * readable, assume there are: auto-saving needlessly only means an extra
 * recovery prompt, while skipping it could lose work.
 */
function mayHaveUnsavedChanges(): boolean {
  try {
    const saved = getViewStore()?.saved;
    if (typeof saved === "boolean") return !saved;
  } catch {
    // Fall through to checking the project data
  }
  return hasReadableProject();
}

/** Whether the project finished loading before the crash. */
function hasProjectData(): boolean {
  try {
    return getStore() !== undefined && getViewStore() !== undefined;
  } catch {
    return false;
  }
}

function describeError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}\n${error.stack ?? ""}`.trim();
  }
  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return String(error);
  }
}

// Listen for an app menu event meant for this window
function listenToMenu(event: string, handler: () => void) {
  return appWindow.listen<{ label: string }>(event, (e) => {
    if (e.payload.label === appWindow.label) handler();
  });
}

/**
 * Shown in place of a window's contents after it crashes. In project windows,
 * auto-saves any unsaved changes first, so reloading (which offers to restore
 * the autosave) doesn't lose work.
 */
export function CrashScreen({ error, windowType }: CrashScreenProps) {
  const isProject = windowType === "project";
  const [autosave, setAutosave] = useState<AutosaveStatus>(() =>
    isProject && mayHaveUnsavedChanges() ? "saving" : "not-needed"
  );
  const [details, setDetails] = useState(describeError(error));
  const [copied, setCopied] = useState(false);

  // The editor's re-render callbacks belong to components that are gone now;
  // make saving (which calls them) leave the crash screen alone
  useEffect(() => {
    // Not set up yet if the window crashed while starting
    if (!window.__CHOICELAB_FUNCTIONS__) return;
    window.__CHOICELAB_FUNCTIONS__.updateProject = () => {};
    window.__CHOICELAB_FUNCTIONS__.updateView = () => {};
  }, []);

  // Save unsaved changes right away, without waiting for the autosave interval
  useEffect(() => {
    if (autosave !== "saving") return;
    flushAutosave().then((ok) => setAutosave(ok ? "saved" : "failed"));
  }, []);

  // Add the app version and platform to the details, for issue reports
  useEffect(() => {
    getVersion()
      .then((version) =>
        setDetails(
          `Choicelab ${version} (${getPlatform()})\n\n${describeError(error)}`
        )
      )
      .catch(() => {});
  }, [error]);

  // The editor's own listeners went away with it. Keep closing, saving, and
  // quitting working, so unsaved changes still get the usual prompts.
  useEffect(() => {
    if (!isProject) return;
    // If the project never finished loading, there's nothing to save, and the
    // usual handlers would fail; just close or quit
    if (!hasProjectData()) {
      const unlisteners = [
        appWindow.listen("tauri://close-requested", () => {
          appWindow.destroy();
        }),
        listenToMenu("menu-request-quit", () => exit(0)),
      ];
      return () => {
        unlisteners.forEach((unlisten) => unlisten.then((fn) => fn()));
      };
    }
    const unlisteners = [
      appWindow.listen("tauri://close-requested", () => {
        handleCloseRequest();
      }),
      listenToMenu("menu-save-project", () => saveProject()),
      listenToMenu("menu-save-as-project", () => saveAsProject()),
      listenToMenu("menu-request-quit", () => handleQuit()),
    ];
    return () => {
      unlisteners.forEach((unlisten) => unlisten.then((fn) => fn()));
    };
  }, []);

  function reload() {
    if (isProject) {
      // Reloading opens the saved version unless the author restores the
      // autosave, which marks the window as edited again
      emit("set-document-edited", {
        state: false,
        windowLabel: appWindow.label,
      });
    }
    window.location.reload();
  }

  function copyDetails() {
    navigator.clipboard
      .writeText(details)
      .then(() => setCopied(true))
      .catch(() => {});
  }

  let message: string;
  switch (autosave) {
    case "saving":
      message = "Auto-saving your changes…";
      break;
    case "saved":
      message =
        "Your changes were auto-saved. Reload the window to keep working, and Choicelab will offer to restore them.";
      break;
    case "failed":
      message =
        "Your latest changes couldn't be auto-saved. Use Save As to save a copy before reloading, or they'll be lost.";
      break;
    default:
      message = isProject
        ? "No project data was lost. Reload the window to keep working."
        : "Reload the window to try again.";
  }

  const reloadButton = (
    <button
      class={`ui-button large${autosave === "failed" ? "" : " primary"}`}
      disabled={autosave === "saving"}
      onClick={reload}
    >
      Reload Window
    </button>
  );
  const saveAsButton = (
    <button
      class={`ui-button large${autosave === "failed" ? " primary" : ""}`}
      disabled={autosave === "saving"}
      onClick={() => saveAsProject()}
    >
      Save As&hellip;
    </button>
  );

  return (
    <div id="crash-screen" data-tauri-drag-region>
      <div class="inner">
        <h1>Choicelab encountered a problem.</h1>
        <p>{message}</p>
        <div class="actions">
          {/* When autosave failed, saving a copy comes first */}
          {autosave === "failed" && saveAsButton}
          {reloadButton}
          {isProject &&
            autosave !== "failed" &&
            autosave !== "not-needed" &&
            saveAsButton}
          <button class="ui-button large" onClick={copyDetails}>
            {copied ? "Copied" : "Copy Error Details"}
          </button>
        </div>
        <details>
          <summary>Error details</summary>
          <pre>{details}</pre>
        </details>
      </div>
    </div>
  );
}
