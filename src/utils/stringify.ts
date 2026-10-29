export function stringify(obj: unknown): string {
  return JSON.stringify(obj, null, 2);
}
