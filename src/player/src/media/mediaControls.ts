import { getStore } from "../store";
import { pauseMedia, playMedia } from "./playPause";
import { clearHistory } from "../history";
import { getCaptionsEnabled, setCaptionsEnabled } from "../captions";

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
  // CC button
  const ccButton = document.createElement("button");
  ccButton.setAttribute("class", "cc button");
  ccButton.setAttribute("disabled", "");
  ccButton.setAttribute("aria-pressed", "false");
  ccButton.setAttribute("title", "Toggle captions");
  const ccOffIcon = document.createElement("span");
  ccOffIcon.setAttribute("class", "cc-off icon");
  ccOffIcon.innerHTML = `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <g>
      <path fill="#000000" fill-rule="evenodd" stroke="none" d="M 7 31 C 4.790861 31 3 29.209139 3 27 L 3 13 C 3 10.790861 4.790861 9 7 9 L 33 9 C 35.209141 9 37 10.790861 37 13 L 37 27 C 37 29.209139 35.209141 31 33 31 L 7 31 Z M 5 27 L 5 13 C 5 11.895431 5.895431 11 7 11 L 33 11 C 34.104572 11 35 11.89543 35 13 L 35 27 C 35 28.10457 34.104572 29 33 29 L 7 29 C 5.895431 29 5 28.104568 5 27 Z"/>
      <path fill="#000000" fill-rule="evenodd" stroke="none" d="M 26.745705 25.825584 C 28.950752 25.825584 30.257444 25.041567 31.433472 23.783875 L 29.832769 22.16684 C 28.934418 22.983522 28.134066 23.506201 26.827374 23.506201 C 24.867331 23.506201 23.511637 21.872833 23.511637 19.912792 L 23.511637 19.880123 C 23.511637 17.920082 24.899998 16.319382 26.827374 16.319382 C 27.97073 16.319382 28.869083 16.809391 29.751101 17.609743 L 31.351801 15.764036 C 30.290113 14.718681 28.999752 14 26.843706 14 C 23.331964 14 20.881912 16.66239 20.881912 19.912792 L 20.881912 19.945459 C 20.881912 23.228529 23.380966 25.825584 26.745705 25.825584 Z M 15.018122 25.825584 C 17.223169 25.825584 18.529863 25.041567 19.705889 23.783875 L 18.105186 22.16684 C 17.206835 22.983524 16.406485 23.506201 15.09979 23.506201 C 13.139749 23.506201 11.784053 21.872833 11.784053 19.912792 L 11.784053 19.880123 C 11.784053 17.920082 13.172416 16.319382 15.09979 16.319382 C 16.243147 16.319382 17.1415 16.809391 18.02352 17.609743 L 19.62422 15.764036 C 18.562531 14.718681 17.272169 14 15.116124 14 C 11.604383 14 9.154331 16.66239 9.154331 19.912792 L 9.154331 19.945459 C 9.154331 23.228529 11.653384 25.825584 15.018122 25.825584 Z"/>
    </g>
  </svg>`;
  const ccOnIcon = document.createElement("span");
  ccOnIcon.setAttribute("class", "cc-on icon");
  ccOnIcon.innerHTML = `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <g>
      <path fill="#000000" fill-rule="evenodd" stroke="none" d="M 7 31 C 4.790861 31 3 29.209139 3 27 L 3 13 C 3 10.790861 4.790861 9 7 9 L 33 9 C 35.209141 9 37 10.790861 37 13 L 37 27 C 37 29.209139 35.209141 31 33 31 L 7 31 Z M 19.705889 23.783875 C 18.529863 25.041567 17.223169 25.825584 15.018122 25.825584 C 11.653384 25.825584 9.154331 23.228529 9.154331 19.945459 L 9.154331 19.912792 C 9.154331 16.66239 11.604383 14 15.116124 14 C 17.272169 14 18.562531 14.718681 19.62422 15.764036 L 18.02352 17.609743 C 17.1415 16.809391 16.243147 16.319382 15.09979 16.319382 C 13.172416 16.319382 11.784053 17.920082 11.784053 19.880123 L 11.784053 19.912792 C 11.784053 21.872833 13.139749 23.506201 15.09979 23.506201 C 16.406485 23.506201 17.206835 22.983524 18.105186 22.16684 L 19.705889 23.783875 Z M 31.433472 23.783875 C 30.257444 25.041567 28.950752 25.825584 26.745705 25.825584 C 23.380966 25.825584 20.881912 23.228529 20.881912 19.945459 L 20.881912 19.91279 C 20.881912 16.66239 23.331964 14 26.843706 14 C 28.999752 14 30.290113 14.718681 31.351801 15.764036 L 29.751101 17.609743 C 28.869083 16.809393 27.97073 16.319382 26.827374 16.319382 C 24.899998 16.319382 23.511635 17.920082 23.511635 19.880123 L 23.511635 19.91279 C 23.511635 21.872833 24.867331 23.506201 26.827374 23.506201 C 28.134066 23.506201 28.934418 22.983524 29.832769 22.16684 L 31.433472 23.783875 Z"/>
    </g>
  </svg>`;
  ccButton.appendChild(ccOffIcon);
  ccButton.appendChild(ccOnIcon);
  ccButton.addEventListener("click", () => {
    setCaptionsEnabled(!getCaptionsEnabled());
  });
  // Append elements and return parent
  // container.appendChild(backButton);
  // container.appendChild(skipButton);
  container.appendChild(playButton);
  container.appendChild(scrubber);
  container.appendChild(ccButton);
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
 * Enable controls without changing play/pause state — safe to call when foreground media may already be active
 */
export function ensureControlsEnabled() {
  const rootEl = getStore().playback.rootEl;
  const controls = rootEl.querySelector(".cl-controls") as Element;
  const playControl = controls.querySelector(".play.button");
  if (!playControl || !playControl.hasAttribute("disabled")) return;
  playControl.removeAttribute("disabled");
  playControl.classList.add("idle");
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
