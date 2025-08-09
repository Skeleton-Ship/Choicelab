import { useEffect, useState } from "preact/hooks";
import { PlayerFonts } from "../typings";
import { getFonts } from "./fonts";

export function FontDropdown(props: {
  initialFamily: string;
  initialWeight: string;
  initialStyle: string;
  update: (family: string, weight: string, style: string) => void;
}) {
  console.log("Initial family:", props.initialFamily);
  const [fonts, setFonts] = useState<PlayerFonts>({ families: {} });
  const [menuVisible, setMenuVisible] = useState(false);
  useEffect(() => {
    getFonts().then((fonts) => {
      setFonts(fonts);
    });
  }, []);
  const keys = Object.keys(fonts.families);
  function handleChange(family: string, weight?: string, style?: string) {
    if (!weight) weight = "400";
    if (!style) style = "normal";
    props.update(family, weight, style);
  }
  let initialFamilyName = "";
  keys.forEach((key) => {
    if (fonts.families[key].name === props.initialFamily) {
      initialFamilyName = fonts.families[key].name;
    }
  });
  return (
    <div
      class="ui-dropdown fonts large"
      onClick={() => {
        setMenuVisible(menuVisible === true ? false : true);
      }}
    >
      {props.initialFamily !== "" ? (
        <span class="selected-label">{initialFamilyName}</span>
      ) : null}
      {menuVisible ? (
        <ul class="menu">
          {keys.map((key) => {
            const familyName = fonts.families[key].name;
            return (
              <li>
                <button
                  onClick={() => {
                    handleChange(key);
                  }}
                  style={`font-family:"${familyName}";`}
                >
                  <span class="item-name">
                    {familyName === initialFamilyName ? (
                      <span class="check">✓</span>
                    ) : (
                      ""
                    )}{" "}
                    {familyName}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
