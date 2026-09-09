import {
  DEFAULT_PIPELINE_STAGES,
  flagForScore,
  type Candidate,
  type CandidateOrigin,
  type PipelineBoard,
  type TimelineEvent,
} from "./types";

/**
 * Per-role pipeline rosters, so each demo job's Pipeline tab shows a genuinely different mix of
 * candidates and progress — not the same eight people copy-pasted under every job. Deterministic
 * for the same reason as seedCandidates.ts: fixed BASE, no Math.random(), stable across reloads.
 */
const BASE = Date.UTC(2026, 7, 28, 9, 0, 0); // 2026-08-28T09:00:00Z
const DAY = 24 * 60 * 60 * 1000;

function ev(id: string, label: string, actor: TimelineEvent["actor"], agoMs: number, detail?: string): TimelineEvent {
  return { id, label, actor, at: BASE - agoMs, detail };
}

type CandidateSpec = {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  resumeFileName: string;
  stageId: "applied" | "screened" | "submitted" | "interviewing" | "offered";
  appliedDaysAgo: number;
  origin?: CandidateOrigin;
  /** Present once the Trip has been sent; omit to leave the candidate untriped. */
  trip?: { sentDaysAgo: number; completedDaysAgo?: number; score?: number; roundNote?: string };
  interviewInDays?: number;
  tags?: string[];
  note?: { body: string; author: string; daysAgo: number; mentions?: string[] };
};

const STAGE_LABEL: Record<CandidateSpec["stageId"], string> = {
  applied: "Applied",
  screened: "Screened",
  submitted: "Submitted to Client",
  interviewing: "Interviewing",
  offered: "Offered",
};

const STAGE_ORDER: CandidateSpec["stageId"][] = [
  "applied",
  "screened",
  "submitted",
  "interviewing",
  "offered",
];

function priorStageLabel(stageId: CandidateSpec["stageId"]): string {
  const idx = STAGE_ORDER.indexOf(stageId);
  return idx > 0 ? STAGE_LABEL[STAGE_ORDER[idx - 1]!] : STAGE_LABEL.applied;
}

function candidateFrom(spec: CandidateSpec): Candidate {
  const origin = spec.origin ?? { kind: "applied" };
  const timeline: TimelineEvent[] = [
    origin.kind === "applied"
      ? ev(`t-${spec.id}-applied`, "Application submitted", "candidate", spec.appliedDaysAgo * DAY)
      : ev(`t-${spec.id}-added`, "Added as prospect", "team", spec.appliedDaysAgo * DAY, `Submitted by ${origin.by}`),
  ];

  let tripStatus: Candidate["tripStatus"] = "none";
  let tripScore: number | undefined;
  let aiFlag: Candidate["aiFlag"];
  let tripSentAt: number | undefined;

  if (spec.trip) {
    tripSentAt = BASE - spec.trip.sentDaysAgo * DAY;
    timeline.push(ev(`t-${spec.id}-sent`, "Trip sent", "team", spec.trip.sentDaysAgo * DAY));
    tripStatus = "sent";
    if (spec.trip.completedDaysAgo !== undefined && spec.trip.score !== undefined) {
      tripStatus = "completed";
      tripScore = spec.trip.score;
      aiFlag = flagForScore(spec.trip.score);
      timeline.push(
        ev(
          `t-${spec.id}-completed`,
          "Trip completed",
          "candidate",
          spec.trip.completedDaysAgo * DAY,
          `Scored ${spec.trip.score}${spec.trip.roundNote ? ` — ${spec.trip.roundNote}` : ""}`,
        ),
      );
    }
  }

  if (spec.stageId !== "applied") {
    timeline.push(
      ev(
        `t-${spec.id}-moved`,
        `Moved to ${STAGE_LABEL[spec.stageId]}`,
        "team",
        Math.max(spec.appliedDaysAgo - 1, 0) * DAY,
        `${priorStageLabel(spec.stageId)} → ${STAGE_LABEL[spec.stageId]}`,
      ),
    );
  }

  if (spec.interviewInDays !== undefined) {
    timeline.push(ev(`t-${spec.id}-interview`, "Interview scheduled", "team", 1 * DAY));
  }

  return {
    id: spec.id,
    stageId: spec.stageId,
    name: spec.name,
    email: spec.email,
    phone: spec.phone,
    location: spec.location,
    origin,
    appliedAt: BASE - spec.appliedDaysAgo * DAY,
    resumeFileName: spec.resumeFileName,
    tripStatus,
    tripSentAt,
    tripScore,
    aiFlag,
    tags: spec.tags ?? [],
    ratings: [],
    notes: spec.note
      ? [
          {
            id: `n-${spec.id}-1`,
            body: spec.note.body,
            author: spec.note.author,
            createdAt: BASE - spec.note.daysAgo * DAY,
            mentions: spec.note.mentions ?? [],
          },
        ]
      : [],
    timeline,
    interviewAt: spec.interviewInDays !== undefined ? BASE + spec.interviewInDays * DAY : undefined,
  };
}

function board(specs: CandidateSpec[]): PipelineBoard {
  return {
    stages: DEFAULT_PIPELINE_STAGES.map((stage) => ({ ...stage })),
    candidates: specs.map(candidateFrom),
  };
}

const PRODUCT_DESIGNER: CandidateSpec[] = [
  { id: "cand-ananya", name: "Ananya Bose", email: "ananya.bose@example.com", phone: "+91 98200 11223", location: "Bangalore", resumeFileName: "ananya-bose-portfolio.pdf", stageId: "applied", appliedDaysAgo: 1 },
  { id: "cand-kabir", name: "Kabir Sethi", email: "kabir.sethi@example.com", phone: "+91 99880 44556", location: "Pune", resumeFileName: "kabir-sethi-resume.pdf", stageId: "applied", appliedDaysAgo: 3 },
  { id: "cand-rhea", name: "Rhea Kulkarni", email: "rhea.kulkarni@example.com", phone: "+91 90210 77889", location: "Bangalore", resumeFileName: "rhea-kulkarni-portfolio.pdf", stageId: "screened", appliedDaysAgo: 6, trip: { sentDaysAgo: 5, completedDaysAgo: 4, score: 68, roundNote: "thin defense of trade-offs in pick and defend" }, tags: ["Needs coaching"] },
  { id: "cand-devika", name: "Devika Pillai", email: "devika.pillai@example.com", phone: "+91 91234 55667", location: "Mumbai", resumeFileName: "devika-pillai-portfolio.pdf", stageId: "submitted", appliedDaysAgo: 9, trip: { sentDaysAgo: 8, completedDaysAgo: 6, score: 82, roundNote: "walked through the onboarding redesign live" }, tags: ["Strong portfolio"], note: { body: "Loved the demo round — walked through the whole onboarding redesign live, start to finish.", author: "Alex Smith", daysAgo: 2 } },
  { id: "cand-aman", name: "Aman Kapoor", email: "aman.kapoor@example.com", phone: "+91 98765 12340", location: "Bangalore", resumeFileName: "aman-kapoor-portfolio.pdf", stageId: "interviewing", appliedDaysAgo: 13, trip: { sentDaysAgo: 12, completedDaysAgo: 10, score: 89 }, tags: ["Fast ramp"], interviewInDays: 2 },
  { id: "cand-farah", name: "Farah Ansari", email: "farah.ansari@example.com", phone: "+91 90000 22110", location: "Hyderabad", resumeFileName: "farah-ansari-portfolio.pdf", stageId: "offered", appliedDaysAgo: 18, trip: { sentDaysAgo: 17, completedDaysAgo: 15, score: 94 }, tags: ["Strong communicator", "Client ready"], note: { body: "Offer sent — exceptional flaunt-or-flex round. @Alex Smith please confirm start date.", author: "Meera Iyer", daysAgo: 1, mentions: ["Alex Smith"] } },
];

const FRONTEND_ENGINEER: CandidateSpec[] = [
  { id: "cand-yash", name: "Yash Trivedi", email: "yash.trivedi@example.com", phone: "+91 99001 12233", location: "Remote", resumeFileName: "yash-trivedi-resume.pdf", stageId: "applied", appliedDaysAgo: 1 },
  { id: "cand-meher", name: "Meher Chatterjee", email: "meher.chatterjee@example.com", phone: "+91 90123 44556", location: "Remote", resumeFileName: "meher-chatterjee-cv.pdf", stageId: "applied", appliedDaysAgo: 2 },
  { id: "cand-sanjana", name: "Sanjana Iyer", email: "sanjana.iyer@example.com", phone: "+91 98123 66778", location: "Bangalore", resumeFileName: "sanjana-iyer-resume.pdf", stageId: "screened", appliedDaysAgo: 5, trip: { sentDaysAgo: 4, completedDaysAgo: 3, score: 58, roundNote: "shaky under time pressure in the coding round" } },
  { id: "cand-rahul", name: "Rahul Bhandari", email: "rahul.bhandari@example.com", phone: "+91 91234 88990", location: "Pune", resumeFileName: "rahul-bhandari-cv.pdf", stageId: "submitted", appliedDaysAgo: 8, trip: { sentDaysAgo: 7, completedDaysAgo: 5, score: 77 }, tags: ["Client ready"] },
  { id: "cand-ishita", name: "Ishita Verma", email: "ishita.verma@example.com", phone: "+91 90876 11223", location: "Remote", resumeFileName: "ishita-verma-resume.pdf", stageId: "interviewing", appliedDaysAgo: 11, trip: { sentDaysAgo: 10, completedDaysAgo: 8, score: 85 }, tags: ["High ownership"], interviewInDays: 3 },
  { id: "cand-karan", name: "Karan Malhotra", email: "karan.malhotra@example.com", phone: "+91 99887 33445", location: "Bangalore", resumeFileName: "karan-malhotra-cv.pdf", stageId: "offered", appliedDaysAgo: 15, trip: { sentDaysAgo: 14, completedDaysAgo: 12, score: 92 }, tags: ["Strong communicator"] },
];

const PRODUCT_MANAGER: CandidateSpec[] = [
  { id: "cand-naina", name: "Naina Bhatt", email: "naina.bhatt@example.com", phone: "+91 98123 00112", location: "Mumbai", resumeFileName: "naina-bhatt-resume.pdf", stageId: "applied", appliedDaysAgo: 1 },
  { id: "cand-siddharth", name: "Siddharth Rao", email: "siddharth.rao@example.com", phone: "+91 90456 22334", location: "Mumbai", resumeFileName: "siddharth-rao-cv.pdf", stageId: "applied", appliedDaysAgo: 2 },
  { id: "cand-priyanka", name: "Priyanka Ghosh", email: "priyanka.ghosh@example.com", phone: "+91 98765 44556", location: "Bangalore", resumeFileName: "priyanka-ghosh-resume.pdf", stageId: "screened", appliedDaysAgo: 4, trip: { sentDaysAgo: 3, completedDaysAgo: 2, score: 71, roundNote: "sharp rank-order reasoning on activation vs retention" } },
  { id: "cand-arnav", name: "Arnav Deshmukh", email: "arnav.deshmukh@example.com", phone: "+91 91111 66778", location: "Mumbai", resumeFileName: "arnav-deshmukh-resume.pdf", stageId: "submitted", appliedDaysAgo: 6, trip: { sentDaysAgo: 5, completedDaysAgo: 4, score: 80 }, tags: ["Strong communicator"] },
];

const DATA_ANALYST: CandidateSpec[] = [
  { id: "cand-tanvi", name: "Tanvi Shah", email: "tanvi.shah@example.com", phone: "+91 90000 11224", location: "Hyderabad", resumeFileName: "tanvi-shah-resume.pdf", stageId: "applied", appliedDaysAgo: 1 },
  { id: "cand-om", name: "Om Prakash", email: "om.prakash@example.com", phone: "+91 98123 55667", location: "Hyderabad", resumeFileName: "om-prakash-cv.pdf", stageId: "applied", appliedDaysAgo: 2 },
  { id: "cand-neha", name: "Neha Bansal", email: "neha.bansal@example.com", phone: "+91 90876 22110", location: "Bangalore", resumeFileName: "neha-bansal-resume.pdf", stageId: "screened", appliedDaysAgo: 4, trip: { sentDaysAgo: 3, completedDaysAgo: 2, score: 64 } },
  { id: "cand-rohit", name: "Rohit Saxena", email: "rohit.saxena@example.com", phone: "+91 99001 33445", location: "Hyderabad", resumeFileName: "rohit-saxena-cv.pdf", stageId: "submitted", appliedDaysAgo: 7, trip: { sentDaysAgo: 6, completedDaysAgo: 5, score: 74 }, tags: ["Fast ramp"] },
  { id: "cand-simran", name: "Simran Kaur", email: "simran.kaur@example.com", phone: "+91 90123 88990", location: "Remote", resumeFileName: "simran-kaur-resume.pdf", stageId: "interviewing", appliedDaysAgo: 10, trip: { sentDaysAgo: 9, completedDaysAgo: 7, score: 88 }, interviewInDays: 4 },
];

const CUSTOMER_SUCCESS: CandidateSpec[] = [
  { id: "cand-varun", name: "Varun Chawla", email: "varun.chawla@example.com", phone: "+91 98212 00998", location: "Pune", resumeFileName: "varun-chawla-resume.pdf", stageId: "applied", appliedDaysAgo: 1 },
  { id: "cand-alisha", name: "Alisha Fernandes", email: "alisha.fernandes@example.com", phone: "+91 90678 44112", location: "Pune", resumeFileName: "alisha-fernandes-cv.pdf", stageId: "applied", appliedDaysAgo: 2 },
  { id: "cand-deepak", name: "Deepak Nair", email: "deepak.nair@example.com", phone: "+91 91234 66009", location: "Remote", resumeFileName: "deepak-nair-resume.pdf", stageId: "screened", appliedDaysAgo: 5, trip: { sentDaysAgo: 4, completedDaysAgo: 3, score: 60, roundNote: "rapid fire answers felt rehearsed" } },
  { id: "cand-pooja", name: "Pooja Reddy", email: "pooja.reddy@example.com", phone: "+91 98123 77003", location: "Pune", resumeFileName: "pooja-reddy-resume.pdf", stageId: "submitted", appliedDaysAgo: 8, trip: { sentDaysAgo: 7, completedDaysAgo: 6, score: 79 }, tags: ["Client ready"] },
  { id: "cand-vivek", name: "Vivek Menon", email: "vivek.menon@example.com", phone: "+91 90000 55220", location: "Remote", resumeFileName: "vivek-menon-resume.pdf", stageId: "offered", appliedDaysAgo: 14, trip: { sentDaysAgo: 13, completedDaysAgo: 11, score: 90 }, tags: ["Strong communicator"] },
];

const OPERATIONS_LEAD: CandidateSpec[] = [
  { id: "cand-harpreet", name: "Harpreet Singh", email: "harpreet.singh@example.com", phone: "+91 98100 22114", location: "Delhi NCR", resumeFileName: "harpreet-singh-resume.pdf", stageId: "applied", appliedDaysAgo: 1 },
  { id: "cand-manpreet", name: "Manpreet Kaur", email: "manpreet.kaur@example.com", phone: "+91 90211 33225", location: "Delhi NCR", resumeFileName: "manpreet-kaur-cv.pdf", stageId: "applied", appliedDaysAgo: 3 },
  { id: "cand-ajay", name: "Ajay Kumar", email: "ajay.kumar@example.com", phone: "+91 98322 44336", location: "Delhi NCR", resumeFileName: "ajay-kumar-resume.pdf", stageId: "screened", appliedDaysAgo: 5, trip: { sentDaysAgo: 4, completedDaysAgo: 3, score: 66, roundNote: "clear priority ranking of hub bottlenecks" } },
  { id: "cand-ritu", name: "Ritu Chawla", email: "ritu.chawla@example.com", phone: "+91 90433 55447", location: "Delhi NCR", resumeFileName: "ritu-chawla-resume.pdf", stageId: "submitted", appliedDaysAgo: 8, trip: { sentDaysAgo: 7, completedDaysAgo: 6, score: 76 }, tags: ["High ownership"] },
];

/** Keyed by the ADDITIONAL_ROLES `id` in seedJobs.ts, not the job record id. */
export const ROLE_BOARDS: Record<string, () => PipelineBoard> = {
  "product-designer": () => board(PRODUCT_DESIGNER),
  "frontend-engineer": () => board(FRONTEND_ENGINEER),
  "product-manager": () => board(PRODUCT_MANAGER),
  "data-analyst": () => board(DATA_ANALYST),
  "customer-success": () => board(CUSTOMER_SUCCESS),
  "operations-lead": () => board(OPERATIONS_LEAD),
};
