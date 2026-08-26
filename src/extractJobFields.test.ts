import { describe, expect, it } from "vitest";
import { extractFromTranscript } from "./extractJobFields";
import { GOLDEN_TRANSCRIPT } from "./types";

describe("extractFromTranscript", () => {
  it("extracts the golden ramble without inventing the rest", () => {
    const result = extractFromTranscript(GOLDEN_TRANSCRIPT);

    expect(result.fields.designation).toBe("Senior backend engineer");
    expect(result.fields.experienceYears).toBe("5–8");
    expect(result.fields.location).toBe("Bangalore");
    expect(result.fields.workMode).toBe("Hybrid");
    expect(result.fields.salary).toMatch(/45/);
    expect(result.fields.salary).toMatch(/60/);
    expect(result.fields.salary).toMatch(/₹|L/i);
    expect(result.salaryCurrency).toBe("INR");
    expect(result.fields.mustHaves).toBeTruthy();
    expect(result.fields.mustHaves!.toLowerCase()).toMatch(/payments|on-call/);
    expect(result.fields.industryType).toBeUndefined();
    expect(result.fields.companyType).toBeUndefined();
    expect(result.fields.experienceType).toBeUndefined();
    expect(result.fields.disqualifier).toBeUndefined();
    expect(result.fields.redFlags).toBeUndefined();
    expect(result.fields.searchStrategy).toBeUndefined();
    expect(result.flags).toEqual({});
  });

  it("detects confidential and search strategy from a longer brief", () => {
    const result = extractFromTranscript(
      "Confidential search. Avoid agencies. Red flag if they cannot ship. Look for them on LinkedIn. Need someone who has built B2B SaaS at a startup. Full-time. Deal-breaker if they want tickets only.",
    );
    expect(result.flags.confidential).toBe(true);
    expect(result.fields.searchStrategy?.toLowerCase()).toMatch(/linkedin/);
    expect(result.fields.industryType).toBe("B2B SaaS");
    expect(result.fields.companyType).toBe("Startup");
    expect(result.fields.experienceType).toBe("Full-time");
    expect(result.fields.redFlags?.toLowerCase()).toMatch(/red flag|deal/);
    expect(result.fields.disqualifier?.toLowerCase()).toMatch(/avoid/);
  });
});
