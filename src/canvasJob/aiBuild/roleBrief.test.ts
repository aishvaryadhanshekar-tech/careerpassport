import { describe, expect, it } from "vitest";
import { createDraft } from "../../types";
import { baseFunnel, node } from "../funnelModel";
import { buildPipelineEdges, layoutPipeline } from "../pipelineModel";
import { buildProfileProposal, insightSummary } from "./aiBuildFixtures";
import { BRIEF_HUB_ID, BRIEF_SECTIONS, briefHandoffOpen, briefProgress } from "./buildPhase";

function briefCanvas() {
  const proposal = buildProfileProposal("We need a senior product designer in Berlin", createDraft());
  return { proposal, items: [...baseFunnel(), proposal.hub, ...proposal.sections] };
}

const prospects = () => node("stage", "Prospects", "job", "prospects");

describe("role brief", () => {
  it("drafts one hub with the four Role Profile sections under it", () => {
    const { proposal } = briefCanvas();
    expect(proposal.hub).toMatchObject({ id: BRIEF_HUB_ID, kind: "insight", insightKey: "hub", parent: "job" });
    expect(proposal.sections.map((s) => [s.id, s.insightKey, s.parent])).toEqual(
      BRIEF_SECTIONS.map((s) => [s.id, s.key, BRIEF_HUB_ID]),
    );
  });

  it("reads card copy from the live draft", () => {
    const { draft } = briefCanvas().proposal;
    expect(insightSummary("evaluation", draft)).toContain(`${draft.roleProfile.evaluationFramework.length} criteria`);
    const edited = {
      ...draft,
      roleProfile: { ...draft.roleProfile, headline: { value: "Design lead for payments", source: "user" as const } },
    };
    expect(insightSummary("summary", edited)).toContain("Design lead for payments");
  });

  it("lays sections out in a 2×2 grid beside the hub, off the job → stage spine", () => {
    const laid = layoutPipeline([...briefCanvas().items, prospects()]);
    const at = (id: string) => laid.find((item) => item.id === id)!.position;
    const hub = at(BRIEF_HUB_ID);
    const grid = BRIEF_SECTIONS.map((section) => at(section.id));
    expect(hub.x).toBe(0);
    expect(new Set(grid.map((p) => p.x)).size).toBe(2);
    expect(new Set(grid.map((p) => p.y)).size).toBe(2);
    expect(Math.min(...grid.map((p) => p.x))).toBeGreaterThan(hub.x + 260);
    expect(at("prospects").x).toBe(0);
    expect(at("prospects").y).toBeGreaterThan(hub.y);
  });

  it("routes the spine through the brief", () => {
    const ids = buildPipelineEdges([...briefCanvas().items, prospects()]).map((edge) => edge.id);
    expect(ids).toContain(`job->${BRIEF_HUB_ID}`);
    expect(ids).toContain(`${BRIEF_HUB_ID}->prospects`);
    expect(ids).not.toContain("job->prospects");
  });

  it("offers the pipeline hand-off only once drafted and before a pipeline exists", () => {
    const { items } = briefCanvas();
    expect(briefProgress(items)).toEqual({ reviewed: 0, total: 4 });
    const reviewed = items.map((item) => (item.parent === BRIEF_HUB_ID ? { ...item, reviewed: true } : item));
    expect(briefProgress(reviewed).reviewed).toBe(4);
    expect(briefHandoffOpen("reviewing", items)).toBe(true);
    expect(briefHandoffOpen("drafting", items)).toBe(false);
    expect(briefHandoffOpen("done", [...items, prospects()])).toBe(false);
  });
});
