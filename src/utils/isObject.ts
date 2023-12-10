export default function isObject(thisVar: any): boolean {
  if (
    typeof thisVar === "object" &&
    !Array.isArray(thisVar) &&
    thisVar !== null
  ) {
    return true;
  }
  return false;
}
