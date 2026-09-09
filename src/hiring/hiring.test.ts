import { beforeEach, describe, expect, it, vi } from "vitest";
import { demoService } from "../demo/service";
import {
  baseFunnel,
  expandFunnel,
  layoutFunnel,
} from "../canvasJob/funnelModel";
import {
  emptyOperations,
  newLever,
  reviewFor,
  STAGES,
  withCapabilities,
} from "./catalog";
import {
  attachPeople,
  change,
  completeAssessment,
  inviteAssessment,
  moveCandidate,
  newProspect,
  operations,
  parseCSV,
  pool,
  promote,
  publishAssessment,
  renderMessage,
  sendOutreach,
  validateAssessment,
} from "./service";
import { generateLevers } from "./AssessmentsPanel";
import { matches } from "./DataFilters";
import type { Assessment, MessageTemplate } from "./types";

const data = new Map<string, string>();
const storage: Storage = {
  get length() {
    return data.size;
  },
  key: (i) => [...data.keys()][i] ?? null,
  getItem: (key) => data.get(key) ?? null,
  setItem: (key, value) => {
    data.set(key, value);
  },
  removeItem: (key) => {
    data.delete(key);
  },
  clear: () => data.clear(),
};
vi.stubGlobal("localStorage", storage);
vi.stubGlobal("window", { localStorage: storage });
vi.stubGlobal("location", { origin: "http://demo.test" });
const project = () => demoService().get("audit-job")!;
const ops = () => operations(project());
beforeEach(() => {
  storage.clear();
  demoService().loadDemo("audit-job");
});
function assessment(): Assessment {
  const a: Assessment = {
    id: "assessment-one",
    title: "Product judgment",
    stage: "applied",
    difficulty: "Intermediate",
    storyline: "Improve onboarding",
    instructions: "Prioritize research",
    domain: "SaaS",
    role: "Designer",
    source: "Job",
    persona: "Candidate",
    levers: [
      newLever("Rapid Fire"),
      newLever("Pick & Defend"),
      newLever("Demo"),
    ],
    version: 1,
    roster: [],
    expiresAt: project().clock + 86400000,
    invites: {},
  };
  a.levers = generateLevers(a);
  change("audit-job", "Created assessment", (o) => {
    o.assessments[a.id] = a;
  });
  return a;
}
function template(values: Partial<MessageTemplate> = {}): MessageTemplate {
  return {
    id: "email-one",
    name: "Invitation",
    channel: "Email",
    stage: "All",
    scope: "Job",
    tone: "Warm",
    subject: "Hello {{first_name}}",
    body: "Explore {{job_title}} at {{company_name}} with {{sender_name}}.",
    default: true,
    slots: [],
    ...values,
  };
}
describe("additive audit model", () => {
  it("adds capabilities idempotently without removing existing journey nodes", () => {
    const original = expandFunnel(baseFunnel()),
      extended = withCapabilities(original);
    expect(extended).toHaveLength(original.length + 10);
    expect(withCapabilities(extended)).toEqual(extended);
    expect(extended.slice(0, original.length)).toEqual(original);
    const positions = layoutFunnel(extended).map(
      (n) => `${n.position.x},${n.position.y}`,
    );
    expect(new Set(positions).size).toBe(positions.length);
  });
  it("distinguishes private people from job prospects and applicants", () => {
    const person = newProspect({ name: "Riya", headline: "Designer" });
    const count = Object.keys(project().candidates).length;
    attachPeople("audit-job", [person]);
    attachPeople("audit-job", [person]);
    expect(ops().prospectIds).toEqual([person.id]);
    expect(pool().people[person.id].name).toBe("Riya");
    expect(Object.keys(project().candidates)).toHaveLength(count);
  });
  it("blocks incomplete promotion, then maps the completed prospect to exactly one applicant", () => {
    const person = newProspect({
      name: "Riya",
      headline: "Designer",
      email: "riya@example.com",
      phone: "123",
      owner: "Maya Chen",
      source: "CSV",
    });
    attachPeople("audit-job", [person]);
    expect(() => promote("audit-job", person.id, {})).toThrow(/required/);
    expect(ops().prospects[person.id].candidateId).toBeUndefined();
    const form = project().configuration.draft.application!;
    const answers = Object.fromEntries([
      ...form.standardOrder.map((f) => [f.id, "Provided"]),
      ...form.items.map((q) => [q.id, "Provided"]),
    ]);
    promote("audit-job", person.id, answers);
    const id = ops().prospects[person.id].candidateId!;
    expect(project().candidates[id].stageId).toBe("applied");
    expect(ops().reviews[id].owner).toBe("Maya Chen");
    expect(() => promote("audit-job", person.id, answers)).toThrow(/already/);
  });
  it("rejects invalid stage/status pairs before moving candidates", () => {
    expect(() =>
      moveCandidate(
        "audit-job",
        "cand-priya",
        "offered",
        "Awaiting screen decision",
      ),
    ).toThrow(/status/);
    expect(project().candidates["cand-priya"].stageId).toBe("applied");
    moveCandidate("audit-job", "cand-priya", "offered", "Offer accepted");
    expect(ops().reviews["cand-priya"].status).toBe("Offer accepted");
  });
  it("repairs derived status when an existing demo shortcut moves the candidate", () => {
    moveCandidate("audit-job", "cand-priya", "offered", "Offer accepted");
    demoService().move("audit-job", "cand-priya", "screened");
    expect(reviewFor(project().candidates["cand-priya"], ops()).status).toBe(
      STAGES.screened[0],
    );
  });
  it("keeps audit operations through stale configuration autosaves", () => {
    const old = project().configuration;
    change("audit-job", "Saved setup", (o) => {
      o.setup.client = "Northstar";
    });
    demoService().saveConfiguration("audit-job", old);
    expect(ops().setup.client).toBe("Northstar");
    expect(ops().activity).toHaveLength(1);
  });
  it("keeps lifecycle separate from public visibility and stops closed applications", () => {
    change("audit-job", "Closed role", (o) => {
      o.setup.status = "closed";
    });
    expect(project().configuration.published).toBe(true);
    expect(() =>
      demoService().submit("audit-job", "New", "new@example.com", {}),
    ).toThrow(/paused or closed/);
  });
  it("parses quoted CSV and ignores blank rows without corrupting commas or quotes", () => {
    expect(
      parseCSV(
        'name,email,headline\r\n"Doe, Jane",j@example.com,"Lead ""Designer"""\r\n\r\n',
      ),
    ).toEqual([
      ["name", "email", "headline"],
      ["Doe, Jane", "j@example.com", 'Lead "Designer"'],
    ]);
    expect(() => parseCSV('"unclosed')).toThrow(/unclosed/);
  });
  it("filters multiple evidence fields and composes advanced conditions", () => {
    expect(
      matches({ name: "Riya", skills: "Research", years: 6 }, "research", [
        { field: "years", operator: "Greater than", value: "4" },
      ]),
    ).toBe(true);
    expect(
      matches({ verified: false }, "", [
        { field: "verified", operator: "Is", value: "true" },
      ]),
    ).toBe(false);
  });
});
describe("outreach audit safeguards", () => {
  it("renders the nine outreach tokens without changing source templates", () => {
    change("audit-job", "Set client", (o) => {
      o.setup.client = "Northstar";
    });
    const t = template();
    expect(renderMessage(t, project(), "Alex Morgan").body).toContain(
      "Northstar",
    );
    expect(t.body).toContain("{{company_name}}");
  });
  it("requires approved WhatsApp content and completed slots", () => {
    expect(() =>
      sendOutreach(
        "audit-job",
        ["cand-priya"],
        template({ channel: "WhatsApp", approvedId: "unapproved" }),
      ),
    ).toThrow();
    expect(() =>
      renderMessage(
        template({ channel: "WhatsApp", approvedId: "unapproved" }),
        project(),
        "Alex",
      ),
    ).toThrow(/approved/);
    const t = template({
      channel: "WhatsApp",
      approvedId: "uri_cai",
      slots: [
        "{{first_name}}",
        "{{job_title}}",
        "{{company_name}}",
        "https://demo.test/apply",
      ],
    });
    expect(renderMessage(t, project(), "Alex Morgan").body).toContain(
      "Hi Alex,",
    );
  });
  it("gates calls on stage provisioning and recipient eligibility", () => {
    change("audit-job", "Added phone", (_, p) => {
      p.candidates["cand-priya"].phone = "+919876543210";
    });
    const t = template({ channel: "AI call", stage: "applied" });
    expect(() => sendOutreach("audit-job", ["cand-priya"], t)).toThrow(
      /Provision/,
    );
    sendOutreach("audit-job", ["cand-priya"], { ...t, provisioned: true });
    expect(
      Object.values(project().deliveries).some(
        (d) => d.name === "AI call: Invitation",
      ),
    ).toBe(true);
  });
  it("makes failed bulk sends atomic and does not append a success activity", () => {
    const before = project();
    expect(() =>
      sendOutreach("audit-job", ["cand-priya", "missing-id"], template()),
    ).toThrow(/not found/);
    expect(project()).toEqual(before);
  });
});
describe("assessment publishing and candidate experience", () => {
  it("generates each lever’s distinct sub-items and preserves authoring instructions", () => {
    const a = assessment();
    expect(a.levers[0].statements).toHaveLength(8);
    expect(a.levers[1].defense).toHaveLength(3);
    expect(a.levers[1].options).toHaveLength(4);
    expect(a.levers[2].beats).toHaveLength(3);
    a.levers.forEach((l) => expect(l.prompt).toContain("Prioritize research"));
  });
  it("rejects audio-only Demo capture", () => {
    const a = assessment();
    a.levers[2].screen = false;
    a.levers[2].face = false;
    expect(() => validateAssessment(a)).toThrow(/screen or face/);
  });
  it("publishes without sending or assigning anyone automatically", () => {
    const a = assessment(),
      before = project();
    publishAssessment("audit-job", a.id);
    expect(ops().assessments[a.id].publishedAt).toBeTruthy();
    expect(project().deliveries).toEqual(before.deliveries);
    expect(project().assignments).toEqual(before.assignments);
  });
  it("enforces explicit roster, target stage and a minimum one-hour expiry", () => {
    const a = assessment();
    publishAssessment("audit-job", a.id);
    expect(() =>
      inviteAssessment("audit-job", a.id, [], project().clock + 86400000),
    ).toThrow(/Select/);
    expect(() =>
      inviteAssessment("audit-job", a.id, ["cand-priya"], project().clock + 1),
    ).toThrow(/one hour/);
    moveCandidate("audit-job", "cand-priya", "offered", "Offer accepted");
    expect(() =>
      inviteAssessment(
        "audit-job",
        a.id,
        ["cand-priya"],
        project().clock + 86400000,
      ),
    ).toThrow(/target stage/);
    expect(ops().assessments[a.id].invites).toEqual({});
  });
  it("preserves frozen content while storing a selected candidate invitation", () => {
    const a = assessment();
    publishAssessment("audit-job", a.id);
    const frozen = ops().assessments[a.id].levers;
    inviteAssessment(
      "audit-job",
      a.id,
      ["cand-priya"],
      project().clock + 86400000,
    );
    expect(ops().assessments[a.id].levers).toEqual(frozen);
    expect(Object.keys(ops().assessments[a.id].invites)).toEqual([
      "cand-priya",
    ]);
    expect(() => publishAssessment("audit-job", a.id)).toThrow(/Already/);
  });
  it("gates uninvited, incomplete and expired responses", () => {
    const a = assessment();
    publishAssessment("audit-job", a.id);
    expect(() =>
      completeAssessment("audit-job", a.id, "cand-priya", {}),
    ).toThrow(/not been invited/);
    inviteAssessment(
      "audit-job",
      a.id,
      ["cand-priya"],
      project().clock + 86400000,
    );
    expect(() =>
      completeAssessment("audit-job", a.id, "cand-priya", {}),
    ).toThrow(/Complete all/);
    demoService().advance("audit-job", 2);
    expect(() =>
      completeAssessment("audit-job", a.id, "cand-priya", {}),
    ).toThrow(/expired/);
  });
  it("keeps completed responses immutable on repeated submission or reinvitation", () => {
    const a = assessment();
    publishAssessment("audit-job", a.id);
    inviteAssessment(
      "audit-job",
      a.id,
      ["cand-priya"],
      project().clock + 86400000,
    );
    const answers: Record<string, string> = {};
    a.levers.forEach((l) => {
      if (l.type === "Rapid Fire")
        l.statements.forEach((_, i) => {
          answers[`${l.id}:statement:${i}`] = "SERIOUS";
        });
      else if (l.type === "Pick & Defend") {
        answers[`${l.id}:option`] = "1";
        l.defense.forEach((_, i) => {
          answers[`${l.id}:defense:${i}`] = "Evidence";
        });
      } else answers[`${l.id}:recording`] = "Demo response";
    });
    completeAssessment("audit-job", a.id, "cand-priya", answers);
    const after = project();
    completeAssessment("audit-job", a.id, "cand-priya", {
      changed: "overwrite attempt",
    });
    expect(project()).toEqual(after);
    expect(() =>
      inviteAssessment(
        "audit-job",
        a.id,
        ["cand-priya"],
        project().clock + 86400000,
      ),
    ).toThrow(/already completed/);
    expect(project()).toEqual(after);
  });
  it("migrates old project operations lazily and keeps jobs isolated", () => {
    expect(ops()).toEqual(emptyOperations());
    demoService().loadDemo("other");
    change("audit-job", "Added setting", (o) => {
      o.setup.client = "Changed";
    });
    expect(demoService().get("other")!.operations).toBeUndefined();
  });
});
