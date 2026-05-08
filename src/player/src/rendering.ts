import { ActionForPlayback } from "./typings";
import { getStore } from "./store";
import { error } from "./logging";

const GRID_TO_PERCENT: Record<number, number> = { 1: 16, 2: 50, 3: 83 };

function getPosition(action: ActionForPlayback): { x: number; y: number } {
  const pos = action.extendedProps?.["choicelab-player-html5"]?.position;
  if (pos) {
    if (pos.kind === "absolute") return { x: pos.x, y: pos.y };
    if (pos.kind === "grid") {
      return {
        x: GRID_TO_PERCENT[pos.x] ?? 50,
        y: GRID_TO_PERCENT[pos.y] ?? 50,
      };
    }
  }
  return { x: 50, y: 50 };
}

function getMaxWidth(action: ActionForPlayback): number {
  return action.extendedProps?.["choicelab-player-html5"]?.maxWidth ?? 45;
}

export function createActionWrapper(
  tagName: string,
  action: ActionForPlayback
): HTMLElement {
  const store = getStore();
  const el = document.createElement(tagName);
  el.classList.add(`${action.name}`);
  el.classList.add(`cl-action`);
  store.playback.actionWrappers[action.id] = el;
  return el;
}

export function render(el: Element, action: ActionForPlayback) {
  const store = getStore();
  const stage = store.playback.rootEl.querySelector(".cl-stage") as HTMLElement;
  if (!stage) {
    error("Stage element not found.");
    return;
  }
  const { x, y } = getPosition(action);
  const maxWidth = getMaxWidth(action);
  (el as HTMLElement).style.setProperty("--cl-pos-x", `${x}%`);
  (el as HTMLElement).style.setProperty("--cl-pos-y", `${y}%`);
  (el as HTMLElement).style.setProperty("--cl-max-width", `${maxWidth}%`);
  stage.appendChild(el);
}

export function clear(action: ActionForPlayback) {
  const store = getStore();
  const el = store.playback.actionWrappers[action.id];
  if (!el) {
    error(`No action with the ID ${action.id} was found.`);
    return;
  }
  el.classList.add(`clear`);
  setTimeout(() => {
    el.parentNode?.removeChild(el);
  }, 300);
  delete store.playback.actionWrappers[action.id];
}
