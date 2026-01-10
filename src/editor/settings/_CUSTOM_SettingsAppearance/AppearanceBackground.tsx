import FileUpload from "../../shared/FileUpload";
import { useState } from "preact/hooks";

export function AppearanceBackground(props: {
  initial: any;
  update: (key: string, newValues: { [key: string]: any }) => void;
}) {
  console.log(props.initial);
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
      {kind === "image" && (
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
              console.log("Image cleared");
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
      )}
    </>
  );
}
