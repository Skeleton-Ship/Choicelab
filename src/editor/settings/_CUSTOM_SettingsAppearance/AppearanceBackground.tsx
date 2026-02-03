import FileUpload from "../../shared/FileUpload";
import { useState } from "preact/hooks";
import { ColorPicker } from "./ColorPicker";

export function AppearanceBackground(props: {
  initial: any;
  update: (key: string, newValues: { [key: string]: any }) => void;
}) {
  const [kind, setKind] = useState(props.initial.background.kind);
  return (
    <>
      <div class="radio section">
        <h2>Background Kind:</h2>
        <div>
          <label for="input_kind_color">
            <input
              type="radio"
              name="input_kind"
              id="input_kind_color"
              value="color"
              checked={kind === "color"}
              onChange={() => {
                setKind("color");
              }}
            />
            <span>Color</span>
          </label>
          <label for="input_kind_image">
            <input
              type="radio"
              name="input_kind"
              id="input_kind_image"
              value="image"
              checked={kind === "image"}
              onChange={() => {
                setKind("image");
              }}
            />
            <span>Image</span>
          </label>
        </div>
      </div>
      {kind === "image" ? (
        <div class="section">
          <FileUpload
            type="binary"
            propName="appearance_backgroundImage"
            label=""
            existingFile={props.initial.background.file}
            fileKind="image"
            fileParent="none"
            accept="image/jpeg,image/png"
            onClear={() => {
              props.update("background", {
                kind: "image",
                file: "",
                color: props.initial.color,
              });
            }}
            onCreated={(file) => {
              props.update("background", {
                kind: "image",
                file: file.name,
                color: props.initial.color,
              });
            }}
          />
        </div>
      ) : kind === "color" ? (
        <div class="section">
          <ColorPicker
            key="color-picker-background"
            initial={props.initial.background.color}
            update={(color) => {
              props.update("background", {
                kind: "color",
                file: props.initial.background.file,
                color: color,
              });
            }}
          />
        </div>
      ) : null}
    </>
  );
}
