/*
 * Menu keyboard shortcuts on Windows.
 *
 * Menu accelerators on Windows live on the native window, but keystrokes go to
 * WebView2 first and never reach them. Instead, every menu item created with an
 * accelerator (see menuItem/checkMenuItem below) is recorded here, and a
 * keydown listener runs the matching item through the same path as a click.
 *
 * A matching shortcut is consumed, as a native accelerator would be: the
 * WebView never sees it, so it can't trigger the browser's own shortcuts
 * (Ctrl+N, Ctrl+R, etc.) or editor keymaps. Following Windows convention, a
 * shortcut for a disabled item does nothing.
 *
 * The exception is a focused text field, which keeps its own editing keys
 * (e.g. Ctrl+Delete deletes a word, not the selected node) and any shortcut
 * whose item is disabled (e.g. Ctrl+Z before the project has history), as it
 * would with no menu at all.
 *
 * Built-in items (Cut, Copy, Paste, Select All) have no accelerator here and
 * are left to the WebView.
 */

import { invoke } from "@tauri-apps/api/core";
import {
  Menu,
  MenuItem,
  CheckMenuItem,
  Submenu,
  MenuItemOptions,
  CheckMenuItemOptions,
} from "@tauri-apps/api/menu";
import { platform as getPlatform } from "@tauri-apps/plugin-os";
import inTextElement from "../utils/inTextElement";

type Shortcut = {
  id: string;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
  key: string;
};

const enabled = new Map<string, boolean>();
let pending: Shortcut[] = [];
let active: Shortcut[] = [];

const isWindows = getPlatform() === "windows";

/** Create a MenuItem, recording its accelerator */
export async function menuItem(options: MenuItemOptions) {
  record(options);
  return MenuItem.new(options);
}

/** Create a CheckMenuItem, recording its accelerator */
export async function checkMenuItem(options: CheckMenuItemOptions) {
  record(options);
  return CheckMenuItem.new(options);
}

function record(options: MenuItemOptions | CheckMenuItemOptions) {
  if (!isWindows || !options.id) return;
  enabled.set(options.id, options.enabled ?? true);
  if (!options.accelerator) return;
  const shortcut = parseAccelerator(options.accelerator, options.id);
  if (shortcut) pending.push(shortcut);
}

/** Call before building a menu */
export function beginShortcuts() {
  pending = [];
}

/**
 * Call once the menu is built: activates the recorded shortcuts for items that
 * ended up in it (or none, if this window has no menu).
 */
export async function commitShortcuts(menu: Menu | null) {
  if (!isWindows) return;
  const ids = new Set<string>();
  if (menu) await collectIds(await menu.items(), ids);
  active = pending.filter((shortcut) => ids.has(shortcut.id));
  pending = [];
}

async function collectIds(
  items: Awaited<ReturnType<Menu["items"]>>,
  ids: Set<string>
) {
  for (const item of items) {
    ids.add(item.id);
    if (item instanceof Submenu) await collectIds(await item.items(), ids);
  }
}

/** Mirror a menu item's enabled state (called from setMenu) */
export function setShortcutEnabled(id: string, isEnabled: boolean) {
  if (!isWindows) return;
  enabled.set(id, isEnabled);
}

/** Install the keydown listener (Windows only) */
export function installMenuShortcuts() {
  if (!isWindows) return;
  // Capture on window so this runs before any other key handling
  window.addEventListener(
    "keydown",
    (e) => {
      if (e.isComposing) return;
      const shortcut = active.find((s) => matches(s, e));
      if (!shortcut) return;
      const isEnabled = enabled.get(shortcut.id) !== false;
      if (
        inTextElement() &&
        (textEditingKeys.has(shortcut.key) || !isEnabled)
      ) {
        return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();
      if (!isEnabled) return;
      invoke("trigger_menu_item", { id: shortcut.id });
    },
    true
  );
}

// Keys text fields use for editing and moving the cursor, with or without
// modifiers (KeyboardEvent.code)
const textEditingKeys = new Set([
  "Backspace",
  "Delete",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
  "PageUp",
  "PageDown",
]);

/*
 * Accelerator parsing and matching
 */

// Named keys (accelerator token → KeyboardEvent.code)
const namedKeys: Record<string, string> = {
  ",": "Comma",
  ".": "Period",
  "/": "Slash",
  ";": "Semicolon",
  "'": "Quote",
  "[": "BracketLeft",
  "]": "BracketRight",
  "\\": "Backslash",
  "-": "Minus",
  "=": "Equal",
  "`": "Backquote",
  backspace: "Backspace",
  delete: "Delete",
  enter: "Enter",
  return: "Enter",
  tab: "Tab",
  escape: "Escape",
  esc: "Escape",
  space: "Space",
  up: "ArrowUp",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
  home: "Home",
  end: "End",
  pageup: "PageUp",
  pagedown: "PageDown",
};

function parseAccelerator(accelerator: string, id: string): Shortcut | null {
  const shortcut: Shortcut = {
    id,
    ctrl: false,
    shift: false,
    alt: false,
    meta: false,
    key: "",
  };
  for (const raw of accelerator.split("+")) {
    const token = raw.trim().toLowerCase();
    switch (token) {
      case "cmdorctrl":
      case "cmdorcontrol":
      case "commandorcontrol":
      case "commandorctrl":
      case "ctrl":
      case "control":
        shortcut.ctrl = true;
        break;
      case "shift":
        shortcut.shift = true;
        break;
      case "alt":
      case "option":
        shortcut.alt = true;
        break;
      case "cmd":
      case "command":
      case "super":
      case "meta":
        shortcut.meta = true;
        break;
      default:
        if (/^[a-z]$/.test(token)) shortcut.key = token;
        else if (/^[0-9]$/.test(token)) shortcut.key = `Digit${token}`;
        else if (/^f([1-9]|1[0-9]|2[0-4])$/.test(token))
          shortcut.key = token.toUpperCase();
        else if (namedKeys[token]) shortcut.key = namedKeys[token];
        else {
          console.warn(`Unrecognized accelerator key "${raw}" in`, accelerator);
          return null;
        }
    }
  }
  return shortcut.key ? shortcut : null;
}

function matches(shortcut: Shortcut, e: KeyboardEvent) {
  if (
    e.ctrlKey !== shortcut.ctrl ||
    e.shiftKey !== shortcut.shift ||
    e.altKey !== shortcut.alt ||
    e.metaKey !== shortcut.meta
  ) {
    return false;
  }
  // Letters follow the keyboard layout, like native accelerators. On layouts
  // without Latin letters (e.g. Cyrillic), fall back to the physical key, as
  // Windows does. Everything else matches the physical key, so Shift doesn't
  // change it (e.g. "," → "<").
  if (shortcut.key.length === 1) {
    const key = e.key.toLowerCase();
    if (/^[a-z]$/.test(key)) return key === shortcut.key;
    return e.code === `Key${shortcut.key.toUpperCase()}`;
  }
  return e.code === shortcut.key;
}
