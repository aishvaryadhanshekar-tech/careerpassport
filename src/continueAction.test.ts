import { describe, expect, it } from "vitest";
import { continueClickAction, continueEnabled } from "./continueAction";

describe("continueEnabled", () => {
  it("is off while recording or analysing", () => {
    expect(
      continueEnabled({
        recording: true,
        analysing: false,
        analysedOnce: true,
        hasContent: true,
      }),
    ).toBe(false);
    expect(
      continueEnabled({
        recording: false,
        analysing: true,
        analysedOnce: false,
        hasContent: true,
      }),
    ).toBe(false);
  });

  it("is off before the first analysis when there is nothing to extract", () => {
    expect(
      continueEnabled({
        recording: false,
        analysing: false,
        analysedOnce: false,
        hasContent: false,
      }),
    ).toBe(false);
  });

  it("is on when there is content to extract, even before the first analysis", () => {
    expect(
      continueEnabled({
        recording: false,
        analysing: false,
        analysedOnce: false,
        hasContent: true,
      }),
    ).toBe(true);
  });

  it("stays on after the first analysis even if fields are still missing", () => {
    expect(
      continueEnabled({
        recording: false,
        analysing: false,
        analysedOnce: true,
        hasContent: false,
      }),
    ).toBe(true);
  });
});

describe("continueClickAction", () => {
  it("navigates when all required fields are already covered", () => {
    expect(
      continueClickAction({ allCovered: true, hasContent: true }),
    ).toBe("navigate");
  });

  it("extracts when fields are missing and there is content", () => {
    expect(
      continueClickAction({ allCovered: false, hasContent: true }),
    ).toBe("analyse");
  });

  it("stays on the page when fields are missing and there is nothing to extract", () => {
    expect(
      continueClickAction({ allCovered: false, hasContent: false }),
    ).toBe("stay");
  });
});
