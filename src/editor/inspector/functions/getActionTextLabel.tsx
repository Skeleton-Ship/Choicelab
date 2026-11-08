import { Action, RichText } from "../../../typings";
import { getStore } from "../../../data/dataStore";
import { getVariables } from "../../../data/getData";
import { richTextToDisplayText } from "../../../data/richText";

function displayText(richText: RichText): string {
  return richTextToDisplayText(richText, getVariables(getStore()), " ").trim();
}

export function getActionTextLabel(action: Action): string {
  let label = "";
  switch (action.name) {
    case "text":
      label = displayText(action.props.contents) || "Text Block";
      break;
    case "button":
      label = displayText(action.props.label) || "Button";
      break;
    case "image":
      label =
        action.props.alt !== ""
          ? action.props.alt
          : action.props.source !== ""
          ? action.props.source
          : "Image";
      break;
    case "inputField":
      label = action.props.label !== "" ? action.props.label : "Input Field";
      break;
  }
  return label;
}
