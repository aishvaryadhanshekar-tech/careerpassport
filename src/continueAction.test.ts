import { describe, expect, it } from "vitest";
import { continueEnabled, generateEnabled, generateLabel } from "./continueAction";

describe("continueEnabled", () => {
  it("is off while recording or analysing, even if everything is covered", () => {
    expect(
      continueEnabled({ recording: true, analysing: false, allCovered: true }),
    ).toBe(false);
    expect(
      continueEnabled({ recording: false, analysing: true, allCovered: true }),
    ).toBe(false);
  });

  it("is off until every required field is covered", () => {
    expect(
      continueEnabled({
        recording: false,
        analysing: false,
        allCovered: false,
      }),
    ).toBe(false);
  });

  it("is on once every required field is covered", () => {
    expect(
      continueEnabled({ recording: false, analysing: false, allCovered: true }),
    ).toBe(true);
  });
});

describe("generateEnabled", () => {
  it("is off while recording or analysing", () => {
    expect(
      generateEnabled({ recording: true, analysing: false, hasContent: true }),
    ).toBe(false);
    expect(
      generateEnabled({ recording: false, analysing: true, hasContent: true }),
    ).toBe(false);
  });

  it("is off when there is nothing to extract", () => {
    expect(
      generateEnabled({
        recording: false,
        analysing: false,
        hasContent: false,
      }),
    ).toBe(false);
  });

  it("is on when there is content to extract", () => {
    expect(
      generateEnabled({ recording: false, analysing: false, hasContent: true }),
    ).toBe(true);
  });
});

describe("generateLabel", () => {
  it("cycles through the build phases while analysing", () => {
    expect(
      generateLabel({ analysing: true, analysedOnce: false, buildPhase: 0 }),
    ).toBe("Reading your notes…");
    expect(
      generateLabel({ analysing: true, analysedOnce: false, buildPhase: 1 }),
    ).toBe("Structuring the role…");
    expect(
      generateLabel({ analysing: true, analysedOnce: false, buildPhase: 2 }),
    ).toBe("Building your role…");
  });

  it("wraps back to the first phase past the end", () => {
    expect(
      generateLabel({ analysing: true, analysedOnce: true, buildPhase: 3 }),
    ).toBe("Reading your notes…");
  });

  it("defaults to the first phase when no buildPhase is given", () => {
    expect(generateLabel({ analysing: true, analysedOnce: false })).toBe(
      "Reading your notes…",
    );
  });

  it("invites the first analysis before one has run", () => {
    expect(generateLabel({ analysing: false, analysedOnce: false })).toBe(
      "Build with AI",
    );
  });

  it("offers to rebuild once the first pass has run", () => {
    expect(generateLabel({ analysing: false, analysedOnce: true })).toBe(
      "Re-build with AI",
    );
  });
});
