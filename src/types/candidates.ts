import type { SentMessage } from "./communications";
import type { FieldSource } from "./shared";

/**
 * Hiring pipeline types.
 *
 * NAMING: `Stage`, `StageType` and `StageItem` are already taken by the Trip questionnaire
 * model (src/types/trips.ts) and everything is re-exported flat through the barrel, so a
 * kanban column is a `PipelineStage`. Do not introduce a bare `Stage` here.
 */

export type PipelineStage = {
  id: string;
  label: string;
  /** Default stages are fixed; recruiter-added ones can be renamed and deleted. */
  removable: boolean;
};

export const DEFAULT_PIPELINE_STAGES: readonly PipelineStage[] = [
  { id: "applied", label: "Applied", removable: false },
  { id: "screened", label: "Screened", removable: false },
  { id: "submitted", label: "Submitted to Client", removable: false },
  { id: "interviewing", label: "Interviewing", removable: false },
  { id: "offered", label: "Offered", removable: false },
  { id: "archive", label: "Archive", removable: false },
];

/** The stage new applicants land in, and the one orphaned candidates fall back to. */
export const APPLIED_STAGE_ID = "applied";
export const ARCHIVE_STAGE_ID = "archive";

export type AiFlag = "recommended" | "borderline" | "hold";

export const AI_FLAG_LABELS: Record<AiFlag, string> = {
  recommended: "Recommended for next round",
  borderline: "Borderline",
  hold: "Hold",
};

/**
 * One-word verdicts for the pipeline card, where the pill sits beside the name in a column
 * only so wide. Reads as a strength scale rather than as an instruction — the card states
 * how the candidate did and leaves the call to the hiring manager. The long labels above
 * stay for the drawer, which has room for the full sentence.
 */
export const AI_FLAG_SHORT_LABELS: Record<AiFlag, string> = {
  recommended: "Strong",
  borderline: "Decent",
  hold: "Weak",
};

export type TripStatus = "none" | "sent" | "completed";

export type CandidateOrigin = { kind: "applied" } | { kind: "submitted_by"; by: string };

/** A recruiter's 1-5 score against one EvaluationCriterion from the job's framework. */
export type SkillRating = { criterionId: string; rating: number };

export type CandidateNote = {
  id: string;
  body: string;
  author: string;
  createdAt: number;
  /** @mentioned names parsed out of the body, used to show assigned follow-ups. */
  mentions: string[];
};

export type TimelineEvent = {
  id: string;
  label: string;
  detail?: string;
  at: number;
  /** Drives the CANDIDATE vs YOUR TEAM tag in the drawer's timeline. */
  actor: "candidate" | "team";
};

export type Candidate = {
  id: string;
  stageId: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  origin: CandidateOrigin;
  appliedAt: number;
  resumeFileName: string;
  tripStatus: TripStatus;
  tripSentAt?: number;
  /** 0-100, present only once tripStatus is "completed". */
  tripScore?: number;
  aiFlag?: AiFlag;
  tags: string[];
  ratings: SkillRating[];
  notes: CandidateNote[];
  timeline: TimelineEvent[];
  interviewAt?: number;
  /** Templates sent to this candidate. Optional so older stored boards still parse. */
  messages?: SentMessage[];
};

export type PipelineBoard = {
  stages: PipelineStage[];
  candidates: Candidate[];
};

/** Quick-select chips in the drawer's Feedback tab. */
export const CANDIDATE_TAG_SUGGESTIONS: readonly string[] = [
  "Strong communicator",
  "Culture add",
  "Fast ramp",
  "High ownership",
  "Needs coaching",
  "Client ready",
];

/**
 * Score → AI flag. Exported so the board, the card chip and the store all agree
 * rather than each re-deriving the thresholds.
 */
export function flagForScore(score: number): AiFlag {
  if (score >= 75) return "recommended";
  if (score >= 55) return "borderline";
  return "hold";
}

/** Kept for symmetry with the rest of the domain, which tracks provenance this way. */
export type CandidateFieldSource = FieldSource;
