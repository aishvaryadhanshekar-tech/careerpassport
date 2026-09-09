import { seedApplication } from "./seedApplication";
import { buildTripWithAI } from "./tripAIBuild";
import { createDraft, type Difficulty, type JobDraft, type StageType } from "./types";

/**
 * Stable sample identities and complete role snapshots. Candidate boards are seeded
 * lazily for each job by the existing candidate store. Record construction remains
 * in jobsStore to avoid a circular dependency and duplicate salary formatting.
 */
export const SEEDED_JOB_ID = "job-seed-senior-backend";

const BASE = Date.UTC(2026, 7, 28, 9, 0, 0); // 2026-08-28T09:00:00Z
const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

export const SEEDED_JOB_CREATED_AT = BASE - 21 * DAY;
export const SEEDED_JOB_UPDATED_AT = BASE - 5 * HOUR;

const TRANSCRIPT =
  "We need a senior backend engineer for the payments platform in Bangalore. Five to eight " +
  "years, hybrid three days in office, budget is forty five to sixty lakhs. They should own " +
  "our payment services end to end — settlement, reconciliation, the ledger. Go and Postgres " +
  "is the stack. On-call is part of the job, roughly one week in six. I care much more about " +
  "someone who has debugged a live money-movement incident than about brand names on the CV.";

const FIELD_VALUES: Partial<Record<keyof JobDraft["fields"], string>> = {
  designation: "Senior Backend Engineer, Payments",
  experienceYears: "5–8",
  location: "Bangalore",
  workMode: "Hybrid",
  salary: "₹45–60L",
  industryType: "Fintech",
  companyType: "Product",
  experienceType: "Full-time",
  mustHaves:
    "Owned a payments or ledger service in production; strong Go or Java; Postgres at scale; comfortable on-call.",
  disqualifier:
    "No production ownership — only feature work behind someone else's design.",
  redFlags:
    "Job-hops under 12 months with no shipped surface to point at; cannot explain a past incident in their own words.",
  searchStrategy:
    "Target fintech and marketplace payment teams in Bangalore and Hyderabad. Series B and later, where the candidate carried a pager.",
  evaluationCriteria:
    "Depth on money movement, incident judgement, and clarity when explaining trade-offs to non-engineers.",
};

export function seedJobDraft(): JobDraft {
  const draft = createDraft();
  draft.transcript = TRANSCRIPT;
  draft.analysedOnce = true;
  draft.flagsPromptShown = true;

  for (const [id, value] of Object.entries(FIELD_VALUES)) {
    const key = id as keyof JobDraft["fields"];
    draft.fields[key] = { value, source: "extracted" };
  }

  draft.salaryCurrency = "INR";
  draft.salaryPeriod = "Per year";
  draft.flags.newPosition = true;
  draft.flags.firstPrinciplesThinker = true;

  draft.roleProfile = {
    headline: {
      value: "Backend engineer who has carried payments in production",
      source: "extracted",
    },
    portrait: {
      value:
        "Five to eight years building server-side systems, most of it on money movement — " +
        "settlement, reconciliation or ledgers. Has been the person paged when a payout run " +
        "stalled and can walk through what they changed and why. Writes Go or Java by " +
        "preference, treats Postgres as a tool they know well rather than an ORM detail. " +
        "Comfortable in a hybrid team and used to reviewing other people's designs.",
      source: "extracted",
    },
    department: { value: "Engineering", source: "extracted" },
    avoidLookalikes:
      "Backend generalists whose payments exposure is calling a Stripe SDK. The distinction is owning the reconciliation, not integrating a provider.",
    evaluationFramework: [
      {
        id: "eval-payments",
        label: "Production ownership of a payments or ledger service",
        type: "must_have",
        importance: "critical",
      },
      {
        id: "eval-experience",
        label: "Years of backend experience",
        type: "number_threshold",
        importance: "critical",
        comparator: "≥",
        target: "5",
        unit: "years",
      },
      {
        id: "eval-incident",
        label: "Incident judgement under live money movement",
        type: "rating_scale",
        importance: "critical",
        scaleMax: "5",
      },
      {
        id: "eval-communication",
        label: "Explains trade-offs clearly to non-engineers",
        type: "qualitative",
        importance: "important",
        grades: ["Weak", "Adequate", "Strong"],
      },
      {
        id: "eval-go",
        label: "Go or Java depth",
        type: "rating_scale",
        importance: "important",
        scaleMax: "5",
      },
    ],
  };
  draft.roleProfileGenerated = true;

  draft.preview = {
    idealCandidate:
      "A senior backend engineer who has owned payment services end to end and can point at " +
      "the settlement or reconciliation path they built.",
    expectedSkills:
      "Go or Java, Postgres, distributed systems, idempotency and reconciliation, on-call ownership.",
    targetCompanies:
      "Razorpay, PhonePe, Juspay, Cred, Zeta, Setu, and payment teams inside larger marketplaces.",
    industrySectors: "Fintech, payments infrastructure, B2B SaaS, e-commerce.",
  };
  draft.previewGenerated = true;

  draft.application = seedApplication(draft);
  draft.publishDestinations = { internal: true, marketplace: true };
  draft.trips = attachedTrips(draft, [
    { stageId: "screened", types: ["rapid_fire", "coding_round"] },
    { stageId: "interviewing", types: ["case_study"] },
  ], "hard");

  return draft;
}

type TripGroup = { stageId: "screened" | "interviewing"; types: StageType[] };

/**
 * One AI-prefilled Trip per group, each attached at its own pipeline stage — same generator the
 * product uses. Splitting rounds across groups (rather than one Trip with every round) is what
 * gives jobs a genuinely different number of Trips, not just different round content.
 */
const TRIP_GROUP_LABEL: Record<TripGroup["stageId"], string> = {
  screened: "Screening",
  interviewing: "Final round",
};

function attachedTrips(draft: JobDraft, groups: TripGroup[], difficulty: Difficulty) {
  return groups.map((group) => {
    const trip = buildTripWithAI(draft, { difficulty, pipelineStageId: group.stageId, types: group.types });
    // Distinguish multi-Trip jobs' Trips by name — otherwise two Trips on one job both come out
    // titled "<role> Trip", which reads as a duplicate rather than two distinct stages of work.
    if (groups.length > 1) trip.title = `${trip.title} — ${TRIP_GROUP_LABEL[group.stageId]}`;
    return trip;
  });
}

/**
 * Complete, independent role snapshots for exploring different hiring journeys.
 * `tripGroups` gives each role a distinct shape: how many Trips it has, which stage each one
 * lands on, and which rounds make it up — so demo pipelines genuinely differ in structure, not
 * just in round-content flavor.
 */
const ADDITIONAL_ROLES = [
  { id: 'product-designer', title: 'Senior Product Designer', department: 'Design', industry: 'B2B SaaS', location: 'Bangalore', mode: 'Hybrid', salary: '₹28–38L', experience: '4–7', status: 'Published' as const, skills: 'Interaction design, user research, Figma, design systems and accessible interfaces', outcome: 'Own the onboarding experience from research through shipped product', companies: 'Freshworks, Postman, Chargebee', tripGroups: [{ stageId: 'screened', types: ['flaunt_or_flex'] }, { stageId: 'interviewing', types: ['pick_and_defend', 'do_a_demo'] }] as TripGroup[], tripDifficulty: 'medium' as Difficulty },
  { id: 'frontend-engineer', title: 'Frontend Engineer, Platform', department: 'Engineering', industry: 'Developer tools', location: 'Remote, India', mode: 'Remote', salary: '₹24–36L', experience: '3–5', status: 'Published' as const, skills: 'React, TypeScript, browser performance, accessibility and component testing', outcome: 'Build a fast, accessible developer dashboard and shared component library', companies: 'BrowserStack, Postman, Hasura', tripGroups: [{ stageId: 'screened', types: ['rapid_fire', 'coding_round', 'ai_critic'] }] as TripGroup[], tripDifficulty: 'medium' as Difficulty },
  { id: 'product-manager', title: 'Product Manager, Growth', department: 'Product', industry: 'Consumer technology', location: 'Mumbai', mode: 'Hybrid', salary: '₹32–45L', experience: '4–6', status: 'Draft' as const, skills: 'Experiment design, funnel analysis, customer discovery and roadmap prioritization', outcome: 'Improve activation and retention through measurable product experiments', companies: 'Meesho, Swiggy, Zepto', tripGroups: [{ stageId: 'screened', types: ['case_study', 'rank_order', 'pick_and_defend'] }] as TripGroup[], tripDifficulty: 'medium' as Difficulty },
  { id: 'data-analyst', title: 'Data Analyst', department: 'Data', industry: 'E-commerce', location: 'Hyderabad', mode: 'Hybrid', salary: '₹14–22L', experience: '2–4', status: 'Published' as const, skills: 'SQL, Python, dashboard design, statistics and stakeholder communication', outcome: 'Turn marketplace and fulfilment data into decisions for operations teams', companies: 'Flipkart, Amazon, Myntra', tripGroups: [{ stageId: 'screened', types: ['multiple_choice', 'coding_round'] }, { stageId: 'interviewing', types: ['case_study'] }] as TripGroup[], tripDifficulty: 'easy' as Difficulty },
  { id: 'customer-success', title: 'Customer Success Manager', department: 'Customer Success', industry: 'B2B SaaS', location: 'Pune', mode: 'Remote', salary: '₹16–24L', experience: '3–5', status: 'Published' as const, skills: 'Enterprise onboarding, account planning, renewal management and product adoption', outcome: 'Help enterprise customers adopt the platform and achieve their rollout goals', companies: 'Zoho, Freshworks, CleverTap', tripGroups: [{ stageId: 'screened', types: ['rapid_fire', 'pick_and_defend', 'case_study'] }] as TripGroup[], tripDifficulty: 'medium' as Difficulty },
  { id: 'operations-lead', title: 'Operations Lead, Last Mile', department: 'Operations', industry: 'Logistics', location: 'Delhi NCR', mode: 'On-site', salary: '₹20–30L', experience: '5–8', status: 'Draft' as const, skills: 'Delivery operations, capacity planning, vendor management and team leadership', outcome: 'Improve delivery reliability across a growing network of city hubs', companies: 'Delhivery, Blue Dart, Shadowfax', tripGroups: [{ stageId: 'screened', types: ['binary_choice', 'rank_order', 'case_study'] }] as TripGroup[], tripDifficulty: 'medium' as Difficulty },
];

function additionalDraft(role: typeof ADDITIONAL_ROLES[number]): JobDraft {
  const draft = createDraft();
  const values = {
    designation: role.title, experienceYears: role.experience, location: role.location,
    workMode: role.mode, salary: role.salary, industryType: role.industry,
    companyType: 'Product', experienceType: 'Full-time', mustHaves: role.skills,
    disqualifier: `No relevant experience in ${role.department.toLowerCase()}`,
    redFlags: 'Cannot explain their own contribution to a recent project',
    searchStrategy: `Look for teams at ${role.companies}`, evaluationCriteria: role.outcome,
  };
  for (const [key, value] of Object.entries(values)) {
    draft.fields[key as keyof JobDraft['fields']] = { value, source: 'extracted' };
  }
  draft.transcript = `Hire a ${role.title} with ${role.experience} years of experience. ${role.outcome}. ${role.skills}. Based in ${role.location}; ${role.mode.toLowerCase()}, ${role.salary} per year.`;
  draft.analysedOnce = true;
  draft.flagsPromptShown = true;
  draft.salaryCurrency = 'INR';
  draft.salaryPeriod = 'Per year';
  draft.roleProfile = {
    headline: { value: role.title, source: 'extracted' },
    portrait: { value: role.outcome, source: 'extracted' },
    department: { value: role.department, source: 'extracted' },
    avoidLookalikes: 'Experience without clear ownership of outcomes',
    evaluationFramework: [
      { id: `eval-${role.id}-skills`, label: role.skills, type: 'must_have', importance: 'critical' },
      { id: `eval-${role.id}-ownership`, label: role.outcome, type: 'qualitative', importance: 'important', grades: ['Limited', 'Clear', 'Strong'] },
    ],
  };
  draft.roleProfileGenerated = true;
  draft.preview = { idealCandidate: role.outcome, expectedSkills: role.skills, targetCompanies: role.companies, industrySectors: role.industry };
  draft.previewGenerated = true;
  draft.application = seedApplication(draft);
  draft.publishDestinations = { internal: true, marketplace: role.status === 'Published' };
  draft.trips = attachedTrips(draft, role.tripGroups, role.tripDifficulty);
  return draft;
}

/** Static ids only — safe to read without re-running draft generation (which mints new uids). */
export const DEMO_JOB_IDS: string[] = [SEEDED_JOB_ID, ...ADDITIONAL_ROLES.map((role) => `job-seed-${role.id}`)];

export function seedJobExamples() {
  return [
    { id: SEEDED_JOB_ID, status: 'Published' as const, createdAt: SEEDED_JOB_CREATED_AT, updatedAt: SEEDED_JOB_UPDATED_AT, draft: seedJobDraft() },
    ...ADDITIONAL_ROLES.map((role, index) => ({
      id: `job-seed-${role.id}`, status: role.status,
      createdAt: BASE - (18 - index) * DAY, updatedAt: BASE - (index + 1) * DAY,
      draft: additionalDraft(role),
    })),
  ];
}
