import { getVariable } from "../../../data/getData";
import { getStore } from "../../../data/dataStore";

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

function FCInputField(props: {
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
function FCImage(props: { source: string; alt: string }) {
  const [imageEl, setImageEl] = useState(<span class="no-src">Image</span>);
  getAssetContents(props.source, "image").then((src) => {
    if (typeof src === "string") {
      setImageEl(getAssetPreviewElement("image", props.source, src));
    }
  });
  return <div>{imageEl}</div>;
}
*/

function FCImage(props: { source: string; alt: string }) {
  let imageLabel = <span class="no-src">Image</span>;
  if (typeof props.source !== "undefined" && props.source !== "") {
    imageLabel = (
      <div>
        <i class="bi bi-image"></i>
        {props.source}
      </div>
    );
  }
  return <>{imageLabel}</>;
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
