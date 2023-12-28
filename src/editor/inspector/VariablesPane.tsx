import { Variable } from "../../typings";
import { getStore } from "../../data/dataStore";
import VariableEl from "./elements/Variable";
import addVariable from "./functions/addVariable";

export default function VariablesPane(props: { update: Function }) {
  function handleCreateVariable() {
    addVariable(props.update);
  }
  const store = getStore();
  const variables = store.project.variables.items;
  const varEls: Array<preact.JSX.Element> = [];
  variables.forEach((variable: Variable) => {
    const key = `var_${variable.id}`;
    const varEl = (
      <VariableEl key={key} instance={variable} update={props.update} />
    );
    varEls.push(varEl);
  });
  return (
    <>
      <div id="variables-toolbar">
        <button onClick={handleCreateVariable}>New Variable</button>
      </div>
      <ul id="variables-list">{varEls}</ul>
    </>
  );
}
