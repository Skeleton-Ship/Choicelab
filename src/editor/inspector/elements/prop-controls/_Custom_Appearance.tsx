import { openProjectSettings } from "../../../settings/openProjectSettings";

export function Appearance() {
  return null;
  return (
    <div class="inspector-prop appearance">
      <button
        class="ui-button small"
        onClick={() => {
          openProjectSettings("appearance");
        }}
      >
        Project Appearance...
      </button>
    </div>
  );
}

/*
 * NOTE: This all works, it's just disabled until it's time to implement custom appearance controls.
 */
/*

import { useState } from "preact/hooks";
import { setStore } from "../../../../data/dataStore";
import { Action, ActionDef, ActionDefProp, Store } from "../../../../typings";
import { getPlayerConfig } from "../../../../player/getPlayerConfig";
import { openProjectSettings } from "../../../settings/openProjectSettings";

interface AppearanceSettings {
  font?: string;
  textColor?: string;
  backgroundColor?: string;
  size?: string;
  transitionStyle?: string;
  transitionDuration?: string;
  width?: string;
  shape?: string;
}

function getPropsObj(props: { [key: string]: any }, action: Action) {
  return props.extended === false
    ? action.props
    : action.extendedProps[getPlayerConfig().id];
}

function getAppearanceProps(
  props: { [key: string]: any },
  propDef: ActionDefProp,
  action: Action
) {
  return getPropsObj(props, action)[propDef.name];
}

function isAllDefault(
  props: { [key: string]: any },
  propDef: ActionDefProp,
  action: Action
) {
  const keys = Object.keys(getAppearanceProps(props, propDef, action));
  let allDefault = true;
  keys.forEach((key) => {
    if (getAppearanceProps(props, propDef, action)[key] !== "default") {
      allDefault = false;
    }
  });
  return allDefault;
}

export function Appearance(props: {
  action: Action;
  actionDef: ActionDef;
  propDef: ActionDefProp;
  initialValue: AppearanceSettings;
  extended: boolean;
  store: Store;
  update: Function;
}) {
  const action = props.action;
  const propDef = props.propDef;
  // const propElName = `action_${action.id}_${propDef.name}`;
  let [showCustom, setShowCustom] = useState(false);

  function handleChange(e: InputEvent) {
    const target = e.target;
    if (target === null || !action) return;
    const value = (target as HTMLSelectElement).value;
    const propsObj = getPropsObj(props, action);
    propsObj[propDef.name] = value;
    setStore(props.store);
    props.update();
  }
  console.log(handleChange);
  //
  // TODO: Iterate through all appearance properties and add controls
  //
  const settingsEl = <div>Hey guys</div>;
  return (
    <div class="inspector-prop appearance">
      {isAllDefault(props, propDef, action) && showCustom === false ? (
        <button
          class="ui-button small"
          onClick={() => {
            setShowCustom(true);
          }}
        >
          Set Custom Style...
        </button>
      ) : (
        settingsEl
      )}
      <button
        class="ui-button small"
        onClick={() => {
          openProjectSettings();
        }}
      >
        Project Style Settings...
      </button>
    </div>
  );
}

*/
