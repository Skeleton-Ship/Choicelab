import { loadPlayerFonts } from "../../../utils/loadPlayerFonts";
import { useEffect } from "preact/hooks";

export function AppearanceText(props: {
  initial: any;
  update: (key: string, value: string) => void;
}) {
  console.log(props.initial);
  useEffect(() => {
    loadPlayerFonts();
  }, []);
  return (
    <>
      <div id="headings">
        <h2 style="font-family:'Nebula Sans';">Headings</h2>
      </div>
    </>
  );
}
