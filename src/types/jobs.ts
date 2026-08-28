import type { Currency, FieldState, SalaryPeriod } from "./shared";

export const COVERAGE_IDS = [
  "designation",
  "experienceYears",
  "location",
  "workMode",
  "salary",
  "industryType",
  "companyType",
  "experienceType",
  "mustHaves",
  "disqualifier",
  "redFlags",
  "searchStrategy",
  "evaluationCriteria",
] as const;

export type CoverageId = (typeof COVERAGE_IDS)[number];

const OPTIONAL_COVERAGE_IDS = [
  "companyType",
  "experienceType",
  "mustHaves",
  "disqualifier",
  "redFlags",
  "searchStrategy",
  "evaluationCriteria",
] as const;

export const REQUIRED_COVERAGE_IDS = COVERAGE_IDS.filter(
  (id): id is Exclude<CoverageId, (typeof OPTIONAL_COVERAGE_IDS)[number]> =>
    !(OPTIONAL_COVERAGE_IDS as readonly string[]).includes(id),
);

export const FLAG_IDS = [
  "confidential",
  "noUpperSalaryCap",
  "newPosition",
  "replacementHiring",
  "firstPrinciplesThinker",
  "aiToolPowerUser",
  "anyExperienceWorks",
] as const;

export type FlagId = (typeof FLAG_IDS)[number];

export const COVERAGE_LABELS: Record<CoverageId, string> = {
  designation: "Designation",
  experienceYears: "Experience (in yrs)",
  location: "Location",
  workMode: "WFO/WFH",
  salary: "CTC",
  industryType: "Industry type",
  companyType: "Company type",
  experienceType: "Experience type",
  mustHaves: "Must haves",
  disqualifier: "Disqualifiers",
  redFlags: "Red flags",
  searchStrategy: "Thoughts on search strategy",
  evaluationCriteria: "Evaluation criteria",
};

export const FLAG_LABELS: Record<FlagId, string> = {
  confidential: "Confidential",
  noUpperSalaryCap: "No upper salary cap",
  newPosition: "New position",
  replacementHiring: "Replacement hiring",
  firstPrinciplesThinker: "1st principle thinker",
  aiToolPowerUser: "AI tool power user",
  anyExperienceWorks: "Any experience works",
};

export const WORK_MODE_OPTIONS = ["WFO", "WFH", "Hybrid"] as const;
export const COMPANY_TYPE_OPTIONS = [
  "Startup",
  "Enterprise",
  "Product",
  "Agency",
] as const;
export const EXPERIENCE_TYPE_OPTIONS = [
  "Full-time",
  "Contract",
  "Internship",
  "Founding",
] as const;
export const LOCATION_SUGGESTIONS = [
  "Bangalore",
  "Mumbai",
  "Delhi NCR",
  "Hyderabad",
  "Pune",
  "Chennai",
  "Remote",
] as const;
export const INDUSTRY_SUGGESTIONS = [
  "Fintech",
  "B2B SaaS",
  "HR tech",
  "Healthcare",
  "E-commerce",
  "AI",
] as const;
export const DEPARTMENT_OPTIONS = [
  "Engineering",
  "Product",
  "Design",
  "Sales",
  "Marketing",
  "HR",
  "Finance",
  "Operations",
  "Customer Success",
  "Legal",
] as const;

export type RecordingClip = {
  id: string;
  createdAt: number;
  durationMs: number;
  blobUrl: string;
};

export type Attachment = {
  id: string;
  name: string;
  mime: string;
  sizeBytes: number;
  kind: "document" | "image" | "audio" | "other";
  blobUrl: string;
};

export type JobPreviewFields = {
  idealCandidate: string;
  expectedSkills: string;
  targetCompanies: string;
  industrySectors: string;
};

export function emptyPreviewFields(): JobPreviewFields {
  return {
    idealCandidate: "",
    expectedSkills: "",
    targetCompanies: "",
    industrySectors: "",
  };
}

export type PublishDestinations = {
  internal: boolean;
  marketplace: boolean;
};

export function emptyPublishDestinations(): PublishDestinations {
  return { internal: true, marketplace: false };
}

export type Extraction = {
  fields: Partial<Record<CoverageId, string>>;
  salaryCurrency?: Currency;
  salaryPeriod?: SalaryPeriod;
  flags: Partial<Record<FlagId, true>>;
};

export const GOLDEN_TRANSCRIPT =
  "Senior backend engineer, 5–8 years, Bangalore hybrid, ₹45–60L, ownership of payments services, on-call OK";

export function isFieldCovered(
  id: CoverageId,
  fields: Record<CoverageId, FieldState>,
  salaryCurrency: Currency | null,
): boolean {
  const filled = fields[id].value.trim() !== "";
  if (!filled) return false;
  if (id === "salary") return salaryCurrency !== null;
  return true;
}

export function coveredCount(
  fields: Record<CoverageId, FieldState>,
  salaryCurrency: Currency | null,
): number {
  return REQUIRED_COVERAGE_IDS.filter((id) =>
    isFieldCovered(id, fields, salaryCurrency),
  ).length;
}
