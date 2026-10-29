/*
 * Force a style reflow on Safari to correct CSS Grid selectors
 */
export function forceReflow() {
  const el = document.querySelector<HTMLElement>(".cl-stage");
  if (!el) return;
  el.style.setProperty("--safari-hack", "1");
  requestAnimationFrame(() => {
    el.style.setProperty("--safari-hack", "0");
  });
}
