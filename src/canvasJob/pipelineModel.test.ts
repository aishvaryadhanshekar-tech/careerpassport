import { describe, expect, it } from "vitest";
import { DEFAULT_PIPELINE_STAGES, type PipelineBoard } from "../types";
import { baseFunnel, node, templateFunnel } from "./funnelModel";
import { buildPipelineEdges, candidateStageNode, hardRuleResult, insertPipelineStage, layoutPipeline, migratePipeline, pipelineStages, pipelineVisibleNodes, reorderPipelineStage, type PipelineRule } from "./pipelineModel";

const board: PipelineBoard = { stages: [...DEFAULT_PIPELINE_STAGES], candidates: [] };

describe("pipeline draft migration", () => {
  it("keeps scratch canvases unexpanded", () => {
    const scratch = baseFunnel();
    expect(migratePipeline(scratch, board)).toEqual([{ ...scratch[0], pipelineVersion: 2 }]);
    expect(scratch[0].pipelineVersion).toBeUndefined();
  });

  it("is idempotent and preserves original node IDs, positions, content, settings and parent links", () => {
    const original = templateFunnel("Designer");
    original.find(item => item.id === "pipeline")!.title = "Portfolio shortlist";
    const trip = original.find(item => item.kind === "trip")!;
    trip.position = { x: -170, y: 560 };
    trip.tripId = "full-trip-42";
    const communication = original.find(item => item.kind === "communication")!;
    communication.trigger = "When score below threshold";
    communication.description = "Existing follow-up instruction";
    const capability = node("capability", "Assessment studio", "job", "cap-assessments");
    capability.capability = "assessments";
    original.push(capability);
    const snapshot = structuredClone(original);
    const migrated = migratePipeline(original, board);
    expect(original).toEqual(snapshot);
    expect(migratePipeline(migrated, board)).toEqual(migrated);
    for (const item of original) {
      const kept = migrated.find(value => value.id === item.id)!;
      expect(kept).toBeDefined();
      expect(kept.parent).toBe(item.parent);
      expect(kept.position).toEqual(item.position);
      expect(kept.body).toEqual(item.body);
      expect(kept.threshold).toEqual(item.threshold);
    }
    expect(migrated.find(item => item.id === trip.id)).toEqual(trip);
    expect(migrated.find(item => item.id === "pipeline")?.title).toBe("Portfolio shortlist");
    expect(migrated.find(item => item.id === "interview")?.title).toBe("Interviewing");
    expect(migrated.find(item => item.id === communication.id)).toMatchObject({ active: false, trigger: communication.trigger });
    expect(migrated.find(item => item.id === communication.id)?.description).toContain("Existing follow-up instruction");
    expect(migrated.find(item => item.id === capability.id)?.title).toBe("Trips library");
    expect(pipelineVisibleNodes(migrated).some(item => item.id === capability.id)).toBe(false);
    expect(pipelineStages(migrated).map(item => item.stageKey)).toEqual([undefined, "applied", "screened", "submitted", "interviewing", "offered", "archive"]);
    expect(migrated.every(item => !item.parent || migrated.some(parent => parent.id === item.parent))).toBe(true);
  });

  it("maps both explicit board locations and old round locations without altering candidate records", () => {
    const original = templateFunnel("Engineer");
    const round = original.find(item => item.kind === "round")!;
    const migrated = migratePipeline(original, { ...board, stages: [...board.stages, { id: round.id, label: round.title, removable: true }, { id: "reference", label: "References", removable: true }] });
    expect(candidateStageNode(migrated, "screened")?.id).toBe("pipeline");
    expect(candidateStageNode(migrated, round.id)?.id).toBe("interview");
    expect(pipelineStages(migrated).some(item => item.stageKey === round.id)).toBe(false);
    expect(candidateStageNode(migrated, "reference")?.stageKey).toBe("reference");
    expect(candidateStageNode(migrated, "missing")).toBeUndefined();
  });
});

describe("pipeline structure and outcomes", () => {
  it("inserts and reorders stages without losing activity links or saved positions", () => {
    const original = migratePipeline(templateFunnel("Engineer"), board);
    const inserted = insertPipelineStage(original, "pipeline", "Reference check");
    const added = inserted.find(item => !original.some(value => value.id === item.id))!;
    expect(added.stageKey).toBe(added.id);
    const stages = pipelineStages(inserted);
    expect(stages[stages.findIndex(item => item.id === "pipeline") + 1]).toBe(added);
    const reordered = reorderPipelineStage(inserted, added.id, -1);
    expect(pipelineStages(reordered)[pipelineStages(reordered).findIndex(item => item.id === "pipeline") - 1]).toBe(added);
    for (const item of original) expect(reordered.find(value => value.id === item.id)).toEqual(item);
    expect(reorderPipelineStage(original, "archive", -1)).toBe(original);
    expect(insertPipelineStage(original, "archive", "After exit")).toBe(original);
  });

  it("routes an existing transition through an inserted stage while preserving failure attachments", () => {
    const original = migratePipeline(templateFunnel("Engineer"), board);
    const activity = original.find(item => item.id === "eligibility-check")!;
    activity.destinationId = "pipeline";
    const inserted = insertPipelineStage(original, activity.parent!, "Screening review");
    const added = inserted.find(item => !original.some(value => value.id === item.id))!;
    expect(inserted.find(item => item.id === activity.id)?.destinationId).toBe(added.id);
    const edges = buildPipelineEdges(inserted);
    expect(edges).toContainEqual(expect.objectContaining({ source: activity.id, target: added.id, outcome: "success" }));
    expect(edges).toContainEqual(expect.objectContaining({ source: "eligibility-thank-you", target: "archive", outcome: "failure" }));
  });

  it("keeps stages vertical, activities between stages and archive off the happy path", () => {
    const items = migratePipeline(templateFunnel("Engineer"), board);
    const layout = layoutPipeline(items);
    const stages = pipelineStages(layout).filter(item => !item.exit);
    expect(stages.every(item => item.position!.x === 0)).toBe(true);
    for (let i = 0; i < stages.length - 1; i++) {
      expect(stages[i + 1].position!.y).toBeGreaterThan(stages[i].position!.y);
      const children = layout.filter(item => item.parent === stages[i].id && item.kind !== "communication");
      for (const child of children) {
        expect(child.position.y).toBeGreaterThan(stages[i].position!.y);
        expect(child.position.y).toBeLessThan(stages[i + 1].position!.y);
      }
    }
    expect(layout.find(item => item.exit)?.position.x).toBe(650);
    const edges = buildPipelineEdges(items);
    expect(edges.some(edge => edge.source === "offered" && edge.target === "archive")).toBe(false);
    expect(edges).toContainEqual(expect.objectContaining({ source: "eligibility-check", target: "eligibility-thank-you", outcome: "failure" }));
    expect(edges).toContainEqual(expect.objectContaining({ source: "eligibility-thank-you", target: "archive", outcome: "failure" }));
    expect(edges).toContainEqual(expect.objectContaining({ source: "eligibility-check", target: "pipeline", outcome: "success" }));
    expect(edges.every(edge => layout.some(item => item.id === edge.source) && layout.some(item => item.id === edge.target))).toBe(true);
  });

  it("retains manually moved coordinates and keeps remaining layout stable on collapse", () => {
    const items = migratePipeline(templateFunnel("Engineer"), board);
    const before = layoutPipeline(items);
    const stage = items.find(item => item.id === "pipeline")!;
    const previous = before.find(item => item.id === stage.id)!.position;
    const moved = items.map(item => item.id === stage.id ? { ...item, position: { x: previous.x + 50, y: previous.y + 60 } } : item);
    const after = layoutPipeline(moved);
    expect(after.find(item => item.id === stage.id)!.position).toEqual({ x: 50, y: previous.y + 60 });
    const child = items.find(item => item.parent === stage.id && item.kind === "trip")!;
    expect(after.find(item => item.id === child.id)!.position.y).toBe(before.find(item => item.id === child.id)!.position.y + 60);
    expect(layoutPipeline(moved.map(item => item.id === stage.id ? { ...item, collapsed: true } : item)).find(item => item.id === "interview")!.position).toEqual(after.find(item => item.id === "interview")!.position);
  });
});

describe("explicit hard rules", () => {
  const rules: PipelineRule[] = [
    { id: "domain", field: "domain", operator: "not_contains", value: "design", enabled: true },
    { id: "experience", field: "experience", operator: "less_than", value: "3", enabled: true },
  ];
  it("uses only explicit evidence and thresholds, with no score input", () => {
    expect(hardRuleResult(rules, { domain: "Product DESIGN", experience: 3 })).toEqual({ result: "pass", reasons: [] });
    expect(hardRuleResult(rules, { domain: "Accounting", experience: 2 })).toEqual({ result: "fail", reasons: ["Domain does not include design.", "Experience is below 3 years."] });
    expect(hardRuleResult([], {})).toEqual({ result: "pass", reasons: [] });
  });
  it("routes missing or ambiguous evidence and invalid rules to human review", () => {
    expect(hardRuleResult(rules, {}).result).toBe("review");
    expect(hardRuleResult(rules, { domain: "Unknown", experience: 5 }).result).toBe("review");
    expect(hardRuleResult(rules, { domain: "design", experience: "2–5" }).result).toBe("review");
    expect(hardRuleResult([{ ...rules[1], value: "" }], { experience: 8 }).result).toBe("review");
    expect(hardRuleResult(rules.map(rule => ({ ...rule, enabled: false })), {}).result).toBe("pass");
  });
});
