import { invoke } from "@tauri-apps/api/core";
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
 * sits alongside the traffic lights in the same spot on every macOS version.
 * Renders nothing where the native title is shown instead (Windows, or if the
 * backend couldn't measure the title bar).
 */
export default function WindowTitle() {
  const [layout, setLayout] = useState<TitleBarLayout | null>(null);
  useEffect(() => {
    let cancelled = false;
    getTitleBarLayout().then((result) => {
      if (!cancelled) setLayout(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  if (!layout) return null;
  return (
    <div
      class="window-title"
      style={{
        top: `${layout.titleTop}px`,
        left: `${layout.titleLeft}px`,
        // Leaves the same margin on the right as the traffic lights have on
        // the left, truncating long names to fit
        maxWidth: `calc(100% - ${layout.titleLeft + 12}px)`,
      }}
      aria-hidden="true"
    >
      {getStore().project.name}
    </div>
  );
}
