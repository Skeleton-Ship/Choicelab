export function AppearanceCustomCSS(props: {
  initial: any;
  update: (key: string, newValues: { [key: string]: any }) => void;
}) {
  console.log(props.initial);
  return <>Custom CSS</>;
}
