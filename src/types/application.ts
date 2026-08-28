import type { FieldSource } from "./shared";

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
  | "dropdown"
  | "file_upload"
  | "linear_scale"
  | "rating"
  | "multiple_choice_grid"
  | "checkbox_grid"
  | "date"
  | "time";

export type CustomQuestion = {
  id: string;
  kind: "question";
  prompt: string;
  type: CustomQuestionType;
  required: FieldRequirement;
  options: string[];
  imageUrl?: string;
  // multiple_choice_grid / checkbox_grid
  rows?: string[];
  columns?: string[];
  requireResponsePerRow?: boolean;
  // linear_scale
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
  // rating
  ratingMax?: number;
  ratingIcon?: "star" | "heart" | "thumb";
  // file_upload
  restrictFileTypes?: boolean;
  allowedFileTypes?: string[];
  maxFiles?: number;
  maxFileSizeMb?: number;
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
