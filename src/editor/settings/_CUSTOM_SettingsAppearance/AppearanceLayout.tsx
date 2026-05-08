export function AppearanceLayout(props: {
  initial: any;
  update: (key: string, newValues: { [key: string]: any }) => void;
}) {
  return (
    <>
      <div class="section">
        <h2>Aspect Ratio:</h2>
        <div class="ui-dropdown">
          <select
            value={props.initial.aspectRatio ?? "16/9"}
            onChange={(e) => {
              props.update("aspectRatio", {
                value: (e.target as HTMLSelectElement).value,
              });
            }}
          >
            <option value="16/9">Landscape (16:9)</option>
            <option value="1/1">Square</option>
            <option value="9/16">Vertical (9:16)</option>
          </select>
        </div>
      </div>
    </>
  );
}
