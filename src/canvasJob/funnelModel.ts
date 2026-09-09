import { uid } from "../files";
import type { JobDraft } from "../types";
import type { Capability } from "../hiring/types";

export type FunnelKind =
  | "job"
  | "stage"
  | "application"
  | "round"
  | "trip"
  | "communication"
  | "capability";
export type FunnelNode = {
  id: string;
  parent: string | null;
  kind: FunnelKind;
  title: string;
  description: string;
  collapsed: boolean;
  duration: number;
  tripType: string;
  trigger: string;
  delay: number;
  threshold: number;
  recipient: string;
  active: boolean;
  subject: string;
  body: string;
  capability?: Capability;
  position?: { x: number; y: number };
  stageKey?: string;
  outcome?: "success" | "failure" | "always";
  rules?: {
    id: string;
    field: "domain" | "experience";
    operator: "not_contains" | "less_than";
    value: string;
    enabled: boolean;
  }[];
  destinationId?: string;
  tripId?: string;
  pipelineVersion?: number;
  manual?: boolean;
  placeholder?: boolean;
  canvasConnections?: {source:string;target:string;sourceHandle:string;targetHandle:string}[];
  hiddenConnections?: string[];
  exit?: boolean;
};
export function node(
  kind: FunnelKind,
  title: string,
  parent: string | null,
  id = uid(),
): FunnelNode {
  return {
    id,
    parent,
    kind,
    title,
    description: "",
    collapsed: false,
    duration: 30,
    tripType: "Assessment",
    trigger: "When round starts",
    delay: 3,
    threshold: 30,
    recipient: "Candidate",
    active: true,
    subject: "",
    body: "",
  };
}
export function baseFunnel(): FunnelNode[] {
  return [node("job", "Job configuration", null, "job")];
}
export function expandFunnel(nodes: FunnelNode[]): FunnelNode[] {
  if (nodes.some((n) => n.id === "prospects")) return nodes;
  return [
    ...nodes,
    node("stage", "Prospects", "job", "prospects"),
    node("application", "Application form", "prospects", "application"),
    node("stage", "Pipeline", "job", "pipeline"),
    node("stage", "Interview process", "job", "interview"),
  ];
}
export function templateFunnel(role: string): FunnelNode[] {
  const nodes = expandFunnel(baseFunnel());
  const design = /design/i.test(role);
  const screening = node(
    "trip",
    design ? "Portfolio walkthrough" : "Skills assessment",
    "pipeline",
  );
  screening.tripType = design ? "Design task" : "Assessment";
  screening.description =
    "Walk us through a relevant project. Explain your decisions, trade-offs, and what you learned.";
  nodes.push(screening);
  for (const title of [
    design ? "Design review" : "Technical conversation",
    "Team conversation",
  ]) {
    const round = node("round", title, "interview");
    const trip = node(
      "trip",
      title === "Team conversation"
        ? "Collaboration scenario"
        : design
          ? "Design challenge"
          : "Practical challenge",
      round.id,
    );
    trip.description =
      "Describe your approach, explain the trade-offs, and share how you would validate the result.";
    const message = node("communication", "Round invitation", round.id);
    message.subject = `Your next step: ${title}`;
    message.body =
      "Hi {{candidate_name}},\n\nWe would like to invite you to the next round for {{job_title}}. Please reply with a time that works for you.\n\nThank you for your time.";
    nodes.push(round, trip, message);
  }
  return nodes;
}
export function removeBranch(nodes: FunnelNode[], id: string): FunnelNode[] {
  const removed = new Set([id]);
  let previous = 0;
  while (previous !== removed.size) {
    previous = removed.size;
    nodes.forEach((n) => {
      if (n.parent && removed.has(n.parent)) removed.add(n.id);
    });
  }
  return nodes.filter((n) => !removed.has(n.id));
}
export function visibleNodes(nodes: FunnelNode[]): FunnelNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  return nodes.filter((n) => {
    let parent = n.parent;
    const seen = new Set<string>();
    while (parent) {
      if (seen.has(parent)) return false;
      seen.add(parent);
      const ancestor = byId.get(parent);
      if (!ancestor || ancestor.collapsed) return false;
      parent = ancestor.parent;
    }
    return true;
  });
}
export function resetFunnelLayout(nodes: FunnelNode[]): FunnelNode[] {
  return nodes.map(({ position: _position, ...item }) => item);
}

export function layoutFunnel(nodes: FunnelNode[]) {
  // Lay out the full hierarchy so collapsing a branch never shifts other nodes.
  const children = new Map<string | null, FunnelNode[]>();
  for (const item of nodes) {
    const siblings = children.get(item.parent) ?? [];
    siblings.push(item);
    children.set(item.parent, siblings);
  }
  const positions = new Map<string, { x: number; y: number }>();
  const indent = 70;
  const rowGap = 230;
  let row = 0;
  function place(item: FunnelNode, x: number, offset: { x: number; y: number }) {
    if (positions.has(item.id)) return;
    const fallback = { x, y: row++ * rowGap };
    const saved = item.position;
    const position = saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)
      ? { ...saved }
      : { x: fallback.x + offset.x, y: fallback.y + offset.y };
    positions.set(item.id, position);
    const branchOffset = { x: position.x - fallback.x, y: position.y - fallback.y };
    for (const child of children.get(item.id) ?? []) {
      // Main stages share the role's column; details nest underneath each section.
      const childX = item.kind === "job" && child.kind === "stage" ? x : x + indent;
      place(child, childX, branchOffset);
    }
  }
  for (const root of children.get(null) ?? []) {
    place(root, 0, { x: 0, y: 0 });
  }
  return visibleNodes(nodes).map((item) => ({
    ...item,
    position: positions.get(item.id) ?? { x: 0, y: 0 },
  }));
}
export function publishErrors(draft: JobDraft): string[] {
  return (
    [
      ["designation", "Job title"],
      ["experienceType", "Role type"],
      ["location", "Location"],
      ["mustHaves", "Basic requirements"],
    ] as const
  )
    .filter(([key]) => !draft.fields[key].value.trim())
    .map(([, label]) => label);
}
