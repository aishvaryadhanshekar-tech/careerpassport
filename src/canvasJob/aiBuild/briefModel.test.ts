import { describe, expect, it } from "vitest";
import { baseFunnel, node } from "../funnelModel";
import { briefHub } from "./aiBuildFixtures";
import {
  ANALYSING_MS,
  BRIEF_GENERATION_MS,
  BRIEF_HUB_ID,
  BRIEF_READING_LABEL,
  BRIEF_READY_LABEL,
  BRIEF_SECTIONS,
  DRAFT_STEP_MS,
  briefGenerationAt,
  briefProgress,
  briefReviewed,
  briefSectionViews,
  migrateBriefSections,
  nextUnreviewed,
  withSectionReviewed,
} from "./buildPhase";

const canvas = () => [...baseFunnel(), briefHub()];

describe("role brief model", () => {
  it("steps through reading, one section per step, then ready, in about 8–9 seconds", () => {
    expect(BRIEF_GENERATION_MS).toBeGreaterThanOrEqual(8000);
    expect(BRIEF_GENERATION_MS).toBeLessThanOrEqual(9000);
    expect(briefGenerationAt(0)).toEqual({ label: BRIEF_READING_LABEL, ready: [] });
    expect(briefGenerationAt(ANALYSING_MS)).toEqual({ label: BRIEF_SECTIONS[0].drafting, ready: [] });
    expect(briefGenerationAt(ANALYSING_MS + DRAFT_STEP_MS * 2 + 1).ready).toEqual(["summary", "requirements"]);
    expect(briefGenerationAt(BRIEF_GENERATION_MS)).toEqual({
      label: BRIEF_READY_LABEL,
      ready: ["summary", "requirements", "sourcing", "evaluation"],
    });
  });

  it("ticks sections on the hub, in order and only once", () => {
    let items = withSectionReviewed(canvas(), "sourcing");
    items = withSectionReviewed(withSectionReviewed(items, "summary"), "sourcing");
    expect(briefReviewed(items)).toEqual(["summary", "sourcing"]);
    expect(briefProgress(items)).toEqual({ reviewed: 2, total: 4 });
  });

  it("walks to the next unreviewed section, wrapping round", () => {
    expect(nextUnreviewed([])).toBe("summary");
    expect(nextUnreviewed(["summary"], "summary")).toBe("requirements");
    expect(nextUnreviewed(["requirements", "sourcing", "evaluation"], "evaluation")).toBe("summary");
    expect(nextUnreviewed(["summary", "requirements", "sourcing", "evaluation"])).toBeNull();
  });

  it("shows tiles pending while generating, then ready, then reviewed", () => {
    const items = withSectionReviewed(canvas(), "summary");
    const generating = briefSectionViews(canvas(), { label: "", ready: ["summary"] });
    expect(generating.map((view) => view.status)).toEqual(["ready", "pending", "pending", "pending"]);
    expect(briefSectionViews(items, null).map((view) => view.status)).toEqual(["reviewed", "ready", "ready", "ready"]);
  });

  it("migrates legacy section nodes into ticks on the hub", () => {
    const legacy = [
      ...canvas(),
      { ...node("insight", "Role summary", BRIEF_HUB_ID, "ai-brief-summary"), insightKey: "summary" as const, reviewed: true },
      { ...node("insight", "Requirements", BRIEF_HUB_ID, "ai-brief-requirements"), insightKey: "requirements" as const },
    ];
    const migrated = migrateBriefSections(legacy);
    expect(migrated.some((item) => item.id.startsWith("ai-brief-"))).toBe(false);
    expect(migrated.find((item) => item.id === BRIEF_HUB_ID)?.reviewedSections).toEqual(["summary"]);
    const current = canvas();
    expect(migrateBriefSections(current)).toBe(current);
  });
});
