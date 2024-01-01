import { getStore, setStore } from "../../../../data/dataStore";
import {
  Action,
  ActionDef,
  ActionDefProp,
  Store,
  Variable,
} from "../../../../typings";
import { getVariables } from "../../../../data/getData";

export default function VariableControl(props: {
  action: Action;
  actionDef: ActionDef;
  propDef: ActionDefProp;
  initialValue: string;
  className: string;
  store: Store;
  update: Function;
}) {
  function handleChange(target: EventTarget | null) {
    if (target === null || !action) return;
    const value = (target as HTMLInputElement).value;
    action.props[propDef.name] = value;
    setStore(props.store);
    props.update();
  }
  const action = props.action;
  const propDef = props.propDef;
  const propElName = `action_${action.id}_${propDef.name}`;
  const className = `inspector-prop variable ${props.className}`;
  // Get variables
  const store = getStore();
  const variables = getVariables(store);
  const variableEls: Array<preact.JSX.Element> = [
    <option value="">Variable</option>,
  ];
  variables.forEach((variable: Variable) => {
    const variableEl = <option value={variable.id}>{variable.name}</option>;
    variableEls.push(variableEl);
  });
  return (
    <div class={className}>
      <label class="label break-line" for={propElName}>
        {propDef.label}
      </label>
      <select
        value={props.initialValue}
        onInput={(e) => {
          handleChange(e.target);
        }}
      >
        {variableEls}
      </select>
    </div>
  );
}
