import type {
  FieldRequirement,
  StandardField,
  StandardFieldId,
} from "./types";

export const STANDARD_FIELD_IDS: StandardFieldId[] = [
  "resume",
  "coverLetter",
  "linkedinUrl",
  "portfolioUrl",
  "currentCompany",
  "expectedCtc",
  "noticePeriod",
  "currentCtc",
  "availableStartDate",
  "currentLocation",
  "yearsOfExperience",
];

export const STANDARD_FIELD_META: Record<
  StandardFieldId,
  { label: string; defaultRequired: FieldRequirement }
> = {
  resume: {
    label: "Resume",
    defaultRequired: "mandatory",
  },
  coverLetter: {
    label: "Cover letter",
    defaultRequired: "optional",
  },
  linkedinUrl: {
    label: "LinkedIn URL",
    defaultRequired: "mandatory",
  },
  portfolioUrl: {
    label: "Portfolio URL",
    defaultRequired: "optional",
  },
  currentCompany: {
    label: "Current company",
    defaultRequired: "optional",
  },
  expectedCtc: {
    label: "Expected CTC",
    defaultRequired: "mandatory",
  },
  noticePeriod: {
    label: "Notice period",
    defaultRequired: "mandatory",
  },
  currentCtc: {
    label: "Current CTC",
    defaultRequired: "optional",
  },
  availableStartDate: {
    label: "Available start date",
    defaultRequired: "optional",
  },
  currentLocation: {
    label: "Current location",
    defaultRequired: "mandatory",
  },
  yearsOfExperience: {
    label: "Years of experience",
    defaultRequired: "mandatory",
  },
};

export function defaultStandardFields(): StandardField[] {
  return STANDARD_FIELD_IDS.map((id) => ({
    id,
    required: STANDARD_FIELD_META[id].defaultRequired,
  }));
}
