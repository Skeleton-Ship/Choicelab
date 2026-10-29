export default function isObject(
  thisVar: unknown
): thisVar is Record<string, unknown> {
  if (
    typeof thisVar === "object" &&
    !Array.isArray(thisVar) &&
    thisVar !== null
  ) {
    return true;
  }
  return false;
}
