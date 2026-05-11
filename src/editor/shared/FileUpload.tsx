import { useState, useEffect, useRef } from "preact/hooks";
import { emit, listen } from "@tauri-apps/api/event";
import { resolve } from "@tauri-apps/api/path";
import { message } from "@tauri-apps/plugin-dialog";
import { getStore, getViewStore, setStore } from "../../data/dataStore";
import { getAsset } from "../../data/getData";
import { createAsset } from "../../data/createNode";
import { Action, Asset } from "../../typings";
import readFileUpload from "./readFileUpload";
import getAssetPreviewURL from "./getAssetPreviewURL";
import AssetPreview from "./AssetPreview";
import { getProjectWindowLabel } from "../../utils/getProjectWindowLabel";
import { v4 as uuid } from "uuid";
import { getDialogText } from "../../utils/dialogText";

let uploadInProgress = false;

const UPLOAD_TIMEOUT_MS = 10000;

async function cloudWarningMessage(fileName: string) {
  const fileManager = platform() === "macos" ? "Finder" : "Explorer";
  const dialog = getDialogText(
    "Unable to add file",
    `"${fileName}" couldn't be added.`,
    `If the file is stored in the cloud, download it first in ${fileManager}, then try again.`
  );
  message(dialog.message, dialog.title);
}

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
  const filePickerEl = useRef<HTMLInputElement | null>(null);
  // Keeps changeHandler current without re-attaching the event listener on every render.
  const propsRef = useRef(props);
  const [fileSrc, setFileSrc] = useState("");
  const [isLoading, setLoading] = useState(false);
  useEffect(() => {
    propsRef.current = props;
  });

  // Method: Clear file
  function handleClear() {
    setFileSrc("");
    props.onClear();
  }
  // Method: Replace file
  function handleReplace() {
    if (filePickerEl.current) {
      filePickerEl.current.click();
    }
  }

  // Listen to file picker
  useEffect(() => {
    if (!filePickerEl.current) return;
    const filePicker = filePickerEl.current;
    const changeHandler = () => {
      if (!filePicker.files) return;
      const file = filePicker.files[0];
      if (filePicker.files.length == 1) {
        // Validate file type before doing anything visible
        let isValidType = false;
        const fileExt = "." + file.name.split(".").pop()?.toLowerCase();
        const acceptedTypes = propsRef.current.accept.split(",");
        acceptedTypes.forEach((fileType: string) => {
          fileType = fileType.trim();
          if (fileType === file.type || fileType === fileExt) {
            isValidType = true;
          }
        });
        if (!isValidType) {
          const dialog = getDialogText(
            "Invalid file format",
            `The file "${file.name}" can't be used.`,
            `You can only upload the following file types: ${propsRef.current.accept}`
          );
          message(dialog.message, dialog.title);
          return;
        }
        if (file.size === 0) {
          cloudWarningMessage(file.name);
          filePicker.value = "";
          return;
        }
        if (uploadInProgress) {
          const dialog = getDialogText(
            "File operation in progress",
            "Another file is still loading into the project.",
            "Wait for the other file to finish, then try this one again."
          );
          message(dialog.message, dialog.title);
          filePicker.value = "";
          return;
        }
        uploadInProgress = true;
        setLoading(true);

        // Start the timeout immediately — readFileUpload itself can hang if the
        // cloud file hasn't downloaded yet, so the timer must cover the full
        // operation, not just the Rust backend step.
        let cancelled = false;
        let assetCreatedUnlisten: (() => void) | null = null;
        const resetUploadState = () => {
          filePicker.value = "";
          uploadInProgress = false;
          setLoading(false);
        };
        const timeoutId = setTimeout(() => {
          cancelled = true;
          assetCreatedUnlisten?.();
          resetUploadState();
          cloudWarningMessage(file.name);
        }, UPLOAD_TIMEOUT_MS);

        readFileUpload(file, propsRef.current.type)
          .then(async (contents: any) => {
            if (cancelled) return;
            const viewStore = getViewStore();
            const assetsPath = await resolve(viewStore.projectPath, "./Assets");
            const jsonData = {
              fileName: file.name,
              contents: contents,
              fileType: propsRef.current.type,
              assetsPath: assetsPath,
              label: getProjectWindowLabel(viewStore.projectPath),
            };
            emit("create-asset", jsonData);
            const unlisten = await listen("asset-created", async (event) => {
              if (cancelled) {
                unlisten();
                return;
              }
              clearTimeout(timeoutId);
              unlisten();
              const store = getStore();
              const resolvedFileName = (event.payload as { fileName: string })
                .fileName;
              const asset = createAsset(
                resolvedFileName,
                propsRef.current.fileKind as Asset["type"]
              );
              store.project.assets.push(asset);
              setStore(store);
              propsRef.current.onCreated(asset);
              resetUploadState();
            });
            assetCreatedUnlisten = unlisten;
          })
          .catch((error) => {
            if (cancelled) return;
            clearTimeout(timeoutId);
            console.error("Error reading file:", error);
            resetUploadState();
          });
      }
    };
    filePicker.addEventListener("change", changeHandler);
    return () => {
      filePicker.removeEventListener("change", changeHandler);
    };
  }, []);

  // Load preview URL whenever the stored file changes.
  useEffect(() => {
    if (!props.existingFile || props.existingFile === "") {
      setFileSrc("");
      return;
    }
    getAssetPreviewURL(props.existingFile, props.type).then((contents: any) => {
      if (typeof contents === "string") {
        setFileSrc(contents);
      }
    });
  }, [props.existingFile]);

  // Resolve display filename from asset registry
  const displayFileName = (() => {
    if (!props.existingFile) return props.existingFile;
    const store = getStore();
    const asset = getAsset(props.existingFile, store);
    return asset ? asset.fileName : props.existingFile;
  })();
  // Get action if file upload is associated with it
  let id = uuid();
  if (props.fileParent === "action" && props.action) {
    id = props.action.id;
  }
  // Create elements + display classes
  const fileIsSet = props.existingFile && props.existingFile !== "";
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
          fileName={displayFileName}
          fileSrc={fileSrc}
          isLoading={isLoading}
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
