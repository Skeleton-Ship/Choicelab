import { getStore } from "./store";
import { playMedia } from "./media/playPause";

export function enableAutoplay() {
  const media = getStore().playback.media;
  if (media.autoplay) return;
  media.autoplay = true;
  if (media.currentItem && !media.playing) {
    playMedia();
  }
}

export function registerAutoplayQualifier(element: HTMLElement) {
  element.addEventListener("click", () => enableAutoplay(), { once: true });
}
