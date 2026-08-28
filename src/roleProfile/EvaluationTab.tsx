import { useState, type DragEvent } from "react";
import {
  addCriterion,
  removeCriterion,
  reorderCriteria,
  setCriterionImportance,
  setCriterionType,
  updateCriterion,
} from "../evaluationFramework";
import {
  COMPARATORS,
  EVAL_TYPES,
  EVAL_TYPE_LABELS,
  type EvalType,
  type EvaluationCriterion,
  type JobDraft,
} from "../types";
import { ImportanceDropdown } from "./ImportanceDropdown";
import { criterionSummary, ImportanceBadge, TrashIcon } from "./shared";
import { TabEditControls } from "./TabEditControls";
import { UnitCombobox } from "./UnitCombobox";

function CriterionCard({
  criterion,
  editing,
  onChange,
  onRemove,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  criterion: EvaluationCriterion;
  editing: boolean;
  onChange: (patch: Partial<EvaluationCriterion>) => void;
  onRemove: () => void;
  draggable: boolean;
  onDragStart: () => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: () => void;
}) {
  const [gradeQuery, setGradeQuery] = useState("");

  if (!editing) {
    return (
      <div
        className="criterion-row"
        draggable={draggable}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <span className="drag-handle" aria-hidden="true">
          ⋮⋮
        </span>
        <div className="criterion-row-main">
          <div className="criterion-row-head">
            <span className="criterion-row-label">{criterion.label || "Untitled criterion"}</span>
            <span className="type-badge">{EVAL_TYPE_LABELS[criterion.type]}</span>
            <ImportanceBadge importance={criterion.importance} />
          </div>
          {criterion.type !== "qualitative" ? (
            <p className="criterion-row-subtitle">{criterionSummary(criterion)}</p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="criterion-card">
      <div className="criterion-top">
        <input
          className="criterion-label"
          value={criterion.label}
          placeholder="Criterion label"
          aria-label="Criterion label"
          onChange={(e) => onChange({ label: e.target.value })}
        />
        <button
          type="button"
          className="footer-icon"
          title="Delete criterion"
          aria-label="Delete criterion"
          onClick={onRemove}
        >
          <TrashIcon />
        </button>
      </div>

      <div className="criterion-controls">
        <select
          className="type-select"
          value={criterion.type}
          aria-label="Type"
          onChange={(e) => onChange({ type: e.target.value as EvalType })}
        >
          {EVAL_TYPES.map((type) => (
            <option key={type} value={type}>
              {EVAL_TYPE_LABELS[type]}
            </option>
          ))}
        </select>

        <ImportanceDropdown
          importance={criterion.importance}
          onChange={(importance) => onChange({ importance })}
        />
      </div>

      {criterion.type === "number_threshold" ? (
        <div className="criterion-subfields">
          <select
            className="type-select"
            value={criterion.comparator ?? COMPARATORS[0]}
            aria-label="Comparator"
            onChange={(e) => onChange({ comparator: e.target.value })}
          >
            {COMPARATORS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            className="pill-input"
            placeholder="Target"
            aria-label="Target"
            value={criterion.target ?? ""}
            onChange={(e) => onChange({ target: e.target.value })}
          />
          <UnitCombobox
            value={criterion.unit ?? ""}
            onChange={(unit) => onChange({ unit })}
          />
        </div>
      ) : null}

      {criterion.type === "rating_scale" ? (
        <div className="criterion-subfields">
          <input
            className="pill-input"
            placeholder="Scale max"
            aria-label="Scale max"
            value={criterion.scaleMax ?? ""}
            onChange={(e) => onChange({ scaleMax: e.target.value })}
          />
        </div>
      ) : null}

      {criterion.type === "qualitative" ? (
        <div className="tag-input criterion-grades">
          {(criterion.grades ?? []).map((grade) => (
            <span className="tag-chip" key={grade}>
              {grade}
              <button
                type="button"
                className="tag-chip-x"
                aria-label={`Remove ${grade}`}
                onClick={() => onChange({ grades: (criterion.grades ?? []).filter((g) => g !== grade) })}
              >
                ×
              </button>
            </span>
          ))}
          <input
            className="tag-input-field"
            placeholder="Add grade"
            aria-label="Add grade"
            value={gradeQuery}
            onChange={(e) => setGradeQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && gradeQuery.trim()) {
                e.preventDefault();
                onChange({ grades: [...(criterion.grades ?? []), gradeQuery.trim()] });
                setGradeQuery("");
              }
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

export function EvaluationTab({
  draft,
  onFramework,
  editing,
  onEdit,
  onDiscard,
  onSave,
}: {
  draft: JobDraft;
  onFramework: (next: EvaluationCriterion[]) => void;
  editing: boolean;
  onEdit: () => void;
  onDiscard: () => void;
  onSave: () => void;
}) {
  const list = draft.roleProfile.evaluationFramework;
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  return (
    <div className="jd-cards">
      <section className="app-card">
        <header className="app-card-head">
          <h2>Evaluation framework</h2>
          <div className="app-card-head-actions">
            <button type="button" className="text-add" onClick={() => onFramework(addCriterion(list))}>
              + Add criterion
            </button>
            <TabEditControls
              editing={editing}
              onEdit={onEdit}
              onDiscard={onDiscard}
              onSave={onSave}
              label="Evaluation framework"
            />
          </div>
        </header>
        <div className="app-card-body">
          {list.length === 0 ? (
            <p className="jd-empty">No criteria yet.</p>
          ) : (
            list.map((criterion, index) => (
              <CriterionCard
                key={criterion.id}
                criterion={criterion}
                editing={editing}
                onChange={(patch) => {
                  if (patch.type) {
                    onFramework(setCriterionType(list, criterion.id, patch.type));
                    return;
                  }
                  if (patch.importance) {
                    onFramework(setCriterionImportance(list, criterion.id, patch.importance));
                    return;
                  }
                  onFramework(updateCriterion(list, criterion.id, patch));
                }}
                onRemove={() => onFramework(removeCriterion(list, criterion.id))}
                draggable={!editing}
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIndex === null) return;
                  onFramework(reorderCriteria(list, dragIndex, index));
                  setDragIndex(null);
                }}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
