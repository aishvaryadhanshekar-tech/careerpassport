import { useEffect, useRef, useState } from "react";
import { useReactFlow, useViewport } from "@xyflow/react";
import type { FunnelNode } from "./funnelModel";

export type CanvasChatMessage = { role: "user" | "assistant"; text: string };

/**
 * The selected node's AI button, anchored beside it as the canvas moves. The conversation
 * itself lives in the docked hiring assistant; this only points it at the node.
 */
export function CanvasNodeAssistant({ item, position, onOpen }: {
  item: FunnelNode; position: { x: number; y: number }; onOpen: () => void;
}) {
  const { x, y, zoom } = useViewport();
  const flow = useReactFlow();
  const root = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 900, height: 600 });
  useEffect(() => {
    const surface = root.current?.closest(".react-flow");
    if (!surface) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(surface);
    return () => observer.disconnect();
  }, []);
  const nodeWidth = flow.getNode(item.id)?.measured?.width ?? (["job", "stage"].includes(item.kind) ? 280 : 240);
  // Reserve the bottom toolbar rows so the button never sits under the block toolbar or reset.
  const toolbarSpace = size.width <= 600 ? 130 : 68;
  const left = Math.max(12, Math.min(x + (position.x + nodeWidth) * zoom + 12, size.width - 40));
  const top = Math.max(12, Math.min(y + position.y * zoom + 12, size.height - toolbarSpace - 28));
  return <div ref={root} className="canvas-node-assistant nodrag nopan nowheel" style={{ left, top }}>
    <button className="canvas-assistant-trigger" aria-label={`Ask AI about ${item.title}`} onClick={onOpen}>✦</button>
  </div>;
}

/**
 * One-shot "build the starting pipeline by hand" affordance, anchored directly below the Job
 * configuration node — the manual counterpart to the AI-drafted pipeline in the canvas assistant.
 * Disappears once any stage exists (see FunnelCanvas), since it's only for the empty-canvas case.
 */
export function AddPipelineButton({ item, position, onClick }: {
  item: FunnelNode; position: { x: number; y: number }; onClick: () => void;
}) {
  const { x, y, zoom } = useViewport();
  const flow = useReactFlow();
  const nodeWidth = flow.getNode(item.id)?.measured?.width ?? 280;
  const nodeHeight = flow.getNode(item.id)?.measured?.height ?? 160;
  const left = x + position.x * zoom;
  const top = y + (position.y + nodeHeight) * zoom + 12;
  return (
    <button
      type="button"
      className="canvas-add-pipeline nodrag nopan"
      style={{ left, top, minWidth: nodeWidth * zoom }}
      onClick={onClick}
    >
      + Add pipeline manually
    </button>
  );
}
