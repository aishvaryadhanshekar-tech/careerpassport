import { describe, expect, it } from "vitest";
import {
  addQuestion,
  addQuestionOption,
  addSection,
  duplicateItem,
  mandatoryCount,
  removeQuestion,
  removeQuestionOption,
  removeStandardField,
  reorderItems,
  reorderStandardFields,
  restoreStandardField,
  setContextText,
  setQuestionRequirement,
  setQuestionType,
  setStandardFieldRequirement,
  toggleContextShown,
  updateQuestionOption,
  updateQuestionPrompt,
} from "./applicationForm";
import { seedApplication } from "./seedApplication";
import { createDraft, type CustomQuestion, type StandardFieldId } from "./types";

function seeded() {
  return seedApplication(createDraft());
}

function questionsOf(config: ReturnType<typeof seeded>) {
  return config.items.filter(
    (item): item is CustomQuestion => item.kind === "question",
  );
}

describe("applicationForm", () => {
  it("sets a standard field's requirement across skip/ask/require", () => {
    const id: StandardFieldId = "coverLetter";
    const required = setStandardFieldRequirement(seeded(), id, "mandatory");
    expect(
      required.standardOrder.find((f) => f.id === id)?.required,
    ).toBe("mandatory");
    const skipped = setStandardFieldRequirement(required, id, "skipped");
    expect(skipped.standardOrder.find((f) => f.id === id)?.required).toBe(
      "skipped",
    );
    const asked = setStandardFieldRequirement(skipped, id, "optional");
    expect(asked.standardOrder.find((f) => f.id === id)?.required).toBe(
      "optional",
    );
  });

  it("removes and restores a standard field", () => {
    const removed = removeStandardField(seeded(), "portfolioUrl");
    expect(removed.standardOrder.some((f) => f.id === "portfolioUrl")).toBe(
      false,
    );
    const restored = restoreStandardField(removed, "portfolioUrl");
    expect(restored.standardOrder.at(-1)?.id).toBe("portfolioUrl");
  });

  it("reorders standard fields and items", () => {
    const config = seeded();
    const reordered = reorderStandardFields(config, 0, 2);
    expect(reordered.standardOrder[2].id).toBe(config.standardOrder[0].id);
    const q = reorderItems(config, 0, 1);
    expect(q.items[1].id).toBe(config.items[0].id);
  });

  it("toggles context visibility and updates copy", () => {
    const hidden = toggleContextShown(seeded(), "company");
    expect(hidden.context.company.shown).toBe(false);
    const edited = setContextText(hidden, "role", "Edited role copy.");
    expect(edited.context.role.text).toBe("Edited role copy.");
  });

  it("adds, edits, and removes custom questions", () => {
    const added = addQuestion(seeded());
    expect(questionsOf(added)).toHaveLength(5);
    const created = questionsOf(added).at(-1)!;
    expect(created.type).toBe("short_answer");
    const renamed = updateQuestionPrompt(
      added,
      created.id,
      "What is your notice period?",
    );
    expect(questionsOf(renamed).at(-1)?.prompt).toBe(
      "What is your notice period?",
    );
    const dropped = removeQuestion(renamed, created.id);
    expect(questionsOf(dropped)).toHaveLength(4);
  });

  it("inserts a new question right after a given item", () => {
    const config = seeded();
    const firstId = config.items[0].id;
    const added = addQuestion(config, firstId);
    expect(added.items[1].id).not.toBe(config.items[1].id);
    expect(added.items[0].id).toBe(firstId);
  });

  it("adds a section with an auto-numbered title", () => {
    const config = seeded();
    const withSection = addSection(config);
    const section = withSection.items.at(-1)!;
    expect(section.kind).toBe("section");
    if (section.kind === "section") {
      expect(section.title).toBe("Section 2");
    }
  });

  it("duplicates a question right after the original", () => {
    const config = seeded();
    const originalId = config.items[0].id;
    const duplicated = duplicateItem(config, originalId);
    expect(duplicated.items).toHaveLength(config.items.length + 1);
    expect(duplicated.items[0].id).toBe(originalId);
    expect(duplicated.items[1].id).not.toBe(originalId);
    expect(duplicated.items[1]).toMatchObject({
      prompt: (config.items[0] as CustomQuestion).prompt,
    });
  });

  it("switching to multiple choice starts with two options; switching to short answer drops options", () => {
    const config = seeded();
    const shortId = config.items[0].id;
    const multi = setQuestionType(config, shortId, "multiple_choice");
    expect(questionsOf(multi)[0].type).toBe("multiple_choice");
    expect(questionsOf(multi)[0].options).toEqual(["", ""]);
    const back = setQuestionType(multi, shortId, "short_answer");
    expect(questionsOf(back)[0].options).toEqual([]);
  });

  it("edits option-based questions and toggles required", () => {
    const config = seeded();
    const multiId = questionsOf(config)[2].id;
    const extra = addQuestionOption(config, multiId);
    expect(questionsOf(extra)[2].options.length).toBe(
      questionsOf(config)[2].options.length + 1,
    );
    const labeled = updateQuestionOption(extra, multiId, 0, "Pair programming");
    expect(questionsOf(labeled)[2].options[0]).toBe("Pair programming");
    const trimmed = removeQuestionOption(labeled, multiId, 0);
    expect(questionsOf(trimmed)[2].options).not.toContain("Pair programming");
    const required = setQuestionRequirement(config, multiId, "mandatory");
    expect(questionsOf(required)[2].required).toBe("mandatory");
  });

  it("counts mandatory standard fields plus mandatory questions", () => {
    expect(mandatoryCount(seeded())).toBe(8);
  });
});
