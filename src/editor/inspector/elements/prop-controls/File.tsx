import { getAction } from "../../../../data/getData";
import { getStore, setStore } from "../../../../data/dataStore";
import { Action, ActionDef, ActionDefProp, Asset, Store, UpdateFunction } from "../../../../typings";
import { getActionProp, setActionProp } from "../../../../data/actionProps";
import { updatePreview } from "../../../../preview/updatePreview";
import FileUpload from "../../../shared/FileUpload";

/*
 * NOTE: This element is a wrapper for the <FileUpload /> element SPECIFICALLY to deal with action-specific considerations for files.
 * If you want the lower-level ability to upload files and do something with them on save, use <FileUpload /> instead.
 */
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
  update: UpdateFunction;
}) {
  // Method: Clear file
  function handleClear() {
    const store = getStore();
    const action: Action | undefined = getAction(props.action.id, store);
    if (!action) return;
    setActionProp(action, props.propDef.name, "");
    setStore(store);
    props.update();
  }
  // Method: File created
  function handleCreated(asset: Asset) {
    // Store asset ID
    const store = getStore(); // get store again, because asset creation can cause the store to fall out-of-date
    const storedAction: Action | undefined = getAction(props.action.id, store);
    if (storedAction) {
      setActionProp(storedAction, props.filePropName, asset.id);
      setStore(store);
      props.update(true, false);
      setTimeout(() => {
        updatePreview();
      }, 500);
    }
  }
  const storedFile = getActionProp(props.action, props.filePropName);
  const existingFile = typeof storedFile === "string" ? storedFile : "";
  return (
    <FileUpload
      type={props.type}
      action={props.action}
      propName={props.propDef.name}
      label={props.propDef.label}
      fileKind={props.propDef.control}
      fileParent="action"
      existingFile={existingFile}
      accept={props.accept}
      update={props.update}
      className={props.className}
      onCreated={handleCreated}
      onClear={handleClear}
    />
  );
}
