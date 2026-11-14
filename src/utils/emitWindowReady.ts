import { emit } from "@tauri-apps/api/event";

type WindowReadyPayload = { label: string; projectPath?: string };

/** Resolves when `promise` does, or after `ms`, whichever is first. */
function withTimeout(promise: Promise<unknown>, ms: number) {
  return Promise.race([
    promise,
    new Promise<void>((resolve) => setTimeout(resolve, ms)),
  ]);
}

/**
 * Waits for the window's contents to be ready to show: pending renders done,
 * and fonts and images loaded and decoded. Capped, so a slow image can't keep
 * a window hidden.
 */
async function whenContentsReady() {
  // Let any pending renders (e.g. from a state update just made) run first
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  const images = Array.from(document.images, (img) =>
    img.decode().catch(() => {})
  );
  await withTimeout(Promise.all([document.fonts.ready, ...images]), 1000);
  // Then a frame, so layout catches up. Hidden windows may not run frames at
  // all, so don't wait long for one.
  await withTimeout(
    new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
    50
  );
}

/**
 * Tells the backend this window is ready, once its contents are. Windows are
 * created hidden, and the backend shows them on this (see reveal_window() in
 * bind_listeners.rs), so call it once the window's contents are complete.
 */
export async function emitWindowReady(payload: WindowReadyPayload) {
  await whenContentsReady();
  await emit("window-ready", payload);
}
