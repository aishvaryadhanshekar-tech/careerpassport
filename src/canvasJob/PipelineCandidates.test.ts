import { describe, expect, it } from "vitest";
import { createDraft, DEFAULT_PIPELINE_STAGES } from "../types";
import type { DemoCandidate, DemoProject } from "../demo/types";
import { emptyOperations } from "../hiring/catalog";
import { seedBoard } from "../seedCandidates";
import { templateFunnel } from "./funnelModel";
import { migratePipeline } from "./pipelineModel";
import { needsDecision, candidateNextAction } from "./PipelineCandidates";

function fixture() {
  const candidate: DemoCandidate = { ...seedBoard().candidates[0], id: "candidate", stageId: "applied", tripStatus: "none", revisionId: null, answers: {}, stageEnteredAt: 0, visit: 0 };
  const project: DemoProject = {
    schemaVersion: 1, id: "job", updatedAt: 0, clock: 1000,
    configuration: { nodes: migratePipeline(templateFunnel("Engineer"), { stages: [...DEFAULT_PIPELINE_STAGES], candidates: [] }), draft: createDraft(), started: true, published: true },
    candidates: { candidate }, assignments: {}, deliveries: {}, revisions: {}, liveRevisionId: null, connections: {}, operations: emptyOperations(),
  };
  return { candidate, project };
}

describe("candidate decision indicators", () => {
  it("marks unassigned or completed trips for human review without using scores", () => {
    const { candidate, project } = fixture();
    expect(needsDecision(candidate, project)).toBe(true);
    for (const tripScore of [0, 50, 100]) expect(needsDecision({ ...candidate, tripStatus: "completed", tripScore }, project)).toBe(true);
    expect(needsDecision({ ...candidate, tripStatus: "sent" }, project)).toBe(false);
  });

  it("recognizes active assignments and pending tasks, including legacy round locations", () => {
    const { candidate, project } = fixture();
    const round = project.configuration.nodes.find(item => item.kind === "round" && item.parent === "interview")!;
    candidate.stageId = round.id;
    project.assignments.a = { id: "a", candidateId: candidate.id, nodeId: "trip", title: "Trip", instructions: "", duration: 20, status: "assigned" };
    expect(needsDecision(candidate, project)).toBe(false);
    project.operations!.tasks.task = { id: "task", candidateId: candidate.id, title: "Review feedback", type: "Feedback", assignedTo: "Recruiter", createdBy: "Recruiter", due: 2000, done: false };
    const snapshot = structuredClone(project);
    expect(needsDecision(candidate, project)).toBe(true);
    expect(project).toEqual(snapshot);
    project.operations!.tasks.task.done = true;
    expect(needsDecision(candidate, project)).toBe(false);
  });

  it("does not classify offered or archived candidates as pending stage decisions", () => {
    const { candidate, project } = fixture();
    for (const stageId of ["archive", "offered"]) expect(needsDecision({ ...candidate, stageId, tripStatus: "completed" }, project)).toBe(false);
  });
});

describe("candidate next actions",()=>{
  it("prioritizes a concrete pending task and never bases wording on scores",()=>{const {candidate,project}=fixture();project.operations!.tasks.task={id:'task',candidateId:candidate.id,title:'Call to verify experience',type:'Call',assignedTo:'Recruiter',createdBy:'Recruiter',due:10,done:false};expect(candidateNextAction(candidate,project)).toBe('Call to verify experience');project.operations!.tasks.task.done=true;for(const tripScore of [0,100])expect(candidateNextAction({...candidate,tripStatus:'completed',tripScore},project)).toBe('Review submitted response');});
  it("distinguishes waiting and terminal stages from review actions",()=>{const {candidate,project}=fixture();expect(candidateNextAction({...candidate,tripStatus:'sent'},project)).toBe('Await candidate response');expect(candidateNextAction({...candidate,stageId:'archive'},project)).toBe('Archived · view history');expect(candidateNextAction({...candidate,stageId:'offered'},project)).toBe('Follow up on offer');});
});
