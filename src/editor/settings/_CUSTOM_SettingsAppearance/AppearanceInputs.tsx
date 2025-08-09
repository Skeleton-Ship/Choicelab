export function AppearanceBackground(props: {
  initial: any;
  update: (key: string, value: string) => void;
}) {
  console.log(props.initial);
  return <>Background</>;
}
