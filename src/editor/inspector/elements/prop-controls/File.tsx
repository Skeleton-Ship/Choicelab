import { createRef } from "preact";
import { useState, useEffect } from "preact/hooks";
import { emit, listen } from "@tauri-apps/api/event";
import { resolve } from "@tauri-apps/api/path";
import { getAction } from "../../../../data/getData";
import { getStore, setStore } from "../../../../data/dataStore";
import { Action, ActionDef, ActionDefProp, Store } from "../../../../typings";
import readFileUpload from "../../functions/readFileUpload";
import getAssetContents from "../../functions/getAssetContents";
import getAssetPreviewElement from "../../functions/getAssetPreviewElement";

export default function File(props: {
  type: string;
  action: Action;
  actionDef: ActionDef;
  propDef: ActionDefProp;
  filePropName: string;
  initialValue: string;
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
    action.props[props.filePropName] = "";
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
        readFileUpload(file, props.type)
          .then(async (contents) => {
            const store = getStore();
            const assetsPath = await resolve(store.projectPath, "./assets");
            const jsonData = {
              fileName: file.name,
              contents: contents,
              fileType: props.type,
              assetsPath: assetsPath,
            };
            emit("create-asset", jsonData);
            listen("asset-created", async () => {
              // Store file
              const store = getStore(); // get store again, because asset creation can cause the store to fall out-of-date
              const storedAction: Action | undefined = getAction(
                props.action.id,
                store
              );
              if (storedAction) {
                storedAction.props[props.filePropName] = file.name;
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
    getAssetContents(existingFile, props.type).then((contents) => {
      if (typeof contents === "string") {
        setFileSrc(contents);
      }
    });
  }
  // Create elements + display classes
  const inputId = `file_${props.action.id}_${props.propDef.name}`;
  const setClass = fileIsSet === true ? "file-set" : "file-not-set";
  const loadingClass = isLoading === true ? "is-loading" : "loaded";
  const elementClass = `inspector-prop file ${setClass} ${loadingClass} ${props.className}`;
  const previewEl = getAssetPreviewElement(
    props.propDef.control,
    existingFile,
    fileSrc
  );
  return (
    <div class={elementClass}>
      <label class="label break-line" for={inputId}>
        {props.propDef.label}
      </label>
      <input
        id={inputId}
        type="file"
        ref={filePickerEl}
        accept={props.accept}
      />
      <div class="media">{previewEl}</div>
      <div class="file-set-controls">
        <button onClick={handleReplace}>Replace</button>
        <button onClick={handleClear}>Clear</button>
      </div>
    </div>
  );
}
