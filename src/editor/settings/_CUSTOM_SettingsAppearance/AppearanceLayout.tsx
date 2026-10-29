import { AspectRatio } from "../../../typings";
import type { AppearancePaneProps } from "./SettingsAppearance";
export function AppearanceLayout(props: AppearancePaneProps) {
  return (
    <>
      <div class="section">
        <h2>Aspect Ratio:</h2>
        <div class="ui-dropdown">
          <select
            value={props.initial.aspectRatio ?? "16/9"}
            onChange={(e) => {
              props.update(
                "aspectRatio",
                (e.target as HTMLSelectElement).value as AspectRatio
              );
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
