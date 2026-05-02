import { ActionForPlayback } from "./typings";
import { getStore } from "./store";
import { error } from "./logging";

function gridCell(action: ActionForPlayback): string {
  let x = 1,
    y = 1;
  const extendedProps = action.extendedProps["choicelab-player-html5"];
  if (extendedProps) {
    const position = extendedProps.position;
    if (position) {
      x = position.x;
      y = position.y;
    }
  }
  return `.grid.x-${x}.y-${y}`;
}

export function createActionWrapper(
  tagName: string,
  action: ActionForPlayback
): HTMLElement {
  const store = getStore();
  const el = document.createElement(tagName);
  el.classList.add(`${action.name}`);
  el.classList.add(`cl-action`);
  // Get position classes
  store.playback.actionWrappers[action.id] = el;
  return el;
}

export function render(el: Element, action: ActionForPlayback) {
  const store = getStore();
  const selector = gridCell(action);
  const renderEl = store.playback.rootEl.querySelector(`.cl-stage ${selector}`);
  // Render element
  if (renderEl) {
    renderEl.appendChild(el);
  } else {
    error(`The element ${selector} was not found on the stage.`);
  }
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
  // delete action wrapper
  delete store.playback.actionWrappers[action.id];
}
