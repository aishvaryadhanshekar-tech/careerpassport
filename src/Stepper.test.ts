import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import {
  STEPS,
  Stepper,
  isStepCurrent,
  isStepReachable,
  stepPath,
  stepperAriaLabel,
} from "./Stepper";

describe("STEPS", () => {
  it("names the four steps with short blurbs", () => {
    expect(STEPS).toEqual([
      { index: 1, name: "Job details", blurb: "Talk, paste, or attach" },
      { index: 2, name: "Role Profile", blurb: "Review & refine" },
      { index: 3, name: "Application", blurb: "What to ask" },
      { index: 4, name: "Preview", blurb: "Review & confirm" },
    ]);
  });
});

describe("isStepCurrent", () => {
  it("is true only for the current step", () => {
    expect(isStepCurrent(1, 1)).toBe(true);
    expect(isStepCurrent(1, 2)).toBe(false);
    expect(isStepCurrent(2, 1)).toBe(false);
    expect(isStepCurrent(2, 2)).toBe(true);
  });
});

describe("stepperAriaLabel", () => {
  it("announces the current named step", () => {
    expect(stepperAriaLabel(1)).toBe("Step 1 of 4, Job details");
    expect(stepperAriaLabel(2)).toBe("Step 2 of 4, Role Profile");
  });
});

describe("stepPath", () => {
  it("maps each step to its wizard route", () => {
    expect(stepPath(1)).toBe("/create-job");
    expect(stepPath(2)).toBe("/role-profile");
    expect(stepPath(3)).toBe("/step-2");
    expect(stepPath(4)).toBe("/step-3");
  });
});

describe("isStepReachable", () => {
  it("lets the user go back to completed steps only", () => {
    expect(isStepReachable(2, 1)).toBe(true);
    expect(isStepReachable(2, 2)).toBe(false);
    expect(isStepReachable(2, 3)).toBe(false);
    expect(isStepReachable(1, 1)).toBe(false);
    expect(isStepReachable(1, 2)).toBe(false);
    expect(isStepReachable(3, 1)).toBe(true);
    expect(isStepReachable(3, 2)).toBe(true);
    expect(isStepReachable(3, 3)).toBe(false);
  });
});

describe("Stepper", () => {
  it("links Job details to the collect-job route when Role Profile is current", () => {
    const html = renderToString(
      createElement(
        MemoryRouter,
        null,
        createElement(Stepper, { current: 2 }),
      ),
    );
    expect(html).toContain('href="/create-job"');
    expect(html).toContain("Job details");
    expect(html).not.toContain('href="/role-profile"');
    expect(html).not.toContain('href="/step-2"');
    expect(html).not.toContain('href="/step-3"');
  });

  it("does not link any step while Job details is current", () => {
    const html = renderToString(
      createElement(
        MemoryRouter,
        null,
        createElement(Stepper, { current: 1 }),
      ),
    );
    expect(html).not.toContain("href=");
  });
});
