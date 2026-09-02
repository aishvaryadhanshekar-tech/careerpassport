export const CANVAS_NODE_IDS = ["jobDetails", "roleProfile", "application", "publish"] as const;

export type CanvasNodeId = (typeof CANVAS_NODE_IDS)[number];

export type CanvasNodeStatus = "pending" | "active" | "in_progress" | "done";
