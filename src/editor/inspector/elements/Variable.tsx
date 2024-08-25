import { Variable } from "../../../typings";
import { getVariable } from "../../../data/getData";
import { getStore, setStore } from "../../../data/dataStore";
import { deleteVariableFromData } from "../../../data/deleteData";
import IconDelete from "../../../assets/icon-delete.svg";
import NumberField from "./NumberField";

export default function VariableEl(props: {
  instance: Variable;
  update: Function;
}) {
  /*
   * Methods for updating, deleting
   */
  function setVariableName(rawName: string) {
    const components = rawName.split(/[\s\.\-_]/g);
    let newName = "";
    for (var i = 0; i < components.length; i++) {
      var component = components[i];
      if (i === 0) {
        component = component.charAt(0).toLowerCase() + component.slice(1);
      }
      if (i > 0) {
        component = component.charAt(0).toUpperCase() + component.slice(1);
      }
      newName += component;
    }
    newName = newName.replace(/[^a-zA-Z0-9]/g, "");
    return newName;
  }
  function handleDelete() {
    const store = getStore();
    const newStore = deleteVariableFromData(props.instance.id, store);
    setStore(newStore);
    props.update();
  }
  function handleChange(
    field: "name" | "varType" | "description" | "startingValue",
    target: EventTarget | null,
    directValue?: any
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
    let value: any;
    let rawValue = target ? (target as HTMLInputElement).value : null;
    switch (field) {
      case "name":
        if (rawValue) {
          value = setVariableName(rawValue);
        }
        break;
      case "startingValue":
        if (varInStore.varType === "number") {
          if (typeof directValue !== "undefined") {
            value = directValue;
          } else if (rawValue) {
            value = parseFloat(rawValue);
          }
        } else if (varInStore.varType === "boolean") {
          value = rawValue === "true" ? true : false;
        }
        break;
      // If changing var type, reset the value too
      case "varType":
        value = rawValue;
        if (rawValue === "boolean") {
          varInStore.startingValue = true;
        } else if (rawValue === "string") {
          varInStore.startingValue = "";
        }
        break;
      default:
        value = rawValue;
    }
    // Update and save
    varInStore[field] = value;
    setStore(store);
    props.update();
  }

  /*
   * Front-end display
   */
  const variable = props.instance;
  // Get names of fields
  const nameField = `name_${variable.id}`;
  const typeField = `varType_${variable.id}`;
  const descField = `description_${variable.id}`;
  const startingValField = `starting_value_${variable.id}`;
  // Get starting value field based on var type
  const startingValue: any = variable.startingValue; // `any` isn't ideal here, but we're enforcing the type above
  let startingValueInput = (
    <input
      type="text"
      class="ui-text-field"
      value={startingValue}
      onChange={(e) => {
        handleChange("startingValue", e.target);
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
          value={startingValue}
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
    <li class="variable inspector-item">
      <div class="item-toolbar">
        <div class="var-name inspector-prop">
          <label class="aria-only" for={nameField}>
            Name:
          </label>
          <input
            type="text"
            id={nameField}
            class="ui-text-field"
            value={variable.name}
            onChange={(e) => {
              handleChange("name", e.target);
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
            Starting Value:
          </label>
          {startingValueInput}
        </div>
      </div>
      <div class="inspector-prop">
        <label class="break-line" for={descField}>
          Description (optional):
        </label>
        <textarea
          id={descField}
          class="ui-text-area"
          value={variable.description}
          onChange={(e) => {
            handleChange("description", e.target);
          }}
        />
      </div>
    </li>
  );
}
