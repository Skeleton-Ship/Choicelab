import { Action, ActionDef, ActionProp, Store } from "../../typings";
import TextField from "./prop-controls/TextField";
import Dropdown from "./prop-controls/Dropdown";
import Checkbox from "./prop-controls/Checkbox";

export default function ActionPropEditor(props: {
  instance: Action;
  def: ActionDef;
  defProp: ActionProp;
  store: Store;
  update: Function;
}) {
  let propEl = <></>,
    propControl;
  // Figure out the initial value for the element
  let initialValue: any;
  const action = props.instance;
  const actionDef = props.def;
  const defProp = props.defProp;
  const storedValue = action.props[defProp.name];
  if (typeof storedValue !== "undefined") {
    initialValue = storedValue;
  } else {
    if (typeof defProp.default !== "undefined") {
      initialValue = defProp.default;
    }
  }
  switch (defProp.control) {
    case "text":
      propControl = (
        <TextField
          action={action}
          actionDef={actionDef}
          propDef={defProp}
          initialValue={initialValue}
          store={props.store}
          fieldType="text"
          update={props.update}
        />
      );
      break;
    case "textarea":
      propControl = (
        <TextField
          action={action}
          actionDef={actionDef}
          propDef={defProp}
          initialValue={initialValue}
          store={props.store}
          fieldType="textarea"
          update={props.update}
        />
      );
      break;
    case "dropdown":
      propControl = (
        <Dropdown
          action={action}
          actionDef={actionDef}
          propDef={defProp}
          initialValue={initialValue}
          store={props.store}
          update={props.update}
        />
      );
      break;
    case "boolean":
      propControl = (
        <Checkbox
          action={action}
          actionDef={actionDef}
          propDef={defProp}
          initialValue={initialValue}
          store={props.store}
          update={props.update}
        />
      );
      break;
    default:
      propControl = <div>{defProp.name}</div>;
  }
  if (propControl) {
    propEl = propControl;
  }
  return propEl;
}
