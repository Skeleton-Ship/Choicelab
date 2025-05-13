import { useState, useRef, useEffect, useLayoutEffect } from "preact/hooks";

export function TimingFlag(props: {
  label: string;
  start: number;
  parentActionId: string;
  onChange: (timing: { start: number; end: number }) => void;
}) {
  const elRef = useRef<HTMLButtonElement>(null);

  // current percent position (0–100)
  const [percent, setPercent] = useState(props.start);
  // current parent width in px
  const [parentWidth, setParentWidth] = useState(0);

  // dragging state + refs to compute deltas
  const [dragging, setDragging] = useState(false);
  const initialXRef = useRef(0);
  const initialPctRef = useRef(props.start);
  const initialWidthRef = useRef(0);

  // 1) Observe parent size changes & keep parentWidth up-to-date
  useLayoutEffect(() => {
    const parent = elRef.current?.parentElement;
    if (!parent) return;

    // set initial width immediately
    setParentWidth(parent.getBoundingClientRect().width);

    const ro = new ResizeObserver(([entry]) => {
      setParentWidth(entry.contentRect.width);
    });
    ro.observe(parent);
    return () => ro.disconnect();
  }, []);

  function handlePointerDown(e: PointerEvent) {
    e.preventDefault();
    if (!elRef.current) return;

    const parent = elRef.current.parentElement;
    if (parent) {
      parent.querySelectorAll(".timing-flag").forEach((el) => {
        const flag = el as HTMLButtonElement;
        flag.style.zIndex = "10";
      });
    }
    elRef.current.style.zIndex = "100";
    // capture where we started
    initialXRef.current = e.clientX;
    initialPctRef.current = percent;
    initialWidthRef.current = parentWidth;

    // capture pointer so moves/up still fire
    elRef.current.setPointerCapture(e.pointerId);
    setDragging(true);
  }

  function handlePointerMove(e: PointerEvent) {
    if (!dragging || !elRef.current) return;

    const dx = e.clientX - initialXRef.current;
    const startPx = (initialPctRef.current / 100) * initialWidthRef.current;
    let newPx = startPx + dx;

    // clamp within [0, initialWidth]
    newPx = Math.max(0, Math.min(newPx, initialWidthRef.current));

    const newPctRaw = (newPx / initialWidthRef.current) * 100;
    const newPct = Math.round(newPctRaw * 100) / 100; // round to 2 decimal places

    // only update if change is significant
    if (Math.abs(newPct - percent) >= 0.01) {
      setPercent(newPct);
    }
  }

  function handlePointerUp(e: PointerEvent) {
    if (!dragging || !elRef.current) return;
    endDrag(e);
  }

  function endDrag(e: PointerEvent) {
    setDragging(false);
    elRef.current?.releasePointerCapture(e.pointerId);
    if (props.start !== percent) {
      props.onChange({ start: percent, end: -1 });
    }
  }

  // Sync percent when props.start changes
  useEffect(() => {
    setPercent(props.start);
  }, [props.start]);

  // Update sibling flags' intersections
  useEffect(() => {
    const flags = Array.from(
      document.querySelectorAll(
        `.timing-flag[data-parent-action="${props.parentActionId}"]`
      )
    );

    // Utility: check if two rectangles overlap
    function isOverlapping(rect1: DOMRect, rect2: DOMRect) {
      return !(
        rect1.right < rect2.left ||
        rect1.left > rect2.right ||
        rect1.bottom < rect2.top ||
        rect1.top > rect2.bottom
      );
    }

    // Clear previous data
    flags.forEach((flag) => flag.removeAttribute("data-overlap"));

    // Build clusters of overlapping elements using DFS
    const visited = new Set<Element>();
    const clusters: Element[][] = [];

    for (let i = 0; i < flags.length; i++) {
      const start = flags[i];
      if (visited.has(start)) continue;

      const cluster: Element[] = [];
      const stack = [start];

      while (stack.length > 0) {
        const current = stack.pop()!;
        if (visited.has(current)) continue;

        visited.add(current);
        cluster.push(current);

        const rect1 = current.getBoundingClientRect();

        for (let j = 0; j < flags.length; j++) {
          const other = flags[j];
          if (current === other || visited.has(other)) continue;

          const rect2 = other.getBoundingClientRect();
          if (isOverlapping(rect1, rect2)) {
            stack.push(other);
          }
        }
      }

      // Only store clusters with >1 overlapping element
      if (cluster.length > 1) {
        clusters.push(cluster);
      }
    }

    // Assign overlap indices within each cluster
    clusters.forEach((cluster) => {
      cluster.forEach((el, i) => {
        el.setAttribute("data-overlap", (i + 1).toString());
      });
    });
  });

  // final CSS left: percent of the *current* parentWidth
  const leftPx = (percent / 100) * parentWidth;

  return (
    <button
      class="timing-flag"
      data-parent-action={props.parentActionId}
      ref={elRef}
      style={{ left: `${leftPx}px` }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <span>{props.label}</span>
    </button>
  );
}
