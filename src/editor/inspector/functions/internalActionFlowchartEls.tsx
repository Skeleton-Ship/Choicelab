import { getVariable } from "../../../data/getData";
import { getStore } from "../../../data/dataStore";

/*
 * Text
 */
export function FCText(props: { contents: string; tag: string }) {
  let contents = <>{props.contents}</>;
  if (props.tag !== "p") {
    contents = <strong>{props.contents}</strong>;
  }
  return <div>{contents}</div>;
}

/*
 * Button
 */
export function FCButton(props: {
  label: string;
  varToSet: string;
  value: string;
  response: string;
  saveInputs: boolean;
}) {
  const store = getStore();
  const variable = getVariable(props.varToSet, store);
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
export function FCInputField(props: {
  label: string;
  type: string;
  varToSet: string;
}) {
  const store = getStore();
  const variable = getVariable(props.varToSet, store);
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
export function FCImage(props: { source: string; alt: string }) {
  let imageLabel = <span class="no-src">Image</span>;
  if (typeof props.source !== "undefined" && props.source !== "") {
    imageLabel = (
      <div>
        <i class="bi bi-image"></i>
        {props.alt !== "" ? props.alt : props.source}
      </div>
    );
  }
  return <>{imageLabel}</>;
}

/*
 * Audio
 */
export function FCAudio(props: { source: string; captions: string }) {
  let audioLabel = <span class="no-src">Audio</span>;
  if (typeof props.source !== "undefined" && props.source !== "") {
    audioLabel = (
      <div>
        <i class="bi bi-volume-up-fill"></i>
        {props.source}
      </div>
    );
  }
  return <>{audioLabel}</>;
}

/*
 * Video
 */
export function FCVideo(props: { source: string; captions: string }) {
  let videoLabel = <span class="no-src">Video</span>;
  if (props.source && props.source !== "") {
    videoLabel = (
      <div>
        <i class="bi bi-film"></i>
        {props.source}
      </div>
    );
  }
  return <>{videoLabel}</>;
}

/*
 * Silence
 */
export function FCSilence(props: { duration: number }) {
  return (
    <div>
      <em>({props.duration}s of silence)</em>
    </div>
  );
}
