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
  /** The Role brief card fills in section by section. */
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

/** Generating a role brief reads for ANALYSING_MS, fills one section per DRAFT_STEP_MS, then settles. */
export const ANALYSING_MS = 2000;
export const STAGGER_MS = 90;
export const DRAFT_STEP_MS = 1500;
export const BRIEF_SETTLE_MS = 600;

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
  /** Tile and tab label. */
  label: string;
  /** Status line while the assistant drafts this section. */
  drafting: string;
  /** @deprecated Id of the legacy section node. */
  id: string;
  /** @deprecated Title of the legacy section node. */
  title: string;
}[] = [
  { key: "summary", label: "Summary", drafting: "Summarising the role…", id: "ai-brief-summary", title: "Role summary" },
  { key: "requirements", label: "Requirements", drafting: "Pulling out requirements…", id: "ai-brief-requirements", title: "Requirements" },
  { key: "sourcing", label: "Sourcing", drafting: "Mapping where to source…", id: "ai-brief-sourcing", title: "Sourcing playbook" },
  { key: "evaluation", label: "Evaluation", drafting: "Weighting the evaluation criteria…", id: "ai-brief-evaluation", title: "Evaluation framework" },
];

const SECTION_KEYS = BRIEF_SECTIONS.map((section) => section.key);
const LEGACY_SECTION_IDS = new Set(BRIEF_SECTIONS.map((section) => section.id));

/** Total length of the generating animation, from the click to the review phase (~8.6 s). */
export const BRIEF_GENERATION_MS = ANALYSING_MS + BRIEF_SECTIONS.length * DRAFT_STEP_MS + BRIEF_SETTLE_MS;
export const BRIEF_READING_LABEL = "Reading what you shared…";
export const BRIEF_READY_LABEL = "Role brief ready";

/** How the person is describing the role: the open prompt, or the template list inside the composer. */
export type IntakeView = "open" | "templates";

export type BriefTileStatus = "pending" | "ready" | "reviewed";
export type BriefSectionView = { key: BriefSectionKey; label: string; status: BriefTileStatus };
/** A moment in the generating animation: the status line and the sections already filled in. */
export type BriefGeneration = { label: string; ready: readonly BriefSectionKey[] };

/** Everything the single Role brief card on the canvas renders and calls. */
export type BriefCardModel = {
  sections: BriefSectionView[];
  reviewed: number;
  total: number;
  /** The brief is still being generated (analysing or drafting). */
  generating: boolean;
  /** The current generating step, or null once ready. */
  statusLabel: string | null;
  /** "Generate pipeline" is on offer (see briefHandoffOpen). */
  canGenerate: boolean;
  /** The section open in the inspector, if any. */
  activeSection: BriefSectionKey | null;
  /** Opens the inspector on the first unreviewed section. */
  onReview: () => void;
  onOpenSection: (key: BriefSectionKey) => void;
  /** Hands off to the pipeline question. */
  onGenerate: () => void;
};

/** Footprint of the Role brief card, shared by the card CSS, the layout spacing and camera centring. */
export const BRIEF_CARD_SIZE = { width: 280, height: 236 } as const;

/** Pure: what the card and composer show `elapsed` ms after the person clicks "Generate role brief". */
export function briefGenerationAt(elapsed: number): BriefGeneration {
  if (elapsed < ANALYSING_MS) return { label: BRIEF_READING_LABEL, ready: [] };
  const step = Math.floor((elapsed - ANALYSING_MS) / DRAFT_STEP_MS);
  if (step >= BRIEF_SECTIONS.length) return { label: BRIEF_READY_LABEL, ready: SECTION_KEYS };
  return { label: BRIEF_SECTIONS[step].drafting, ready: SECTION_KEYS.slice(0, step) };
}

export function findBriefHub(items: FunnelNode[]): FunnelNode | undefined {
  return items.find((item) => item.id === BRIEF_HUB_ID);
}

/** Sections ticked off, in BRIEF_SECTIONS order. Also reads legacy section nodes until they are migrated. */
export function briefReviewed(items: FunnelNode[]): BriefSectionKey[] {
  const ticked = new Set<BriefSectionKey>(findBriefHub(items)?.reviewedSections ?? []);
  for (const section of BRIEF_SECTIONS) {
    if (items.some((item) => item.id === section.id && item.reviewed)) ticked.add(section.key);
  }
  return SECTION_KEYS.filter((key) => ticked.has(key));
}

export function briefProgress(items: FunnelNode[]): { reviewed: number; total: number } {
  return { reviewed: briefReviewed(items).length, total: BRIEF_SECTIONS.length };
}

/** The next section still to check, looking forward from `after` and wrapping round; null once all are done. */
export function nextUnreviewed(reviewed: readonly BriefSectionKey[], after?: BriefSectionKey): BriefSectionKey | null {
  const start = after ? SECTION_KEYS.indexOf(after) + 1 : 0;
  const order = [...SECTION_KEYS.slice(start), ...SECTION_KEYS.slice(0, start)];
  return order.find((key) => !reviewed.includes(key)) ?? null;
}

/** Ticks a section off on the hub. */
export function withSectionReviewed(items: FunnelNode[], key: BriefSectionKey): FunnelNode[] {
  return items.map((item) =>
    item.id === BRIEF_HUB_ID && !item.reviewedSections?.includes(key)
      ? { ...item, reviewedSections: SECTION_KEYS.filter((k) => k === key || item.reviewedSections?.includes(k)) }
      : item,
  );
}

/** The four tiles: pending while being generated, then ready, then reviewed. */
export function briefSectionViews(items: FunnelNode[], generation: BriefGeneration | null): BriefSectionView[] {
  const reviewed = briefReviewed(items);
  return BRIEF_SECTIONS.map(({ key, label }) => ({
    key,
    label,
    status: reviewed.includes(key) ? "reviewed" : generation && !generation.ready.includes(key) ? "pending" : "ready",
  }));
}

/** Drops legacy per-section brief nodes, folding their ticks into the hub. Returns `items` untouched if none exist. */
export function migrateBriefSections(items: FunnelNode[]): FunnelNode[] {
  if (!items.some((item) => LEGACY_SECTION_IDS.has(item.id))) return items;
  const reviewed = briefReviewed(items);
  return items
    .filter((item) => !LEGACY_SECTION_IDS.has(item.id))
    .map((item) => (item.id === BRIEF_HUB_ID ? { ...item, reviewedSections: reviewed } : item));
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
  /** Draft with the extracted role fields, preview and role profile applied. */
  draft: JobDraft;
};
