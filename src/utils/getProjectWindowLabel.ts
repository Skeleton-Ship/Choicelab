/*
 * Create a unique identifier for the current project window, based on the file path
 */
export function getProjectWindowLabel(
  path: string,
  subtype?: "settings" | "assets"
) {
  path = path.trim();
  let pathStr = path.replace(/[^a-zA-Z0-9-_]/g, "_");
  if (pathStr[0] === "_") {
    pathStr = pathStr.substring(1, pathStr.length);
  }
  let prefix = `project`;
  if (typeof subtype !== "undefined") {
    prefix += `_${subtype}`;
  }
  return `${prefix}_${pathStr}`;
}
