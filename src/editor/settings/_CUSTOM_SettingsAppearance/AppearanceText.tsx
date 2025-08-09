import { FontDropdown } from "../../../fonts/FontDropdown";

export function AppearanceText(props: {
  initial: any;
  update: (key: string, newValues: { [key: string]: any }) => void;
}) {
  console.log(props.initial);
  return (
    <>
      <div class="section" id="headings">
        <h2>Headings</h2>
        <FontDropdown
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
        />
      </div>
      <div class="section" id="subheadings">
        <h2>Subheadings</h2>
        <FontDropdown
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
      </div>
      <div class="section" id="subheadings">
        <h2>Body Text</h2>
        <FontDropdown
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
      </div>
    </>
  );
}
