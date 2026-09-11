import { DEMO_ROLES } from "../../demo/fixtures";

/**
 * Copy and parsing for the "Build with AI" intake: one open prompt (type, record, upload a JD
 * or pick a template), then the person generates the role brief when they're ready.
 */

/** Top line of the composer card during the open intake. */
export const INTAKE_QUESTION = "How would you like to describe the role?";
export const GENERATE_BRIEF_LABEL = "Generate role brief";

export const INTAKE_WELCOME =
  "Tell me about the role you're hiring for — speak it, attach a job description, or type it out. I'll turn it into a complete role brief you can review.";

/** Starting templates, shared by the start screen and the assistant. */
export const TEMPLATE_ROLES: readonly string[] = DEMO_ROLES;
export const TEMPLATE_BLURB = "Application · assessment · 2 interview rounds";

const SENIORITY = /\b(junior|mid[- ]?level|senior|lead|staff|principal)\b/i;
const MODES: readonly (readonly [RegExp, string])[] = [
  [/\bremote\b/i, "Remote"],
  [/\bhybrid\b/i, "Hybrid"],
  [/\b(?:on[- ]?site|in[- ]office)\b/i, "On-site"],
];

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
