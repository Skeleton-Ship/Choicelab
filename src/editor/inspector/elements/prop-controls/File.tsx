import { createRef } from "preact";
import { useState, useEffect } from "preact/hooks";
import { emit, once } from "@tauri-apps/api/event";
import { resolve } from "@tauri-apps/api/path";
import { message } from "@tauri-apps/plugin-dialog";
import { getAction } from "../../../../data/getData";
import { getStore, setStore } from "../../../../data/dataStore";
import { Action, ActionDef, ActionDefProp, Store } from "../../../../typings";
import readFileUpload from "../../functions/readFileUpload";
import getAssetPreviewURL from "../../functions/getAssetPreviewURL";
import AssetPreview from "../../functions/AssetPreview";
import { getPlayerConfig } from "../../../../player/getPlayerConfig";
import { getProjectWindowLabel } from "../../../../utils/getProjectWindowLabel";

export default function File(props: {
  type: string;
  action: Action;
  actionDef: ActionDef;
  propDef: ActionDefProp;
  filePropName: string;
  initialValue: string;
  extended: boolean;
  className: string;
  accept: string;
  store: Store;
  update: Function;
}) {
  // Method: Clear file
  function handleClear() {
    const store = getStore();
    const action: Action | undefined = getAction(props.action.id, store);
    if (!action) return;
    const propsObj =
      props.extended === false
        ? action.props
        : action.extendedProps[getPlayerConfig().id];
    propsObj[props.propDef.name] = "";
    setStore(store);
    props.update();
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
            `The ${props.actionDef.label} action only accepts the following file types: ${props.accept}`,
            `The file "${file.name}" can't be used.`
          );
          return;
        }
        // If it is, upload the file
        readFileUpload(file, props.type)
          .then(async (contents) => {
            const store = getStore();
            const assetsPath = await resolve(store.projectPath, "./assets");
            const jsonData = {
              fileName: file.name,
              contents: contents,
              fileType: props.type,
              assetsPath: assetsPath,
              label: getProjectWindowLabel(store.projectPath),
            };
            emit("create-asset", jsonData);
            once("asset-created", async () => {
              // Store file
              const store = getStore(); // get store again, because asset creation can cause the store to fall out-of-date
              const storedAction: Action | undefined = getAction(
                props.action.id,
                store
              );
              if (storedAction) {
                // storedAction.props[props.filePropName] = file.name;
                const propsObj =
                  props.extended === false
                    ? storedAction.props
                    : storedAction.extendedProps[getPlayerConfig().id];
                propsObj[props.filePropName] = file.name;
                setLoading(false);
                setStore(store);
                props.update();
              }
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
  const existingFile = props.action.props[props.filePropName];
  const fileIsSet = existingFile && existingFile !== "";
  if (fileIsSet) {
    getAssetPreviewURL(existingFile, props.type).then((contents) => {
      if (typeof contents === "string" && fileSrc === "") {
        setFileSrc(contents);
      }
    });
  }
  // Create elements + display classes
  const inputId = `file_${props.action.id}_${props.propDef.name}`;
  const setClass = fileIsSet === true ? "file-set" : "file-not-set";
  const loadingClass = isLoading === true ? "is-loading" : "loaded";
  const elementClass = `inspector-prop file ${setClass} ${loadingClass} ${props.className}`;
  return (
    <div class={elementClass}>
      <label class="label break-line" for={inputId}>
        {props.propDef.label}
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
          media={props.propDef.control}
          fileName={existingFile}
          fileSrc={fileSrc}
          action={props.action}
          update={props.update}
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
