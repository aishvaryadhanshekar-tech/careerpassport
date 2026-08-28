import { uid } from "./files";
import { deriveInferenceCards } from "./tripInference";
import { generateSpine } from "./tripSpine";
import type { CustomQuestion, InferenceCard, InferenceCardId, JobDraft, Stage, StageType, Trip } from "./types";

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

function rapidFireQuestions(cards: InferenceCard[]): CustomQuestion[] {
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
  const count = Math.min(Math.max(source.length, 3), 5);
  return Array.from({ length: count }, (_, i) => {
    const seed = source[i % source.length];
    return question({
      prompt: seed,
      type: "multiple_choice",
      options: ["Serious", "Joking"],
    });
  });
}

function multipleChoiceQuestions(cards: InferenceCard[]): CustomQuestion[] {
  const evaluation = sentencesOf(cardContent(cards, "evaluationCriteria"));
  const skills = sentencesOf(cardContent(cards, "skills"));
  const seeds = [...evaluation, ...skills];
  const fallback = [
    "How would you evaluate a candidate's approach to this problem",
    "What matters most when applying this skill",
    "Which of the following best demonstrates this",
  ];
  const source = seeds.length > 0 ? seeds : fallback;
  const count = Math.min(Math.max(source.length, 3), 5);
  return Array.from({ length: count }, (_, i) => {
    const seed = source[i % source.length];
    return question({
      prompt: `Which option best reflects: ${seed}?`,
      type: "multiple_choice",
      options: ["Strongly agree", "Somewhat agree", "Neutral", "Disagree"],
    });
  });
}

function caseStudyQuestions(cards: InferenceCard[]): CustomQuestion[] {
  const idealCandidate = sentencesOf(cardContent(cards, "idealCandidate"));
  const redFlags = sentencesOf(cardContent(cards, "redFlags"));
  const seeds = [...idealCandidate, ...redFlags];
  const fallback = [
    "Walk through how you'd approach this situation from start to finish",
    "Describe a time your judgement was tested and how you handled it",
  ];
  const source = seeds.length > 0 ? seeds : fallback;
  const count = Math.min(Math.max(source.length, 1), 2);
  return Array.from({ length: count }, (_, i) => {
    const seed = source[i % source.length];
    return question({
      prompt: `Describe your approach in detail: ${seed}`,
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
    default:
      return "";
  }
}

function questionsForType(type: StageType, cards: InferenceCard[]): CustomQuestion[] {
  switch (type) {
    case "rapid_fire":
      return rapidFireQuestions(cards);
    case "multiple_choice":
      return multipleChoiceQuestions(cards);
    case "case_study":
      return caseStudyQuestions(cards);
    default:
      return [];
  }
}

export function generateTripRounds(
  cards: InferenceCard[],
  _draft: JobDraft,
  types: StageType[] = DEFAULT_ROUND_TYPES,
): Stage[] {
  return types.map((type) => ({
    id: uid(),
    type,
    spokenInstructions: spokenInstructionsFor(type),
    items: questionsForType(type, cards),
  }));
}

export function buildTripWithAI(draft: JobDraft): Trip {
  const cards = deriveInferenceCards(draft);
  const spine = generateSpine(cards, draft);
  const stages = generateTripRounds(cards, draft);
  const now = Date.now();
  return {
    id: uid(),
    title: "Untitled trip",
    status: "draft",
    createdAt: now,
    updatedAt: now,
    inferenceCards: cards,
    inferenceCardsLocked: true,
    spine,
    spineGenerated: true,
    stages,
    aiPrefilled: true,
  };
}

export function rewriteRoundQuestions(
  stage: Stage,
  cards: InferenceCard[],
  _draft: JobDraft,
): CustomQuestion[] {
  return questionsForType(stage.type, cards);
}
