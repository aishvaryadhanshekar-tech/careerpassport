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

export const REQUIRED_COVERAGE_IDS = COVERAGE_IDS.filter(
  (id): id is Exclude<CoverageId, "disqualifier" | "evaluationCriteria"> =>
    id !== "disqualifier" && id !== "evaluationCriteria",
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

export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "SGD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const PERIODS = ["Per year", "Per month", "Per hour"] as const;
export type SalaryPeriod = (typeof PERIODS)[number];

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

export type FieldSource = "empty" | "extracted" | "user";

export type FieldState = {
  value: string;
  source: FieldSource;
};

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


export type FieldRequirement = "mandatory" | "optional";
export type StandardFieldRequirement = FieldRequirement | "skipped";

export type StandardFieldId =
  | "resume"
  | "coverLetter"
  | "linkedinUrl"
  | "portfolioUrl"
  | "currentCompany"
  | "expectedCtc"
  | "noticePeriod"
  | "currentCtc"
  | "availableStartDate"
  | "currentLocation"
  | "yearsOfExperience";

export type StandardField = {
  id: StandardFieldId;
  required: StandardFieldRequirement;
};

export type CustomQuestionType =
  | "short_answer"
  | "paragraph"
  | "multiple_choice"
  | "checkboxes"
  | "dropdown";

export type CustomQuestion = {
  id: string;
  kind: "question";
  prompt: string;
  type: CustomQuestionType;
  required: FieldRequirement;
  options: string[];
  imageUrl?: string;
};

export type SectionBreak = {
  id: string;
  kind: "section";
  title: string;
  description: string;
};

export type ApplicationItem = CustomQuestion | SectionBreak;

export type ApplicationConfig = {
  standardOrder: StandardField[];
  context: {
    // `source` mirrors the FieldState convention used elsewhere (see
    // RoleProfilePage's mergeFieldState): "user" once the person has typed
    // their own copy in the Application step, so auto-resync from Job
    // Details / Role Profile knows to leave it alone. Anything else stays
    // eligible to be refreshed as upstream fields change.
    company: { shown: boolean; text: string; source: FieldSource };
    role: { shown: boolean; text: string; source: FieldSource };
  };
  items: ApplicationItem[];
};

export const EVAL_TYPES = [
  "must_have",
  "number_threshold",
  "rating_scale",
  "qualitative",
] as const;
export type EvalType = (typeof EVAL_TYPES)[number];
export const EVAL_TYPE_LABELS: Record<EvalType, string> = {
  must_have: "Must-have",
  number_threshold: "Number threshold",
  rating_scale: "Rating scale",
  qualitative: "Qualitative",
};

export const EVAL_IMPORTANCE = ["critical", "important", "nice_to_have"] as const;
export type EvalImportance = (typeof EVAL_IMPORTANCE)[number];
export const EVAL_IMPORTANCE_LABELS: Record<EvalImportance, string> = {
  critical: "Critical",
  important: "Important",
  nice_to_have: "Nice to have",
};

export const COMPARATORS = ["≥", "≤", "=", ">", "<"] as const;
export const DEFAULT_QUALITATIVE_GRADES = ["Weak", "Adequate", "Strong"];

export const UNIT_SUGGESTIONS = [
  "years",
  "months",
  "%",
  "points",
  "x (multiplier)",
  "₹",
  "$",
  "hours",
  "days",
] as const;

export type EvaluationCriterion = {
  id: string;
  label: string;
  type: EvalType;
  importance: EvalImportance;
  comparator?: string;
  target?: string;
  unit?: string;
  scaleMax?: string;
  grades?: string[];
};

export type RoleProfileFields = {
  headline: FieldState;
  portrait: FieldState;
  department: FieldState;
  avoidLookalikes: string;
  evaluationFramework: EvaluationCriterion[];
};

export function emptyRoleProfile(): RoleProfileFields {
  return {
    headline: { value: "", source: "empty" },
    portrait: { value: "", source: "empty" },
    department: { value: "", source: "empty" },
    avoidLookalikes: "",
    evaluationFramework: [],
  };
}

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

export type JobDraft = {
  transcript: string;
  clips: RecordingClip[];
  attachments: Attachment[];
  fields: Record<CoverageId, FieldState>;
  salaryCurrency: Currency | null;
  salaryPeriod: SalaryPeriod;
  flags: Record<FlagId, boolean>;
  flagsPromptShown: boolean;
  analysedOnce: boolean;
  application: ApplicationConfig | null;
  preview: JobPreviewFields;
  previewGenerated: boolean;
  roleProfile: RoleProfileFields;
  roleProfileGenerated: boolean;
};

export type Extraction = {
  fields: Partial<Record<CoverageId, string>>;
  salaryCurrency?: Currency;
  salaryPeriod?: SalaryPeriod;
  flags: Partial<Record<FlagId, true>>;
};

export const GOLDEN_TRANSCRIPT =
  "Senior backend engineer, 5–8 years, Bangalore hybrid, ₹45–60L, ownership of payments services, on-call OK";

export function emptyFields(): Record<CoverageId, FieldState> {
  return Object.fromEntries(
    COVERAGE_IDS.map((id) => [id, { value: "", source: "empty" as const }]),
  ) as Record<CoverageId, FieldState>;
}

export function emptyFlags(): Record<FlagId, boolean> {
  return Object.fromEntries(FLAG_IDS.map((id) => [id, false])) as Record<
    FlagId,
    boolean
  >;
}

export function createDraft(): JobDraft {
  return {
    transcript: "",
    clips: [],
    attachments: [],
    fields: emptyFields(),
    salaryCurrency: null,
    salaryPeriod: "Per year",
    flags: emptyFlags(),
    flagsPromptShown: false,
    analysedOnce: false,
    application: null,
    preview: emptyPreviewFields(),
    previewGenerated: false,
    roleProfile: emptyRoleProfile(),
    roleProfileGenerated: false,
  };
}

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
