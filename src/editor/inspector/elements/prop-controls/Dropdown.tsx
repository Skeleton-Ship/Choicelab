import { setStore } from "../../../../data/dataStore";
import {
  Action,
  ActionDef,
  ActionDefProp,
  ActionDefPropDropdownOption,
  Store,
} from "../../../../typings";
import { getPlayerConfig } from "../../../../player/getPlayerConfig";

export default function Dropdown(props: {
  action: Action;
  actionDef: ActionDef;
  propDef: ActionDefProp;
  initialValue: string;
  extended: boolean;
  className: string;
  store: Store;
  update: Function;
}) {
  function handleChange(target: EventTarget | null) {
    if (target === null || !action) return;
    const value = (target as HTMLSelectElement).value;
    const propsObj =
      props.extended === false
        ? action.props
        : action.extendedProps[getPlayerConfig().id];
    if (propsObj[propDef.name] === value) return;
    propsObj[propDef.name] = value;
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
  options.forEach((option: ActionDefPropDropdownOption) => {
    const optionEl = <option value={option.value}>{option.label}</option>;
    optionEls.push(optionEl);
  });
  const className = `inspector-prop dropdown ${props.className}`;
  return (
    <div class={className}>
      <label class="label break-line" for={propElName}>
        {propDef.label}
      </label>
      <div class="ui-dropdown">
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
    </div>
  );
}
