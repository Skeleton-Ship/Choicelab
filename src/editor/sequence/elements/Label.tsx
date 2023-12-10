import { useState } from "react";
import { getNode, getBranchStem } from "../../../data/getData";
import { getStore, getProject } from "../../../data/dataStore";

/**
 * An editable text field element used in cells, branches, and branch stems.
 *
 * @param {string} nodeId - The ID of the parent element.
 * @param {string} text - The text value that should display in the field.
 * @param {string} stemId - The ID of the stem, if applicable.
 * @param {string} placeholder - The default text if there is no set value.
 * @param {string} textProp - The property in the node object that the label corresponds to. Can be a single property, or nested one level.
 * @param {Function} setProjectData - A React handler that traverses back to the app root, triggering a refresh.
 */
export default function Label(props: {
  nodeId: string;
  text: string;
  stemId?: string;
  placeholder?: string;
  textProp?: string;
  setProjectData: Function;
}) {
  const projectData = getProject();
  const [previousLabelValue, setPreviousLabelValue] = useState(props.text);
  function handleLabelChange(e: any) {
    let thisItem: any = getNode(props.nodeId, projectData);
    if (props.stemId) {
      thisItem = getBranchStem(props.stemId, props.nodeId, projectData);
    }
    // Figure out what prop we're setting in the data
    if (props.textProp) {
      let textPropParts = props.textProp?.split(".");
      if (textPropParts.length === 1) {
        thisItem[props.textProp] = e.target.value;
      }
      if (textPropParts.length === 2) {
        thisItem[textPropParts[0]][textPropParts[1]] = e.target.value;
      }
    } else {
      // default to `label`
      thisItem.label = e.target.value;
    }
    props.setProjectData(projectData, false);
  }
  function makeLabelReadonly(e: any) {
    const el = e.target;
    el.readOnly = true;
  }
  function makeLabelEditable(e: any) {
    const el = e.target;
    setPreviousLabelValue(el.value);
    el.readOnly = false;
    el.select();
    document.addEventListener("keypress", function myKeyListener(e) {
      if (e.key === "Return" || e.key === "Enter") {
        el.blur();
        document.removeEventListener("keypress", myKeyListener);
      }
    });
  }
  const placeholder = props.placeholder || "";
  return (
    <input
      type="text"
      className="label"
      value={props.text}
      readOnly={true}
      placeholder={placeholder}
      onDoubleClick={makeLabelEditable}
      onChange={handleLabelChange}
      onBlur={(e) => {
        makeLabelReadonly(e);
        if (e.target.value !== previousLabelValue) {
          props.setProjectData(projectData);
        }
      }}
    />
  );
}
