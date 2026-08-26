import { describe, expect, it } from "vitest";
import { applyExtraction } from "./applyAnalysis";
import { extractFromTranscript } from "./extractJobFields";
import { createDraft, GOLDEN_TRANSCRIPT } from "./types";

describe("applyExtraction", () => {
  it("fills empty fields from the extractor and leaves flags prompt on", () => {
    const next = applyExtraction(
      createDraft(),
      extractFromTranscript(GOLDEN_TRANSCRIPT),
    );
    expect(next.analysedOnce).toBe(true);
    expect(next.fields.designation.source).toBe("extracted");
    expect(next.fields.designation.value).toBe("Senior backend engineer");
    expect(next.salaryCurrency).toBe("INR");
    expect(next.flagsPromptShown).toBe(true);
    expect(Object.values(next.flags).some(Boolean)).toBe(false);
  });

  it("does not overwrite user-edited or already filled fields on re-analyse", () => {
    const first = applyExtraction(
      createDraft(),
      extractFromTranscript(GOLDEN_TRANSCRIPT),
    );
    first.fields.designation = {
      value: "Staff backend engineer",
      source: "user",
    };
    first.fields.location = { value: "", source: "empty" };
    const second = applyExtraction(
      first,
      extractFromTranscript(
        "Staff backend engineer, 5–8 years, Mumbai hybrid, ₹45–60L",
      ),
    );
    expect(second.fields.designation.value).toBe("Staff backend engineer");
    expect(second.fields.location.value).toBe("Mumbai");
    expect(second.fields.location.source).toBe("extracted");
  });

  it("never turns a flag back off", () => {
    const draft = createDraft();
    draft.flags.confidential = true;
    const next = applyExtraction(
      draft,
      extractFromTranscript("Senior backend engineer in Bangalore"),
    );
    expect(next.flags.confidential).toBe(true);
    expect(next.flagsPromptShown).toBe(false);
  });
});
