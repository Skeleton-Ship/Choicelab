import fonts from "@surfgreen/choicelab-player-html5/fonts.json";

export function AppearanceText(props: {
  initial: any;
  update: (key: string, value: string) => void;
}) {
  console.log(props.initial);
  console.log(fonts);
  return (
    <>
      <div id="headings">
        <h2>Headings</h2>
      </div>
    </>
  );
}
