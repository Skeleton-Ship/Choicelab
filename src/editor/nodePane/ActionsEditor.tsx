import { getStore } from "../../data/dataStore";
import { getCell, getActionDef } from "../../data/getData";
import { Cell, Action } from "../../typings";
import internalActionDefs from "./internalActionDefs";
import TextField from "./propControls/TextField";
import Dropdown from "./propControls/Dropdown";
import Checkbox from "./propControls/Checkbox";

export default function ActionsEditor(props: { update: Function }) {
  const store = getStore();
  // 1 node is selected
  const selectedNodeId = store.selectedNodes[0].id;
  const node: Cell | undefined = getCell(selectedNodeId, store);
  if (!node) return <></>;
  let editorEls: Array<preact.JSX.Element> = [];
  node.actions.forEach((action: Action) => {
    const actionDef = getActionDef(action.name, internalActionDefs);
    if (!actionDef) return;
    let propEls: Array<preact.JSX.Element> = [];
    // Create an editor for each prop
    const defProps = actionDef.props;
    defProps.forEach((defProp) => {
      let propEl = <></>,
        propControl;
      /*
		TODO: Add control types
		☑️ text
		☑️ textarea
		☑️ boolean
		☑️ dropdown
		audio
		video
		captions
		image
		variable
		variableValue
		*/
      // Figure out the initial value for the element
      let initialValue: any;
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
              store={store}
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
              store={store}
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
              store={store}
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
              store={store}
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
      propEls.push(propEl);
    });
    // Finally, make an editor el
    const editorEl = (
      <li key={action.id}>
        <h5>{actionDef.label}</h5>
        {propEls}
      </li>
    );
    editorEls.push(editorEl);
  });
  return (
    <ul id="actions-editor">
      <div class="inner">{editorEls}</div>
    </ul>
  );
}
