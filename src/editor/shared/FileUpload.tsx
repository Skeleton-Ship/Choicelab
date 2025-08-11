import { createRef } from "preact";
import { useState, useEffect } from "preact/hooks";
import { emit, once } from "@tauri-apps/api/event";
import { resolve } from "@tauri-apps/api/path";
import { message } from "@tauri-apps/plugin-dialog";
import { getViewStore } from "../../data/dataStore";
import { Action } from "../../typings";
import readFileUpload from "./readFileUpload";
import getAssetPreviewURL from "./getAssetPreviewURL";
import AssetPreview from "./AssetPreview";
import { getProjectWindowLabel } from "../../utils/getProjectWindowLabel";
import { v4 as uuid } from "uuid";

export default function FileUpload(props: {
  type: string; // Binary or text file
  propName: string; // The name of the prop associated with the parent object (`src`, `url`, etc.)
  label: string; // The user-shown label (`Caption File`)
  existingFile: string; // If something's uploaded already
  fileKind: string; // Video, image, etc., used for previewing
  fileParent: "action" | "none";
  action?: Action; // The parent action, if it applies per above
  accept: string; // File types accepted
  className?: string;
  update?: Function; // Parent updater function, only passed to <AssetPreview /> to enable control of timing flags
  onCreated: Function;
  onClear: Function;
}) {
  // Method: Clear file
  function handleClear() {
    props.onClear();
  }
  // Method: Replace file
  function handleReplace() {
    if (filePickerEl.current) {
      filePickerEl.current.click();
    }
  }
  // Listen to file picker
  const filePickerEl = createRef();
  useEffect(() => {
    // Listen to file when uploaded
    if (!filePickerEl.current) return;
    const filePicker = filePickerEl.current;
    filePicker.addEventListener("change", () => {
      if (!filePicker.files) return;
      const file = filePicker.files[0];
      if (filePicker.files.length == 1) {
        setLoading(true);
        // First, make sure the file type is valid
        let isValidType = false;
        const acceptedTypes = props.accept.split(",");
        acceptedTypes.forEach((fileType: string) => {
          fileType = fileType.trim();
          if (fileType === file.type) {
            isValidType = true;
          }
        });
        if (isValidType === false) {
          message(
            `You can only upload the following file types: ${props.accept}`,
            `The file "${file.name}" can't be used.`
          );
          return;
        }
        // If it is, upload the file
        readFileUpload(file, props.type)
          .then(async (contents: any) => {
            const viewStore = getViewStore();
            const assetsPath = await resolve(viewStore.projectPath, "./Assets");
            const jsonData = {
              fileName: file.name,
              contents: contents,
              fileType: props.type,
              assetsPath: assetsPath,
              label: getProjectWindowLabel(viewStore.projectPath),
            };
            emit("create-asset", jsonData);
            once("asset-created", async () => {
              props.onCreated(file);
              setLoading(false);
            });
          })
          .catch((error) => {
            console.error("Error reading file:", error);
          });
      }
    });
  }, []);
  // Show file if it's set
  const [fileSrc, setFileSrc] = useState("");
  const [isLoading, setLoading] = useState(false);
  const fileIsSet = props.existingFile && props.existingFile !== "";
  if (fileIsSet) {
    getAssetPreviewURL(props.existingFile, props.type).then((contents: any) => {
      if (typeof contents === "string" && fileSrc === "") {
        setFileSrc(contents);
      }
    });
  }
  // Get action if file upload is associated with it
  let id = uuid();
  if (props.fileParent === "action" && props.action) {
    id = props.action.id;
  }
  // Create elements + display classes
  const inputId = `file_${id}_${props.propName}`;
  const setClass = fileIsSet === true ? "file-set" : "file-not-set";
  const loadingClass = isLoading === true ? "is-loading" : "loaded";
  const elementClass = `file ${
    props.action ? "inspector-prop" : ""
  } ${setClass} ${props.className ? props.className : ""} ${loadingClass}`;
  return (
    <div class={elementClass}>
      <label class="label break-line" for={inputId}>
        {props.label}
      </label>
      <button class="file-initial ui-button" onClick={handleReplace}>
        Choose...
      </button>
      <input
        id={inputId}
        class="file-initial"
        type="file"
        ref={filePickerEl}
        accept={props.accept}
      />
      <div class="media">
        <AssetPreview
          assetParent={props.fileParent}
          media={props.fileKind}
          fileName={props.existingFile}
          fileSrc={fileSrc}
          action={props.action}
          update={props.update ? props.update : undefined}
        />
      </div>
      <div class="file-set-controls">
        <button class="ui-button" onClick={handleReplace}>
          Replace
        </button>
        <button class="ui-button" onClick={handleClear}>
          Clear
        </button>
      </div>
    </div>
  );
}
