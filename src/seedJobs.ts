import { seedApplication } from "./seedApplication";
import { createDraft, type JobDraft } from "./types";

/**
 * One ready-made published job, so the prototype opens on a populated Jobs list instead of
 * the empty state. Pairs with the pipeline seed in seedCandidates.ts — `getBoard` seeds a
 * board for whatever job id it is first asked about, so this job gets that board for free.
 *
 * Deterministic on purpose — fixed id, fixed timestamps derived from a fixed BASE rather
 * than Date.now(). Same reasoning as seedCandidates: the list looks identical on every
 * reload, and `formatUpdated` still renders a sensible relative age.
 *
 * Exports the draft rather than a finished JobRecord: JobRecord and `salaryLabel` live in
 * jobsStore, which imports this module, so building the record here would be circular and
 * would duplicate the salary formatting. jobsStore assembles the record instead.
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

  return draft;
}
