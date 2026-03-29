import type { FunctionComponent } from "preact";
import type { SVGProps } from "preact/compat";

const svgComponents = import.meta.glob("../../assets/icons/color/Icon-*.svg", {
  eager: true,
  query: "?react",
  import: "default",
}) as Record<string, FunctionComponent<SVGProps<SVGSVGElement>>>;

type ColorIconState = "" | "Inactive" | "Disabled";

export interface ColorIconProps {
  size?: number;
  darkMode?: boolean;
  state?: ColorIconState;
  class?: string;
}

function makeIcon(
  name: string,
  meta: { hasDarkMode?: true; states?: ColorIconState[] } = {}
): FunctionComponent<ColorIconProps> {
  return ({ size = 66, darkMode = false, state = "" }: ColorIconProps) => {
    const stateSuffix = meta.states?.includes(state) ? `-${state}` : "";
    const darkModeSuffix = meta.hasDarkMode && darkMode ? "-DarkMode" : "";
    const key = `../../assets/icons/color/Icon-${name}${stateSuffix}${darkModeSuffix}.svg`;
    const Svg = svgComponents[key];
    return <Svg width={size} height={size} className="color-icon" />;
  };
}

export const GearIcon = makeIcon("Gear");
export const LightningIcon = makeIcon("Lightning", { states: ["Inactive"] });
export const NewBranchIcon = makeIcon("NewBranch", { hasDarkMode: true });
export const NewCellIcon = makeIcon("NewCell", { hasDarkMode: true });
export const PaintbrushIcon = makeIcon("Paintbrush");
export const PlayIcon = makeIcon("Play", { states: ["Inactive"] });
export const VariablesIcon = makeIcon("Variables", {
  states: ["Inactive"],
  hasDarkMode: true,
});
