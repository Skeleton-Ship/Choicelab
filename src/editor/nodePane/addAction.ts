import { ActionDef, Cell } from "../../typings";
import { getCell } from "../../data/getData";
import { getStore, setStore } from "../../data/dataStore";
import handleSelectNode from "../sequence/selecting/handleSelectNode";
import { v4 as uuidv4 } from "uuid";
type GenericObject = { [key: string]: any };

export default function addAction(actionDef: ActionDef, update: Function) {
  const store = getStore();
  const cell: Cell | undefined = getCell(store.selectedNodes[0].id, store);
  if (!cell) return;
  const actionProps: GenericObject = {};
  actionDef.props.forEach((propDef) => {
    if (typeof propDef.default !== "undefined") {
      actionProps[propDef.name] = propDef.default;
    }
  });
  const action = {
    name: actionDef.name,
    id: uuidv4(),
    props: actionProps,
  };
  cell.actions.push(action);
  setStore(store);
  update();
  handleSelectNode(cell, update);
}
