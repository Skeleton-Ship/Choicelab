import { Rule, Stem, Branch, Variable } from "../../../typings";
import { getVariables, getVariable, getStemRule } from "../../../data/getData";
import { getStore, setStore } from "../../../data/dataStore";
import { deleteStemRuleFromData } from "../../../data/deleteData";

export default function RuleInstance(props: {
  rule: Rule;
  stem: Stem;
  branch: Branch;
  update: Function;
}) {
  // Handle form updates
  function handleChange(
    fieldName: "variableId" | "operator" | "value",
    e: Event
  ) {
    let value: string | number | boolean;
    if (e.target !== null) {
      value = (e.target as HTMLInputElement).value;
    } else {
      return;
    }
    const store = getStore();
    const rule = getStemRule(
      props.rule.id,
      props.stem.id,
      props.branch.id,
      store
    );
    if (!rule) return;
    // Cast value from a string to its correct type
    if (fieldName === "value") {
      const variable: Variable | undefined = getVariable(
        rule.variableId,
        store
      );
      if (!variable) return;
      switch (variable.varType) {
        case "number":
          value = parseFloat(value);
          break;
        case "boolean":
          value = value === "true" ? true : false;
          break;
      }
    }
    // @ts-ignore
    rule[fieldName] = value;
    console.log(rule);
    setStore(store);
    props.update();
  }
  // Delete rule
  function handleDelete() {
    const newStore = deleteStemRuleFromData(
      props.rule.id,
      props.stem.id,
      props.branch.id,
      store
    );
    setStore(newStore);
    props.update();
  }
  const store = getStore();
  // Get a list of variables
  const variables = getVariables(store);
  const varItems: Array<preact.JSX.Element> = [
    <option value="">Variable</option>,
  ];
  variables.forEach((variable: Variable) => {
    const varItem = <option value={variable.id}>{variable.name}</option>;
    varItems.push(varItem);
  });
  // Figure out what the input field and operators should be based on the currently selected variable
  let inputField = <></>,
    operatorItems: Array<preact.JSX.Element> = [];
  // Get the kind of operators for each element
  let thisVar = getVariable(props.rule.variableId, store);
  if (thisVar) {
    const displayValue: any = props.rule.value;
    switch (thisVar.varType) {
      case "string":
        operatorItems = [
          <option value="equals">is</option>,
          <option value="notEquals">is not</option>,
        ];
        inputField = (
          <input
            class="value"
            type="text"
            value={displayValue}
            onChange={(e: Event) => {
              handleChange("value", e);
            }}
          />
        );
        break;
      case "number":
        operatorItems = [
          <option value="equals">=</option>,
          <option value="notEquals">!=</option>,
          <option value="greaterThan">&gt;</option>,
          <option value="lessThan">&lt;</option>,
          <option value="greaterThanOrEqualTo">&gt;=</option>,
          <option value="lessThanOrEqualTo">&lt;=</option>,
        ];
        inputField = (
          <input
            class="value"
            type="number"
            value={displayValue}
            onChange={(e: Event) => {
              handleChange("value", e);
            }}
          />
        );
        break;
      case "boolean":
        operatorItems = [<option value="equals">is</option>];
        inputField = (
          <select
            class="value"
            value={displayValue}
            onChange={(e: Event) => {
              handleChange("value", e);
            }}
          >
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );
        break;
    }
  }
  return (
    <li class="rule">
      <select
        class="variables"
        value={props.rule.variableId}
        onChange={(e) => {
          handleChange("variableId", e);
        }}
      >
        {varItems}
      </select>
      <select
        class="operators"
        value={props.rule.operator}
        onChange={(e) => {
          handleChange("operator", e);
        }}
      >
        {operatorItems}
      </select>
      {inputField}
      <button
        class="delete-rule icon"
        title="Delete Rule"
        onClick={handleDelete}
      >
        <i class="bi bi-dash-circle-fill"></i>
      </button>
    </li>
  );
}
