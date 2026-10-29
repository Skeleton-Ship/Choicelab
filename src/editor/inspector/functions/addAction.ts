import { Action, ActionDef, Cell } from "../../../typings";
import { getCell } from "../../../data/getData";
import { getStore, getViewStore, setStore } from "../../../data/dataStore";
import { applyActionDefaults } from "../../../data/actionProps";
import handleSelectNode from "../../flowchart/selecting/handleSelectNode";
import { v4 as uuidv4 } from "uuid";

export default function addAction(actionDef: ActionDef, update: Function) {
  const store = getStore(),
    viewStore = getViewStore();
  const cell: Cell | undefined = getCell(viewStore.selectedNodes[0].id, store);
  if (!cell) return;
  // Props are filled from the def, which is what makes them match the action's typed props
  const action = {
    name: actionDef.name,
    id: uuidv4(),
    enabled: true,
    props: {},
  } as Action;
  applyActionDefaults(action, actionDef);
  cell.actions.push(action);
  setStore(store);
  update();
  handleSelectNode(cell, update);
  return action.id;
}
