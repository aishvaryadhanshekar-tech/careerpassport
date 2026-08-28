import type { JSX } from "react";
import { EditableField } from "../EditableField";
import { splitPoints } from "../formControlUtils";
import { EVAL_TYPE_LABELS, type EvaluationCriterion, type JobDraft } from "../types";
import { ImportanceBadge, MustHaveRedFlagTable, criterionSummary } from "./shared";

/**
 * Read-only role-detail views.
 *
 * These three components were byte-identical copies in JobDetailsPage.tsx and Step3Page.tsx
 * (~110 duplicated lines), so any change to how role details render had to be made twice and
 * the two pages could silently drift apart. Both now import from here.
 */

export function ReadOnlyList({ value }: { value: string }): JSX.Element {
  const points = splitPoints(value);
  if (points.length === 0) return <p className="jd-empty">Not captured yet.</p>;
  return (
    <ul className="jd-readonly-list">
      {points.map((point, index) => (
        <li key={`${index}-${point}`}>{point}</li>
      ))}
    </ul>
  );
}

export function ReadOnlyCriterionRow({
  criterion,
}: {
  criterion: EvaluationCriterion;
}): JSX.Element {
  return (
    <div className="criterion-row">
      <div className="criterion-row-main">
        <div className="criterion-row-head">
          <span className="criterion-row-label">{criterion.label || "Untitled criterion"}</span>
          <span className="type-badge">{EVAL_TYPE_LABELS[criterion.type]}</span>
          <ImportanceBadge importance={criterion.importance} />
        </div>
        <p className="criterion-row-subtitle">{criterionSummary(criterion)}</p>
      </div>
    </div>
  );
}

export function RoleDetailsTab({ draft }: { draft: JobDraft }): JSX.Element {
  const criteria = draft.roleProfile.evaluationFramework;

  return (
    <div className="jd-cards">
      <section className="app-card">
        <header className="app-card-head">
          <h2>Requirements</h2>
        </header>
        <div className="app-card-body role-profile-fields">
          <EditableField
            label="Ideal candidate"
            editing={false}
            display={<p>{draft.preview.idealCandidate || "Not captured yet."}</p>}
          >
            <></>
          </EditableField>
          <EditableField
            label="Skills expected"
            editing={false}
            display={<ReadOnlyList value={draft.preview.expectedSkills} />}
          >
            <></>
          </EditableField>
          <EditableField
            label="Must haves & red flags"
            editing={false}
            display={
              <MustHaveRedFlagTable
                mustHaves={draft.fields.mustHaves.value}
                redFlags={draft.fields.redFlags.value}
              />
            }
          >
            <></>
          </EditableField>
        </div>
      </section>

      <section className="app-card">
        <header className="app-card-head">
          <h2>Sourcing playbook</h2>
        </header>
        <div className="app-card-body role-profile-fields">
          <EditableField
            label="Target companies"
            editing={false}
            display={<ReadOnlyList value={draft.preview.targetCompanies} />}
          >
            <></>
          </EditableField>
          <EditableField
            label="Target sectors"
            editing={false}
            display={<ReadOnlyList value={draft.preview.industrySectors} />}
          >
            <></>
          </EditableField>
          <EditableField
            label="Avoid look-alikes"
            editing={false}
            display={<ReadOnlyList value={draft.roleProfile.avoidLookalikes} />}
          >
            <></>
          </EditableField>
        </div>
      </section>

      <section className="app-card">
        <header className="app-card-head">
          <h2>Evaluation framework</h2>
        </header>
        <div className="app-card-body">
          {criteria.length === 0 ? (
            <p className="jd-empty">No criteria yet.</p>
          ) : (
            criteria.map((criterion) => (
              <ReadOnlyCriterionRow key={criterion.id} criterion={criterion} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
