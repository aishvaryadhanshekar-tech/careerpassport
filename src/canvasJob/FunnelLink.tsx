import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";

/** Keep hierarchy links outside the column of cards while retaining free placement. */
export function FunnelLink(props: EdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style,
    markerStart,
    markerEnd,
    interactionWidth,
  } = props;

  let path: string;
  if (targetY - sourceY < 72) {
    // A node dragged above or very close to its parent has no lower gutter clearance.
    [path] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  } else {
    // Cards are 260px wide. Clear the left edge of both endpoint cards, with
    // a slightly wider lane for indented children to separate sibling links.
    const laneOffset = 170 + Math.min(24, Math.abs(targetX - sourceX) * 0.2);
    const gutterX = Math.min(sourceX, targetX) - laneOffset;
    const startY = sourceY + 20;
    const endY = targetY - 24;
    const radius = Math.min(10, (endY - startY) / 2);
    path = [
      `M ${sourceX} ${sourceY}`,
      `L ${sourceX} ${startY - radius}`,
      `Q ${sourceX} ${startY} ${sourceX - radius} ${startY}`,
      `L ${gutterX + radius} ${startY}`,
      `Q ${gutterX} ${startY} ${gutterX} ${startY + radius}`,
      `L ${gutterX} ${endY - radius}`,
      `Q ${gutterX} ${endY} ${gutterX + radius} ${endY}`,
      `L ${targetX - radius} ${endY}`,
      `Q ${targetX} ${endY} ${targetX} ${endY + radius}`,
      `L ${targetX} ${targetY}`,
    ].join(" ");
  }

  return (
    <BaseEdge
      id={id}
      path={path}
      style={style}
      markerStart={markerStart}
      markerEnd={markerEnd}
      interactionWidth={interactionWidth}
    />
  );
}
