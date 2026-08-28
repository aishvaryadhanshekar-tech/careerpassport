import { describe, expect, it } from "vitest";
import {
  DEFAULT_ROUND_TYPES,
  buildTripWithAI,
  generateTripRounds,
  rewriteRoundQuestions,
} from "./tripAIBuild";
import { deriveInferenceCards } from "./tripInference";
import { createDraft, type CustomQuestion, type JobDraft } from "./types";

function draftWithContent(): JobDraft {
  const draft = createDraft();
  return {
    ...draft,
    preview: {
      ...draft.preview,
      idealCandidate: "Calm under pressure. Communicates clearly.",
      expectedSkills: "SQL. Data modelling. Stakeholder communication.",
    },
    fields: {
      ...draft.fields,
      redFlags: { value: "Blames others. Avoids feedback.", source: "user" },
    },
  };
}

describe("generateTripRounds", () => {
  it("produces exactly one stage per requested type, each with non-empty questions", () => {
    const draft = draftWithContent();
    const cards = deriveInferenceCards(draft);
    const stages = generateTripRounds(cards, draft);

    expect(stages).toHaveLength(DEFAULT_ROUND_TYPES.length);
    expect(stages.map((s) => s.type)).toEqual(DEFAULT_ROUND_TYPES);

    for (const stage of stages) {
      expect(stage.items.length).toBeGreaterThan(0);
      expect(new Set(stage.items.map((i) => i.id)).size).toBe(stage.items.length);
    }

    const ids = stages.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("generates the expected question type per stage type", () => {
    const draft = draftWithContent();
    const cards = deriveInferenceCards(draft);
    const stages = generateTripRounds(cards, draft, ["multiple_choice", "case_study", "rapid_fire"]);

    const mc = stages.find((s) => s.type === "multiple_choice")!;
    expect(mc.items.every((q) => q.type === "multiple_choice")).toBe(true);
    expect(mc.items.every((q) => q.options.length > 0)).toBe(true);

    const caseStudy = stages.find((s) => s.type === "case_study")!;
    expect(caseStudy.items.every((q) => q.type === "paragraph")).toBe(true);
    expect(caseStudy.items.length).toBeGreaterThanOrEqual(1);
    expect(caseStudy.items.length).toBeLessThanOrEqual(2);

    const rapidFire = stages.find((s) => s.type === "rapid_fire")!;
    expect(rapidFire.items.every((q) => q.type === "short_answer")).toBe(true);
  });

  it("respects a custom set of round types", () => {
    const draft = draftWithContent();
    const cards = deriveInferenceCards(draft);
    const stages = generateTripRounds(cards, draft, ["multiple_choice"]);
    expect(stages).toHaveLength(1);
    expect(stages[0].type).toBe("multiple_choice");
  });

  it("falls back to generic seed content when inference cards are empty", () => {
    const draft = createDraft();
    const cards = deriveInferenceCards(draft);
    const stages = generateTripRounds(cards, draft);
    for (const stage of stages) {
      expect(stage.items.length).toBeGreaterThan(0);
      for (const item of stage.items) {
        expect(item.prompt.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

describe("buildTripWithAI", () => {
  it("builds a full trip with spine, cards, and prefilled stages", () => {
    const draft = draftWithContent();
    const trip = buildTripWithAI(draft);

    expect(trip.aiPrefilled).toBe(true);
    expect(trip.inferenceCardsLocked).toBe(true);
    expect(trip.spineGenerated).toBe(true);
    expect(trip.spine.length).toBeGreaterThan(0);
    expect(trip.inferenceCards.length).toBeGreaterThan(0);
    expect(trip.stages).toHaveLength(DEFAULT_ROUND_TYPES.length);
    expect(trip.stages.every((s) => s.items.length > 0)).toBe(true);
  });
});

describe("rewriteRoundQuestions", () => {
  it("regenerates only the targeted stage's content shape", () => {
    const draft = draftWithContent();
    const cards = deriveInferenceCards(draft);
    const stages = generateTripRounds(cards, draft);
    const caseStudyStage = stages.find((s) => s.type === "case_study")!;

    const rewritten = rewriteRoundQuestions(caseStudyStage, cards, draft);

    expect(rewritten.length).toBeGreaterThan(0);
    expect(rewritten.every((q: CustomQuestion) => q.type === "paragraph")).toBe(true);
    // regenerated ids should be fresh, not reused from the original stage
    const originalIds = new Set(caseStudyStage.items.map((i) => i.id));
    expect(rewritten.every((q) => !originalIds.has(q.id))).toBe(true);
  });

  it("produces multiple_choice questions with options when targeting that stage type", () => {
    const draft = draftWithContent();
    const cards = deriveInferenceCards(draft);
    const stages = generateTripRounds(cards, draft);
    const mcStage = stages.find((s) => s.type === "multiple_choice")!;

    const rewritten = rewriteRoundQuestions(mcStage, cards, draft);
    expect(rewritten.every((q) => q.type === "multiple_choice" && q.options.length > 0)).toBe(true);
  });
});
