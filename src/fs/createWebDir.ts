import { emit } from "@tauri-apps/api/event";
import playerHTMLDefault from "@surfgreen/choicelab-player-html5/dist/index.html?raw";
import playerCSSDefault from "@surfgreen/choicelab-player-html5/dist/choicelab.css?raw";
import playerJSDefault from "@surfgreen/choicelab-player-html5/dist/choicelab.js?raw";

export function createWebDir(projectPath: string, label: string) {
  emit("save-text-file", {
    name: "index.html",
    contents: playerHTMLDefault,
    path: projectPath + "/.web",
    label: label,
  });
  emit("save-text-file", {
    name: "choicelab.css",
    contents: playerCSSDefault,
    path: projectPath + "/.web",
    label: label,
  });
  emit("save-text-file", {
    name: "choicelab.js",
    contents: playerJSDefault,
    path: projectPath + "/.web",
    label: label,
  });
}
