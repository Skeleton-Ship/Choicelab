export default function ActionPane(props: { update: Function }) {
  console.log(props);
  return (
    <div id="action-pane" class="pane right">
      <div class="resizer"></div>
      Action pane
    </div>
  );
}
