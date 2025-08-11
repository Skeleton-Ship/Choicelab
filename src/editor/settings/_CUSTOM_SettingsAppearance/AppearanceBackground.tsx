import FileUpload from "../../shared/FileUpload";

export function AppearanceBackground(props: {
  initial: any;
  update: (key: string, newValues: { [key: string]: any }) => void;
}) {
  console.log(props.initial);
  return (
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
          console.log("Image cleared");
        }}
        onCreated={() => {
          console.log("Image uploaded");
        }}
      />
    </div>
  );
}
