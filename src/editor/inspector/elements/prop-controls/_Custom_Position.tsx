import { setStore } from "../../../../data/dataStore";
import { Action, ActionDef, ActionDefProp, Store } from "../../../../typings";
import { getPlayerConfig } from "../../../../player/getPlayerConfig";

type PositionString = "top" | "middle" | "bottom" | "left" | "center" | "right";

export function Position(props: {
  action: Action;
  actionDef: ActionDef;
  propDef: ActionDefProp;
  initialValue: { kind: string; x: number; y: number };
  extended: boolean;
  store: Store;
  update: Function;
}) {
  const action = props.action;
  const propDef = props.propDef;
  const propElName = `action_${action.id}_${propDef.name}`;
  function getNumericValue(textValue: PositionString) {
    if (textValue === "top" || textValue === "left") return 1;
    if (textValue === "middle" || textValue === "center") return 2;
    if (textValue === "bottom" || textValue === "right") return 3;
    return -1;
  }
  function handleChange(e: MouseEvent) {
    if (!action) return;
    const el = e.target as HTMLButtonElement;
    const valueRaw = el.value;
    const values = valueRaw.split(" ") as Array<PositionString>;
    const propsObj =
      props.extended === false
        ? action.props
        : action.extendedProps[getPlayerConfig().id];
    const newValue = {
      kind: "grid",
      y: getNumericValue(values[0]),
      x: getNumericValue(values[1]),
    };
    propsObj[propDef.name] = newValue;
    setStore(props.store);
    props.update();
  }
  const positionsY: Array<PositionString> = ["top", "middle", "bottom"],
    positionsX: Array<PositionString> = ["left", "center", "right"];
  return (
    <div class="inspector-prop position col-2">
      <label for={propElName}>Position</label>
      <div class="position-markers">
        {positionsY.map((y) => {
          return positionsX.map((x) => {
            const value = `${y} ${x}`;
            return (
              <button
                class={`position-marker ${
                  props.initialValue.y === getNumericValue(y) &&
                  props.initialValue.x === getNumericValue(x)
                    ? "selected"
                    : ""
                }`}
                title={`Position at ${value}`}
                value={value}
                onClick={handleChange}
              ></button>
            );
          });
        })}
      </div>
    </div>
  );
}
