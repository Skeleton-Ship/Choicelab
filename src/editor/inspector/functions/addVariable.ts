import { Variable } from "../../../typings";
import { getStore, setStore } from "../../../data/dataStore";
import { v4 as uuidv4 } from "uuid";
export default function addVariable(update: Function) {
  const variable: Variable = {
    name: "myVar",
    id: uuidv4(),
    description: "",
    varType: "string",
    startingValue: "",
  };
  // Update data
  const store = getStore();
  store.project.variables.items.push(variable);
  setStore(store);
  update();
}
