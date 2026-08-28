import type { ApplicationConfig } from "./application";
import {
  COVERAGE_IDS,
  FLAG_IDS,
  emptyPreviewFields,
  emptyPublishDestinations,
} from "./jobs";
import type {
  Attachment,
  CoverageId,
  FlagId,
  JobPreviewFields,
  PublishDestinations,
  RecordingClip,
} from "./jobs";
import { emptyRoleProfile } from "./roleProfile";
import type { RoleProfileFields } from "./roleProfile";
import type { Currency, FieldState, SalaryPeriod } from "./shared";
import type { Trip } from "./trips";

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
  publishDestinations: PublishDestinations;
  trips: Trip[];
};

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
    publishDestinations: emptyPublishDestinations(),
    trips: [],
  };
}
