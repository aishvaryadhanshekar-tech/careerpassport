import { describe, expect, it } from "vitest";
import {
  STANDARD_FIELD_IDS,
  defaultStandardFields,
} from "./applicationCatalog";
import { seedApplication } from "./seedApplication";
import { createDraft, type ApplicationConfig, type CustomQuestion } from "./types";

function questionsOf(config: ApplicationConfig) {
  return config.items.filter(
    (item): item is CustomQuestion => item.kind === "question",
  );
}

describe("createDraft application", () => {
  it("starts unseeded", () => {
    expect(createDraft().application).toBeNull();
  });
});

describe("seedApplication", () => {
  it("includes all 11 standard fields with 6 mandatory", () => {
    const config = seedApplication(createDraft());
    expect(config.standardOrder.map((field) => field.id)).toEqual([
      ...STANDARD_FIELD_IDS,
    ]);
    expect(config.standardOrder).toEqual(defaultStandardFields());
    expect(
      config.standardOrder.filter((field) => field.required === "mandatory"),
    ).toHaveLength(6);
  });

  it("uses generic company copy and four always-on questions when Step 1 is empty", () => {
    const config = seedApplication(createDraft());
    expect(config.context.company.shown).toBe(true);
    expect(config.context.role.shown).toBe(true);
    expect(config.context.company.text).toContain("Career Passport");
    expect(config.context.role.text.length).toBeGreaterThan(20);
    const questions = questionsOf(config);
    expect(questions).toHaveLength(4);
    expect(questions.map((q) => q.prompt)).toEqual([
      "Why are you interested in this role?",
      "Describe 1–2 key achievements most relevant to this role.",
      "How do you prefer to work? (Select all that apply)",
      "Are there any concerns or gaps you'd like us to know about?",
    ]);
    expect(questions[0]).toMatchObject({
      type: "paragraph",
      required: "mandatory",
    });
    expect(questions[2]).toMatchObject({
      type: "checkboxes",
      required: "optional",
    });
    expect(questions[2].options.length).toBeGreaterThan(3);
  });

  it("adds location, work mode, and salary questions from filled Step 1 fields", () => {
    const draft = createDraft();
    draft.fields.designation.value = "UI/UX Designer";
    draft.fields.location.value = "Bangalore";
    draft.fields.workMode.value = "Hybrid";
    draft.fields.salary.value = "₹45–60L";
    draft.salaryCurrency = "INR";
    draft.fields.companyType.value = "startup";
    draft.fields.industryType.value = "fintech";

    const config = seedApplication(draft);
    expect(config.context.company.text).toContain("startup");
    expect(config.context.company.text).toContain("fintech");
    expect(config.context.role.text).toContain("UI/UX Designer");
    expect(config.context.role.text).toContain("Bangalore");
    expect(config.context.role.text).toContain("Hybrid");
    expect(config.context.role.text).toContain("₹45–60L");

    const prompts = questionsOf(config).map((q) => q.prompt);
    expect(prompts).toContain(
      "Are you able to work at the specified location (Bangalore)?",
    );
    expect(prompts).toContain("What work mode do you prefer?");
    expect(prompts).toContain("What is your salary expectation (annual)?");
    expect(questionsOf(config)).toHaveLength(7);
  });
});
