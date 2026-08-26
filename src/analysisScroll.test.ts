import { describe, expect, it } from "vitest";
import {
  MISSING_DETAILS_ID,
  analysisRevealTarget,
  scrollOffsetToAlignTop,
} from "./analysisScroll";

describe("analysisRevealTarget", () => {
  it("scrolls to missing details when analysis leaves fields uncovered", () => {
    expect(analysisRevealTarget(3)).toBe(MISSING_DETAILS_ID);
  });

  it("does not scroll the page when every required field is covered", () => {
    expect(analysisRevealTarget(0)).toBeNull();
  });
});

describe("scrollOffsetToAlignTop", () => {
  it("pins the missing-details section to the top of the scroller", () => {
    expect(
      scrollOffsetToAlignTop({
        scrollerTop: 169,
        scrollerScrollTop: 0,
        targetTop: 520,
      }),
    ).toBe(351);
  });

  it("does not scroll above the top of the scroller", () => {
    expect(
      scrollOffsetToAlignTop({
        scrollerTop: 169,
        scrollerScrollTop: 0,
        targetTop: 120,
      }),
    ).toBe(0);
  });
});
