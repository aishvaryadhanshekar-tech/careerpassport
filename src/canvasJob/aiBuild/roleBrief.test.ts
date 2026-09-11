import { describe, expect, it } from "vitest";
import { createDraft } from "../../types";
import { baseFunnel, node } from "../funnelModel";
import { buildPipelineEdges, layoutPipeline } from "../pipelineModel";
import { briefHub, buildProfileProposal, insightSummary } from "./aiBuildFixtures";
import { BRIEF_CARD_SIZE, BRIEF_HUB_ID, briefHandoffOpen, briefProgress, withSectionReviewed } from "./buildPhase";

const briefCanvas = () => [...baseFunnel(), briefHub()];
const prospects = () => node("stage", "Prospects", "job", "prospects");

describe("role brief", () => {
  it("is one card on the job, with no section nodes under it", () => {
    const items = briefCanvas();
    expect(items.find((item) => item.id === BRIEF_HUB_ID)).toMatchObject({ kind: "insight", insightKey: "hub", parent: "job" });
    expect(items.some((item) => item.parent === BRIEF_HUB_ID)).toBe(false);
    expect(layoutPipeline([...items, prospects()]).some((item) => item.parent === BRIEF_HUB_ID)).toBe(false);
  });

  it("reads card copy from the live draft", () => {
    const { draft } = buildProfileProposal("We need a senior product designer in Berlin", createDraft());
    expect(insightSummary("evaluation", draft)).toContain(`${draft.roleProfile.evaluationFramework.length} criteria`);
    const edited = {
      ...draft,
      roleProfile: { ...draft.roleProfile, headline: { value: "Design lead for payments", source: "user" as const } },
    };
    expect(insightSummary("summary", edited)).toContain("Design lead for payments");
  });

  it("sits on the job → stage spine, with the first stage clear of the taller card", () => {
    const laid = layoutPipeline([...briefCanvas(), prospects()]);
    const at = (id: string) => laid.find((item) => item.id === id)!.position;
    const hub = at(BRIEF_HUB_ID);
    expect(hub.x).toBe(0);
    expect(hub.y).toBeGreaterThan(at("job").y);
    expect(at("prospects").x).toBe(0);
    expect(at("prospects").y - hub.y).toBeGreaterThanOrEqual(BRIEF_CARD_SIZE.height);
  });

  it("routes the spine through the brief", () => {
    const ids = buildPipelineEdges([...briefCanvas(), prospects()]).map((edge) => edge.id);
    expect(ids).toContain(`job->${BRIEF_HUB_ID}`);
    expect(ids).toContain(`${BRIEF_HUB_ID}->prospects`);
    expect(ids).not.toContain("job->prospects");
  });

  it("offers the pipeline hand-off only once drafted and before a pipeline exists", () => {
    const items = briefCanvas();
    expect(briefProgress(items)).toEqual({ reviewed: 0, total: 4 });
    const reviewed = (["summary", "requirements", "sourcing", "evaluation"] as const).reduce(withSectionReviewed, items);
    expect(briefProgress(reviewed).reviewed).toBe(4);
    expect(briefHandoffOpen("reviewing", items)).toBe(true);
    expect(briefHandoffOpen("drafting", items)).toBe(false);
    expect(briefHandoffOpen("done", [...items, prospects()])).toBe(false);
  });
});
