import type { CustomQuestion } from "./application";

export const INFERENCE_CARD_IDS = [
  "idealCandidate",
  "tribalDetails",
  "skills",
  "evaluationCriteria",
  "sourcingStrategy",
  "redFlags",
] as const;
export type InferenceCardId = (typeof INFERENCE_CARD_IDS)[number];
export type InferenceCard = { id: InferenceCardId; title: string; content: string };

export const STAGE_TYPES = [
  "rapid_fire",
  "do_a_demo",
  "pick_and_defend",
  "multiple_choice",
  "binary_choice",
  "rank_order",
  "ai_critic",
  "coding_round",
  "case_study",
  "flaunt_or_flex",
] as const;
export type StageType = (typeof STAGE_TYPES)[number];
export const LIVE_STAGE_TYPES: readonly StageType[] = [
  "rapid_fire",
  "do_a_demo",
  "pick_and_defend",
];

export type Stage = {
  id: string;
  type: StageType;
  spokenInstructions: string;
  items: CustomQuestion[];
};

export type Trip = {
  id: string;
  title: string;
  status: "draft" | "published";
  createdAt: number;
  updatedAt: number;
  inferenceCards: InferenceCard[];
  inferenceCardsLocked: boolean;
  spine: string;
  spineGenerated: boolean;
  stages: Stage[];
  aiPrefilled: boolean;
};
