import { useState } from "preact/hooks";
import getAssetPreviewElement from "./getAssetPreviewElement";
import getAssetContents from "./getAssetContents";

function FCText(props: { contents: string; tag: string }) {
  let contents = <>{props.contents}</>;
  if (props.tag !== "p") {
    contents = <strong>{props.contents}</strong>;
  }
  return <div>{contents}</div>;
}

function FCButton(props: {
  label: string;
  varToSet: string;
  value: string;
  response: string;
  saveInputs: boolean;
}) {
  return <div>{props.label}</div>;
}

function FCInputField(props: {
  label: string;
  type: string;
  varToSet: string;
}) {
  return <div>{props.label}</div>;
}

function FCImage(props: { source: string; alt: string }) {
  const [imageEl, setImageEl] = useState(<span class="no-src">Image</span>);
  getAssetContents(props.source, "image").then((src) => {
    if (typeof src === "string") {
      setImageEl(getAssetPreviewElement("image", props.source, src));
    }
  });
  return <div>{imageEl}</div>;
}

function FCAudio(props: { source: string; captions: string }) {
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

function FCVideo(props: { source: string; captions: string }) {
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

export { FCText, FCButton, FCInputField, FCImage, FCAudio, FCVideo };
