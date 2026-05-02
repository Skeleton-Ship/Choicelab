export function dirname(p: string) {
  return p.replace(/\/[^\/]+\/?$/, "") || ".";
}
