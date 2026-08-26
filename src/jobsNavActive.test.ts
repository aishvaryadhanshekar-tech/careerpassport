import { describe, expect, it } from "vitest";
import { jobsNavActive } from "./jobsNavActive";

describe("jobsNavActive", () => {
  it("is on for Jobs and the create-job wizard", () => {
    expect(jobsNavActive("/")).toBe(true);
    expect(jobsNavActive("/create-job")).toBe(true);
    expect(jobsNavActive("/step-2")).toBe(true);
    expect(jobsNavActive("/step-3")).toBe(true);
  });

  it("is off on Settings", () => {
    expect(jobsNavActive("/settings")).toBe(false);
  });
});
