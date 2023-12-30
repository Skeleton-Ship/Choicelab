import { Variable, Rule, Store } from "../../../typings";
import { getVariable } from "../../../data/getData";

export default function ruleIsValid(rule: Rule, store: Store): boolean {
  const variable: Variable | undefined = getVariable(rule.variableId, store);
  if (!variable) {
    return false;
  }
  if (
    rule.variableId === "" ||
    rule.operator === "" ||
    (rule.value === "" && variable.varType !== "string")
  ) {
    return false;
  }
  return true;
}
