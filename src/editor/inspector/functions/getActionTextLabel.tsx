import { Action } from "../../../typings";

export function getActionTextLabel(action: Action): string {
  let label = "";
  switch (action.name) {
    case "text":
      label = action.props.contents !== "" ? action.props.contents : "Text Block";
      break;
    case "button":
      label = action.props.label !== "" ? action.props.label : "Button";
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
