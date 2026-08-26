import { describe, expect, it } from "vitest";
import {
  wizardBackAriaLabel,
  wizardBackTo,
  wizardTitle,
} from "./wizardHeader";

describe("wizardTitle", () => {
  it("stays Create a job on every wizard step", () => {
    expect(wizardTitle(1)).toBe("Create a job");
    expect(wizardTitle(2)).toBe("Create a job");
    expect(wizardTitle(3)).toBe("Create a job");
    expect(wizardTitle(4)).toBe("Create a job");
  });
});

describe("wizardBackTo", () => {
  it("returns the previous wizard page, or Jobs from step 1", () => {
    expect(wizardBackTo(1)).toBe("/");
    expect(wizardBackTo(2)).toBe("/create-job");
    expect(wizardBackTo(3)).toBe("/role-profile");
    expect(wizardBackTo(4)).toBe("/step-2");
  });
});

describe("wizardBackAriaLabel", () => {
  it("names the destination, not the current page", () => {
    expect(wizardBackAriaLabel(1)).toBe("Back to Jobs");
    expect(wizardBackAriaLabel(2)).toBe("Back to Step 1");
    expect(wizardBackAriaLabel(3)).toBe("Back to Role Profile");
    expect(wizardBackAriaLabel(4)).toBe("Back to Application");
  });
});
