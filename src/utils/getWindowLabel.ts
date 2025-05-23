export function getWindowLabel(path: string) {
  return `project_${path.replace(/[^a-zA-Z0-9-_]/g, "-")}`;
}
