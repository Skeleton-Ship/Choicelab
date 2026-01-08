import { FontDropdown } from "../../../fonts/FontDropdown";
import { FontSizeDropdown } from "./FontSizeDropdown";
import { ColorPicker } from "./ColorPicker";

export function AppearanceText(props: {
  initial: any;
  update: (key: string, newValues: { [key: string]: any }) => void;
}) {
  return (
    <>
      <div class="section" id="headings">
        <h2>Headings</h2>
        <FontDropdown
          key="font-picker-headings"
          initialFamily={props.initial.headings.fontFamily}
          initialStyle={props.initial.headings.fontStyle}
          initialWeight={props.initial.headings.fontWeight}
          update={(family, weight, style) => {
            props.update("headings", {
              fontFamily: family,
              fontWeight: weight,
              fontStyle: style,
            });
          }}
        />{" "}
        <div class="text-secondary-props">
          <FontSizeDropdown
            key="font-size-headings"
            initial={props.initial.headings.fontSize}
            update={(fontSize: string) => {
              props.update("headings", {
                fontSize: fontSize,
              });
            }}
          />
          <ColorPicker
            key="color-picker-headings"
            initial={props.initial.headings.color}
            update={(color) => {
              props.update("headings", {
                color: color,
              });
            }}
          />
        </div>
      </div>
      <div class="section" id="subheadings">
        <h2>Subheadings</h2>
        <FontDropdown
          key="font-picker-subheadings"
          initialFamily={props.initial.subheadings.fontFamily}
          initialStyle={props.initial.subheadings.fontStyle}
          initialWeight={props.initial.subheadings.fontWeight}
          update={(family, weight, style) => {
            props.update("subheadings", {
              fontFamily: family,
              fontWeight: weight,
              fontStyle: style,
            });
          }}
        />
        <div class="text-secondary-props">
          <FontSizeDropdown
            key="font-size-subheadings"
            initial={props.initial.subheadings.fontSize}
            update={(fontSize: string) => {
              props.update("subheadings", {
                fontSize: fontSize,
              });
            }}
          />
          <ColorPicker
            key="color-picker-subheadings"
            initial={props.initial.subheadings.color}
            update={(color) => {
              props.update("subheadings", {
                color: color,
              });
            }}
          />
        </div>
      </div>
      <div class="section" id="subheadings">
        <h2>Body Text</h2>
        <FontDropdown
          key="font-picker-body"
          initialFamily={props.initial.bodyText.fontFamily}
          initialStyle={props.initial.bodyText.fontStyle}
          initialWeight={props.initial.bodyText.fontWeight}
          update={(family, weight, style) => {
            props.update("bodyText", {
              fontFamily: family,
              fontWeight: weight,
              fontStyle: style,
            });
          }}
        />
        <div class="text-secondary-props">
          <FontSizeDropdown
            key="font-size-body"
            initial={props.initial.bodyText.fontSize}
            update={(fontSize: string) => {
              props.update("bodyText", {
                fontSize: fontSize,
              });
            }}
          />
          <ColorPicker
            key="color-picker-body"
            initial={props.initial.bodyText.color}
            update={(color) => {
              props.update("bodyText", {
                color: color,
              });
            }}
          />
        </div>
      </div>
    </>
  );
}
