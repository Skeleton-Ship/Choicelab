import { check } from "@tauri-apps/plugin-updater";
import { emit } from "@tauri-apps/api/event";
import { handleCloseRequest } from "../fs/handleCloseRequest";
import spinner from "../assets/spinner.gif";

async function updateToolbar(callback: Function) {
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
      // Run callback from checkForUpdates
      callback();
    });
  });
}

export async function checkForUpdates() {
  const update = await check();
  if (update) {
    updateToolbar(async () => {
      emit("handle-update");
    });
  }
}
