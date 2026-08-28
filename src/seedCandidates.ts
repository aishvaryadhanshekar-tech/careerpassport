import {
  DEFAULT_PIPELINE_STAGES,
  flagForScore,
  type Candidate,
  type PipelineBoard,
  type TimelineEvent,
} from "./types";

/**
 * Prototype pipeline data.
 *
 * Deterministic on purpose — no Math.random(), no bare Date.now(). Every timestamp is
 * BASE minus a fixed offset so the board looks identical on every reload and screenshots
 * stay stable. BASE is a fixed instant, not "now", for the same reason.
 */
const BASE = Date.UTC(2026, 7, 28, 9, 0, 0); // 2026-08-28T09:00:00Z
const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

function ev(
  id: string,
  label: string,
  actor: TimelineEvent["actor"],
  agoMs: number,
  detail?: string,
): TimelineEvent {
  return { id, label, actor, at: BASE - agoMs, detail };
}

function scored(score: number) {
  return { tripStatus: "completed" as const, tripScore: score, aiFlag: flagForScore(score) };
}

const CANDIDATES: Candidate[] = [
  {
    id: "cand-priya",
    stageId: "applied",
    name: "Priya Nair",
    email: "priya.nair@example.com",
    phone: "+91 98450 21134",
    location: "Bangalore",
    origin: { kind: "applied" },
    appliedAt: BASE - 6 * HOUR,
    resumeFileName: "priya-nair-resume.pdf",
    tripStatus: "none",
    tags: [],
    ratings: [],
    notes: [],
    timeline: [ev("t-priya-1", "Application submitted", "candidate", 6 * HOUR)],
  },
  {
    id: "cand-arjun",
    stageId: "applied",
    name: "Arjun Mehta",
    email: "arjun.mehta@example.com",
    phone: "+91 99012 88420",
    location: "Pune",
    origin: { kind: "submitted_by", by: "Ravi Kulkarni" },
    appliedAt: BASE - 1 * DAY,
    resumeFileName: "arjun-mehta-cv.pdf",
    tripStatus: "sent",
    tripSentAt: BASE - 4 * HOUR,
    tags: ["Fast ramp"],
    ratings: [],
    notes: [],
    timeline: [
      ev("t-arjun-1", "Added as prospect", "team", 1 * DAY, "Submitted by Ravi Kulkarni"),
      ev("t-arjun-2", "Application submitted", "candidate", 20 * HOUR),
      ev("t-arjun-3", "Trip sent", "team", 4 * HOUR),
    ],
  },
  {
    id: "cand-sneha",
    stageId: "applied",
    name: "Sneha Raghavan",
    email: "sneha.r@example.com",
    phone: "+91 90080 44219",
    location: "Chennai",
    origin: { kind: "applied" },
    appliedAt: BASE - 2 * DAY,
    resumeFileName: "sneha-raghavan.pdf",
    tripStatus: "none",
    tags: [],
    ratings: [],
    notes: [],
    timeline: [ev("t-sneha-1", "Application submitted", "candidate", 2 * DAY)],
  },
  {
    id: "cand-vikram",
    stageId: "screened",
    name: "Vikram Desai",
    email: "vikram.desai@example.com",
    phone: "+91 98209 71455",
    location: "Mumbai",
    origin: { kind: "applied" },
    appliedAt: BASE - 5 * DAY,
    resumeFileName: "vikram-desai-resume.pdf",
    ...scored(88),
    tripSentAt: BASE - 4 * DAY,
    tags: ["Strong communicator", "High ownership"],
    ratings: [],
    notes: [
      {
        id: "n-vikram-1",
        body: "Really crisp on trade-offs in the rapid fire round. Worth fast-tracking.",
        author: "Alex Smith",
        createdAt: BASE - 2 * DAY,
        mentions: [],
      },
    ],
    timeline: [
      ev("t-vikram-1", "Application submitted", "candidate", 5 * DAY),
      ev("t-vikram-2", "Trip sent", "team", 4 * DAY),
      ev("t-vikram-3", "Trip completed", "candidate", 3 * DAY, "Scored 88"),
      ev("t-vikram-4", "Moved to Screened", "team", 3 * DAY, "Applied → Screened"),
    ],
  },
  {
    id: "cand-aisha",
    stageId: "screened",
    name: "Aisha Khan",
    email: "aisha.khan@example.com",
    phone: "+91 97400 63028",
    location: "Hyderabad",
    origin: { kind: "submitted_by", by: "Meera Iyer" },
    appliedAt: BASE - 6 * DAY,
    resumeFileName: "aisha-khan-cv.pdf",
    ...scored(61),
    tripSentAt: BASE - 5 * DAY,
    tags: ["Needs coaching"],
    ratings: [],
    notes: [],
    timeline: [
      ev("t-aisha-1", "Added as prospect", "team", 6 * DAY, "Submitted by Meera Iyer"),
      ev("t-aisha-2", "Trip sent", "team", 5 * DAY),
      ev("t-aisha-3", "Trip completed", "candidate", 4 * DAY, "Scored 61"),
      ev("t-aisha-4", "Moved to Screened", "team", 4 * DAY, "Applied → Screened"),
    ],
  },
  {
    id: "cand-rohan",
    stageId: "submitted",
    name: "Rohan Bhatia",
    email: "rohan.bhatia@example.com",
    phone: "+91 98118 30277",
    location: "Gurgaon",
    origin: { kind: "applied" },
    appliedAt: BASE - 9 * DAY,
    resumeFileName: "rohan-bhatia-resume.pdf",
    ...scored(79),
    tripSentAt: BASE - 8 * DAY,
    tags: ["Client ready", "Culture add"],
    ratings: [],
    notes: [
      {
        id: "n-rohan-1",
        body: "Shared the profile with the client this morning — waiting on their read.",
        author: "Alex Smith",
        createdAt: BASE - 1 * DAY,
        mentions: [],
      },
    ],
    timeline: [
      ev("t-rohan-1", "Application submitted", "candidate", 9 * DAY),
      ev("t-rohan-2", "Trip completed", "candidate", 7 * DAY, "Scored 79"),
      ev("t-rohan-3", "Moved to Submitted to Client", "team", 1 * DAY, "Screened → Submitted to Client"),
    ],
  },
  {
    id: "cand-nikhil",
    stageId: "interviewing",
    name: "Nikhil Rao",
    email: "nikhil.rao@example.com",
    phone: "+91 96320 17744",
    location: "Bangalore",
    origin: { kind: "applied" },
    appliedAt: BASE - 12 * DAY,
    resumeFileName: "nikhil-rao-cv.pdf",
    ...scored(84),
    tripSentAt: BASE - 11 * DAY,
    interviewAt: BASE + 2 * DAY,
    tags: ["High ownership"],
    ratings: [],
    notes: [],
    timeline: [
      ev("t-nikhil-1", "Application submitted", "candidate", 12 * DAY),
      ev("t-nikhil-2", "Trip completed", "candidate", 10 * DAY, "Scored 84"),
      ev("t-nikhil-3", "Moved to Interviewing", "team", 3 * DAY, "Submitted to Client → Interviewing"),
      ev("t-nikhil-4", "Interview scheduled", "team", 2 * DAY),
    ],
  },
  {
    id: "cand-divya",
    stageId: "offered",
    name: "Divya Menon",
    email: "divya.menon@example.com",
    phone: "+91 95000 92866",
    location: "Bangalore",
    origin: { kind: "applied" },
    appliedAt: BASE - 20 * DAY,
    resumeFileName: "divya-menon-resume.pdf",
    ...scored(91),
    tripSentAt: BASE - 19 * DAY,
    tags: ["Strong communicator", "Client ready", "Fast ramp"],
    ratings: [],
    notes: [
      {
        id: "n-divya-1",
        body: "Offer sent. @Alex Smith please chase the signed copy by Friday.",
        author: "Meera Iyer",
        createdAt: BASE - 2 * DAY,
        mentions: ["Alex Smith"],
      },
    ],
    timeline: [
      ev("t-divya-1", "Application submitted", "candidate", 20 * DAY),
      ev("t-divya-2", "Trip completed", "candidate", 18 * DAY, "Scored 91"),
      ev("t-divya-3", "Moved to Offered", "team", 2 * DAY, "Interviewing → Offered"),
    ],
  },
];

export function seedBoard(): PipelineBoard {
  return {
    stages: DEFAULT_PIPELINE_STAGES.map((stage) => ({ ...stage })),
    // Deep-ish copy so a caller mutating the board can never write back into this module.
    candidates: CANDIDATES.map((c) => ({
      ...c,
      tags: [...c.tags],
      ratings: c.ratings.map((r) => ({ ...r })),
      notes: c.notes.map((n) => ({ ...n, mentions: [...n.mentions] })),
      timeline: c.timeline.map((t) => ({ ...t })),
    })),
  };
}
