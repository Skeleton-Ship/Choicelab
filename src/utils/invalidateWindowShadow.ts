import { invoke } from "@tauri-apps/api/core";

/**
 * Asks macOS to recompute this window's shadow once its content has drawn.
 * Windows are transparent, and a transparent window's shadow is shaped from
 * whatever it showed when it opened, which can be nothing at all. No-op on
 * other platforms.
 */
export function invalidateWindowShadowAfterPaint() {
  const invalidate = () => invoke("invalidate_window_shadow").catch(() => {});
  // Two frames: the first runs before the render is painted, the second after
  requestAnimationFrame(() => requestAnimationFrame(invalidate));
  // The webview draws in a separate process, so its frame can reach the window
  // a little later; catch that, along with late fonts and images
  setTimeout(invalidate, 300);
}
