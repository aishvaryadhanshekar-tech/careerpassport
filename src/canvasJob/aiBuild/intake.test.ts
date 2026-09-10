import { describe, expect, it } from "vitest";
import { createDraft } from "../../types";
import { buildProfileProposal } from "./aiBuildFixtures";
import { applyIntake, composeBrief, readWhere } from "./intake";

const answers = { role: "Software Engineer", where: "Senior · Hybrid, London", musts: "Go, distributed systems" };

describe("assistant intake", () => {
  it("reads seniority, work mode and location from one answer", () => {
    expect(readWhere("Senior · Hybrid, London")).toEqual({ seniority: "Senior", workMode: "Hybrid", location: "London" });
    expect(readWhere("Mid-level · Remote")).toEqual({ seniority: "Mid-level", workMode: "Remote", location: undefined });
    expect(readWhere("Lead, on-site in Bangalore").location).toBe("Bangalore");
  });

  it("writes the answers as user-owned draft fields", () => {
    const { fields } = applyIntake(answers, createDraft());
    expect(fields.designation).toEqual({ value: "Senior Software Engineer", source: "user" });
    expect(fields.workMode.value).toBe("Hybrid");
    expect(fields.location.value).toBe("London");
    expect(fields.mustHaves.value).toBe("Go, distributed systems");
  });

  it("keeps an explicit seniority in the title and ignores a skipped must-haves answer", () => {
    const draft = createDraft();
    const { fields } = applyIntake({ role: "Lead Designer", where: "Senior · Remote", musts: "Skip" }, draft);
    expect(fields.designation.value).toBe("Lead Designer");
    expect(fields.mustHaves).toEqual(draft.fields.mustHaves);
    expect(composeBrief({ role: "Lead Designer", musts: "skip" })).toBe("Hiring a Lead Designer.");
  });

  it("feeds the drafted brief so the answers beat fixture data", () => {
    const proposal = buildProfileProposal(composeBrief(answers), applyIntake(answers, createDraft()));
    expect(proposal.role).toBe("Senior Software Engineer");
    expect(proposal.draft.fields.location.value).toBe("London");
    expect(proposal.draft.fields.mustHaves.value).toBe("Go, distributed systems");
  });
});
