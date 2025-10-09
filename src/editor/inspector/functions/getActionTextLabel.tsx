export function getActionTextLabel(name: string, props: any) {
  let label = "";
  switch (name) {
    case "text":
      label = props.contents !== "" ? props.contents : "Text Block";
      break;
    case "button":
      label = props.label !== "" ? props.label : "Button";
      break;
    case "image":
      label =
        props.alt !== ""
          ? props.alt
          : props.source !== ""
          ? props.source
          : "Image";
      break;
    case "inputField":
      label = props.label !== "" ? props.label : "Input Field";
      break;
    case "appearance":
      label = "Change Appearance";
      break;
  }
  return label;
}
