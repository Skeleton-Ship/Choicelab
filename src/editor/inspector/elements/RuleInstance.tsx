import { useState, useEffect } from "preact/hooks";
import { Rule, Stem, Branch, Variable } from "../../../typings";
import { getVariables, getVariable, getStemRule } from "../../../data/getData";
import { getStore, setStore, getViewStore, setViewStore } from "../../../data/dataStore";
import { deleteStemRuleFromData } from "../../../data/deleteData";
import { setMenu } from "../../../menu/setMenu";
import NumberField from "./NumberField";

export default function RuleInstance(props: {
  rule: Rule;
  stem: Stem;
  branch: Branch;
  index: number;
  update: Function;
}) {
  const [localValue, setLocalValue] = useState(props.rule.value as string);
  useEffect(() => {
    setLocalValue(props.rule.value as string);
  }, [props.rule.value]);

  /*
   * Rule functions
   */

  // Handle form updates
  function handleChange(
    fieldName: "variableId" | "operator" | "value",
    e: Event | null,
    varName?: string,
    directValue?: any
  ) {
    let value: string | number | boolean;
    if (e !== null && e.target !== null) {
      value = (e.target as HTMLInputElement).value;
    } else {
      if (typeof directValue !== "undefined") {
        value = directValue;
      } else {
        return;
      }
    }
    const store = getStore();
    const rule = getStemRule(
      props.rule.id,
      props.stem.id,
      props.branch.id,
      store
    );
    if (!rule) return;
    // Cast value to its correct type before comparing
    if (fieldName === "value") {
      if (!varName) {
        console.error("No variable name provided; value cannot be re-cast.");
        return;
      }
      const variable = getVariable(varName, store);
      if (variable?.varType === "boolean") {
        value = value === "true" ? true : false;
      }
    }
    // @ts-ignore
    if (rule[fieldName] === value) return;
    // If changing variable, clear the existing operator/value and set sensible defaults
    if (fieldName === "variableId" && !directValue) {
      rule.operator = "";
      rule.value = "";
      let variable: Variable | undefined;
      if (typeof value === "string") {
        variable = getVariable(value, store);
      }
      if (variable) {
        switch (variable.varType) {
          case "string":
            rule.operator = "equals";
            break;
          case "boolean":
            rule.operator = "equals";
            rule.value = true;
            break;
          case "number":
            rule.operator = "equals";
            break;
        }
      }
    }
    // @ts-ignore
    rule[fieldName] = value;
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

  /*
   * Front-end
   */
  const store = getStore();
  // Get a list of variables
  const variables = getVariables(store);
  const varItems: Array<preact.JSX.Element> = [
    <option value="">Select Variable...</option>,
  ];
  variables.forEach((variable: Variable) => {
    const varItem = <option value={variable.id}>{variable.name}</option>;
    varItems.push(varItem);
  });
  let rule: Rule | undefined = props.rule;
  // If we have a variable BUT that variable does not exist, clear it
  if (
    props.rule.variableId !== "" &&
    !getVariable(props.rule.variableId, store)
  ) {
    rule = getStemRule(props.rule.id, props.stem.id, props.branch.id, store);
    if (rule) {
      rule.variableId = "";
      rule.operator = "";
      rule.value = "";
      setStore(store);
      props.update(false, false);
    }
  }
  if (!rule) {
    return <p>Rule not found.</p>;
  }
  const viewStore = getViewStore();
  // Figure out what the input field and operators should be based on the currently selected variable
  let inputField = <></>,
    operatorItems: Array<preact.JSX.Element> = [];
  // Get the kind of operators for each element
  let thisVar = getVariable(rule.variableId, store);
  const fieldName = `input_${rule.id}`;
  if (thisVar) {
    const displayValue: any = rule.value;
    switch (thisVar.varType) {
      case "string":
        operatorItems = [
          <option value="equals">is</option>,
          <option value="notEquals">is not</option>,
        ];
        inputField = (
          <input
            name={fieldName}
            class="value ui-text-field"
            type="text"
            placeholder="empty"
            value={localValue}
            onFocus={() => {
              viewStore.inTextElement = true;
              setViewStore(viewStore);
              props.update(false, false);
              setMenu();
            }}
            onBlur={(e: Event) => {
              viewStore.inTextElement = false;
              setViewStore(viewStore);
              handleChange("value", e, rule.variableId);
            }}
            onChange={(e: Event) => {
              setLocalValue((e.target as HTMLInputElement).value);
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
          <NumberField
            name={fieldName}
            class="value"
            value={displayValue}
            decimalPlaces={2}
            onChange={(value: number) => {
              handleChange("value", null, rule.variableId, value);
            }}
          />
        );
        break;
      case "boolean":
        operatorItems = [<option value="equals">is</option>];
        inputField = (
          <div class="value ui-dropdown">
            <select
              name={fieldName}
              value={displayValue}
              onChange={(e: Event) => {
                handleChange("value", e, rule.variableId);
              }}
            >
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
          </div>
        );
        break;
    }
  }
  // Only show delete button for rules > 0
  // (This isn't strictly necessary, it's just a better UI)
  const deleteButton =
    props.index > 0 ? (
      <button
        class="delete-rule icon"
        title="Delete Rule"
        onClick={handleDelete}
      >
        <i class="bi bi-dash-circle-fill"></i>
      </button>
    ) : (
      ""
    );
  return (
    <li class="rule">
      <div class="variables ui-dropdown">
        <select
          value={rule.variableId}
          onChange={(e) => {
            handleChange("variableId", e);
          }}
        >
          {varItems}
        </select>
      </div>
      <div class="operators ui-dropdown">
        <select
          value={rule.operator}
          onChange={(e) => {
            handleChange("operator", e);
          }}
        >
          {operatorItems}
        </select>
      </div>
      {inputField}
      {deleteButton}
    </li>
  );
}
