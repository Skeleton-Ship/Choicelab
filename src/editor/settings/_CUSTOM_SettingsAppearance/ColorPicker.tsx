export function ColorPicker(props: {
  initial: string;
  update: (value: string) => void;
}) {
  function handleChange(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    if (value === props.initial) return;
    props.update(value);
  }
  return (
    <div class="ui-color-picker">
      <label class="sr-only">Color:</label>
      <input type="color" value={props.initial} onChange={handleChange} />
      <input
        type="text"
        class="ui-text-field"
        value={props.initial}
        onChange={handleChange}
      />
    </div>
  );
}
