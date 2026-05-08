import { setStore } from "../../../../data/dataStore";
import { Action, ActionDef, ActionDefProp, Store } from "../../../../typings";
import { getPlayerConfig } from "../../../../player/getPlayerConfig";

const GRID_TO_PERCENT: Record<number, number> = { 1: 16, 2: 50, 3: 83 };

function resolvePosition(value: { kind: string; x: number; y: number }): { x: number; y: number } {
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
  initialValue: { kind: string; x: number; y: number };
  extended: boolean;
  store: Store;
  update: Function;
}) {
  const action = props.action;
  const propDef = props.propDef;
  const { x, y } = resolvePosition(props.initialValue);

  function handleChange(axis: "x" | "y", rawValue: string) {
    if (!action) return;
    const parsed = parseFloat(rawValue);
    const clamped = isNaN(parsed) ? 50 : Math.min(100, Math.max(0, parsed));
    const current = resolvePosition(props.initialValue);
    const propsObj =
      props.extended === false
        ? action.props
        : action.extendedProps[getPlayerConfig().id];
    propsObj[propDef.name] = {
      kind: "absolute",
      x: axis === "x" ? clamped : current.x,
      y: axis === "y" ? clamped : current.y,
    };
    setStore(props.store);
    props.update();
  }

  return (
    <div class="inspector-prop position col-2">
      <label>Position</label>
      <div class="position-inputs">
        <div class="position-input">
          <label>X</label>
          <input
            type="number"
            min="0"
            max="100"
            value={x}
            onChange={(e) => handleChange("x", (e.target as HTMLInputElement).value)}
          />
          <span class="suffix">%</span>
        </div>
        <div class="position-input">
          <label>Y</label>
          <input
            type="number"
            min="0"
            max="100"
            value={y}
            onChange={(e) => handleChange("y", (e.target as HTMLInputElement).value)}
          />
          <span class="suffix">%</span>
        </div>
      </div>
    </div>
  );
}
