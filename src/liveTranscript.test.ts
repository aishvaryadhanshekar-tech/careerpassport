import { describe, expect, it } from "vitest";
import { liveInterimGap } from "./liveTranscript";

describe("liveInterimGap", () => {
  it("adds a space after committed text so interim stays on the same line", () => {
    expect(liveInterimGap("Senior engineer")).toBe(" ");
  });

  it("does not add a space after a trailing space or newline", () => {
    expect(liveInterimGap("Senior engineer ")).toBe("");
    expect(liveInterimGap("Senior engineer\n")).toBe("");
  });

  it("does not add a space when the field is empty", () => {
    expect(liveInterimGap("")).toBe("");
  });
});
