import { Variable } from "../typings";

/*
 * Variable names are free-form text: the player references variables by ID,
 * so a name is only a label for the author. A few characters are reserved for
 * a possible future condition syntax (operators, quoted values, and/or, and
 * inserting variables into text), and are converted to "-".
 */
const RESERVED_CHARS = /[<>!=()[\]{}*#@"&|]/g;

/** Replaces reserved characters, collapses runs of whitespace, and trims. */
export function sanitizeVariableName(rawName: string): string {
  return rawName.replace(RESERVED_CHARS, "-").replace(/\s+/g, " ").trim();
}

function nameKey(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Returns a sanitized name that doesn't match (case-insensitively) any other
 * variable's name. A conflicting name gets a numeric suffix, starting at 2
 * ("Score" → "Score 2"). A blank name becomes "Variable [#]", numbered by how
 * many variables exist, and incremented past any conflict.
 *
 * @param excludeId - The ID of the variable being renamed, so it doesn't
 *                    conflict with itself.
 */
export function resolveVariableName(
  rawName: string,
  variables: Variable[],
  excludeId?: string
): string {
  const others = variables.filter((v) => v.id !== excludeId);
  const taken = new Set(others.map((v) => nameKey(v.name)));
  const name = sanitizeVariableName(rawName);
  if (name === "") {
    // Count includes the variable being named, whether or not it's in the list yet
    let n = others.length + 1;
    while (taken.has(nameKey(`Variable ${n}`))) n++;
    return `Variable ${n}`;
  }
  if (!taken.has(nameKey(name))) return name;
  let n = 2;
  while (taken.has(nameKey(`${name} ${n}`))) n++;
  return `${name} ${n}`;
}
