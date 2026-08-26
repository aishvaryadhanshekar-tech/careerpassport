import { persistableDraft } from "./applyAnalysis";
import { memoryStorage } from "./memoryStore";
import {
  createDraft,
  emptyFields,
  emptyFlags,
  emptyPreviewFields,
  emptyRoleProfile,
  type ApplicationConfig,
  type CoverageId,
  type Currency,
  type EvaluationCriterion,
  type FieldState,
  type JobDraft,
  type JobPreviewFields,
  type RoleProfileFields,
  type SalaryPeriod,
} from "./types";


function readApplication(value: unknown): ApplicationConfig | null {
  if (!value || typeof value !== "object") return null;
  const config = value as ApplicationConfig;
  if (!Array.isArray(config.standardOrder) || !config.context || !Array.isArray(config.items)) {
    return null;
  }
  return config;
}

function readPreview(value: unknown): JobPreviewFields {
  const base = emptyPreviewFields();
  if (!value || typeof value !== "object") return base;
  const data = value as Partial<JobPreviewFields>;
  return {
    idealCandidate: data.idealCandidate ?? base.idealCandidate,
    expectedSkills: data.expectedSkills ?? base.expectedSkills,
    targetCompanies: data.targetCompanies ?? base.targetCompanies,
    industrySectors: data.industrySectors ?? base.industrySectors,
  };
}

function readRoleProfile(value: unknown): RoleProfileFields {
  const base = emptyRoleProfile();
  if (!value || typeof value !== "object") return base;
  const data = value as Partial<RoleProfileFields>;
  return {
    headline: (data.headline as FieldState) ?? base.headline,
    portrait: (data.portrait as FieldState) ?? base.portrait,
    avoidLookalikes: data.avoidLookalikes ?? base.avoidLookalikes,
    evaluationFramework: Array.isArray(data.evaluationFramework)
      ? (data.evaluationFramework as EvaluationCriterion[])
      : base.evaluationFramework,
  };
}

export const STORAGE_KEY = "cp.jobDraft.v1";

export function saveDraft(draft: JobDraft) {
  memoryStorage.setItem(STORAGE_KEY, JSON.stringify(persistableDraft(draft)));
}

export function loadDraft(): JobDraft {
  const base = createDraft();
  try {
    const raw = memoryStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const data = JSON.parse(raw) as Partial<ReturnType<typeof persistableDraft>>;
    const fields = emptyFields();
    if (data.fields) {
      for (const id of Object.keys(fields) as CoverageId[]) {
        if (data.fields[id]) fields[id] = data.fields[id];
      }
    }
    return {
      ...base,
      transcript: data.transcript ?? "",
      fields,
      salaryCurrency: (data.salaryCurrency as Currency | null) ?? null,
      salaryPeriod: (data.salaryPeriod as SalaryPeriod) ?? "Per year",
      flags: { ...emptyFlags(), ...(data.flags ?? {}) },
      flagsPromptShown: Boolean(data.flagsPromptShown),
      analysedOnce: Boolean(data.analysedOnce),
      application: readApplication(data.application),
      preview: readPreview(data.preview),
      previewGenerated: Boolean(data.previewGenerated),
      roleProfile: readRoleProfile(data.roleProfile),
      roleProfileGenerated: Boolean(data.roleProfileGenerated),
    };
  } catch {
    return base;
  }
}
