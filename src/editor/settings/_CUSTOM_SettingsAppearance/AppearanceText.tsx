import { FontDropdown } from "../../../fonts/FontDropdown";

export function AppearanceText(props: {
  initial: any;
  update: (key: string, value: string) => void;
}) {
  console.log(props.initial);
  return (
    <>
      <div id="headings">
        <h2>Headings</h2>
        <FontDropdown
          initialFamily={props.initial.headings.fontFamily}
          initialStyle={props.initial.headings.fontStyle}
          initialWeight={props.initial.headings.fontWeight}
          update={(family, weight, style) => {
            console.log(family, weight, style);
          }}
        />
      </div>
    </>
  );
}
