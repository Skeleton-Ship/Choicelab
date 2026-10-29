import { Action, ActionDef, ActionDefProp, Store, UpdateFunction } from "../../../typings";
import TextField from "./prop-controls/TextField";
import Dropdown from "./prop-controls/Dropdown";
import Checkbox from "./prop-controls/Checkbox";
import File from "./prop-controls/File";
import VariableControl from "./prop-controls/Variable";
import VariableValueControl from "./prop-controls/VariableValue";
import { Position } from "./prop-controls/_Custom_Position";
import { getActionProp } from "../../../data/actionProps";

export default function ActionPropEditor(props: {
  instance: Action;
  def: ActionDef;
  defProp: ActionDefProp;
  store: Store;
  update: UpdateFunction;
}) {
  let propEl = <></>,
    propControl;
  const action = props.instance;
  const actionDef = props.def;
  const defProp = props.defProp;
  const className = defProp.className ? defProp.className : "";
  // Figure out the initial value for the element.
  // Each control edits one type of value; anything else falls back to that control's empty value.
  const initialValue = getActionProp(action, defProp.name) ?? defProp.default;
  const initialString = typeof initialValue === "string" ? initialValue : "";
  const initialNumber = typeof initialValue === "number" ? initialValue : 0;
  const initialBoolean = initialValue === true;
  const initialPosition = typeof initialValue === "object" ? initialValue : undefined;
  const initialVariableValue = typeof initialValue === "object" ? undefined : initialValue;
  switch (defProp.control) {
    case "text":
      propControl = (
        <TextField
          fieldType="text"
          action={action}
          actionDef={actionDef}
          propDef={defProp}
          initialValue={initialString}
          className={className}
          store={props.store}
          update={props.update}
        />
      );
      break;
    case "textarea":
      propControl = (
        <TextField
          fieldType="textarea"
          action={action}
          actionDef={actionDef}
          propDef={defProp}
          initialValue={initialString}
          className={className}
          store={props.store}
          update={props.update}
        />
      );
      break;
    case "number":
      propControl = (
        <TextField
          fieldType="number"
          action={action}
          actionDef={actionDef}
          propDef={defProp}
          initialValue={initialNumber}
          className={className}
          store={props.store}
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
          initialValue={initialString}
          className={className}
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
          initialValue={initialBoolean}
          className={className}
          store={props.store}
          update={props.update}
        />
      );
      break;
    case "image":
      propControl = (
        <File
          type="binary"
          accept="image/png,image/jpeg"
          filePropName="source"
          action={action}
          actionDef={actionDef}
          propDef={defProp}
          initialValue={initialString}
          className={className}
          store={props.store}
          update={props.update}
        />
      );
      break;
    case "video":
      propControl = (
        <File
          type="binary"
          accept=".webm,.mp4"
          filePropName="source"
          action={action}
          actionDef={actionDef}
          propDef={defProp}
          initialValue={initialString}
          className={className}
          store={props.store}
          update={props.update}
        />
      );
      break;
    case "audio":
      propControl = (
        <File
          type="binary"
          accept="audio/mpeg"
          filePropName="source"
          action={action}
          actionDef={actionDef}
          propDef={defProp}
          initialValue={initialString}
          className={className}
          store={props.store}
          update={props.update}
        />
      );
      break;
    case "captions":
      propControl = (
        <File
          type="text"
          accept=".vtt"
          filePropName="captions"
          action={action}
          actionDef={actionDef}
          propDef={defProp}
          initialValue={initialString}
          className={className}
          store={props.store}
          update={props.update}
        />
      );
      break;
    case "variable":
      propControl = (
        <VariableControl
          action={action}
          actionDef={actionDef}
          propDef={defProp}
          initialValue={initialString}
          className={className}
          store={props.store}
          update={props.update}
        />
      );
      break;
    case "variableValue":
      propControl = (
        <VariableValueControl
          action={action}
          actionDef={actionDef}
          propDef={defProp}
          varFieldName="varToSet"
          initialValue={initialVariableValue}
          className={className}
          store={props.store}
          update={props.update}
        />
      );
      break;
    case "__CUSTOM__Position":
      propControl = (
        <Position
          action={action}
          actionDef={actionDef}
          propDef={defProp}
          initialValue={initialPosition}
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
