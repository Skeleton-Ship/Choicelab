import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

async function updateToolbar(callback: Function) {
  const toolbar = document.querySelector("#toolbar #update");
  if (!toolbar) return;
  const btn = document.createElement("button");
  btn.innerText = "Update Ready";
  toolbar.appendChild(btn);
  btn.addEventListener("click", () => {
    callback();
  });
}

export async function checkForUpdates() {
  const update = await check();
  if (update) {
    await update.download((event) => {
      switch (event.event) {
        case "Finished":
          console.log("download finished");
          break;
      }
    });
    updateToolbar(async () => {
      await relaunch();
    });
  }
}
