import { useState, useRef, useEffect, useLayoutEffect } from "preact/hooks";

export function TimingFlag(props: {
  label: string;
  start: number;
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
    props.onChange({ start: percent, end: -1 });
  }

  useEffect(() => {
    setPercent(props.start);
  }, [props.start]);

  // final CSS left: percent of the *current* parentWidth
  const leftPx = (percent / 100) * parentWidth;

  return (
    <button
      class="timing-flag"
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
