import { describe, expect, it } from "vitest";
import {
  REQUIRED_COVERAGE_IDS,
  coveredCount,
  createDraft,
} from "./types";

describe("required coverage", () => {
  it("only requires the core role-basics fields", () => {
    expect(REQUIRED_COVERAGE_IDS).not.toContain("companyType");
    expect(REQUIRED_COVERAGE_IDS).not.toContain("experienceType");
    expect(REQUIRED_COVERAGE_IDS).not.toContain("mustHaves");
    expect(REQUIRED_COVERAGE_IDS).not.toContain("disqualifier");
    expect(REQUIRED_COVERAGE_IDS).not.toContain("redFlags");
    expect(REQUIRED_COVERAGE_IDS).not.toContain("searchStrategy");
    expect(REQUIRED_COVERAGE_IDS).not.toContain("evaluationCriteria");
    expect(REQUIRED_COVERAGE_IDS).toHaveLength(6);
  });

  it("does not count a filled disqualifier toward coverage", () => {
    const draft = createDraft();
    draft.fields.disqualifier = { value: "Avoid agencies", source: "user" };
    expect(coveredCount(draft.fields, draft.salaryCurrency)).toBe(0);
  });

  it("counts a filled required field even when disqualifier is empty", () => {
    const draft = createDraft();
    draft.fields.designation = { value: "Engineer", source: "user" };
    expect(coveredCount(draft.fields, draft.salaryCurrency)).toBe(1);
  });
});
