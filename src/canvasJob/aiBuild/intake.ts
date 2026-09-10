import { DEMO_ROLES } from "../../demo/fixtures";
import type { JobDraft } from "../../types";

/**
 * The assistant's opening questions for "Build with AI". Answers become user-owned draft
 * fields plus one brief sentence, so the existing drafting flow runs unchanged after them.
 */
export type IntakeKey = "role" | "where" | "musts";
export type IntakeAnswers = Partial<Record<IntakeKey, string>>;

export type IntakeStep = {
  key: IntakeKey;
  question: string;
  placeholder: string;
  /** Quick replies offered under the question. */
  chips: readonly string[];
};

export const INTAKE_STEPS: readonly IntakeStep[] = [
  {
    key: "role",
    question: "What role are you hiring for?",
    placeholder: "e.g. Senior Product Designer",
    // Deliberately not the template names, so an answer never reads as picking a template.
    chips: ["Product Designer", "Backend Engineer", "Sales Manager"],
  },
  {
    key: "where",
    question: "How senior is it, and where will they work?",
    placeholder: "e.g. Senior · Hybrid, London",
    chips: ["Senior · Hybrid, London", "Mid-level · Remote", "Lead · On-site, Bangalore"],
  },
  {
    key: "musts",
    question: "Any must-haves? Skills, experience, anything non-negotiable.",
    placeholder: "e.g. 5+ years in B2B SaaS, strong systems thinking",
    chips: ["Skip"],
  },
];

export const INTAKE_WELCOME =
  "Hi! Answer 3 quick questions and I'll draft your role brief and pipeline — or start from a template.";

/** Starting templates, shared by the start screen and the assistant. */
export const TEMPLATE_ROLES: readonly string[] = DEMO_ROLES;
export const TEMPLATE_BLURB = "Application · assessment · 2 interview rounds";

export const TEMPLATE_LINK = "Use a template";
export const JD_LINK = "Paste or upload a JD";
export const JD_PROMPT = "Paste the job description below, or attach a file.";

const SKIP = /^\s*(?:skip|none|no|n\/a)\.?\s*$/i;
const SENIORITY = /\b(junior|mid[- ]?level|senior|lead|staff|principal)\b/i;
const MODES: readonly (readonly [RegExp, string])[] = [
  [/\bremote\b/i, "Remote"],
  [/\bhybrid\b/i, "Hybrid"],
  [/\b(?:on[- ]?site|in[- ]office)\b/i, "On-site"],
];

export function isSkip(text: string): boolean {
  return SKIP.test(text);
}

/** Pull seniority, work mode and a location out of an answer like "Senior · Hybrid, London". */
export function readWhere(text: string): { seniority?: string; workMode?: string; location?: string } {
  const seniority = SENIORITY.exec(text)?.[1];
  const mode = MODES.find(([pattern]) => pattern.test(text));
  let rest = text.replace(SENIORITY, " ");
  for (const [pattern] of MODES) rest = rest.replace(pattern, " ");
  const location = rest
    .split(/[·,|/]|\s-\s|\bin\b|\bbased\b/i)
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
  return {
    seniority: seniority && seniority[0].toUpperCase() + seniority.slice(1).toLowerCase(),
    workMode: mode?.[1],
    location: location || undefined,
  };
}

/** The role title, prefixed with the answered seniority unless it already carries one. */
function roleTitle(answers: IntakeAnswers): string {
  const role = answers.role?.trim() ?? "";
  const { seniority } = readWhere(answers.where ?? "");
  if (!role || !seniority || /^mid/i.test(seniority) || SENIORITY.test(role)) return role;
  return `${seniority} ${role}`;
}

export function applyIntake(answers: IntakeAnswers, draft: JobDraft): JobDraft {
  const { workMode, location } = readWhere(answers.where ?? "");
  const musts = answers.musts?.trim() ?? "";
  const set = { designation: roleTitle(answers), workMode, location, mustHaves: isSkip(musts) ? "" : musts };
  const fields = { ...draft.fields };
  for (const [key, value] of Object.entries(set) as [keyof typeof set, string | undefined][]) {
    if (value) fields[key] = { value, source: "user" };
  }
  return { ...draft, fields };
}

/** One sentence the drafting step reads, in place of a free-text brief. */
export function composeBrief(answers: IntakeAnswers): string {
  const musts = answers.musts?.trim() ?? "";
  return [
    roleTitle(answers) && `Hiring a ${roleTitle(answers)}.`,
    answers.where?.trim() && `${answers.where.trim()}.`,
    musts && !isSkip(musts) && `Must-haves: ${musts}.`,
  ]
    .filter(Boolean)
    .join(" ");
}
