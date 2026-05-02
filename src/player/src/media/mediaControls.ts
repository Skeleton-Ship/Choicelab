import { getStore } from "../store";
import { pauseMedia, playMedia } from "./playPause";
import { clearHistory } from "../history";

export function createMediaControls() {
  // Container
  const container = document.createElement("div");
  container.classList.add("cl-controls");
  // Back button
  const backButton = document.createElement("button");
  backButton.setAttribute("class", "back button");
  backButton.setAttribute("title", "Go back");
  const backButtonIcon = document.createElement("span");
  backButtonIcon.classList.add("icon");
  backButtonIcon.innerHTML = `
<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
	  <path id="arrow-left" fill="#000000" fill-rule="evenodd" stroke="none" d="M 15.779854 20.864281 L 24.722439 29.804287 C 25.480677 30.415478 24.871231 31.175014 24.322439 31.630463 C 23.715267 32.134361 22.843266 32.359074 22.096264 31.630463 L 11.778888 21.313087 C 11.536322 21.071135 11.4 20.742603 11.4 20.4 C 11.4 20.05739 11.536322 19.728865 11.778888 19.486912 L 22.096264 9.169535 C 22.764769 8.500671 23.725132 8.692083 24.322439 9.169535 C 24.879511 9.614822 25.226725 10.49143 24.722439 10.995714 L 15.779854 19.935719 L 15.779854 20.864281 Z"/>
  </svg>`;
  backButton.appendChild(backButtonIcon);
  // Play button
  const playButton = document.createElement("button");
  playButton.setAttribute("class", "play button idle");
  playButton.setAttribute("disabled", "");
  const playButtonPlayIcon = document.createElement("span");
  playButtonPlayIcon.setAttribute("class", "play icon");
  playButtonPlayIcon.innerHTML = `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
	  <path id="Path" fill="#000000" stroke="none" d="M 28.99 21.742498 L 13.0825 30.9725 C 11.7325 31.754999 10 30.807499 10 29.23 L 10 10.77 C 10 9.194998 11.73 8.245001 13.0825 9.029999 L 28.99 18.26 C 29.615124 18.616861 30.000982 19.281437 30.000982 20.001249 C 30.000982 20.721064 29.615124 21.385639 28.99 21.742498"/>
  </svg>
`;
  playButton.appendChild(playButtonPlayIcon);
  const playButtonPauseIcon = document.createElement("span");
  playButtonPauseIcon.setAttribute("class", "pause icon");
  playButtonPauseIcon.innerHTML = `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
		<path id="Path" fill="#000000" stroke="none" d="M 13.75 8.75 C 15.821068 8.75 17.5 10.428932 17.5 12.5 L 17.5 27.5 C 17.5 29.571068 15.821068 31.25 13.75 31.25 C 11.678932 31.25 10 29.571068 10 27.5 L 10 12.5 C 10 10.428932 11.678932 8.75 13.75 8.75 M 26.25 8.75 C 28.321068 8.75 30 10.428932 30 12.5 L 30 27.5 C 30 29.571068 28.321068 31.25 26.25 31.25 C 24.178932 31.25 22.5 29.571068 22.5 27.5 L 22.5 12.5 C 22.5 10.428932 24.178932 8.75 26.25 8.75"/>
	</svg>
`;
  playButton.appendChild(playButtonPauseIcon);
  playButton.addEventListener("click", () => {
    const store = getStore();
    const media = store.playback.media;
    // Play it!
    if (media.playing === false) {
      playMedia();
    } else {
      pauseMedia();
    }
  });
  // Skip button
  const skipButton = document.createElement("button");
  skipButton.setAttribute("class", "skip button");
  const skipButtonIcon = document.createElement("div");
  skipButtonIcon.innerHTML = `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
		<path id="arrow-right" fill="#000000" fill-rule="evenodd" stroke="none" d="M 23.697851 20.864281 L 14.755266 29.804287 C 13.997029 30.415478 14.606474 31.175014 15.155266 31.630463 C 15.762438 32.134361 16.634439 32.359074 17.381443 31.630463 L 27.698818 21.313087 C 27.941383 21.071135 28.077705 20.742603 28.077705 20.4 C 28.077705 20.05739 27.941383 19.728865 27.698818 19.486912 L 17.381443 9.169535 C 16.712936 8.500671 15.752573 8.692083 15.155266 9.169535 C 14.598195 9.614822 14.250981 10.49143 14.755266 10.995714 L 23.697851 19.935719 L 23.697851 20.864281 Z"/>
	</svg>`;
  skipButton.appendChild(skipButtonIcon);
  // Scrubber
  const scrubber = document.createElement("div");
  scrubber.classList.add("scrubber");
  const scrubberBase = document.createElement("div");
  scrubberBase.classList.add("base");
  scrubber.appendChild(scrubberBase);
  const scrubberProgress = document.createElement("div");
  scrubberProgress.classList.add("progress");
  scrubber.appendChild(scrubberProgress);
  // Reset button (only shown when rememberHistory is enabled)
  const store = getStore();
  // Append elements and return parent
  // container.appendChild(backButton);
  // container.appendChild(skipButton);
  container.appendChild(playButton);
  container.appendChild(scrubber);
  if (store.playback.history.rememberHistory) {
    const resetButton = document.createElement("button");
    resetButton.setAttribute("class", "reset button");
    resetButton.setAttribute("title", "Reset");
    const resetButtonIcon = document.createElement("div");
    resetButtonIcon.setAttribute("class", "icon");
    resetButtonIcon.innerHTML = `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
		<path fill="#000000" d="M 20 8 C 13.373 8 8 13.373 8 20 C 8 26.627 13.373 32 20 32 C 25.819 32 30.747 27.968 31.748 22.5 L 29.225 22.5 C 28.258 26.601 24.485 29.5 20 29.5 C 14.753 29.5 10.5 25.247 10.5 20 C 10.5 14.753 14.753 10.5 20 10.5 C 22.675 10.5 25.097 11.567 26.859 13.316 L 23 17 L 32 17 L 32 8 L 28.689 11.189 C 26.483 9.013 23.404 8 20 8 Z"/>
	  </svg>`;
    resetButton.appendChild(resetButtonIcon);
    resetButton.addEventListener("click", () => {
      clearHistory();
      window.location.reload();
    });
    container.appendChild(resetButton);
  }
  return container;
}

/*
 * Enable/disable playback controls, set play/pause button state
 */
export function setControlState(state: string) {
  const rootEl = getStore().playback.rootEl;
  const controls = rootEl.querySelector(".cl-controls") as Element;
  const playControl = controls.querySelector(".play.button");
  if (!playControl) return;
  if (state === "disabled") {
    playControl.setAttribute("disabled", "");
    playControl.classList.add("idle");
    playControl.classList.remove("playing");
  } else {
    if (playControl.hasAttribute("disabled")) {
      playControl.removeAttribute("disabled");
    }
    if (state === "playing") {
      playControl.classList.remove("idle");
      playControl.classList.remove("paused");
      playControl.classList.add("playing");
    } else if (state === "paused") {
      playControl.classList.remove("idle");
      playControl.classList.remove("playing");
      playControl.classList.add("paused");
    } else if (state === "idle") {
      playControl.classList.remove("playing");
      playControl.classList.remove("paused");
      playControl.classList.add("idle");
    }
  }
}

export function setScrubberProgress(percent: number, progress: HTMLDivElement) {
  let percentInt = percent * 100;
  // Determine the rounding function. Normally we should round to the closest integer, but if we're above 97%, we'll round up to reduce the chance that the progress bar gets stuck at 99%
  if (percent < 97) {
    percentInt = Math.round(percentInt);
  } else {
    percentInt = Math.ceil(percentInt);
  }
  const cssString = percentInt + "%";
  progress.style.width = cssString;
}

export function clearScrubber() {
  const store = getStore();
  const scrubber = store.playback.rootEl.querySelector(
    ".cl-controls .scrubber"
  );
  if (!scrubber) return;
  scrubber.classList.remove("active");
  const progress = scrubber.querySelector(".progress") as HTMLDivElement;
  setScrubberProgress(0, progress);
  removeScrubberListeners();
}

export function removeScrubberListeners() {
  const store = getStore();
  const media = store.playback.media;
  const scrubber = store.playback.rootEl.querySelector(
    ".cl-controls .scrubber"
  );
  if (!scrubber) return;
  if (typeof media.scrubber.interval !== "undefined") {
    clearInterval(media.scrubber.interval);
  }
  if (typeof media.scrubber.tapEvent !== "undefined") {
    scrubber.removeEventListener("click", media.scrubber.tapEvent);
  }
}
