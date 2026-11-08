import { useState, useEffect, useRef } from "preact/hooks";
import { ask } from "@tauri-apps/plugin-dialog";
import {
  Variable,
  VariableType,
  VariableValue,
  UpdateFunction,
} from "../../../typings";
import { getVariable } from "../../../data/getData";
import {
  getStore,
  setStore,
  getViewStore,
  setViewStore,
} from "../../../data/dataStore";
import { deleteVariableFromData } from "../../../data/deleteData";
import { resolveVariableName } from "../../../data/variableNames";
import {
  countVariableUses,
  describeVariableUses,
} from "../../../data/variableUses";
import { getDialogText } from "../../../utils/dialogText";
import { setMenu } from "../../../menu/setMenu";
import { useScrollToNewItem } from "../functions/scrollToNewItem";
import IconDelete from "../../../assets/icons/mono/icon-delete.svg";
import NumberField from "./NumberField";

export default function VariableEl(props: {
  instance: Variable;
  update: UpdateFunction;
}) {
  /*
   * Methods for updating, deleting
   */
  async function handleDelete() {
    // Warn before deleting a variable that's in use
    const usesText = describeVariableUses(
      countVariableUses(props.instance.id, getStore())
    );
    if (usesText) {
      const text = getDialogText(
        "Delete variable?",
        `"${props.instance.name}" is used in ${usesText}.`,
        "Are you sure you want to delete this variable?"
      );
      const confirmed = await ask(text.message, {
        title: text.title,
        kind: "warning",
        okLabel: `Delete "${props.instance.name}"`,
        cancelLabel: "Cancel",
      });
      if (!confirmed) return;
    }
    // Re-read the store, since it may have changed while the dialog was open
    const store = getStore();
    const newStore = deleteVariableFromData(props.instance.id, store);
    setStore(newStore);
    props.update();
  }
  function handleChange(
    field: "name" | "varType" | "description" | "startingValue",
    target: EventTarget | null,
    directValue?: number
  ) {
    // Get var in store
    const store = getStore();
    const varInStore: Variable | undefined = getVariable(
      props.instance.id,
      store
    );
    if (!varInStore) {
      console.error("Variable not found in store.");
      return;
    }
    // Figure out what kind of change we're making, and cast values as needed
    const rawValue = target ? (target as HTMLInputElement).value : "";
    switch (field) {
      case "name": {
        const name = resolveVariableName(
          rawValue,
          store.project.variables.items,
          varInStore.id
        );
        // Show the resolved name even when it matches the stored one
        // (e.g. after trimming), since the field still holds the raw text
        setLocalName(name);
        if (varInStore.name === name) return;
        varInStore.name = name;
        break;
      }
      case "description":
        if (varInStore.description === rawValue) return;
        varInStore.description = rawValue;
        break;
      case "varType": {
        const varType = rawValue as VariableType;
        if (varInStore.varType === varType) return;
        // Reset the starting value to a sensible default
        if (varType === "boolean") varInStore.startingValue = true;
        else if (varType === "string") varInStore.startingValue = "";
        else if (varType === "number") varInStore.startingValue = 0;
        varInStore.varType = varType;
        break;
      }
      case "startingValue": {
        let startingValue: VariableValue | undefined;
        if (varInStore.varType === "number") {
          if (typeof directValue !== "undefined") {
            startingValue = directValue;
          } else if (rawValue) {
            startingValue = parseFloat(rawValue);
          }
        } else if (varInStore.varType === "boolean") {
          startingValue = rawValue === "true";
        } else {
          startingValue = rawValue;
        }
        if (typeof startingValue === "undefined") return;
        if (varInStore.startingValue === startingValue) return;
        varInStore.startingValue = startingValue;
        break;
      }
    }
    setStore(store);
    props.update();
  }

  /*
   * Front-end display
   */
  const variable = props.instance;
  const itemRef = useRef<HTMLLIElement>(null);
  useScrollToNewItem(variable.id, itemRef, ".var-name input");
  const [localName, setLocalName] = useState(variable.name);
  useEffect(() => {
    setLocalName(variable.name);
  }, [variable.name]);
  const [localDescription, setLocalDescription] = useState(
    variable.description ?? ""
  );
  useEffect(() => {
    setLocalDescription(variable.description ?? "");
  }, [variable.description]);
  // Get names of fields
  const nameField = `name_${variable.id}`;
  const typeField = `varType_${variable.id}`;
  const descField = `description_${variable.id}`;
  const startingValField = `starting_value_${variable.id}`;
  // Get starting value field based on var type
  const startingValue = variable.startingValue;
  const stringStartingValue =
    variable.varType === "string" ? String(startingValue ?? "") : "";
  const [localStartingValue, setLocalStartingValue] =
    useState(stringStartingValue);
  useEffect(() => {
    setLocalStartingValue(stringStartingValue);
  }, [stringStartingValue]);
  const viewStore = getViewStore();
  let startingValueInput = (
    <input
      type="text"
      class="ui-text-field"
      value={localStartingValue}
      autoCorrect="off"
      onFocus={() => {
        viewStore.inTextElement = true;
        setViewStore(viewStore);
        props.update(false, false);
        setMenu();
      }}
      onBlur={(e) => {
        viewStore.inTextElement = false;
        setViewStore(viewStore);
        handleChange("startingValue", e.target);
      }}
      onChange={(e) => {
        setLocalStartingValue((e.target as HTMLInputElement).value);
      }}
    />
  );
  if (variable.varType === "number") {
    startingValueInput = (
      <NumberField
        name={startingValField}
        value={startingValue}
        decimalPlaces={2}
        onChange={(value: number) => {
          handleChange("startingValue", null, value);
        }}
      />
    );
  } else if (variable.varType === "boolean") {
    startingValueInput = (
      <div class="ui-dropdown">
        <select
          id={startingValField}
          value={String(startingValue)}
          onChange={(e) => {
            handleChange("startingValue", e.target);
          }}
        >
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      </div>
    );
  }
  /*
   * Return JSX
   */
  return (
    <li class="variable inspector-item" ref={itemRef}>
      <div class="item-toolbar">
        <div class="var-name inspector-prop">
          <label class="aria-only" for={nameField}>
            Name:
          </label>
          <input
            type="text"
            id={nameField}
            class="ui-text-field"
            autoCorrect="off"
            value={localName}
            onFocus={() => {
              viewStore.inTextElement = true;
              setViewStore(viewStore);
              props.update(false, false);
              setMenu();
            }}
            onBlur={(e) => {
              viewStore.inTextElement = false;
              setViewStore(viewStore);
              handleChange("name", e.target);
            }}
            onChange={(e) => {
              setLocalName((e.target as HTMLInputElement).value);
            }}
          />
        </div>
        <div class="controls">
          <button class="icon" onClick={handleDelete} title="Delete Variable">
            <img src={IconDelete} />
          </button>
        </div>
      </div>
      <div class="field-group two-col">
        <div class="inspector-prop">
          <label class="break-line" for={typeField}>
            Type:
          </label>
          <div class="ui-dropdown">
            <select
              id={typeField}
              value={variable.varType}
              onChange={(e) => {
                handleChange("varType", e.target);
              }}
            >
              <option value="string">String</option>
              <option value="boolean">Boolean</option>
              <option value="number">Number</option>
            </select>
          </div>
        </div>
        <div class="inspector-prop">
          <label class="break-line" for={startingValField}>
            Starting Value
            {/* Booleans always have a starting value, so it isn't optional */}
            {variable.varType !== "boolean" && (
              <>
                {" "}
                <span class="optional">(optional)</span>
              </>
            )}
            :
          </label>
          {startingValueInput}
        </div>
      </div>
      <div class="inspector-prop">
        <label class="break-line" for={descField}>
          Description <span class="optional">(optional)</span>:
        </label>
        <textarea
          id={descField}
          class="ui-text-area"
          value={localDescription}
          onFocus={() => {
            viewStore.inTextElement = true;
            setViewStore(viewStore);
            props.update(false, false);
            setMenu();
          }}
          onBlur={(e) => {
            viewStore.inTextElement = false;
            setViewStore(viewStore);
            handleChange("description", e.target);
          }}
          onChange={(e) => {
            setLocalDescription((e.target as HTMLInputElement).value);
          }}
        />
      </div>
    </li>
  );
}
