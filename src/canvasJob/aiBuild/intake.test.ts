import { describe, expect, it } from "vitest";
import { readWhere } from "./intake";

describe("assistant intake", () => {
  it("reads seniority, work mode and location from free text", () => {
    expect(readWhere("Senior · Hybrid, London")).toEqual({ seniority: "Senior", workMode: "Hybrid", location: "London" });
    expect(readWhere("Mid-level · Remote")).toEqual({ seniority: "Mid-level", workMode: "Remote", location: undefined });
    expect(readWhere("Lead, on-site in Bangalore").location).toBe("Bangalore");
  });
});
