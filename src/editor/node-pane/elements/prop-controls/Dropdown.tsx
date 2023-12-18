import { setStore } from "../../../../data/dataStore";
import {
  Action,
  ActionDef,
  ActionProp,
  ActionPropDropdownOption,
  Store,
} from "../../../../typings";

export default function Dropdown(props: {
  action: Action;
  actionDef: ActionDef;
  propDef: ActionProp;
  initialValue: string;
  store: Store;
  update: Function;
}) {
  function handleChange(target: EventTarget | null) {
    if (target === null || !action) return;
    const value = (target as HTMLSelectElement).value;
    action.props[propDef.name] = value;
    setStore(props.store);
    props.update();
  }
  const action = props.action;
  const propDef = props.propDef;
  const propElName = `action_${action.id}_${propDef.name}`;
  // Get options
  const optionEls: Array<preact.JSX.Element> = [];
  const options = props.propDef.options;
  if (!options) return <></>;
  options.forEach((option: ActionPropDropdownOption) => {
    const optionEl = <option value={option.value}>{option.label}</option>;
    optionEls.push(optionEl);
  });
  return (
    <div class="action-prop dropdown">
      <label class="label break-line" for={propElName}>
        {propDef.label}
      </label>
      <select
        name={propElName}
        id={propElName}
        value={props.initialValue}
        onChange={(e) => {
          handleChange(e.target);
        }}
      >
        {optionEls}
      </select>
    </div>
  );
}
