import { EVAL_IMPORTANCE_LABELS, EVAL_TYPE_LABELS } from "./types";
import type { InferenceCard, InferenceCardId, JobDraft, Trip } from "./types";

function evaluationCriteriaSummary(draft: JobDraft): string {
  return draft.roleProfile.evaluationFramework
    .map((criterion) => {
      const label = criterion.label.trim() || "Untitled criterion";
      return `${label} — ${EVAL_TYPE_LABELS[criterion.type]}, ${EVAL_IMPORTANCE_LABELS[criterion.importance]}`;
    })
    .join("\n");
}

function sourcingStrategySummary(draft: JobDraft): string {
  const lines = [
    draft.fields.searchStrategy.value.trim(),
    draft.preview.targetCompanies.trim()
      ? `Target companies: ${draft.preview.targetCompanies.trim()}`
      : "",
    draft.roleProfile.avoidLookalikes.trim()
      ? `Avoid lookalikes: ${draft.roleProfile.avoidLookalikes.trim()}`
      : "",
  ];
  return lines.filter(Boolean).join("\n");
}

export function deriveInferenceCards(draft: JobDraft): InferenceCard[] {
  return [
    { id: "idealCandidate", title: "Ideal candidate", content: draft.preview.idealCandidate ?? "" },
    // No existing source field maps to tribal details — the hiring manager fills this in by hand.
    { id: "tribalDetails", title: "Tribal details", content: "" },
    { id: "skills", title: "Skills expected", content: draft.preview.expectedSkills ?? "" },
    { id: "evaluationCriteria", title: "Evaluation criteria", content: evaluationCriteriaSummary(draft) },
    { id: "sourcingStrategy", title: "Sourcing strategy", content: sourcingStrategySummary(draft) },
    { id: "redFlags", title: "Red flags", content: draft.fields.redFlags.value ?? "" },
  ];
}

export function updateInferenceCard(
  cards: InferenceCard[],
  id: InferenceCardId,
  content: string,
): InferenceCard[] {
  return cards.map((card) => (card.id === id ? { ...card, content } : card));
}

export function lockInferenceCards(trip: Trip): Trip {
  return { ...trip, inferenceCardsLocked: true };
}
