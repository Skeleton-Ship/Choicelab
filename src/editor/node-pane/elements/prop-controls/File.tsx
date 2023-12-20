import { createRef } from "preact";
import { useEffect } from "preact/hooks";
import { emit, listen } from "@tauri-apps/api/event";
import { resolve } from "@tauri-apps/api/path";
import { getAction } from "../../../../data/getData";
import { getStore, setStore } from "../../../../data/dataStore";
import { Action, ActionDef, ActionDefProp, Store } from "../../../../typings";

async function readFileContents(
  file: File,
  type: string
): Promise<string | ArrayBuffer | null | undefined> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      let result = event.target?.result;
      if (result) {
        if (
          result !== null &&
          typeof result !== "undefined" &&
          typeof result !== "string"
        ) {
          const binaryData = new Uint8Array(result);
          const hexString = Array.from(binaryData, (byte) =>
            byte.toString(16).padStart(2, "0")
          ).join("");
          result = hexString;
        }
      }
      resolve(result);
    };
    reader.onerror = () => {
      reject(reader.error);
    };
    if (type === "text") {
      reader.readAsText(file);
    } else if (type === "binary") {
      reader.readAsArrayBuffer(file);
    }
  });
}

export default function File(props: {
  type: string;
  action: Action;
  actionDef: ActionDef;
  propDef: ActionDefProp;
  filePropName: string;
  initialValue: string;
  accept: string;
  store: Store;
  update: Function;
}) {
  const ref = createRef();
  useEffect(() => {
    if (!ref.current) return;
    const filePicker = ref.current;

    filePicker.addEventListener("change", () => {
      if (!filePicker.files) return;
      const file = filePicker.files[0];
      const store = getStore();
      if (filePicker.files.length == 1) {
        readFileContents(file, props.type)
          .then(async (contents) => {
            const assetsPath = await resolve(store.projectPath, "./assets");
            const jsonData = {
              fileName: file.name,
              contents: contents,
              fileType: "binary",
              assetsPath: assetsPath,
            };
            emit("create-asset", jsonData);
            listen("asset-created", () => {
              // Store file
              const storedAction: Action | undefined = getAction(
                props.action.id,
                store
              );
              if (storedAction) {
                storedAction.props[
                  props.filePropName
                ] = `./assets/${file.name}`;
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
  const inputId = `file_${props.action.id}_${props.propDef.name}`;
  return (
    <div class="action-prop file">
      <input id={inputId} type="file" ref={ref} accept={props.accept} />
      {props.action.props.path}
    </div>
  );
}
