import { open } from "@tauri-apps/plugin-shell";

/*
 * Click handler for content with links (e.g. Markdown), which opens them in the
 * default browser. Attach it to the content's container. Static windows block
 * navigation away from the app (see open_static_window in bind_listeners.rs),
 * so without it, links do nothing.
 */
export function openExternalLinks(e: MouseEvent) {
  const link = (e.target as Element).closest("a[href]");
  if (!link) return;
  e.preventDefault();
  const href = link.getAttribute("href") ?? "";
  if (/^https?:\/\//.test(href)) {
    open(href).catch((error) => console.error("Couldn't open link:", error));
  }
}
