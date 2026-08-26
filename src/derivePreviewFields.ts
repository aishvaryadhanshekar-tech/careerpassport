import { joinPoints, joinTags, splitPoints } from "./formControlUtils";
import type { JobDraft, JobPreviewFields } from "./types";

const TARGET_COMPANIES_BY_INDUSTRY: Record<string, string[]> = {
  fintech: ["Razorpay", "PhonePe", "CRED", "Groww"],
  "b2b saas": ["Freshworks", "Zoho", "Chargebee", "Postman"],
  "hr tech": ["Darwinbox", "Keka", "Springworks"],
  healthcare: ["Practo", "PharmEasy", "Cure.fit"],
  "e-commerce": ["Flipkart", "Myntra", "Meesho", "Nykaa"],
  ai: ["Sarvam AI", "Krutrim", "Fractal Analytics"],
};

const DEFAULT_TARGET_COMPANIES = ["Similar-stage startups", "Category leaders"];

const INDUSTRY_SECTORS_BY_INDUSTRY: Record<string, string[]> = {
  fintech: ["Fintech", "Payments", "Banking"],
  "b2b saas": ["B2B SaaS", "Enterprise software"],
  "hr tech": ["HR tech", "B2B SaaS"],
  healthcare: ["Healthcare", "Healthtech"],
  "e-commerce": ["E-commerce", "Retail tech"],
  ai: ["AI", "Deep tech"],
};

const DEFAULT_INDUSTRY_SECTORS = ["Technology"];

function lookup(table: Record<string, string[]>, industryType: string): string[] {
  const key = industryType.trim().toLowerCase();
  return table[key] ?? [];
}

export function deriveJobPreview(draft: JobDraft): JobPreviewFields {
  const designation = draft.fields.designation.value.trim();
  const experienceYears = draft.fields.experienceYears.value.trim();
  const experienceType = draft.fields.experienceType.value.trim();
  const industryType = draft.fields.industryType.value.trim();
  const mustHaves = splitPoints(draft.fields.mustHaves.value);

  const idealCandidateBits = [
    designation ? `A ${designation.toLowerCase()}` : "A candidate",
    experienceYears ? `with ${experienceYears} of experience` : "",
    experienceType ? `looking for a ${experienceType.toLowerCase()} role` : "",
    mustHaves.length > 0 ? `who brings ${mustHaves[0].toLowerCase()}` : "",
  ].filter(Boolean);
  const idealCandidate = idealCandidateBits.join(" ") + (idealCandidateBits.length ? "." : "");

  const expectedSkills = joinPoints(mustHaves);

  const targetCompanies = joinPoints([
    ...lookup(TARGET_COMPANIES_BY_INDUSTRY, industryType),
    ...(lookup(TARGET_COMPANIES_BY_INDUSTRY, industryType).length ? [] : DEFAULT_TARGET_COMPANIES),
  ]);

  const industrySectors = joinTags([
    ...lookup(INDUSTRY_SECTORS_BY_INDUSTRY, industryType),
    ...(lookup(INDUSTRY_SECTORS_BY_INDUSTRY, industryType).length ? [] : DEFAULT_INDUSTRY_SECTORS),
  ]);

  return {
    idealCandidate,
    expectedSkills,
    targetCompanies,
    industrySectors,
  };
}
