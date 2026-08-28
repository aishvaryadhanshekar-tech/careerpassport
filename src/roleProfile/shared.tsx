import { splitPoints } from "../formControlUtils";
import {
  COMPARATORS,
  EVAL_IMPORTANCE_LABELS,
  type EvalImportance,
  type EvaluationCriterion,
} from "../types";

export function ImportanceBadge({ importance }: { importance: EvalImportance }) {
  return (
    <span className={`importance-badge importance-${importance.replace(/_/g, "-")}`}>
      {EVAL_IMPORTANCE_LABELS[importance]}
    </span>
  );
}

export function MustHaveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 8.5 6.2 11.7 13 4.3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RedFlagIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 1.5 15 14H1L8 1.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M8 6.2v3.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="8" cy="11.5" r="0.9" fill="currentColor" />
    </svg>
  );
}

export function MustHaveRedFlagTable({ mustHaves, redFlags }: { mustHaves: string; redFlags: string }) {
  const rows = [
    ...splitPoints(mustHaves).map((text) => ({ kind: "must-have" as const, text })),
    ...splitPoints(redFlags).map((text) => ({ kind: "red-flag" as const, text })),
  ];

  if (rows.length === 0) {
    return <p className="jd-empty">Not captured yet.</p>;
  }

  return (
    <table className="req-table">
      <tbody>
        {rows.map((row, index) => (
          <tr className={`req-table-row req-table-row-${row.kind}`} key={`${row.kind}-${index}-${row.text}`}>
            <td className="req-table-indicator">
              <span className={`req-table-badge req-table-badge-${row.kind}`}>
                {row.kind === "must-have" ? <MustHaveIcon /> : <RedFlagIcon />}
                {row.kind === "must-have" ? "Must have" : "Red flag"}
              </span>
            </td>
            <td className="req-table-text">{row.text}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 7h14M9.5 7V5.5a1.5 1.5 0 0 1 1.5-1.5h2a1.5 1.5 0 0 1 1.5 1.5V7M7 7l.8 12a1.6 1.6 0 0 0 1.6 1.5h5.2a1.6 1.6 0 0 0 1.6-1.5L17 7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function criterionSummary(criterion: EvaluationCriterion): string {
  switch (criterion.type) {
    case "number_threshold": {
      const comparator = criterion.comparator ?? COMPARATORS[0];
      const target = criterion.target ?? "";
      const unit = criterion.unit ?? "";
      return [comparator, target, unit].filter(Boolean).join(" ") || "No target set";
    }
    case "rating_scale":
      return criterion.scaleMax ? `scale 1–${criterion.scaleMax}` : "No scale set";
    case "must_have":
      return "required";
    case "qualitative":
      return (criterion.grades ?? []).length > 0 ? (criterion.grades ?? []).join(", ") : "No grades set";
    default:
      return "";
  }
}
