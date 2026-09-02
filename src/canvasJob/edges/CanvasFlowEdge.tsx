import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";

export type CanvasFlowEdgeData = {
  powered: boolean;
};

export function CanvasFlowEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps & { data?: CanvasFlowEdgeData }) {
  const [path] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const powered = data?.powered ?? false;

  return (
    <BaseEdge
      path={path}
      className={`canvas-flow-edge${powered ? " canvas-flow-edge-powered" : ""}`}
    />
  );
}
