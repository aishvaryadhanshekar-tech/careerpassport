import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import "./inspector-resize.css";

const MIN_WIDTH = 340;
const MIN_CANVAS_WIDTH = 280;
const KEYBOARD_STEP = 24;

export function InspectorResizeHandle({
  onWidthChange,
  width,
}: {
  onWidthChange: (width: number) => void;
  width?: number;
}) {
  const handleRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; x: number; width: number } | null>(null);
  const restoreSelectionRef = useRef<(() => void) | null>(null);
  const [bounds, setBounds] = useState({ current: width ?? MIN_WIDTH, max: MIN_WIDTH });
  const [dragging, setDragging] = useState(false);

  function measurements() {
    const inspector = handleRef.current?.parentElement;
    const workspace = inspector?.parentElement;
    return {
      current: inspector?.getBoundingClientRect().width ?? width ?? MIN_WIDTH,
      max: Math.max(MIN_WIDTH, (workspace?.getBoundingClientRect().width ?? 620) - MIN_CANVAS_WIDTH),
    };
  }

  useEffect(() => {
    const inspector = handleRef.current?.parentElement;
    if (!inspector) return;
    const measure = () => {
      const current = inspector.getBoundingClientRect().width;
      const available = inspector.parentElement?.getBoundingClientRect().width ?? 620;
      setBounds({ current, max: Math.max(MIN_WIDTH, available - MIN_CANVAS_WIDTH) });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(inspector);
    if (inspector.parentElement) observer.observe(inspector.parentElement);
    measure();
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => restoreSelectionRef.current?.(), []);

  function resize(requested: number) {
    const limits = measurements();
    onWidthChange(Math.round(Math.max(MIN_WIDTH, Math.min(limits.max, requested))));
  }

  function stopDrag() {
    dragRef.current = null;
    restoreSelectionRef.current?.();
    restoreSelectionRef.current = null;
    setDragging(false);
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || dragRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, width: measurements().current };
    const body = document.body;
    const selection = body.style.userSelect;
    const cursor = body.style.cursor;
    body.style.userSelect = "none";
    body.style.cursor = "col-resize";
    restoreSelectionRef.current = () => {
      body.style.userSelect = selection;
      body.style.cursor = cursor;
    };
    setDragging(true);
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    resize(drag.width + drag.x - event.clientX);
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerId !== dragRef.current?.pointerId) return;
    stopDrag();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function keyboardResize(event: KeyboardEvent<HTMLDivElement>) {
    const limits = measurements();
    const targets: Record<string, number> = {
      ArrowLeft: limits.current + KEYBOARD_STEP,
      ArrowRight: limits.current - KEYBOARD_STEP,
      Home: MIN_WIDTH,
      End: limits.max,
    };
    const requested = targets[event.key];
    if (requested === undefined) return;
    event.preventDefault();
    event.stopPropagation();
    resize(requested);
  }

  return (
    <div
      ref={handleRef}
      className={`inspector-resize-handle${dragging ? " is-resizing" : ""}`}
      role="separator"
      tabIndex={0}
      aria-label="Resize details panel"
      aria-orientation="vertical"
      aria-valuemin={MIN_WIDTH}
      aria-valuemax={Math.round(bounds.max)}
      aria-valuenow={Math.round(Math.min(bounds.max, Math.max(MIN_WIDTH, bounds.current)))}
      aria-valuetext={`${Math.round(bounds.current)} pixels wide`}
      title="Drag to resize · Left and right arrows adjust width"
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={stopDrag}
      onKeyDown={keyboardResize}
    />
  );
}
