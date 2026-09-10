import type { EvaluationCriterion, JobDraft } from "../../types";
import type { FunnelNode, InsightKey } from "../funnelModel";

/**
 * The AI build flow runs the canvas from "Build with AI" through to a drafted
 * pipeline. Every phase-dependent component switches on this union rather than
 * on ad-hoc booleans.
 */
export type BuildPhase =
  | "off"
  | "intro"
  | "collecting"
  | "analysing"
  /** The Role brief's four sections appear on the canvas one by one. */
  | "drafting"
  /** The person checks each section before asking for a pipeline. */
  | "reviewing"
  | "choosing"
  | "stages"
  | "generating"
  | "done";

/** Phases during which the flow owns the camera and the assistant panel. */
export const ACTIVE_PHASES: readonly BuildPhase[] = [
  "intro",
  "collecting",
  "analysing",
  "drafting",
  "reviewing",
  "choosing",
  "stages",
  "generating",
];

export function isFlowActive(phase: BuildPhase): boolean {
  return ACTIVE_PHASES.includes(phase);
}

export const ANALYSING_MS = 2400;
export const STAGGER_MS = 90;
/**
 * Gap between brief sections appearing. Must outlast one `reveal` in
 * useAiBuildFlow so each section gets its own entrance animation.
 */
export const DRAFT_STEP_MS = 650;
/** How long each new section shows as a skeleton before its content fills in. */
export const DRAFT_FILL_MS = 480;

/** Zoom used while the flow focuses the job node, vs the canvas default. */
export const INTRO_ZOOM = 1.15;
export const DEFAULT_ZOOM = 0.9;

/** Phases where the assistant is working and the composer waits. */
export const BUSY_PHASES: readonly BuildPhase[] = ["analysing", "drafting", "generating"];

export function isBusyPhase(phase: BuildPhase): boolean {
  return BUSY_PHASES.includes(phase);
}

/**
 * The job node's Settings / Brief & sharing / Team / History tools stay hidden
 * until the job actually has data behind them — an empty node with live tools
 * leads the user into blank panels.
 */
export function toolsUnlocked(draft: JobDraft, items: FunnelNode[]): boolean {
  if (draft.fields.designation.value.trim()) return true;
  return items.some((item) => item.kind === "stage" || item.kind === "application");
}

export const BRIEF_HUB_ID = "ai-role-brief";

export type BriefSectionKey = Exclude<InsightKey, "hub">;

/** The Role brief's sections, in the order the Role Profile step shows them. */
export const BRIEF_SECTIONS: readonly {
  key: BriefSectionKey;
  id: string;
  title: string;
  /** Status line while the assistant drafts this section. */
  drafting: string;
}[] = [
  { key: "summary", id: "ai-brief-summary", title: "Role summary", drafting: "Summarising the role…" },
  { key: "requirements", id: "ai-brief-requirements", title: "Requirements", drafting: "Pulling out requirements…" },
  { key: "sourcing", id: "ai-brief-sourcing", title: "Sourcing playbook", drafting: "Planning where to source…" },
  { key: "evaluation", id: "ai-brief-evaluation", title: "Evaluation framework", drafting: "Weighting the criteria…" },
];

/** The brief's section nodes present on the canvas, in BRIEF_SECTIONS order. */
export function briefSections(items: FunnelNode[]): FunnelNode[] {
  return BRIEF_SECTIONS.map((section) => items.find((item) => item.id === section.id)).filter(
    (item): item is FunnelNode => Boolean(item),
  );
}

export function briefProgress(items: FunnelNode[]): { reviewed: number; total: number } {
  return {
    reviewed: briefSections(items).filter((item) => item.reviewed).length,
    total: BRIEF_SECTIONS.length,
  };
}

/** Phases where the brief is still arriving or a pipeline question is already on screen. */
const HANDOFF_BLOCKED: readonly BuildPhase[] = ["analysing", "drafting", "choosing", "stages", "generating"];

/** The Role brief offers "Generate pipeline" until a pipeline exists. */
export function briefHandoffOpen(phase: BuildPhase, items: FunnelNode[]): boolean {
  if (HANDOFF_BLOCKED.includes(phase)) return false;
  return (
    items.some((item) => item.id === BRIEF_HUB_ID) &&
    !items.some((item) => item.kind === "stage" || item.kind === "application")
  );
}

/** What the Role brief hub shows on the canvas: review progress and the pipeline hand-off. */
export type BriefHandoff = {
  reviewed: number;
  total: number;
  canGenerate: boolean;
  drafting: boolean;
  onGenerate: () => void;
};

/** A stage offered in the pre-generation checklist. */
export type StageProposal = {
  id: string;
  title: string;
  detail: string;
  included: boolean;
  /** Stages the flow always creates; the user cannot untick these. */
  required?: boolean;
};

/** How much of the pipeline the user asked the assistant to draft. */
export type PipelineScope = "full" | "application";

/** What the analysing step produces: the Role brief and the draft behind it. */
export type ProfileProposal = {
  role: string;
  criteria: EvaluationCriterion[];
  hub: FunnelNode;
  /** The four brief sections, in BRIEF_SECTIONS order. */
  sections: FunnelNode[];
  /** Draft with the extracted role fields, preview and role profile applied. */
  draft: JobDraft;
};
