import { Variable } from "../../../typings";

export default function VariableEl(props: {
  instance: Variable;
  update: Function;
}) {
  const variable = props.instance;
  const nameField = `name_${variable.id}`;
  const typeField = `varType_${variable.id}`;
  const descField = `description_${variable.description}`;
  return (
    <li class="variable">
      <div>
        <label for={nameField}>Name:</label>
        <input type="text" id={nameField} value={variable.name} />
      </div>
      <div>
        <label for={descField}>Description:</label>
        <input type="text" id={descField} value={variable.description} />
      </div>
      <div>
        <label for={typeField}>Type:</label>
        <select id={typeField} value={variable.varType}>
          <option value="string">String</option>
          <option value="boolean">Boolean</option>
          <option value="number">Number</option>
        </select>
      </div>
    </li>
  );
}
