import { useEffect, useState, useRef } from "preact/hooks";
import { PlayerFonts } from "../typings";
import { getFonts } from "./fonts";

export function FontDropdown(props: {
  initialFamily: string;
  initialWeight: string;
  initialStyle: string;
  update: (family: string, weight: string, style: string) => void;
}) {
  // Setup
  const [fonts, setFonts] = useState<PlayerFonts>({ families: {} });
  const [familyMenuVisible, setFamilyMenuVisible] = useState(false);
  const [styleMenuVisible, setStyleMenuVisible] = useState(false);
  // Load fonts
  useEffect(() => {
    getFonts().then((fonts) => {
      setFonts(fonts);
    });
  }, []);
  // Handle changes to values
  function handleChange(family: string, weight?: string, style?: string) {
    if (!weight) weight = "400";
    if (!style) style = "normal";
    props.update(family, weight, style);
  }
  // Get font family key
  const keys = Object.keys(fonts.families);
  let familyId = "";
  keys.forEach((key) => {
    if (fonts.families[key].name === props.initialFamily) familyId = key;
  });
  // Get font style
  let initialStyleName = "";
  keys.forEach((key) => {
    if (fonts.families[key].name !== props.initialFamily) return;
    fonts.families[key].styles.forEach((style) => {
      if (
        style.style === props.initialStyle &&
        style.weight === props.initialWeight
      ) {
        initialStyleName = style.name;
      }
    });
  });
  // Handle clicks outside of the dropdown
  const familyRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLDivElement>(null);
  function familyOutsideClick() {
    setFamilyMenuVisible(false);
  }
  function styleOutsideClick() {
    setStyleMenuVisible(false);
  }
  useEffect(() => {
    function handleFamilyClickOutside(event: MouseEvent) {
      if (
        familyRef.current &&
        !familyRef.current.contains(event.target as Node)
      ) {
        familyOutsideClick();
      }
    }
    function handleStyleClickOutside(event: MouseEvent) {
      if (
        styleRef.current &&
        !styleRef.current.contains(event.target as Node)
      ) {
        styleOutsideClick();
      }
    }
    document.addEventListener("mousedown", handleFamilyClickOutside);
    document.addEventListener("mousedown", handleStyleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleFamilyClickOutside);
      document.removeEventListener("mousedown", handleStyleClickOutside);
    };
  }, [familyOutsideClick, styleOutsideClick]);
  return (
    <div class="fonts-selector">
      {/* Family */}
      <div
        ref={familyRef}
        class="ui-dropdown fonts large"
        onClick={() => {
          setFamilyMenuVisible(familyMenuVisible === true ? false : true);
        }}
      >
        <button
          class="selected-label"
          style={`font-family:"${props.initialFamily}";font-style:${props.initialStyle};font-weight:${props.initialWeight};`}
        >
          {props.initialFamily !== "" ? props.initialFamily : ""}
        </button>
        {familyMenuVisible ? (
          <ul class="menu">
            {keys.map((key) => {
              const familyName = fonts.families[key].name;
              return (
                <li>
                  <button
                    onClick={() => {
                      handleChange(familyName);
                    }}
                    style={`font-family:"${familyName}";`}
                  >
                    <span class="item-name">
                      {familyName === props.initialFamily ? (
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
      {/* Style */}
      <div
        ref={styleRef}
        class="ui-dropdown fonts large"
        onClick={() => {
          setStyleMenuVisible(styleMenuVisible === true ? false : true);
        }}
      >
        <button
          class="selected-label"
          style={`font-family:"${props.initialFamily}";font-style:${props.initialStyle};font-weight:${props.initialWeight};`}
        >
          {initialStyleName !== "" ? initialStyleName : ""}
        </button>
        {styleMenuVisible ? (
          <ul class="menu">
            {fonts.families[familyId].styles.map((style) => {
              const styleName = style.name;
              return (
                <li>
                  <button
                    onClick={() => {
                      handleChange(
                        props.initialFamily,
                        style.weight,
                        style.style
                      );
                    }}
                    style={`font-family:"${props.initialFamily}";font-style:${style.style};font-weight:${style.weight}`}
                  >
                    <span class="item-name">
                      {style.weight === props.initialWeight &&
                      style.style === props.initialStyle ? (
                        <span class="check">✓</span>
                      ) : (
                        ""
                      )}{" "}
                      {styleName}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
