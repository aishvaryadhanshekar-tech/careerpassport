import { describe, expect, it } from "vitest";
import { newJobDraft, newJobNodes, SPD_ROLE, isSeniorProductDesigner } from "../../demo/seniorProductDesigner";
import { demoDraft } from "../../demo/fixtures";
import { splitPoints } from "../../formControlUtils";
import { withCapabilities } from "../../hiring/catalog";
import { COVERAGE_IDS, DEFAULT_PIPELINE_STAGES, createDraft, type CustomQuestion, type JobDraft } from "../../types";
import { baseFunnel, publishErrors, type FunnelNode } from "../funnelModel";
import { migratePipeline, needsPipelineExpansion } from "../pipelineModel";
import { migratePipelineTrips } from "../pipelineTrips";
import { buildProfileProposal, insightSummary, proposeStages, readPromptFacts, stageNodesFor } from "./aiBuildFixtures";
import { MOCK_PRODUCT_DESIGNER_JD, readDocuments, withDocumentText, withoutDocumentText } from "./mockJd";

const board = () => ({ stages: [...DEFAULT_PIPELINE_STAGES], candidates: [] });
const questions = (draft: JobDraft) =>
  (draft.application?.items ?? []).filter((item): item is CustomQuestion => item.kind === "question");

function expectConnected(nodes: FunnelNode[]) {
  const ids = nodes.map((item) => item.id);
  expect(new Set(ids).size).toBe(ids.length);
  for (const item of nodes) if (item.parent) expect(ids).toContain(item.parent);
}

describe("deep Senior Product Designer dataset", () => {
  const draft = newJobDraft(SPD_ROLE);

  it("recognises designer titles only", () => {
    expect(["Senior Product Designer", "Product Designer", "UX Designer", "UI/UX Designer"].every(isSeniorProductDesigner)).toBe(true);
    expect(["Software Engineer", "Account Executive", "Graphic designer"].some(isSeniorProductDesigner)).toBe(false);
  });

  it("fills every role field, in INR", () => {
    for (const id of COVERAGE_IDS) expect(draft.fields[id].value.trim(), id).not.toBe("");
    expect(draft.fields).toMatchObject({
      location: { value: "Bengaluru" },
      workMode: { value: "Hybrid" },
      experienceYears: { value: "6–9" },
      salary: { value: "38–55L" },
    });
    expect(draft.salaryCurrency).toBe("INR");
    expect(splitPoints(draft.fields.mustHaves.value)).toHaveLength(7);
    expect(splitPoints(draft.fields.redFlags.value).length).toBeGreaterThanOrEqual(4);
    expect(draft.flags).toMatchObject({ newPosition: true, aiToolPowerUser: true, firstPrinciplesThinker: true, confidential: false });
    expect(publishErrors(draft)).toEqual([]);
  });

  it("has a rich preview and role profile", () => {
    expect(splitPoints(draft.preview.expectedSkills).length).toBeGreaterThanOrEqual(12);
    expect(splitPoints(draft.preview.targetCompanies)).toHaveLength(12);
    expect(draft.preview.targetCompanies).toContain("Razorpay");
    expect(draft.roleProfile.department.value).toBe("Design");
    expect(splitPoints(draft.roleProfile.avoidLookalikes).length).toBeGreaterThanOrEqual(5);
    const criteria = draft.roleProfile.evaluationFramework;
    expect(criteria.length).toBeGreaterThanOrEqual(7);
    expect(criteria.length).toBeLessThanOrEqual(8);
    expect(new Set(criteria.map((c) => c.type)).size).toBeGreaterThanOrEqual(3);
    expect(new Set(criteria.map((c) => c.importance)).size).toBe(3);
    expect(criteria.find((c) => c.type === "number_threshold")).toMatchObject({ comparator: "≥", target: "6", unit: "years" });
  });

  it("asks for the portfolio and a case study, with context matching the fields", () => {
    const application = draft.application!;
    expect(application.standardOrder.find((f) => f.id === "portfolioUrl")?.required).toBe("mandatory");
    const prompts = questions(draft).map((q) => q.prompt);
    expect(prompts.some((p) => /case study you're proudest of/.test(p))).toBe(true);
    expect(prompts.some((p) => /design systems experience/.test(p))).toBe(true);
    expect(prompts.some((p) => /notice period/.test(p))).toBe(true);
    expect(application.context.role.text).toContain("Bengaluru");
    expect(application.context.role.text).toContain("₹38–55L");
    expect(application.context.role.text).toContain("3 days a week");
  });

  it("leaves other roles on the demo fixture", () => {
    expect(newJobDraft("Software Engineer")).toMatchObject({ fields: demoDraft("Software Engineer").fields });
    expect(newJobNodes("Software Engineer").some((n) => n.id.startsWith("spd-"))).toBe(false);
  });
});

describe("designer template pipeline", () => {
  it("survives the workspace's migrate chain with a Trip per trip node", () => {
    const draft = newJobDraft(SPD_ROLE);
    const nodes = withCapabilities(newJobNodes(SPD_ROLE));
    expect(nodes.some((n) => n.kind === "trip" && n.tripId)).toBe(false);
    const result = migratePipelineTrips(migratePipeline(nodes, board()), draft);
    expectConnected(result.nodes);
    const trips = result.nodes.filter((n) => n.kind === "trip");
    expect(trips).toHaveLength(6);
    expect(trips.every((n) => result.draft.trips.some((t) => t.id === n.tripId))).toBe(true);
    expect(result.nodes.filter((n) => n.kind === "round").map((n) => n.title)).toEqual([
      "Eligibility review",
      "Recruiter conversation",
      "Design exercise",
      "Portfolio presentation & craft review",
      "Cross-functional round with PM + Engineering",
      "Hiring manager conversation",
    ]);
    expect(result.nodes.find((n) => n.id === "eligibility-check")?.rules?.[0].value).toBe("5");
    expect(result.nodes.some((n) => n.id === "eligibility-check-2")).toBe(false);
    expect(result.nodes.find((n) => n.id === "eligibility-thank-you")?.destinationId).toBe(
      result.nodes.find((n) => n.exit)?.id,
    );
    for (const message of result.nodes.filter((n) => n.kind === "communication")) {
      expect(message.body).toContain("{{candidate_name}}");
    }
    expect(publishErrors(result.draft)).toEqual([]);
    const again = migratePipelineTrips(migratePipeline(result.nodes, board()), result.draft);
    expect(again.nodes).toEqual(result.nodes);
  });
});

describe("Build with AI fixtures", () => {
  it("keeps typed location and work mode over the dataset", () => {
    const proposal = buildProfileProposal("We need a senior product designer in London, remote", createDraft());
    const { draft } = proposal;
    expect(proposal.role).toBe("Senior Product Designer");
    expect(draft.fields.location).toEqual({ value: "London", source: "user" });
    expect(draft.fields.workMode).toEqual({ value: "Remote", source: "user" });
    expect(draft.application?.context.role.text).toContain("London");
    expect(draft.application?.context.role.text).not.toContain("Bengaluru");
    expect(draft.salaryCurrency).toBe("INR");
    expect(draft.transcript).toBe("We need a senior product designer in London, remote");
    expect(draft.roleProfile.evaluationFramework.length).toBe(8);
    expect(proposal.hub.description).toBe("Senior Product Designer · London · Remote · 6–9 yrs");
  });

  it("summarises the hub as one line", () => {
    const { draft } = buildProfileProposal("", createDraft());
    expect(insightSummary("hub", draft)).toBe("Senior Product Designer · Bengaluru · Hybrid · 6–9 yrs");
    expect(insightSummary("requirements", draft)).toContain("7 must-haves");
    expect(insightSummary("evaluation", draft)).toContain("8 criteria");
  });

  it("keeps the person's own values, currency and flags", () => {
    const own = createDraft();
    own.fields.salary = { value: "120000–150000", source: "user" };
    own.salaryCurrency = "GBP";
    own.flags.confidential = true;
    own.preview.targetCompanies = "Monzo, Wise";
    const { draft } = buildProfileProposal("Product designer in London", own);
    expect(draft.salaryCurrency).toBe("GBP");
    expect(draft.fields.salary.value).toBe("120000–150000");
    expect(draft.flags).toMatchObject({ confidential: true, newPosition: true });
    expect(draft.preview.targetCompanies).toBe("Monzo, Wise");
    expect(draft.preview.expectedSkills).not.toBe("");
  });

  it("reads the mock JD back into the same facts", () => {
    expect(readPromptFacts(MOCK_PRODUCT_DESIGNER_JD).fields).toMatchObject({
      location: "Bengaluru",
      workMode: "Hybrid",
      experienceYears: "6–9",
      salary: "38–55L",
    });
    const { draft, role } = buildProfileProposal(MOCK_PRODUCT_DESIGNER_JD, createDraft());
    expect(role).toBe(SPD_ROLE);
    expect(draft.fields.mustHaves.value).toBe(newJobDraft(SPD_ROLE).fields.mustHaves.value);
  });

  it("reads a PDF or Word JD as the formatted mock markdown, and .md files as written", async () => {
    const { markdown, mocked } = await readDocuments([new File(["%PDF"], "jd.pdf")]);
    expect(mocked).toBe(true);
    expect(markdown.startsWith("# Senior Product Designer")).toBe(true);
    expect(markdown).toContain("## About us");
    expect(markdown).toContain("\n- ");
    const own = await readDocuments([new File(["# Staff Engineer\n\n- Go"], "role.md")]);
    expect(own).toEqual({ markdown: "# Staff Engineer\n\n- Go", mocked: false });
  });

  it("puts an uploaded JD in the composer and takes it back out", () => {
    const jd = "# Senior Product Designer\n\n- Figma";
    expect(withDocumentText("", jd)).toBe(jd);
    const filled = withDocumentText("Hiring for Bengaluru ", jd);
    expect(filled).toBe(`Hiring for Bengaluru\n\n${jd}`);
    expect(withoutDocumentText(filled, jd)).toBe("Hiring for Bengaluru");
    expect(withoutDocumentText(jd, jd)).toBe("");
    // Edited text stays in the composer.
    const edited = filled.replace("Senior", "Lead");
    expect(withoutDocumentText(edited, jd)).toBe(edited);
  });

  it("drafts other roles without the designer dataset", () => {
    const { draft, role } = buildProfileProposal("We need a software engineer in Pune", createDraft());
    expect(role).toBe("Software Engineer");
    expect(draft.fields.location.value).toBe("Pune");
    expect(draft.roleProfile.department.value).not.toBe("Design");
    expect(questions(draft).some((q) => q.id === "q-case-study")).toBe(false);
    expect(draft.application?.context.role.text).toContain("Pune");
  });

  it("proposes designer stages with stable ids and connected nodes", () => {
    const proposals = proposeStages(SPD_ROLE, "full");
    expect(proposals.map((p) => p.id)).toEqual([
      "prospects", "application", "pipeline", "interview",
      "ai-round-1", "ai-round-2", "ai-round-3", "ai-round-4", "ai-round-5",
    ]);
    expect(proposeStages(SPD_ROLE, "application").map((p) => p.id)).toEqual(["prospects", "application"]);
    const draft = newJobDraft(SPD_ROLE);
    const nodes = stageNodesFor(proposals, SPD_ROLE, draft);
    expectConnected([{ id: "job" } as FunnelNode, ...nodes]);
    expect(nodes.filter((n) => n.kind === "trip").every((n) => n.description.length > 80 && n.duration > 0)).toBe(true);
    // Re-running produces the same ids, so the flow's dedupe never doubles a branch.
    expect(stageNodesFor(proposals, SPD_ROLE, draft).map((n) => n.id)).toEqual(nodes.map((n) => n.id));
    // Picking only one round still brings its Interview process parent.
    const one = stageNodesFor(proposals.map((p) => ({ ...p, included: p.id === "ai-round-2" })), SPD_ROLE, draft);
    expect(one.map((n) => n.id)).toContain("interview");
  });

  it("builds only up to the application when asked, without the default stages", () => {
    const draft = newJobDraft(SPD_ROLE);
    for (const role of [SPD_ROLE, "Software Engineer"]) {
      const nodes = [...baseFunnel(), ...stageNodesFor(proposeStages(role, "application"), role, draft)];
      expect(needsPipelineExpansion(nodes)).toBe(false);
      const migrated = migratePipeline(nodes, board());
      expect(migrated.filter((n) => n.kind === "stage").map((n) => n.id)).toEqual(["prospects"]);
      expect(migrated.some((n) => n.kind === "round" || n.kind === "trip")).toBe(false);
      expect(migrated.some((n) => n.kind === "application")).toBe(true);
    }
    const full = [...baseFunnel(), ...stageNodesFor(proposeStages(SPD_ROLE, "full"), SPD_ROLE, draft)];
    expect(needsPipelineExpansion(full)).toBe(true);
  });

  it("keeps non-designer proposals on the template ids", () => {
    expect(proposeStages("Software Engineer", "full").map((p) => p.id)).toEqual([
      "prospects", "application", "pipeline", "interview", "ai-round-1", "ai-round-2",
    ]);
  });
});
