import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CanvasNodeStatus } from "../../types";

export type CanvasStepNodeData = {
  title: string;
  subtitle: string;
  icon: "details" | "roleProfile" | "application" | "publish" | "prospects" | "pipeline" | "interview";
  status: CanvasNodeStatus;
  onOpen: () => void;
};

const STATUS_LABEL: Record<CanvasNodeStatus, string> = {
  pending: "Locked",
  active: "Up next",
  in_progress: "In progress",
  done: "Done",
};

function NodeIcon({ icon }: { icon: CanvasStepNodeData["icon"] }) {
  if (icon === "details") {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M6 4h8a1 1 0 0 1 1 1v11l-3-2-2 2-2-2-3 2V5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M8 8h4M8 11h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }
  if (icon === "roleProfile") {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.4" />
        <path d="M4.5 16c.8-3 3-4.5 5.5-4.5s4.7 1.5 5.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }
  if (icon === "application") {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="4" y="3" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M7 7h6M7 10h6M7 13h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }
  if (icon === "prospects") {
    return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.4"/><circle cx="14" cy="8" r="2" stroke="currentColor" strokeWidth="1.4"/><path d="M2.5 16c.6-3 2.1-4.5 4.5-4.5s3.9 1.5 4.5 4.5M11 15.5c.4-2 1.4-3.2 3-3.2 1.7 0 2.7 1 3.2 3.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
  }
  if (icon === "pipeline") {
    return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3 5h14M3 10h10M3 15h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><circle cx="16" cy="10" r="2" fill="currentColor"/></svg>;
  }
  if (icon === "interview") {
    return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M6 8h8M6 11h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="m13 14 2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
  }
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 3v10M10 13l-3.5-3.5M10 13l3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 15.5h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function CanvasStepNode({ data }: NodeProps & { data: CanvasStepNodeData }) {
  const { title, subtitle, icon, status, onOpen } = data;
  const locked = status === "pending";

  return (
    <div className={`canvas-node canvas-node-${status}`}>
      <Handle type="target" position={Position.Left} className="canvas-node-handle" />
      <button
        type="button"
        className="canvas-node-btn"
        disabled={locked}
        aria-disabled={locked}
        onClick={onOpen}
      >
        <span className="canvas-node-icon" aria-hidden="true">
          {status === "done" ? <CheckIcon /> : <NodeIcon icon={icon} />}
        </span>
        <span className="canvas-node-text">
          <span className="canvas-node-title">{title}</span>
          <span className="canvas-node-subtitle">{subtitle}</span>
        </span>
        <span className={`canvas-node-status-pill canvas-node-status-pill-${status}`}>
          {STATUS_LABEL[status]}
        </span>
      </button>
      <Handle type="source" position={Position.Right} className="canvas-node-handle" />
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4.5 10.5 8 14l7.5-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
