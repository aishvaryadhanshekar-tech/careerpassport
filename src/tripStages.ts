import { uid } from "./files";
import type { CustomQuestion, Stage, StageType } from "./types";

export const STAGE_TYPE_META: Record<StageType, { label: string; blurb: string; live: boolean }> = {
  rapid_fire: {
    label: "Rapid fire",
    blurb: "Marks each statement serious or joking — reveals whether the fundamentals are sound, fast",
    live: true,
  },
  do_a_demo: {
    label: "Do a demo",
    blurb: "Records screen and video working through a situation — reveals the work in action",
    live: true,
  },
  pick_and_defend: {
    label: "Pick and defend",
    blurb: "Chooses between options and argues for the choice — reveals judgement under a real trade-off",
    live: true,
  },
  multiple_choice: {
    label: "Multiple choice",
    blurb: "Answers generated questions — reveals applied knowledge",
    live: false,
  },
  binary_choice: {
    label: "Binary choice",
    blurb: "Answers with no middle option — reveals instinct without hedging",
    live: false,
  },
  rank_order: {
    label: "Rank order",
    blurb: "Orders a set of items — reveals what they actually prioritise",
    live: false,
  },
  ai_critic: {
    label: "AI critic",
    blurb: "Gets their answer challenged and responds — reveals how they handle pushback",
    live: false,
  },
  coding_round: {
    label: "Coding round",
    blurb: "Writes code — reveals how they actually build",
    live: false,
  },
  case_study: {
    label: "Case study",
    blurb: "Works a structured problem — reveals structured thinking at length",
    live: false,
  },
  flaunt_or_flex: {
    label: "Flaunt or flex",
    blurb: "Presents work they're proud of — reveals what they value in their own output",
    live: false,
  },
};

export const DEFAULT_DURATION_BY_TYPE: Record<StageType, number> = {
  rapid_fire: 5,
  do_a_demo: 15,
  pick_and_defend: 10,
  multiple_choice: 10,
  binary_choice: 5,
  rank_order: 10,
  ai_critic: 10,
  coding_round: 30,
  case_study: 15,
  flaunt_or_flex: 10,
};

function move<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || from >= items.length) return items;
  const next = items.slice();
  const [item] = next.splice(from, 1);
  if (item === undefined) return items;
  next.splice(to, 0, item);
  return next;
}

export function addStage(stages: Stage[], type: StageType): Stage[] {
  return [
    ...stages,
    { id: uid(), type, spokenInstructions: "", items: [], durationMinutes: DEFAULT_DURATION_BY_TYPE[type] },
  ];
}

export function removeStage(stages: Stage[], id: string): Stage[] {
  return stages.filter((stage) => stage.id !== id);
}

export function reorderStages(stages: Stage[], from: number, to: number): Stage[] {
  return move(stages, from, to);
}

export function updateStage(stages: Stage[], id: string, patch: Partial<Stage>): Stage[] {
  return stages.map((stage) => (stage.id === id ? { ...stage, ...patch } : stage));
}

export function addStageItem(stage: Stage, prompt = ""): Stage {
  const item: CustomQuestion = {
    id: uid(),
    kind: "question",
    prompt,
    type: "short_answer",
    required: "optional",
    options: [],
  };
  return { ...stage, items: [...stage.items, item] };
}

export function removeStageItem(stage: Stage, itemId: string): Stage {
  return { ...stage, items: stage.items.filter((item) => item.id !== itemId) };
}

export function reorderStageItems(stage: Stage, from: number, to: number): Stage {
  return { ...stage, items: move(stage.items, from, to) };
}

export function updateStageItem(
  stage: Stage,
  itemId: string,
  patch: Partial<CustomQuestion>,
): Stage {
  return {
    ...stage,
    items: stage.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
  };
}
