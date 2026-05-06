import FileUpload from "../../shared/FileUpload";
import { ColorPicker } from "./ColorPicker";
import { Asset } from "../../../typings";

export function AppearanceBackground(props: {
  initial: any;
  update: (key: string, newValues: { [key: string]: any }) => void;
}) {
  return (
    <>
      <div class="section">
        <h2>Background Color:</h2>
        <ColorPicker
          key="color-picker-background"
          initial={props.initial.background.color}
          update={(color: string) => {
            props.update("background", { color });
          }}
        />
      </div>
      <div class="section">
        <h2>Background Image:</h2>
        <FileUpload
          type="binary"
          propName="appearance_backgroundImage"
          label=""
          existingFile={props.initial.background.file}
          fileKind="image"
          fileParent="none"
          accept="image/jpeg,image/png"
          onClear={() => {
            props.update("background", { file: "" });
          }}
          onCreated={(asset: Asset) => {
            props.update("background", { file: asset.id });
          }}
        />
      </div>
    </>
  );
}
