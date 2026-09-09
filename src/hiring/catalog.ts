import type { Capability, Lever, HiringOperations, Review } from "./types";
import { node, type FunnelNode } from "../canvasJob/funnelModel";
import type { DemoCandidate } from "../demo/types";

export const CAPABILITIES: {
  id: Capability;
  title: string;
  parent: string;
  description: string;
}[] = [
  {
    id: "setup",
    title: "Role & hiring settings",
    parent: "job",
    description: "Compensation, requirements, sourcing & lifecycle",
  },
  {
    id: "brief",
    title: "Role brief & sharing",
    parent: "job",
    description: "One source of truth · export & share",
  },
  {
    id: "team",
    title: "Hiring team",
    parent: "job",
    description: "Ownership, collaborators & partner access",
  },
  {
    id: "tasks",
    title: "Action on you",
    parent: "job",
    description: "Follow-ups, feedback & assigned work",
  },
  {
    id: "activity",
    title: "Activity history",
    parent: "job",
    description: "A record of decisions across this job",
  },
  {
    id: "prospects",
    title: "Private prospect pool",
    parent: "prospects",
    description: "Source people before they apply",
  },
  {
    id: "review",
    title: "Candidate review",
    parent: "pipeline",
    description: "Stage decisions, evidence & feedback",
  },
  {
    id: "messages",
    title: "Outreach library",
    parent: "pipeline",
    description: "Email, approved WhatsApp & calling agents",
  },
  {
    id: "assessments",
    title: "Assessment studio",
    parent: "pipeline",
    description: "Rapid Fire · Pick & Defend · Demo",
  },
  {
    id: "client",
    title: "Client coordination",
    parent: "interview",
    description: "One hiring-manager thread per candidate",
  },
];
export function withCapabilities(nodes: FunnelNode[]) {
  return [
    ...nodes,
    ...CAPABILITIES.filter(
      (c) =>
        nodes.some((n) => n.id === c.parent) &&
        !nodes.some((n) => n.id === `cap-${c.id}`),
    ).map((c) => ({
      ...node("capability", c.title, c.parent, `cap-${c.id}`),
      capability: c.id,
      description: c.description,
    })),
  ];
}
export const STAGES: Record<string, string[]> = {
  applied: [
    "Application submitted",
    "Awaiting shortlist decision",
    "Shortlist qualifying",
  ],
  screened: [
    "Invited to screen",
    "Under screening review",
    "Awaiting screen decision",
  ],
  submitted: ["Preparing for client", "Pending client review"],
  interviewing: [
    "Scheduling interview",
    "Interview scheduled",
    "Awaiting interview feedback",
    "Awaiting round decision",
  ],
  offered: [
    "Offered_Candidate to revert",
    "Rejected",
    "Offer accepted",
    "Offer declined",
    "Documentation started",
    "Joined",
    "Invoicable",
    "Invoice Cleared",
    "Dropped Out",
  ],
  archive: [
    "Position filled",
    "Rejected by client",
    "Underqualified",
    "Backed out",
    "Not interested",
    "Future hire",
    "Overqualified",
    "On hold",
    "Offer declined",
    "Screen reject",
    "Rejected in R1 or further rounds",
    "Out of budget",
  ],
};
export const TEAM = [
  "Demo Recruiter",
  "Maya Chen",
  "Arjun Mehta",
  "David Park",
];
export const TOKENS = [
  "first_name",
  "candidate_name",
  "job_title",
  "company_name",
  "location",
  "comp_range",
  "meeting_date_time",
  "meeting_link",
  "sender_name",
];
export const CALL_TOKENS = [
  "candidate_name",
  "company_name",
  "job_title",
  "current_date",
  "current_day",
  "current_month",
];
export const APPROVED_WA = [
  {
    id: "demo_temp",
    body: "Hello! Thank you for your interest. Our hiring team will be in touch.",
    slots: 0,
  },
  {
    id: "uri_cai",
    body: "Hi {{1}}, explore {{2}} at {{3}}. Apply here: {{4}}",
    slots: 4,
  },
  {
    id: "uti_temp",
    body: "Hi {{1}}, your next step for {{2}} at {{3}} is ready: {{4}}",
    slots: 4,
  },
];
export function reviewFor(c: DemoCandidate, ops: HiringOperations): Review {
  const r = ops.reviews[c.id] as Review | undefined;
  return {
    status: STAGES[c.stageId]?.[0] ?? STAGES.interviewing[0],
    owner: "Demo Recruiter",
    verified: false,
    confidence:
      c.tripScore === undefined
        ? "Insufficient"
        : c.tripScore >= 75
          ? "Strong"
          : c.tripScore >= 55
            ? "Moderate"
            : "Weak",
    source: c.origin.kind === "applied" ? "Sign-up" : "Referral",
    company: "",
    experience: "",
    ...r,
    ...(r && !(STAGES[c.stageId] ?? STAGES.interviewing).includes(r.status)
      ? { status: (STAGES[c.stageId] ?? STAGES.interviewing)[0] }
      : {}),
  };
}
export function emptyOperations(): HiringOperations {
  return {
    version: 1,
    setup: {},
    prospectIds: [],
    prospects: {},
    reviews: {},
    templates: {},
    approvals: {},
    assessments: {},
    leverTemplates: {},
    tasks: {},
    owner: TEAM[0],
    members: {
      [TEAM[1]]: "Sourcing",
      [TEAM[2]]: "Screening",
      [TEAM[3]]: "HM rep",
    },
    partners: {},
    threads: {},
    activity: [],
  };
}
export function newLever(type: Lever["type"]): Lever {
  return {
    id: crypto.randomUUID(),
    type,
    title: type,
    seconds: type === "Rapid Fire" ? 120 : type === "Pick & Defend" ? 300 : 180,
    questions: type === "Rapid Fire" ? 8 : 3,
    difficulty: "Use trip default",
    prompt: "",
    constraint: "",
    statements: [],
    options: [],
    defense: [],
    preferred: 0,
    why: "",
    axis: "",
    resources: [],
    voice: "",
    screen: true,
    audio: true,
    face: false,
    prep: 0,
    upload: false,
    uploadLabel: "Supporting work",
    uploadInstructions: "",
    formats: ["PDF"],
    beats: [],
    expected: "",
    rubric: "",
  };
}
