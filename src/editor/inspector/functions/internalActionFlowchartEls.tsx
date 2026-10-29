import { getVariable, getAsset } from "../../../data/getData";
import { getStore } from "../../../data/dataStore";
import { ActionPropsMap } from "../../../typings";

/*
 * Text
 */
export function FCText(props: ActionPropsMap["text"] & { tag?: string }) {
  let contents = <>{props.contents}</>;
  if (props.tag !== "p") {
    contents = <strong>{props.contents}</strong>;
  }
  return <div>{contents}</div>;
}

/*
 * Button
 */
export function FCButton(props: ActionPropsMap["button"]) {
  const store = getStore();
  const variable = getVariable(props.varToSet ?? "", store);
  let varEl = <></>;
  if (variable) {
    varEl = <span class="button-var">{variable.name}</span>;
  }
  return (
    <div>
      <span class="button-label">{props.label}</span>
      {varEl}
    </div>
  );
}

/*
 * Input field
 */
export function FCInputField(props: ActionPropsMap["inputField"]) {
  const store = getStore();
  const variable = getVariable(props.varToSet ?? "", store);
  let varEl = <></>;
  if (variable) {
    varEl = <span class="button-var">{variable.name}</span>;
  }
  return (
    <div>
      <span class="button-label">{props.label}</span>
      {varEl}
    </div>
  );
}

/*
 * Image
 */
export function FCImage(props: ActionPropsMap["image"]) {
  let imageLabel = <span class="no-src">Image</span>;
  if (typeof props.source !== "undefined" && props.source !== "") {
    const asset = getAsset(props.source, getStore());
    const displayName = asset ? asset.fileName : props.source;
    imageLabel = (
      <div>
        <i class="bi bi-image"></i>
        {props.alt !== "" ? props.alt : displayName}
      </div>
    );
  }
  return <>{imageLabel}</>;
}

/*
 * Audio
 */
export function FCAudio(props: ActionPropsMap["audio"]) {
  let audioLabel = <span class="no-src">Audio</span>;
  if (typeof props.source !== "undefined" && props.source !== "") {
    const asset = getAsset(props.source, getStore());
    audioLabel = (
      <div>
        <i class="bi bi-volume-up-fill"></i>
        {asset ? asset.fileName : props.source}
      </div>
    );
  }
  return <>{audioLabel}</>;
}

/*
 * Video
 */
export function FCVideo(props: ActionPropsMap["video"]) {
  let videoLabel = <span class="no-src">Video</span>;
  if (props.source && props.source !== "") {
    const asset = getAsset(props.source, getStore());
    videoLabel = (
      <div>
        <i class="bi bi-film"></i>
        {asset ? asset.fileName : props.source}
      </div>
    );
  }
  return <>{videoLabel}</>;
}

/*
 * Silence
 */
export function FCSilence(props: ActionPropsMap["silence"]) {
  return (
    <div>
      <em>({props.duration}s of silence)</em>
    </div>
  );
}

/*
 * Background Audio
 */
export function FCBackgroundAudio(props: ActionPropsMap["backgroundAudio"]) {
  let label = <span class="no-src">Audio</span>;
  if (typeof props.source !== "undefined" && props.source !== "") {
    const asset = getAsset(props.source, getStore());
    label = (
      <div>
        <i class="bi bi-music-note-beamed"></i>
        {asset ? asset.fileName : props.source}
      </div>
    );
  }
  return <>{label}</>;
}

/*
 * Background Video
 */
export function FCBackgroundVideo(props: ActionPropsMap["backgroundVideo"]) {
  let label = <span class="no-src">Video</span>;
  if (props.source && props.source !== "") {
    const asset = getAsset(props.source, getStore());
    label = (
      <div>
        <i class="bi bi-camera-video-fill"></i>
        {asset ? asset.fileName : props.source}
      </div>
    );
  }
  return <>{label}</>;
}

/*
 * End Background Audio / Video
 */
// Shared by endBackgroundAudio and endBackgroundVideo, which have the same props
export function FCEndBackground(props: ActionPropsMap["endBackgroundAudio"]) {
  return (
    <div>
      <em>Stop: {props.name || "..."}</em>
    </div>
  );
}

/*
 * Appearance
 */

export function FCAppearance() {
  return (
    <div>
      <em>Appearance change</em>
    </div>
  );
}
