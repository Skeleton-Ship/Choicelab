import { computePosition, autoUpdate, flip, shift, offset, hide } from "@floating-ui/dom";
import { Variable } from "../../typings";

/*
 * The popup list of variables used by rich text fields, both when typing "{"
 * and when a variable chip is selected. Plain DOM, positioned under an anchor.
 */

export interface VariablePicker {
  isOpen: () => boolean;
  /**
   * @param contextElement - An element inside the scrolling area the anchor is
   *                         in, so the list follows it when that area scrolls.
   */
  show: (
    items: Variable[],
    selectedIndex: number,
    getAnchor: () => DOMRect | null,
    contextElement: Element
  ) => void;
  reposition: () => void;
  move: (delta: 1 | -1) => void;
  pick: () => void;
  hide: () => void;
}

// Matches the .closing transition in rich-text.scss
const FADE_OUT_MS = 200;

export function createVariablePicker(onPick: (variable: Variable) => void): VariablePicker {
  let items: Variable[] = [];
  let selectedIndex = 0;
  let getAnchor: () => DOMRect | null = () => null;
  let contextElement: Element | null = null;
  let stopAutoUpdate: (() => void) | null = null;
  let closing = false;
  let removeTimer: ReturnType<typeof setTimeout> | null = null;
  const el = document.createElement("div");
  el.className = "rich-text-suggestions";
  el.setAttribute("role", "listbox");

  function render() {
    el.replaceChildren();
    if (items.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "No matching variables";
      el.appendChild(empty);
      return;
    }
    items.forEach((variable, i) => {
      const option = document.createElement("div");
      option.className = i === selectedIndex ? "option selected" : "option";
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", String(i === selectedIndex));
      option.textContent = variable.name;
      // The highlight follows the mouse, like a native menu
      option.addEventListener("mouseenter", () => highlight(i, false));
      // Keep focus in the editor
      option.addEventListener("mousedown", (e) => {
        e.preventDefault();
        onPick(variable);
      });
      el.appendChild(option);
    });
    el.querySelector(".selected")?.scrollIntoView({ block: "nearest" });
  }

  // Moves the highlight without rebuilding the list (rebuilding under the
  // pointer would fire mouseenter again)
  function highlight(index: number, scroll: boolean) {
    selectedIndex = index;
    el.querySelectorAll(".option").forEach((option, i) => {
      option.classList.toggle("selected", i === index);
      option.setAttribute("aria-selected", String(i === index));
    });
    if (scroll) el.querySelector(".selected")?.scrollIntoView({ block: "nearest" });
  }

  // A virtual element: the anchor's current rect, inside contextElement's
  // scrolling ancestors (which autoUpdate listens to)
  const reference = {
    getBoundingClientRect: () => getAnchor() ?? new DOMRect(),
    get contextElement() {
      return contextElement ?? undefined;
    },
  };

  function reposition() {
    if (!el.isConnected) return;
    computePosition(reference, el, {
      placement: "bottom-start",
      strategy: "fixed",
      middleware: [offset(4), flip(), shift({ padding: 8 }), hide()],
    }).then(({ x, y, middlewareData }) => {
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      // Hide the list while its token is scrolled out of view
      el.style.visibility = middlewareData.hide?.referenceHidden ? "hidden" : "";
    });
  }

  return {
    isOpen: () => el.isConnected && !closing,
    show(nextItems, nextIndex, nextAnchor, nextContext) {
      // Reopening during the fade-out shows the list again right away
      if (removeTimer) clearTimeout(removeTimer);
      removeTimer = null;
      closing = false;
      el.classList.remove("closing");
      items = nextItems;
      selectedIndex = Math.min(Math.max(0, nextIndex), Math.max(0, items.length - 1));
      getAnchor = nextAnchor;
      if (!el.isConnected) document.body.appendChild(el);
      render();
      if (!stopAutoUpdate || nextContext !== contextElement) {
        stopAutoUpdate?.();
        contextElement = nextContext;
        // Also positions the list right away
        stopAutoUpdate = autoUpdate(reference, el, reposition);
      } else {
        reposition();
      }
    },
    reposition,
    move(delta) {
      if (items.length === 0) return;
      highlight((selectedIndex + delta + items.length) % items.length, true);
    },
    pick() {
      const item = items[selectedIndex];
      if (item) onPick(item);
    },
    hide() {
      stopAutoUpdate?.();
      stopAutoUpdate = null;
      contextElement = null;
      if (!el.isConnected || closing) return;
      // Fade out in place, like a macOS menu (see .closing in rich-text.scss)
      closing = true;
      el.classList.add("closing");
      removeTimer = setTimeout(() => {
        removeTimer = null;
        closing = false;
        el.classList.remove("closing");
        el.remove();
      }, FADE_OUT_MS);
    },
  };
}
