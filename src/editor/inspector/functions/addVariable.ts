import { Variable, UpdateFunction } from "../../../typings";
import { getStore, setStore } from "../../../data/dataStore";
import { resolveVariableName } from "../../../data/variableNames";
import { markNewInspectorItem } from "./scrollToNewItem";
import { v4 as uuidv4 } from "uuid";
export default function addVariable(update: UpdateFunction) {
  const store = getStore();
  const variable: Variable = {
    name: resolveVariableName("New Variable", store.project.variables.items),
    id: uuidv4(),
    description: "",
    varType: "string",
    startingValue: "",
  };
  // Update data
  store.project.variables.items.push(variable);
  setStore(store);
  markNewInspectorItem(variable.id);
  update();
}
