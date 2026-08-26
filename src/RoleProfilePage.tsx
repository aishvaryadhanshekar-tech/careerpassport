import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deriveJobPreview } from "./derivePreviewFields";
import { deriveRoleProfile } from "./deriveRoleProfile";
import { EditableField } from "./EditableField";
import {
  addCriterion,
  removeCriterion,
  setCriterionImportance,
  setCriterionType,
  updateCriterion,
} from "./evaluationFramework";
import { ChoiceRow, PointList, SalaryInput, TagInput } from "./formControls";
import { getCurrentJobId, salaryLabel, startNewJob, upsertJobFromDraft } from "./jobsStore";
import { loadDraft, saveDraft } from "./storage";
import { TabPanel, Tabs } from "./Tabs";
import {
  COMPARATORS,
  COVERAGE_LABELS,
  EVAL_IMPORTANCE,
  EVAL_IMPORTANCE_LABELS,
  EVAL_TYPES,
  EVAL_TYPE_LABELS,
  INDUSTRY_SUGGESTIONS,
  LOCATION_SUGGESTIONS,
  WORK_MODE_OPTIONS,
  type Currency,
  type EvalImportance,
  type EvalType,
  type EvaluationCriterion,
  type JobDraft,
  type JobPreviewFields,
  type RoleProfileFields,
} from "./types";

const WORK_MODE_LABEL: Record<string, string> = {
  WFH: "Remote",
  WFO: "On-site",
  Hybrid: "Hybrid",
};

const IMPORTANCE_RANK: Record<EvalImportance, number> = {
  critical: 3,
  important: 2,
  nice_to_have: 1,
};

type TabId = "overview" | "requirements" | "sourcing" | "evaluation";

function withPreview(draft: JobDraft): JobDraft {
  if (draft.previewGenerated) return draft;
  return { ...draft, preview: deriveJobPreview(draft), previewGenerated: true };
}

function withRoleProfile(draft: JobDraft): JobDraft {
  if (draft.roleProfileGenerated) return draft;
  return {
    ...draft,
    roleProfile: deriveRoleProfile(draft),
    roleProfileGenerated: true,
  };
}

function hydrate(): JobDraft {
  return withRoleProfile(withPreview(loadDraft()));
}

function RoleSummaryHeader({ draft }: { draft: JobDraft }) {
  const rows: { label: string; value: string }[] = [
    { label: COVERAGE_LABELS.designation, value: draft.fields.designation.value || "—" },
    { label: COVERAGE_LABELS.experienceYears, value: draft.fields.experienceYears.value || "—" },
    { label: COVERAGE_LABELS.location, value: draft.fields.location.value || "—" },
    { label: COVERAGE_LABELS.salary, value: salaryLabel(draft) },
    {
      label: COVERAGE_LABELS.workMode,
      value: WORK_MODE_LABEL[draft.fields.workMode.value] ?? (draft.fields.workMode.value || "—"),
    },
    { label: COVERAGE_LABELS.industryType, value: draft.fields.industryType.value || "—" },
  ];
  return (
    <section className="app-card">
      <header className="app-card-head">
        <h2>Role summary</h2>
      </header>
      <div className="app-card-body">
        <dl className="jd-summary-grid">
          {rows.map((row) => (
            <div className="jd-summary-row" key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function ImportanceBadge({ importance }: { importance: EvalImportance }) {
  const rank = IMPORTANCE_RANK[importance];
  return (
    <span className={`importance-badge importance-${importance.replace(/_/g, "-")}`}>
      <span className="importance-dots" aria-hidden="true">
        {[1, 2, 3].map((dot) => (
          <span key={dot} className={`importance-dot${dot <= rank ? " filled" : ""}`} />
        ))}
      </span>
      {EVAL_IMPORTANCE_LABELS[importance]}
    </span>
  );
}

function OverviewTab({
  draft,
  onRoleProfile,
  onField,
  onCurrency,
}: {
  draft: JobDraft;
  onRoleProfile: (patch: Partial<RoleProfileFields>) => void;
  onField: (id: "experienceYears" | "location" | "salary" | "industryType" | "workMode", value: string) => void;
  onCurrency: (v: Currency | null) => void;
}) {
  return (
    <div className="jd-cards">
      <section className="app-card">
        <header className="app-card-head">
          <h2>Overview</h2>
        </header>
        <div className="app-card-body role-profile-fields">
          <EditableField label="Headline" display={<p>{draft.roleProfile.headline.value || "—"}</p>}>
            <input
              className="pill-input"
              value={draft.roleProfile.headline.value}
              onChange={(e) =>
                onRoleProfile({ headline: { value: e.target.value, source: "user" } })
              }
            />
          </EditableField>

          <EditableField label="Portrait" display={<p>{draft.roleProfile.portrait.value || "—"}</p>}>
            <textarea
              className="pill-input area-input"
              rows={3}
              value={draft.roleProfile.portrait.value}
              onChange={(e) =>
                onRoleProfile({ portrait: { value: e.target.value, source: "user" } })
              }
            />
          </EditableField>

          <EditableField
            label={COVERAGE_LABELS.experienceYears}
            display={<p>{draft.fields.experienceYears.value || "—"}</p>}
          >
            <input
              className="pill-input"
              value={draft.fields.experienceYears.value}
              onChange={(e) => onField("experienceYears", e.target.value)}
            />
          </EditableField>

          <EditableField label={COVERAGE_LABELS.location} display={<p>{draft.fields.location.value || "—"}</p>}>
            <TagInput
              id="rp-location"
              value={draft.fields.location.value}
              suggestions={LOCATION_SUGGESTIONS}
              onChange={(next) => onField("location", next)}
            />
          </EditableField>

          <EditableField label={COVERAGE_LABELS.salary} display={<p>{salaryLabel(draft)}</p>}>
            <SalaryInput
              id="rp-salary"
              value={draft.fields.salary.value}
              currency={draft.salaryCurrency}
              onChange={(next) => onField("salary", next)}
              onCurrency={onCurrency}
            />
          </EditableField>

          <EditableField
            label={COVERAGE_LABELS.industryType}
            display={<p>{draft.fields.industryType.value || "—"}</p>}
          >
            <TagInput
              id="rp-industry"
              value={draft.fields.industryType.value}
              suggestions={INDUSTRY_SUGGESTIONS}
              onChange={(next) => onField("industryType", next)}
            />
          </EditableField>

          <EditableField
            label={COVERAGE_LABELS.workMode}
            display={
              <p>
                {WORK_MODE_LABEL[draft.fields.workMode.value] ??
                  (draft.fields.workMode.value || "—")}
              </p>
            }
          >
            <ChoiceRow
              options={WORK_MODE_OPTIONS}
              value={draft.fields.workMode.value}
              ariaLabel={COVERAGE_LABELS.workMode}
              onSelect={(option) => onField("workMode", option)}
            />
          </EditableField>
        </div>
      </section>
    </div>
  );
}

function RequirementsTab({
  draft,
  onPreview,
  onField,
}: {
  draft: JobDraft;
  onPreview: (patch: Partial<JobPreviewFields>) => void;
  onField: (id: "mustHaves" | "redFlags", value: string) => void;
}) {
  return (
    <div className="jd-cards">
      <section className="app-card">
        <header className="app-card-head">
          <h2>Requirements</h2>
        </header>
        <div className="app-card-body role-profile-fields">
          <EditableField
            label="Skills expected"
            display={<p>{draft.preview.expectedSkills || "—"}</p>}
          >
            <PointList
              id="rp-skills-expected"
              value={draft.preview.expectedSkills}
              onChange={(next) => onPreview({ expectedSkills: next })}
            />
          </EditableField>

          <EditableField label="Must haves" display={<p>{draft.fields.mustHaves.value || "—"}</p>}>
            <PointList
              id="rp-must-haves"
              value={draft.fields.mustHaves.value}
              onChange={(next) => onField("mustHaves", next)}
            />
          </EditableField>

          <EditableField label="Red flags" display={<p>{draft.fields.redFlags.value || "—"}</p>}>
            <PointList
              id="rp-red-flags"
              value={draft.fields.redFlags.value}
              onChange={(next) => onField("redFlags", next)}
            />
          </EditableField>
        </div>
      </section>
    </div>
  );
}

function SourcingTab({
  draft,
  onPreview,
  onRoleProfile,
}: {
  draft: JobDraft;
  onPreview: (patch: Partial<JobPreviewFields>) => void;
  onRoleProfile: (patch: Partial<RoleProfileFields>) => void;
}) {
  return (
    <div className="jd-cards">
      <section className="app-card">
        <header className="app-card-head">
          <h2>Sourcing playbook</h2>
        </header>
        <div className="app-card-body role-profile-fields">
          <EditableField
            label="Target companies"
            display={<p>{draft.preview.targetCompanies || "—"}</p>}
          >
            <PointList
              id="rp-target-companies"
              value={draft.preview.targetCompanies}
              onChange={(next) => onPreview({ targetCompanies: next })}
            />
          </EditableField>

          <EditableField
            label="Target sectors"
            display={<p>{draft.preview.industrySectors || "—"}</p>}
          >
            <TagInput
              id="rp-target-sectors"
              value={draft.preview.industrySectors}
              suggestions={INDUSTRY_SUGGESTIONS}
              onChange={(next) => onPreview({ industrySectors: next })}
            />
          </EditableField>

          <EditableField
            label="Avoid look-alikes"
            display={<p>{draft.roleProfile.avoidLookalikes || "—"}</p>}
          >
            <PointList
              id="rp-avoid-lookalikes"
              value={draft.roleProfile.avoidLookalikes}
              onChange={(next) => onRoleProfile({ avoidLookalikes: next })}
            />
          </EditableField>
        </div>
      </section>
    </div>
  );
}

function CriterionCard({
  criterion,
  onChange,
  onRemove,
}: {
  criterion: EvaluationCriterion;
  onChange: (patch: Partial<EvaluationCriterion>) => void;
  onRemove: () => void;
}) {
  const [gradeQuery, setGradeQuery] = useState("");

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
          ×
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

        <select
          className="type-select"
          value={criterion.importance}
          aria-label="Importance"
          onChange={(e) => onChange({ importance: e.target.value as EvalImportance })}
        >
          {EVAL_IMPORTANCE.map((importance) => (
            <option key={importance} value={importance}>
              {EVAL_IMPORTANCE_LABELS[importance]}
            </option>
          ))}
        </select>

        <ImportanceBadge importance={criterion.importance} />
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
          <input
            className="pill-input"
            placeholder="Unit"
            aria-label="Unit"
            value={criterion.unit ?? ""}
            onChange={(e) => onChange({ unit: e.target.value })}
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

function EvaluationTab({
  draft,
  onFramework,
}: {
  draft: JobDraft;
  onFramework: (next: EvaluationCriterion[]) => void;
}) {
  const list = draft.roleProfile.evaluationFramework;

  return (
    <div className="jd-cards">
      <section className="app-card">
        <header className="app-card-head">
          <h2>Evaluation framework</h2>
          <button type="button" className="text-add" onClick={() => onFramework(addCriterion(list))}>
            + Add criterion
          </button>
        </header>
        <div className="app-card-body">
          {list.length === 0 ? (
            <p className="jd-empty">No criteria yet.</p>
          ) : (
            list.map((criterion) => (
              <CriterionCard
                key={criterion.id}
                criterion={criterion}
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
              />
            ))
          )}
          <button
            type="button"
            className="text-add add-another"
            onClick={() => onFramework(addCriterion(list))}
          >
            + Add another
          </button>
        </div>
      </section>
    </div>
  );
}

export function RoleProfilePage() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<JobDraft>(() => hydrate());
  const [tab, setTab] = useState<TabId>("overview");
  const draftRef = useRef(draft);
  draftRef.current = draft;

  useEffect(() => {
    const timer = window.setTimeout(() => saveDraft(draftRef.current), 2000);
    return () => window.clearTimeout(timer);
  }, [draft]);

  useEffect(() => {
    return () => {
      saveDraft(draftRef.current);
    };
  }, []);

  function onRoleProfile(patch: Partial<RoleProfileFields>) {
    setDraft((current) => ({
      ...current,
      roleProfile: { ...current.roleProfile, ...patch },
    }));
  }

  function onPreview(patch: Partial<JobPreviewFields>) {
    setDraft((current) => ({
      ...current,
      preview: { ...current.preview, ...patch },
    }));
  }

  function onField(
    id: "experienceYears" | "location" | "salary" | "industryType" | "workMode" | "mustHaves" | "redFlags",
    value: string,
  ) {
    setDraft((current) => ({
      ...current,
      fields: { ...current.fields, [id]: { value, source: "user" } },
    }));
  }

  function onCurrency(v: Currency | null) {
    setDraft((current) => ({ ...current, salaryCurrency: v }));
  }

  function onFramework(next: EvaluationCriterion[]) {
    setDraft((current) => ({
      ...current,
      roleProfile: { ...current.roleProfile, evaluationFramework: next },
    }));
  }

  function onContinue() {
    const from = draftRef.current;
    saveDraft(from);
    const id = getCurrentJobId() ?? startNewJob();
    upsertJobFromDraft(id, from);
    navigate("/step-2");
  }

  return (
    <div className="app-shell create-job role-profile-page">
      <main className="preview-main">
        <RoleSummaryHeader draft={draft} />
        <Tabs
          ariaLabel="Role profile sections"
          active={tab}
          onChange={(id) => setTab(id as TabId)}
          tabs={[
            { id: "overview", label: "Overview" },
            { id: "requirements", label: "Requirements" },
            { id: "sourcing", label: "Sourcing Playbook" },
            { id: "evaluation", label: "Evaluation Framework" },
          ]}
        />
        <TabPanel id="overview" active={tab === "overview"}>
          <OverviewTab draft={draft} onRoleProfile={onRoleProfile} onField={onField} onCurrency={onCurrency} />
        </TabPanel>
        <TabPanel id="requirements" active={tab === "requirements"}>
          <RequirementsTab draft={draft} onPreview={onPreview} onField={onField} />
        </TabPanel>
        <TabPanel id="sourcing" active={tab === "sourcing"}>
          <SourcingTab draft={draft} onPreview={onPreview} onRoleProfile={onRoleProfile} />
        </TabPanel>
        <TabPanel id="evaluation" active={tab === "evaluation"}>
          <EvaluationTab draft={draft} onFramework={onFramework} />
        </TabPanel>
      </main>
      <footer className="footer">
        <button type="button" className="btn primary" onClick={onContinue}>
          Continue
        </button>
      </footer>
    </div>
  );
}
