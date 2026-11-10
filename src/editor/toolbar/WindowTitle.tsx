import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { platform as getPlatform } from "@tauri-apps/plugin-os";
import { useEffect, useState } from "preact/hooks";
import { getStore } from "../../data/dataStore";

/** Mirrors `ProjectTitleBarLayout` in native_bridge_macos.rs. */
type TitleBarLayout = {
  titleLeft: number;
  titleTop: number;
};

// Measured once by the backend, and the same for every window
let layoutRequest: Promise<TitleBarLayout | null> | null = null;
function getTitleBarLayout() {
  if (!layoutRequest) {
    layoutRequest =
      getPlatform() === "macos"
        ? invoke<TitleBarLayout | null>("get_project_title_bar_layout").catch(
            () => null
          )
        : Promise.resolve(null);
  }
  return layoutRequest;
}

/**
 * The project window's title on macOS, drawn here rather than by AppKit so it
 * sits alongside the traffic lights in the same spot on every macOS version. Renders nothing where the
 * native title is shown instead (Windows, or if the backend couldn't measure
 * the title bar).
 */
export default function WindowTitle() {
  const [layout, setLayout] = useState<TitleBarLayout | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let unlisten: (() => void) | null = null;
    getTitleBarLayout().then((result) => {
      if (cancelled || !result) return;
      setLayout(result);
      // AppKit moves the title and traffic lights into the menu bar area in
      // full screen, so hide this one there too
      const appWindow = getCurrentWindow();
      const checkFullscreen = () =>
        appWindow.isFullscreen().then((value) => {
          if (!cancelled) setFullscreen(value);
        });
      checkFullscreen();
      appWindow.onResized(checkFullscreen).then((fn) => {
        if (cancelled) fn();
        else unlisten = fn;
      });
    });
    return () => {
      cancelled = true;
      if (unlisten) unlisten();
    };
  }, []);
  if (!layout || fullscreen) return null;
  return (
    <div
      class="window-title"
      style={{ top: `${layout.titleTop}px`, left: `${layout.titleLeft}px` }}
      aria-hidden="true"
    >
      {getStore().project.name}
    </div>
  );
}
