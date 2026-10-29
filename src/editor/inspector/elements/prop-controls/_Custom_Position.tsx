import { setStore } from "../../../../data/dataStore";
import { Action, ActionDef, ActionDefProp, ActionPosition, Store } from "../../../../typings";
import { setActionProp } from "../../../../data/actionProps";
import NumberField from "../NumberField";

const GRID_TO_PERCENT: Record<number, number> = { 1: 16, 2: 50, 3: 83 };

function resolvePosition(value: ActionPosition | undefined): { x: number; y: number } {
  if (!value) return { x: 50, y: 50 };
  if (value.kind === "absolute") return { x: value.x, y: value.y };
  if (value.kind === "grid") {
    return {
      x: GRID_TO_PERCENT[value.x] ?? 50,
      y: GRID_TO_PERCENT[value.y] ?? 50,
    };
  }
  return { x: 50, y: 50 };
}

export function Position(props: {
  action: Action;
  actionDef: ActionDef;
  propDef: ActionDefProp;
  initialValue: ActionPosition | undefined;
  store: Store;
  update: Function;
}) {
  const action = props.action;
  const propDef = props.propDef;
  const { x, y } = resolvePosition(props.initialValue);

  function handleChange(axis: "x" | "y", value: number) {
    if (!action) return;
    const current = resolvePosition(props.initialValue);
    if (axis === "x" && current.x === value) return;
    if (axis === "y" && current.y === value) return;
    setActionProp(action, propDef.name, {
      kind: "absolute",
      x: axis === "x" ? value : current.x,
      y: axis === "y" ? value : current.y,
    });
    setStore(props.store);
    props.update();
  }

  return (
    <div class="inspector-prop position col-2">
      <label>Position</label>
      <div class="position-inputs">
        <div class="position-input">
          <label>X</label>
          <NumberField
            name={`position_x_${action.id}`}
            value={x}
            min={0}
            max={100}
            decimalPlaces={1}
            onChange={(value: number) => handleChange("x", value)}
          />
          <span class="suffix">%</span>
        </div>
        <div class="position-input">
          <label>Y</label>
          <NumberField
            name={`position_y_${action.id}`}
            value={y}
            min={0}
            max={100}
            decimalPlaces={1}
            onChange={(value: number) => handleChange("y", value)}
          />
          <span class="suffix">%</span>
        </div>
      </div>
    </div>
  );
}
