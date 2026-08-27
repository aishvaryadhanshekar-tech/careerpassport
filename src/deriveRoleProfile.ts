import { deriveJobPreview } from "./derivePreviewFields";
import { joinPoints, splitPoints } from "./formControlUtils";
import {
  DEFAULT_QUALITATIVE_GRADES,
  type EvaluationCriterion,
  type JobDraft,
  type RoleProfileFields,
} from "./types";

const DEFAULT_AVOID_LOOKALIKES = [
  "Similar title, different seniority",
  "Adjacent domain without hands-on ownership",
];

let criterionSeq = 0;
function nextCriterionId(): string {
  criterionSeq += 1;
  return `criterion-${Date.now()}-${criterionSeq}`;
}

function criteriaFromPoints(
  points: string[],
  importance: EvaluationCriterion["importance"],
): EvaluationCriterion[] {
  return points.map((label) => ({
    id: nextCriterionId(),
    label,
    type: "qualitative",
    importance,
    grades: [...DEFAULT_QUALITATIVE_GRADES],
  }));
}

export function deriveRoleProfile(draft: JobDraft): RoleProfileFields {
  const designation = draft.fields.designation.value.trim();
  const industryType = draft.fields.industryType.value.trim();
  const preview = deriveJobPreview(draft);

  const headlineValue = [designation, industryType].filter(Boolean).join(" · ");

  const mustHaves = splitPoints(draft.fields.mustHaves.value);
  const evaluationCriteria = splitPoints(draft.fields.evaluationCriteria.value);

  return {
    headline: { value: headlineValue, source: "extracted" },
    portrait: { value: preview.idealCandidate, source: "extracted" },
    department: { value: "", source: "empty" },
    avoidLookalikes: joinPoints(DEFAULT_AVOID_LOOKALIKES),
    evaluationFramework: [
      ...criteriaFromPoints(mustHaves, "critical"),
      ...criteriaFromPoints(evaluationCriteria, "important"),
    ],
  };
}
