/*
 * Double-buffered preview iframes. A new iframe loads invisibly on top of the
 * current one, and replaces it only once the player reports that it has
 * rendered, so the preview never shows a blank or half-loaded page.
 */

// Must match the message posted by the player (src/player/src/main.ts)
export const PREVIEW_READY_MESSAGE = "choicelab-preview-ready";
// Reveal the new frame anyway if the player never reports in
const READY_FALLBACK_MS = 4000;

const cancelers = new WeakMap<HTMLIFrameElement, () => void>();

function whenFrameReady(iframe: HTMLIFrameElement, callback: () => void) {
  let done = false;
  const finish = () => {
    if (done) return;
    cancel();
    callback();
  };
  const onMessage = (e: MessageEvent) => {
    if (
      e.source === iframe.contentWindow &&
      e.data?.type === PREVIEW_READY_MESSAGE
    ) {
      finish();
    }
  };
  const timer = window.setTimeout(finish, READY_FALLBACK_MS);
  const cancel = () => {
    done = true;
    window.removeEventListener("message", onMessage);
    window.clearTimeout(timer);
  };
  window.addEventListener("message", onMessage);
  cancelers.set(iframe, cancel);
}

export function loadPreviewFrame(url: string) {
  const container = document.getElementById("preview-frames");
  if (!container) return;
  // Discard any frame that's still loading; only the newest request matters
  container
    .querySelectorAll<HTMLIFrameElement>("iframe.pending")
    .forEach((stale) => {
      cancelers.get(stale)?.();
      stale.remove();
    });
  const next = document.createElement("iframe");
  next.className = "pending";
  whenFrameReady(next, () => {
    if (!next.isConnected) return;
    container
      .querySelectorAll<HTMLIFrameElement>("iframe.current")
      .forEach((old) => old.remove());
    next.className = "current";
  });
  next.src = url;
  container.appendChild(next);
}
