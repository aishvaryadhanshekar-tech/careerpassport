import { deriveJobPreview } from "./derivePreviewFields";
import { joinPoints, splitPoints } from "./formControlUtils";
import {
  DEFAULT_QUALITATIVE_GRADES,
  type EvaluationCriterion,
  type JobDraft,
  type RoleProfileFields,
} from "./types";

const GENERIC_AVOID_LOOKALIKES = [
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

// The "evaluationCriteria" coverage field is never surfaced on the Job
// Details step (see FORM_SECTIONS in CollectJobPage.tsx), so it is always
// blank by the time this runs. Red flags collected on Job Details are the
// closest real signal for a second (non-critical) tier of screening
// criteria, so use those instead of the always-empty field.
function avoidLookalikesFor(designation: string, companyType: string, experienceType: string): string[] {
  const points: string[] = [];
  if (designation) {
    points.push(`Similar title to "${designation}", but different seniority or scope`);
  }
  if (companyType) {
    points.push(`Background limited to ${companyType.toLowerCase()}-only companies, without relevant domain exposure`);
  } else {
    points.push(GENERIC_AVOID_LOOKALIKES[0]);
  }
  if (experienceType && experienceType.toLowerCase() !== "full-time") {
    points.push(`${experienceType} experience only, without sustained ownership of outcomes`);
  } else {
    points.push(GENERIC_AVOID_LOOKALIKES[1]);
  }
  return points;
}

export function deriveRoleProfile(draft: JobDraft): RoleProfileFields {
  const designation = draft.fields.designation.value.trim();
  const industryType = draft.fields.industryType.value.trim();
  const companyType = draft.fields.companyType.value.trim();
  const experienceType = draft.fields.experienceType.value.trim();
  const preview = deriveJobPreview(draft);

  const headlineValue = [designation, industryType].filter(Boolean).join(" · ");

  const mustHaves = splitPoints(draft.fields.mustHaves.value);
  const redFlags = splitPoints(draft.fields.redFlags.value);

  return {
    headline: { value: headlineValue, source: "extracted" },
    portrait: { value: preview.idealCandidate, source: "extracted" },
    avoidLookalikes: joinPoints(avoidLookalikesFor(designation, companyType, experienceType)),
    evaluationFramework: [
      ...criteriaFromPoints(mustHaves, "critical"),
      ...criteriaFromPoints(
        redFlags.map((flag) => `No red flag: ${flag}`),
        "important",
      ),
    ],
  };
}
