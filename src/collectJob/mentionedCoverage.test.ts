import { describe, expect, it } from "vitest";
import { mentionedCoverage } from "./mentionedCoverage";
import { GOLDEN_TRANSCRIPT, REQUIRED_COVERAGE_IDS, createDraft } from "../types";

describe("mentionedCoverage", () => {
  it("is empty for a blank draft", () => {
    expect(mentionedCoverage(createDraft()).size).toBe(0);
  });

  it("detects fields from the raw transcript before any form field is filled", () => {
    const draft = { ...createDraft(), transcript: GOLDEN_TRANSCRIPT };
    const mentioned = mentionedCoverage(draft);
    // Nothing has been written into draft.fields yet — this is transcript-only detection.
    expect(mentioned.size).toBeGreaterThan(0);
    expect(mentioned.has("designation")).toBe(true);
    expect(mentioned.has("location")).toBe(true);
  });

  it("counts a filled form field even when the transcript is empty", () => {
    const base = createDraft();
    const draft = {
      ...base,
      fields: { ...base.fields, location: { value: "Bangalore", source: "user" as const } },
    };
    expect(mentionedCoverage(draft).has("location")).toBe(true);
  });

  it("does not count salary without a currency", () => {
    const base = createDraft();
    const withAmount = {
      ...base,
      fields: { ...base.fields, salary: { value: "40", source: "user" as const } },
      salaryCurrency: null,
    };
    expect(mentionedCoverage(withAmount).has("salary")).toBe(false);

    const withCurrency = { ...withAmount, salaryCurrency: "INR" as const };
    expect(mentionedCoverage(withCurrency).has("salary")).toBe(true);
  });

  it("never reports more than the required-field count", () => {
    const draft = { ...createDraft(), transcript: GOLDEN_TRANSCRIPT };
    expect(mentionedCoverage(draft).size).toBeLessThanOrEqual(REQUIRED_COVERAGE_IDS.length);
  });
});
