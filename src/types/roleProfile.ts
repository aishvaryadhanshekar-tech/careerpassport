import type { FieldState } from "./shared";

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
