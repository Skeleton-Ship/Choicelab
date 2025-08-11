import { Action, ActionDef, ActionDefProp, Store } from "../../../typings";
import TextField from "./prop-controls/TextField";
import Dropdown from "./prop-controls/Dropdown";
import Checkbox from "./prop-controls/Checkbox";
import File from "./prop-controls/File";
import VariableControl from "./prop-controls/Variable";
import VariableValueControl from "./prop-controls/VariableValue";
import { Appearance } from "./prop-controls/_Custom_Appearance";
import { Position } from "./prop-controls/_Custom_Position";
import { getPlayerConfig } from "../../../player/getPlayerConfig";

export default function ActionPropEditor(props: {
  instance: Action;
  def: ActionDef;
  extended: boolean;
  defProp: ActionDefProp;
  store: Store;
  update: Function;
}) {
  const playerConfig = getPlayerConfig();
  let propEl = <></>,
    propControl;
  // Figure out the initial value for the element
  let initialValue: any;
  const action = props.instance;
  const actionDef = props.def;
  const defProp = props.defProp;
  const storedValue =
    props.extended === false
      ? action.props[defProp.name]
      : action.extendedProps[playerConfig.id][defProp.name];
  const className = defProp.className ? defProp.className : "";
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
          fieldType="text"
          action={action}
          actionDef={actionDef}
          propDef={defProp}
          initialValue={initialValue}
          extended={props.extended}
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
          initialValue={initialValue}
          extended={props.extended}
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
          initialValue={initialValue}
          extended={props.extended}
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
          initialValue={initialValue}
          extended={props.extended}
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
          initialValue={initialValue}
          extended={props.extended}
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
          initialValue={initialValue}
          extended={props.extended}
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
          initialValue={initialValue}
          extended={props.extended}
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
          initialValue={initialValue}
          extended={props.extended}
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
          initialValue={initialValue}
          extended={props.extended}
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
          initialValue={initialValue}
          extended={props.extended}
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
          initialValue={initialValue}
          extended={props.extended}
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
          initialValue={initialValue}
          extended={props.extended}
          store={props.store}
          update={props.update}
        />
      );
      break;
    case "__CUSTOM__Appearance":
      propControl = (
        // Temporarily commented out since no props yet
        // <Appearance
        //   action={action}
        //   actionDef={actionDef}
        //   propDef={defProp}
        //   initialValue={initialValue}
        //   extended={props.extended}
        //   store={props.store}
        //   update={props.update}
        // />
        <Appearance />
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
