import { uid } from "./files";
import { deriveInferenceCards } from "./tripInference";
import { generateSpine } from "./tripSpine";
import { DEFAULT_DURATION_BY_TYPE } from "./tripStages";
import type { CustomQuestion, Difficulty, InferenceCard, InferenceCardId, JobDraft, Stage, StageType, Trip } from "./types";

export const DEFAULT_ROUND_TYPES: StageType[] = ["rapid_fire", "multiple_choice", "case_study"];

function cardContent(cards: InferenceCard[], id: InferenceCardId): string {
  return cards.find((card) => card.id === id)?.content.trim() ?? "";
}

function sentencesOf(text: string): string[] {
  return text
    .split(/[\n.]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function question(partial: Partial<CustomQuestion> & Pick<CustomQuestion, "prompt" | "type">): CustomQuestion {
  return {
    id: uid(),
    kind: "question",
    required: "optional",
    options: [],
    ...partial,
  };
}

function maxCountForDifficulty(base: number, difficulty: Difficulty): number {
  if (difficulty === "easy") return Math.max(1, base - 2);
  if (difficulty === "hard") return base + 2;
  return base;
}

function rapidFireQuestions(cards: InferenceCard[], difficulty: Difficulty): CustomQuestion[] {
  const skills = sentencesOf(cardContent(cards, "skills"));
  const tribal = sentencesOf(cardContent(cards, "tribalDetails"));
  const seeds = [...skills, ...tribal];
  const fallback = [
    "You should always ask for permission before shipping a fix.",
    "Documentation matters more than working code.",
    "It's fine to skip tests when the deadline is tight.",
    "The best answer is always the fastest one.",
    "Asking questions early is a sign of weakness.",
  ];
  const source = seeds.length > 0 ? seeds : fallback;
  const count = Math.min(Math.max(source.length, 3), maxCountForDifficulty(5, difficulty));
  return Array.from({ length: count }, (_, i) => {
    const seed = source[i % source.length];
    return question({
      prompt: seed,
      type: "multiple_choice",
      options: ["Serious", "Joking"],
    });
  });
}

function multipleChoiceQuestions(cards: InferenceCard[], difficulty: Difficulty): CustomQuestion[] {
  const evaluation = sentencesOf(cardContent(cards, "evaluationCriteria"));
  const skills = sentencesOf(cardContent(cards, "skills"));
  const seeds = [...evaluation, ...skills];
  const fallback = [
    "How would you evaluate a candidate's approach to this problem",
    "What matters most when applying this skill",
    "Which of the following best demonstrates this",
  ];
  const source = seeds.length > 0 ? seeds : fallback;
  const count = Math.min(Math.max(source.length, 3), maxCountForDifficulty(5, difficulty));
  return Array.from({ length: count }, (_, i) => {
    const seed = source[i % source.length];
    return question({
      prompt: `Which option best reflects: ${seed}?`,
      type: "multiple_choice",
      options: ["Strongly agree", "Somewhat agree", "Neutral", "Disagree"],
    });
  });
}

function caseStudyQuestions(cards: InferenceCard[], difficulty: Difficulty): CustomQuestion[] {
  const idealCandidate = sentencesOf(cardContent(cards, "idealCandidate"));
  const redFlags = sentencesOf(cardContent(cards, "redFlags"));
  const seeds = [...idealCandidate, ...redFlags];
  const fallback = [
    "Walk through how you'd approach this situation from start to finish",
    "Describe a time your judgement was tested and how you handled it",
  ];
  const source = seeds.length > 0 ? seeds : fallback;
  const count = Math.min(Math.max(source.length, 1), maxCountForDifficulty(2, difficulty));
  return Array.from({ length: count }, (_, i) => {
    const seed = source[i % source.length];
    return question({
      prompt: `Describe your approach in detail: ${seed}`,
      type: "paragraph",
    });
  });
}

function binaryChoiceQuestions(cards: InferenceCard[], difficulty: Difficulty): CustomQuestion[] {
  const redFlags = sentencesOf(cardContent(cards, "redFlags"));
  const tribal = sentencesOf(cardContent(cards, "tribalDetails"));
  const seeds = [...redFlags, ...tribal];
  const fallback = [
    "You'd rather ship something imperfect today than something polished next week.",
    "A second opinion is worth pausing for, even under deadline pressure.",
    "The instructions were clear enough — no need to ask a clarifying question.",
  ];
  const source = seeds.length > 0 ? seeds : fallback;
  const count = Math.min(Math.max(source.length, 2), maxCountForDifficulty(4, difficulty));
  return Array.from({ length: count }, (_, i) => {
    const seed = source[i % source.length];
    return question({ prompt: seed, type: "multiple_choice", options: ["Agree", "Disagree"] });
  });
}

function pickAndDefendQuestions(cards: InferenceCard[], difficulty: Difficulty): CustomQuestion[] {
  const idealCandidate = sentencesOf(cardContent(cards, "idealCandidate"));
  const skills = sentencesOf(cardContent(cards, "skills"));
  const seeds = [...idealCandidate, ...skills];
  const fallback = [
    "Two reasonable paths forward, only time to take one",
    "A trade-off between doing it right and doing it now",
  ];
  const source = seeds.length > 0 ? seeds : fallback;
  const count = Math.min(Math.max(source.length, 1), maxCountForDifficulty(2, difficulty));
  return Array.from({ length: count }, (_, i) => {
    const seed = source[i % source.length];
    return question({
      prompt: `Given this trade-off, pick a side and defend it: ${seed}`,
      type: "paragraph",
    });
  });
}

function rankOrderQuestions(cards: InferenceCard[], difficulty: Difficulty): CustomQuestion[] {
  const evaluation = sentencesOf(cardContent(cards, "evaluationCriteria"));
  const skills = sentencesOf(cardContent(cards, "skills"));
  const seeds = [...evaluation, ...skills];
  const fallback = ["Speed", "Quality", "Cost", "Team morale"];
  const source = seeds.length > 0 ? seeds : fallback;
  const count = Math.min(Math.max(source.length, 1), maxCountForDifficulty(1, difficulty));
  return Array.from({ length: count }, (_, i) => {
    const seed = source[i % source.length];
    return question({
      prompt: `Rank what matters most here, and explain why in that order: ${seed}`,
      type: "paragraph",
    });
  });
}

function aiCriticQuestions(cards: InferenceCard[], difficulty: Difficulty): CustomQuestion[] {
  const idealCandidate = sentencesOf(cardContent(cards, "idealCandidate"));
  const evaluation = sentencesOf(cardContent(cards, "evaluationCriteria"));
  const seeds = [...idealCandidate, ...evaluation];
  const fallback = ["Your first answer skipped the failure case — what happens when it breaks?"];
  const source = seeds.length > 0 ? seeds : fallback;
  const count = Math.min(Math.max(source.length, 1), maxCountForDifficulty(1, difficulty));
  return Array.from({ length: count }, (_, i) => {
    const seed = source[i % source.length];
    return question({
      prompt: `An interviewer pushes back on this: "${seed}" How do you respond?`,
      type: "paragraph",
    });
  });
}

function codingRoundQuestions(cards: InferenceCard[], difficulty: Difficulty): CustomQuestion[] {
  const skills = sentencesOf(cardContent(cards, "skills"));
  const seeds = skills;
  const fallback = ["Write the function signature and outline your approach before coding"];
  const source = seeds.length > 0 ? seeds : fallback;
  const count = Math.min(Math.max(source.length, 1), maxCountForDifficulty(2, difficulty));
  return Array.from({ length: count }, (_, i) => {
    const seed = source[i % source.length];
    return question({
      prompt: `Solve this and explain your approach: ${seed}`,
      type: "paragraph",
    });
  });
}

function doADemoQuestions(cards: InferenceCard[], difficulty: Difficulty): CustomQuestion[] {
  const idealCandidate = sentencesOf(cardContent(cards, "idealCandidate"));
  const skills = sentencesOf(cardContent(cards, "skills"));
  const seeds = [...idealCandidate, ...skills];
  const fallback = ["Walk through a real piece of your work, live, as if presenting to the team"];
  const source = seeds.length > 0 ? seeds : fallback;
  const count = Math.min(Math.max(source.length, 1), maxCountForDifficulty(1, difficulty));
  return Array.from({ length: count }, (_, i) => {
    const seed = source[i % source.length];
    return question({
      prompt: `Record yourself working through this: ${seed}`,
      type: "paragraph",
    });
  });
}

function flauntOrFlexQuestions(cards: InferenceCard[], difficulty: Difficulty): CustomQuestion[] {
  const idealCandidate = sentencesOf(cardContent(cards, "idealCandidate"));
  const seeds = idealCandidate;
  const fallback = ["Show us something you made that you're proud of, and why it matters to you"];
  const source = seeds.length > 0 ? seeds : fallback;
  const count = Math.min(Math.max(source.length, 1), maxCountForDifficulty(1, difficulty));
  return Array.from({ length: count }, (_, i) => {
    const seed = source[i % source.length];
    return question({
      prompt: `Present your best work related to: ${seed}`,
      type: "paragraph",
    });
  });
}

function spokenInstructionsFor(type: StageType): string {
  switch (type) {
    case "rapid_fire":
      return "Answer each statement quickly with serious or joking — go with your gut.";
    case "multiple_choice":
      return "Pick the option that best matches how you'd actually respond.";
    case "case_study":
      return "Take your time and walk through your thinking in full sentences.";
    case "binary_choice":
      return "Answer with no middle option — go with your instinct.";
    case "pick_and_defend":
      return "Choose one side and argue for it — there's no credit for hedging.";
    case "rank_order":
      return "Order these by what matters most to you, and say why.";
    case "ai_critic":
      return "Respond to the pushback as you would in a live conversation.";
    case "coding_round":
      return "Write out your approach; working code matters more than polish here.";
    case "do_a_demo":
      return "Record yourself talking through the work, screen and voice together.";
    case "flaunt_or_flex":
      return "Show, don't just tell — bring the actual work.";
    default:
      return "";
  }
}

function questionsForType(type: StageType, cards: InferenceCard[], difficulty: Difficulty): CustomQuestion[] {
  switch (type) {
    case "rapid_fire":
      return rapidFireQuestions(cards, difficulty);
    case "multiple_choice":
      return multipleChoiceQuestions(cards, difficulty);
    case "case_study":
      return caseStudyQuestions(cards, difficulty);
    case "binary_choice":
      return binaryChoiceQuestions(cards, difficulty);
    case "pick_and_defend":
      return pickAndDefendQuestions(cards, difficulty);
    case "rank_order":
      return rankOrderQuestions(cards, difficulty);
    case "ai_critic":
      return aiCriticQuestions(cards, difficulty);
    case "coding_round":
      return codingRoundQuestions(cards, difficulty);
    case "do_a_demo":
      return doADemoQuestions(cards, difficulty);
    case "flaunt_or_flex":
      return flauntOrFlexQuestions(cards, difficulty);
    default:
      return [];
  }
}

export function generateTripRounds(
  cards: InferenceCard[],
  _draft: JobDraft,
  types: StageType[] = DEFAULT_ROUND_TYPES,
  difficulty: Difficulty = "medium",
): Stage[] {
  return types.map((type) => ({
    id: uid(),
    type,
    spokenInstructions: spokenInstructionsFor(type),
    items: questionsForType(type, cards, difficulty),
    durationMinutes: DEFAULT_DURATION_BY_TYPE[type],
  }));
}

function deriveTripTitle(draft: JobDraft): string {
  const designation = draft.fields.designation.value.trim();
  return designation ? `${designation} Trip` : "Untitled trip";
}

export function buildTripWithAI(
  draft: JobDraft,
  opts: { difficulty: Difficulty; pipelineStageId: string; types?: StageType[] },
): Trip {
  const cards = deriveInferenceCards(draft);
  const spine = generateSpine(cards, draft);
  const stages = generateTripRounds(cards, draft, opts.types ?? DEFAULT_ROUND_TYPES, opts.difficulty);
  const now = Date.now();
  return {
    id: uid(),
    title: deriveTripTitle(draft),
    status: "draft",
    createdAt: now,
    updatedAt: now,
    inferenceCards: cards,
    inferenceCardsLocked: true,
    spine,
    spineGenerated: true,
    stages,
    aiPrefilled: true,
    difficulty: opts.difficulty,
    pipelineStageId: opts.pipelineStageId,
  };
}

export function rewriteRoundQuestions(
  stage: Stage,
  cards: InferenceCard[],
  _draft: JobDraft,
  difficulty: Difficulty,
): CustomQuestion[] {
  return questionsForType(stage.type, cards, difficulty);
}

/**
 * Rewrites a single `CustomQuestion` in place (keeping its id), reusing the same per-stage-type
 * generation branches as `questionsForType`/`rewriteRoundQuestions` — just scoped to produce one
 * question instead of a whole round. Backs the per-question Sparkle "rewrite with AI" control in
 * `QuestionBlock`/`RoundQuestionsCard`, as opposed to the existing whole-round rewrite button in
 * `TripRoundTabs.tsx`.
 */
export function rewriteSingleQuestion(
  type: StageType,
  question: CustomQuestion,
  cards: InferenceCard[],
  difficulty: Difficulty,
): CustomQuestion {
  const pool = questionsForType(type, cards, difficulty);
  if (pool.length === 0) {
    return { ...question };
  }
  const pick = pool[Math.floor(Math.random() * pool.length)] ?? pool[0]!;
  return { ...pick, id: question.id };
}

function lowerFirst(s: string): string {
  return s.length > 0 ? s[0].toLowerCase() + s.slice(1) : s;
}

function capitalize(s: string): string {
  return s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;
}

const SNIPPET_REWRITE_STYLES: Array<(s: string) => string> = [
  (s) => `Put simply, ${lowerFirst(s)}`,
  (s) => `In other words, ${lowerFirst(s)}`,
  (s) => `To rephrase: ${lowerFirst(s)}`,
  (s) => `${capitalize(s)} — reworded for clarity`,
];

/**
 * Rewrites a single highlighted snippet of a question prompt (not the whole question) — the
 * "fake AI" behind the inline text-selection "Rewrite" affordance in QuestionEditor. Follows
 * this file's existing convention of a templated/seeded transformation rather than a real LLM
 * call: the style is picked deterministically from the snippet's length (so the same input
 * always rewrites the same way, and the transformation is easy to unit test without mocking
 * randomness), and `difficulty` nudges the phrasing's register.
 */
export function rewriteTextSnippet(snippet: string, difficulty: Difficulty): string {
  const trimmed = snippet.trim();
  if (!trimmed) return snippet;

  const style = SNIPPET_REWRITE_STYLES[trimmed.length % SNIPPET_REWRITE_STYLES.length];
  const reworded = style(trimmed);

  if (difficulty === "hard") return `${reworded}, with specific, concrete detail`;
  if (difficulty === "easy") return `${reworded}, kept short and simple`;
  return reworded;
}
