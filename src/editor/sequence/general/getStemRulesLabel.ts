import { Stem, Rule } from "../../../typings";
import { getStore } from "../../../data/dataStore";
import { getVariable } from "../../../data/getData";
import ruleIsValid from "../../inspector/functions/ruleIsValid";

const operatorSigns = {
  string: {
    equals: "is",
    notEquals: "is not",
  },
  boolean: {
    equals: "is",
  },
  number: {
    equals: "=",
    notEquals: "!=",
    greaterThan: ">",
    lessThan: "<",
    greaterThanOrEqualTo: ">=",
    lessThanOrEqualTo: "<=",
  },
};

export default function getStemRulesLabel(stem: Stem): string {
  let labelsStr = "",
    labels: Array<string> = [];
  if (stem.rules.length === 0) {
    return "Rule not set";
  }
  stem.rules.forEach((rule: Rule) => {
    let label = "Rule not set";
    const store = getStore();
    const variable = getVariable(rule.variableId, store);
    // First, figure out if we should just say the rule hasn't been set
    if (!ruleIsValid(rule, store)) {
      labels.push(label);
      return;
    }
    if (!variable) return;
    // Now make a readable statement out of it
    label = "";
    const varName = variable.name;
    label += varName;
    // @ts-ignore
    const operator = operatorSigns[variable.varType][rule.operator];
    label += ` ${operator} `;
    let value = rule.value;
    if (variable.varType === "string") {
      value = `"${value}"`;
    }
    label += ` ${value}`;
    // Finally, push to the labels array
    labels.push(label);
  });
  for (var i = 0; i < labels.length; i++) {
    var label = labels[i];
    if (i !== 0) {
      label = label.charAt(0).toLowerCase() + label.slice(1);
    }
    if (i !== labels.length - 1) {
      label += "; ";
    }
    labelsStr += label;
  }
  return labelsStr;
}
