import { FontDropdown } from "../../../fonts/FontDropdown";
import { FontSizeDropdown } from "./FontSizeDropdown";
import { ColorPicker } from "./ColorPicker";
import NumberField from "../../inspector/elements/NumberField";

export function AppearanceInputs(props: {
  initial: any;
  update: (key: string, newValues: { [key: string]: any }) => void;
}) {
  return (
    <>
      <div class="section font">
        <FontDropdown
          key="font-picker-inputs"
          initialFamily={props.initial.inputs.fontFamily}
          initialStyle={props.initial.inputs.fontStyle}
          initialWeight={props.initial.inputs.fontWeight}
          update={(family, weight, style) => {
            props.update("inputs", {
              fontFamily: family,
              fontWeight: weight,
              fontStyle: style,
            });
          }}
        />{" "}
        <div class="text-secondary-props">
          <FontSizeDropdown
            key="font-size-inputs"
            initial={props.initial.inputs.fontSize}
            update={(fontSize: string) => {
              props.update("inputs", {
                fontSize: fontSize,
              });
            }}
          />
        </div>
      </div>
      <div class="section">
        <label>
          <span>Text Color:</span>
          <ColorPicker
            key="inputs-text-color"
            initial={props.initial.inputs.textColor}
            update={(color) => {
              props.update("inputs", {
                textColor: color,
              });
            }}
          />
        </label>
        <label>
          <span>Background Color:</span>
          <ColorPicker
            key="inputs-background-color"
            initial={props.initial.inputs.backgroundColor}
            update={(color) => {
              props.update("inputs", {
                backgroundColor: color,
              });
            }}
          />
        </label>
      </div>
      <div class="section">
        <label>
          <span>Border Width:</span>
          <NumberField
            key="inputs-border-width"
            name="inputs-border-width"
            value={props.initial.inputs.borderWidth}
            decimalPlaces={0}
            min={0}
            max={20}
            step={1}
            onChange={(number: number) => {
              props.update("inputs", {
                borderWidth: number,
              });
            }}
          />
        </label>
        <label>
          <span>Border Color:</span>
          <ColorPicker
            key="inputs-border-color"
            initial={props.initial.inputs.borderColor}
            update={(color) => {
              props.update("inputs", {
                borderColor: color,
              });
            }}
          />
        </label>
        <label>
          <span>Border Radius:</span>
          <NumberField
            key="inputs-border-radius"
            name="inputs-border-radius"
            value={props.initial.inputs.borderRadius}
            decimalPlaces={0}
            min={0}
            max={100}
            step={1}
            onChange={(number: number) => {
              props.update("inputs", {
                borderRadius: number,
              });
            }}
          />
        </label>
      </div>
    </>
  );
}
