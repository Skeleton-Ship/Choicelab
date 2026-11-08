import { RefObject } from "preact";
import { useEffect } from "preact/hooks";

/*
 * Scrolls a newly added inspector item (variable, rule) into view. The code
 * that adds the item marks its ID; the item's component checks for the mark
 * when it mounts, so it scrolls once and only when freshly added.
 */
let pendingId: string | null = null;

export function markNewInspectorItem(id: string) {
  pendingId = id;
}

/**
 * @param focusSelector - Optional selector, within the item, for an element to
 *                        focus (and select, if it's a text field) after scrolling.
 */
export function useScrollToNewItem(
  id: string,
  ref: RefObject<HTMLElement | null>,
  focusSelector?: string
) {
  useEffect(() => {
    if (pendingId !== id) return;
    pendingId = null;
    const el = ref.current;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    if (!focusSelector) return;
    const focusTimer = setTimeout(() => {
      const target = el.querySelector<HTMLElement>(focusSelector);
      target?.focus();
      if (target instanceof HTMLInputElement) target.select();
    }, 300);
    return () => clearTimeout(focusTimer);
  }, []);
}
