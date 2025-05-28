import { ActionDef, Cell } from "../../../typings";
import { getPlayerConfig } from "../../../player/getPlayerConfig";
import { getExtendedActionDefs } from "../../../player/getExtendedActionDefs";
import { getCell } from "../../../data/getData";
import { getStore, getViewStore, setStore } from "../../../data/dataStore";
import handleSelectNode from "../../flowchart/selecting/handleSelectNode";
import { v4 as uuidv4 } from "uuid";
type GenericObject = { [key: string]: any };

export default function addAction(actionDef: ActionDef, update: Function) {
  const store = getStore(),
    viewStore = getViewStore();
  const cell: Cell | undefined = getCell(viewStore.selectedNodes[0].id, store);
  if (!cell) return;
  const actionProps: GenericObject = {};
  actionDef.props.forEach((propDef) => {
    if (typeof propDef.default !== "undefined") {
      actionProps[propDef.name] = propDef.default;
    }
  });
  const playerConfig = getPlayerConfig();
  const extendedActionsDefs: any = getExtendedActionDefs();
  const extendedActionDefs = extendedActionsDefs[actionDef.name];
  const extendedProps: any = {};
  if (extendedActionDefs) {
    const extendedPropDefs: any = extendedActionDefs.props;
    if (extendedPropDefs) {
      extendedPropDefs.forEach((propDef: any) => {
        extendedProps[propDef.name] = propDef.default;
      });
    }
  }
  const playerName = playerConfig.id;
  const action = {
    name: actionDef.name,
    id: uuidv4(),
    enabled: true,
    props: actionProps,
    extendedProps: {
      [playerName]: extendedProps,
    },
  };
  cell.actions.push(action);
  setStore(store);
  update();
  handleSelectNode(cell, update);
}
