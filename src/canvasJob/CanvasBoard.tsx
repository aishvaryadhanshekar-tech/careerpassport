import { useMemo } from "react";
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  type Edge,
  type Node,
  type OnMove,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { CanvasStepNode, type CanvasStepNodeData } from "./nodes/CanvasStepNode";
import { CanvasFlowEdge, type CanvasFlowEdgeData } from "./edges/CanvasFlowEdge";
import type { CanvasNodeId } from "../types";
import type { CanvasStatuses } from "./canvasStatus";

const nodeTypes = { canvasStep: CanvasStepNode };
const edgeTypes = { canvasFlow: CanvasFlowEdge };

const NODE_ORDER: { id: CanvasNodeId; title: string; icon: CanvasStepNodeData["icon"]; x: number }[] = [
  { id: "jobDetails", title: "Job Details", icon: "details", x: 60 },
  { id: "roleProfile", title: "Role Profile", icon: "roleProfile", x: 400 },
  { id: "application", title: "Application", icon: "application", x: 740 },
  { id: "publish", title: "Preview & Publish", icon: "publish", x: 1080 },
];

const SUBTITLE: Record<CanvasNodeId, (statuses: CanvasStatuses) => string> = {
  jobDetails: (s) =>
    s.jobDetails === "done" ? "All required details captured" : "Record, type, or upload the role",
  roleProfile: (s) =>
    s.roleProfile === "pending"
      ? "Unlocks once Job Details is done"
      : s.roleProfile === "done"
        ? "Reviewed"
        : "Review the derived role profile",
  application: (s) =>
    s.application === "pending"
      ? "Unlocks once Role Profile is done"
      : s.application === "done"
        ? "Application form ready"
        : "Build the candidate-facing form",
  publish: (s) =>
    s.publish === "pending"
      ? "Unlocks once Application is done"
      : s.publish === "done"
        ? "Live and accepting candidates"
        : "Review and go live",
};

export function CanvasBoard({
  statuses,
  onOpenNode,
  onInit,
  onMove,
}: {
  statuses: CanvasStatuses;
  onOpenNode: (id: CanvasNodeId) => void;
  onInit?: (instance: ReactFlowInstance) => void;
  onMove?: OnMove;
}) {
  const nodes = useMemo<Node[]>(
    () =>
      NODE_ORDER.map(({ id, title, icon, x }) => ({
        id,
        type: "canvasStep",
        position: { x, y: 140 },
        draggable: false,
        data: {
          title,
          subtitle: SUBTITLE[id](statuses),
          icon,
          status: statuses[id],
          onOpen: () => onOpenNode(id),
        } satisfies CanvasStepNodeData,
      })),
    [statuses, onOpenNode],
  );

  const edges = useMemo<Edge[]>(
    () => [
      {
        id: "jobDetails-roleProfile",
        source: "jobDetails",
        target: "roleProfile",
        type: "canvasFlow",
        data: { powered: statuses.jobDetails === "done" } satisfies CanvasFlowEdgeData,
      },
      {
        id: "roleProfile-application",
        source: "roleProfile",
        target: "application",
        type: "canvasFlow",
        data: { powered: statuses.roleProfile === "done" } satisfies CanvasFlowEdgeData,
      },
      {
        id: "application-publish",
        source: "application",
        target: "publish",
        type: "canvasFlow",
        data: { powered: statuses.application === "done" } satisfies CanvasFlowEdgeData,
      },
    ],
    [statuses],
  );

  return (
    <div className="canvas-board">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        panOnScroll
        zoomOnScroll={false}
        fitView
        fitViewOptions={{ padding: 0.35 }}
        proOptions={{ hideAttribution: true }}
        onInit={onInit}
        onMove={onMove}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="#d0d5dd" />
      </ReactFlow>
    </div>
  );
}
