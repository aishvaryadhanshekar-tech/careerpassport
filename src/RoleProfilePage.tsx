import { useEffect, useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { deriveJobPreview } from "./derivePreviewFields";
import { deriveRoleProfile } from "./deriveRoleProfile";
import { CheckIcon, EditableField, PencilIcon } from "./EditableField";
import {
  addCriterion,
  removeCriterion,
  reorderCriteria,
  setCriterionImportance,
  setCriterionType,
  updateCriterion,
} from "./evaluationFramework";
import { ChoiceRow, PointList, SalaryInput, TagInput } from "./formControls";
import { splitPoints } from "./formControlUtils";
import { getCurrentJobId, salaryLabel, startNewJob, upsertJobFromDraft } from "./jobsStore";
import { loadDraft, saveDraft } from "./storage";
import { TabPanel, Tabs } from "./Tabs";
import { wizardBackTo } from "./wizardHeader";
import {
  COMPARATORS,
  COVERAGE_LABELS,
  DEPARTMENT_OPTIONS,
  EVAL_IMPORTANCE,
  EVAL_IMPORTANCE_LABELS,
  EVAL_TYPES,
  EVAL_TYPE_LABELS,
  INDUSTRY_SUGGESTIONS,
  LOCATION_SUGGESTIONS,
  UNIT_SUGGESTIONS,
  WORK_MODE_OPTIONS,
  type Currency,
  type EvalImportance,
  type EvalType,
  type EvaluationCriterion,
  type FieldState,
  type JobDraft,
  type JobPreviewFields,
  type RoleProfileFields,
} from "./types";

const WORK_MODE_LABEL: Record<string, string> = {
  WFH: "Remote",
  WFO: "On-site",
  Hybrid: "Hybrid",
};

type TabId = "overview" | "requirements" | "sourcing" | "evaluation";

// Every field with its own FieldState only refills when it's genuinely
// unset (never "user"-sourced, never already carrying a value) so a
// second hydrate — e.g. after the user goes back and fills in more Job
// Details — keeps picking up new upstream data without ever clobbering
// something the user typed directly on this page.
function mergeFieldState(current: FieldState, derived: FieldState): FieldState {
  if (current.source === "user") return current;
  if (current.value.trim() !== "") return current;
  return derived;
}

function withPreview(draft: JobDraft): JobDraft {
  const derived = deriveJobPreview(draft);
  return {
    ...draft,
    preview: {
      idealCandidate: draft.preview.idealCandidate.trim() !== "" ? draft.preview.idealCandidate : derived.idealCandidate,
      expectedSkills: draft.preview.expectedSkills.trim() !== "" ? draft.preview.expectedSkills : derived.expectedSkills,
      targetCompanies: draft.preview.targetCompanies.trim() !== "" ? draft.preview.targetCompanies : derived.targetCompanies,
      industrySectors: draft.preview.industrySectors.trim() !== "" ? draft.preview.industrySectors : derived.industrySectors,
    },
    previewGenerated: true,
  };
}

function withRoleProfile(draft: JobDraft): JobDraft {
  // Previously this only ran once (gated on roleProfileGenerated), so
  // editing Job Details after visiting Role Profile left this page's
  // headline/portrait/department stuck on stale, pre-edit copy. Re-derive
  // every hydrate and merge field-by-field instead, so user edits stay
  // sticky but unedited fields keep resyncing with upstream data.
  const derived = deriveRoleProfile(draft);
  const current = draft.roleProfile;
  const roleProfile: RoleProfileFields = {
    headline: mergeFieldState(current.headline, derived.headline),
    portrait: mergeFieldState(current.portrait, derived.portrait),
    department: mergeFieldState(current.department, derived.department),
    avoidLookalikes: current.avoidLookalikes.trim() !== "" ? current.avoidLookalikes : derived.avoidLookalikes,
    evaluationFramework:
      current.evaluationFramework.length > 0 ? current.evaluationFramework : derived.evaluationFramework,
  };
  return { ...draft, roleProfile, roleProfileGenerated: true };
}

function hydrate(): JobDraft {
  return withRoleProfile(withPreview(loadDraft()));
}

// Demo/testing fallback only — never written into draft state, so it can
// never overwrite real data and never gets saved as if it were real.
const MOCK = {
  designation: "Senior Product Manager",
  department: "Product",
  industryType: "B2B SaaS",
  location: "Bangalore",
  workMode: "Hybrid",
  experienceYears: "5-8 years",
  salary: "₹28L - ₹40L · per year",
  headline: "Senior Product Manager · B2B SaaS",
  portrait:
    "A hands-on product leader who has shipped 0-to-1 features, partners closely with engineering and design, and makes data-informed calls under ambiguity.",
  expectedSkills: "Product strategy, Roadmapping, SQL, User research, Cross-functional leadership",
  mustHaves: "5+ years in product management, Experience with B2B SaaS, Shipped 0-to-1 features",
  redFlags: "No end-to-end ownership of the product lifecycle, Pure project-management background",
  targetCompanies: "Freshworks, Zoho, Postman, Chargebee",
  industrySectors: "B2B SaaS, Enterprise software",
  avoidLookalikes: "Similar title but IC-only scope, Program manager without product ownership",
} as const;

function orMock(value: string, mock: string): string {
  const trimmed = value.trim();
  return trimmed !== "" && trimmed !== "—" ? value : mock;
}

function RoleSummaryHeader({
  draft,
  editing,
  onToggleEditing,
  onField,
  onRoleProfile,
  onCurrency,
}: {
  draft: JobDraft;
  editing: boolean;
  onToggleEditing: () => void;
  onField: (
    id: "designation" | "experienceYears" | "location" | "salary" | "industryType" | "workMode",
    value: string,
  ) => void;
  onRoleProfile: (patch: Partial<RoleProfileFields>) => void;
  onCurrency: (v: Currency | null) => void;
}) {
  const designation = orMock(draft.fields.designation.value, MOCK.designation);
  const department = orMock(draft.roleProfile.department.value, MOCK.department);
  const industryType = orMock(draft.fields.industryType.value, MOCK.industryType);
  const subline = [department, industryType].filter(Boolean).join(" · ");

  const workModeRaw = draft.fields.workMode.value;
  const workMode = orMock(WORK_MODE_LABEL[workModeRaw] ?? workModeRaw, MOCK.workMode);

  const logistics = [
    { key: "location", label: COVERAGE_LABELS.location, value: orMock(draft.fields.location.value, MOCK.location) },
    { key: "workMode", label: COVERAGE_LABELS.workMode, value: workMode },
    {
      key: "experienceYears",
      label: COVERAGE_LABELS.experienceYears,
      value: orMock(draft.fields.experienceYears.value, MOCK.experienceYears),
    },
  ];

  const compensation = [
    { key: "salary", label: COVERAGE_LABELS.salary, value: orMock(salaryLabel(draft), MOCK.salary) },
    { key: "industryType", label: COVERAGE_LABELS.industryType, value: industryType },
    { key: "department", label: "Department", value: department },
  ];

  if (editing) {
    return (
      <section className="app-card role-summary-card">
        <div className="app-card-body jd-summary-head">
          <div className="jd-summary-edit-head">
            <input
              className="pill-input jd-summary-name-input"
              aria-label={COVERAGE_LABELS.designation}
              placeholder={COVERAGE_LABELS.designation}
              value={draft.fields.designation.value}
              onChange={(e) => onField("designation", e.target.value)}
            />
            <TabEditToggle editing={editing} onToggle={onToggleEditing} label="Role summary" />
          </div>
          <div className="jd-summary-columns">
            <div className="jd-summary-col">
              <label className="jd-summary-edit-field">
                <span className="jd-summary-stat-label">{COVERAGE_LABELS.location}</span>
                <TagInput
                  id="rp-summary-location"
                  value={draft.fields.location.value}
                  suggestions={LOCATION_SUGGESTIONS}
                  variant="dropdown"
                  onChange={(next) => onField("location", next)}
                />
              </label>
              <label className="jd-summary-edit-field">
                <span className="jd-summary-stat-label">{COVERAGE_LABELS.workMode}</span>
                <ChoiceRow
                  options={WORK_MODE_OPTIONS}
                  value={draft.fields.workMode.value}
                  ariaLabel={COVERAGE_LABELS.workMode}
                  onSelect={(option) => onField("workMode", option)}
                />
              </label>
              <label className="jd-summary-edit-field">
                <span className="jd-summary-stat-label">{COVERAGE_LABELS.experienceYears}</span>
                <input
                  className="pill-input"
                  value={draft.fields.experienceYears.value}
                  onChange={(e) => onField("experienceYears", e.target.value)}
                />
              </label>
            </div>
            <div className="jd-summary-col">
              <label className="jd-summary-edit-field">
                <span className="jd-summary-stat-label">{COVERAGE_LABELS.salary}</span>
                <SalaryInput
                  id="rp-summary-salary"
                  value={draft.fields.salary.value}
                  currency={draft.salaryCurrency}
                  onChange={(next) => onField("salary", next)}
                  onCurrency={onCurrency}
                />
              </label>
              <label className="jd-summary-edit-field">
                <span className="jd-summary-stat-label">{COVERAGE_LABELS.industryType}</span>
                <TagInput
                  id="rp-summary-industry"
                  value={draft.fields.industryType.value}
                  suggestions={INDUSTRY_SUGGESTIONS}
                  variant="dropdown"
                  onChange={(next) => onField("industryType", next)}
                />
              </label>
              <label className="jd-summary-edit-field">
                <span className="jd-summary-stat-label">Department</span>
                <select
                  className={`pill-select select-icon${draft.roleProfile.department.value ? "" : " is-placeholder"}`}
                  aria-label="Department"
                  value={draft.roleProfile.department.value}
                  onChange={(e) =>
                    onRoleProfile({ department: { value: e.target.value, source: "user" } })
                  }
                >
                  <option value="" disabled>
                    Select
                  </option>
                  {DEPARTMENT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="app-card role-summary-card">
      <div className="app-card-body jd-summary-head">
        <div className="jd-summary-view-head">
          <h2 className="jd-summary-name">{designation}</h2>
          <TabEditToggle editing={editing} onToggle={onToggleEditing} label="Role summary" />
        </div>
        {subline ? <p className="jd-summary-subline">{subline}</p> : null}
        <div className="jd-summary-columns">
          <div className="jd-summary-col">
            {logistics.map((row) => (
              <div className="jd-summary-stat" key={row.key}>
                <span className="jd-summary-stat-label">{row.label}</span>
                <span className="jd-summary-stat-value">{row.value}</span>
              </div>
            ))}
          </div>
          <div className="jd-summary-col">
            {compensation.map((row) => (
              <div className="jd-summary-stat" key={row.key}>
                <span className="jd-summary-stat-label">{row.label}</span>
                <span className="jd-summary-stat-value">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ImportanceBadge({ importance }: { importance: EvalImportance }) {
  return (
    <span className={`importance-badge importance-${importance.replace(/_/g, "-")}`}>
      {EVAL_IMPORTANCE_LABELS[importance]}
    </span>
  );
}

function TabEditToggle({
  editing,
  onToggle,
  label,
}: {
  editing: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className={`tab-edit-toggle${editing ? " active" : ""}`}
      aria-pressed={editing}
      aria-label={editing ? `Done editing ${label}` : `Edit ${label}`}
      title={editing ? "Done editing" : "Edit"}
      onClick={onToggle}
    >
      {editing ? <CheckIcon /> : <PencilIcon />}
    </button>
  );
}

function TabEditControls({
  editing,
  onEdit,
  onDiscard,
  onSave,
  label,
}: {
  editing: boolean;
  onEdit: () => void;
  onDiscard: () => void;
  onSave: () => void;
  label: string;
}) {
  if (!editing) {
    return (
      <button type="button" className="tab-edit-toggle" aria-label={`Edit ${label}`} title="Edit" onClick={onEdit}>
        <PencilIcon />
      </button>
    );
  }
  return (
    <div className="tab-edit-actions">
      <button type="button" className="btn ghost btn-sm" onClick={onDiscard}>
        Discard
      </button>
      <button type="button" className="btn primary btn-sm" onClick={onSave}>
        Save
      </button>
    </div>
  );
}

function useCloseOnOutsideClick(open: boolean, onClose: () => void) {
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open, onClose]);
  return rootRef;
}

function ImportanceDropdown({
  importance,
  onChange,
}: {
  importance: EvalImportance;
  onChange: (importance: EvalImportance) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() => EVAL_IMPORTANCE.indexOf(importance));
  const rootRef = useCloseOnOutsideClick(open, () => setOpen(false));

  function select(value: EvalImportance) {
    onChange(value);
    setOpen(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!open) {
        setActiveIndex(EVAL_IMPORTANCE.indexOf(importance));
        setOpen(true);
      } else {
        select(EVAL_IMPORTANCE[activeIndex]);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setActiveIndex(EVAL_IMPORTANCE.indexOf(importance));
        setOpen(true);
        return;
      }
      setActiveIndex((i) => Math.min(i + 1, EVAL_IMPORTANCE.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    }
  }

  return (
    <div className="importance-dropdown" ref={rootRef}>
      <button
        type="button"
        className={`importance-dropdown-trigger importance-${importance.replace(/_/g, "-")}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Importance"
        onClick={() => {
          setActiveIndex(EVAL_IMPORTANCE.indexOf(importance));
          setOpen((o) => !o);
        }}
        onKeyDown={handleKeyDown}
      >
        <span className="importance-dropdown-trigger-label">{EVAL_IMPORTANCE_LABELS[importance]}</span>
        <span className="importance-dropdown-caret" aria-hidden="true">
          ▾
        </span>
      </button>
      {open ? (
        <ul className="importance-dropdown-menu" role="listbox" aria-label="Importance options">
          {EVAL_IMPORTANCE.map((option, index) => (
            <li
              key={option}
              role="option"
              aria-selected={option === importance}
              className={`importance-dropdown-option${index === activeIndex ? " active" : ""}`}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => select(option)}
            >
              <ImportanceBadge importance={option} />
              {option === importance ? (
                <span className="importance-dropdown-check" aria-hidden="true">
                  ✓
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function UnitCombobox({
  value,
  onChange,
}: {
  value: string;
  onChange: (unit: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const rootRef = useCloseOnOutsideClick(open, () => {
    setOpen(false);
    setCustomMode(false);
  });

  function selectUnit(unit: string) {
    onChange(unit);
    setOpen(false);
    setCustomMode(false);
  }

  function commitCustom() {
    const trimmed = customValue.trim();
    if (trimmed) {
      onChange(trimmed);
    }
    setCustomValue("");
    setCustomMode(false);
    setOpen(false);
  }

  return (
    <div className="unit-combobox" ref={rootRef}>
      <button
        type="button"
        className="pill-input unit-combobox-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Unit"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span className="unit-combobox-value">{value || "Unit"}</span>
        <span className="importance-dropdown-caret" aria-hidden="true">
          ▾
        </span>
      </button>
      {open ? (
        <ul className="importance-dropdown-menu unit-combobox-menu" role="listbox" aria-label="Unit options">
          {UNIT_SUGGESTIONS.map((unit) => (
            <li
              key={unit}
              role="option"
              aria-selected={unit === value}
              className={`importance-dropdown-option${unit === value ? " active" : ""}`}
              onClick={() => selectUnit(unit)}
            >
              {unit}
              {unit === value ? (
                <span className="importance-dropdown-check" aria-hidden="true">
                  ✓
                </span>
              ) : null}
            </li>
          ))}
          <li className="importance-dropdown-option unit-combobox-custom-option">
            {customMode ? (
              <input
                autoFocus
                className="unit-combobox-custom-input"
                placeholder="Custom unit"
                aria-label="Custom unit"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitCustom();
                  }
                  if (e.key === "Escape") {
                    e.stopPropagation();
                    setCustomMode(false);
                  }
                }}
                onBlur={commitCustom}
              />
            ) : (
              <button
                type="button"
                className="unit-combobox-add"
                onClick={() => setCustomMode(true)}
              >
                + Add custom unit…
              </button>
            )}
          </li>
        </ul>
      ) : null}
    </div>
  );
}

function OverviewTab({
  draft,
  onRoleProfile,
  onField,
  onCurrency,
  editing,
  onEdit,
  onDiscard,
  onSave,
}: {
  draft: JobDraft;
  onRoleProfile: (patch: Partial<RoleProfileFields>) => void;
  onField: (id: "experienceYears" | "location" | "salary" | "industryType" | "workMode", value: string) => void;
  onCurrency: (v: Currency | null) => void;
  editing: boolean;
  onEdit: () => void;
  onDiscard: () => void;
  onSave: () => void;
}) {
  return (
    <div className="jd-cards">
      <section className="app-card">
        <header className="app-card-head">
          <h2>Overview</h2>
          <div className="app-card-head-actions">
            <TabEditControls editing={editing} onEdit={onEdit} onDiscard={onDiscard} onSave={onSave} label="Overview" />
          </div>
        </header>
        <div className="app-card-body role-profile-fields">
          <EditableField
            label="Headline"
            display={<p>{orMock(draft.roleProfile.headline.value, MOCK.headline)}</p>}
            editing={editing}
          >
            <input
              className="pill-input"
              value={draft.roleProfile.headline.value}
              onChange={(e) =>
                onRoleProfile({ headline: { value: e.target.value, source: "user" } })
              }
            />
          </EditableField>

          <EditableField
            label="Portrait"
            display={<p>{orMock(draft.roleProfile.portrait.value, MOCK.portrait)}</p>}
            editing={editing}
          >
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
            label="Department"
            display={<p>{orMock(draft.roleProfile.department.value, MOCK.department)}</p>}
            editing={editing}
          >
            <select
              className={`pill-select select-icon${draft.roleProfile.department.value ? "" : " is-placeholder"}`}
              aria-label="Department"
              value={draft.roleProfile.department.value}
              onChange={(e) =>
                onRoleProfile({ department: { value: e.target.value, source: "user" } })
              }
            >
              <option value="" disabled>
                Select
              </option>
              {DEPARTMENT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </EditableField>

          <EditableField
            label={COVERAGE_LABELS.experienceYears}
            display={<p>{orMock(draft.fields.experienceYears.value, MOCK.experienceYears)}</p>}
            editing={editing}
          >
            <input
              className="pill-input"
              value={draft.fields.experienceYears.value}
              onChange={(e) => onField("experienceYears", e.target.value)}
            />
          </EditableField>

          <EditableField
            label={COVERAGE_LABELS.location}
            display={<p>{orMock(draft.fields.location.value, MOCK.location)}</p>}
            editing={editing}
          >
            <TagInput
              id="rp-location"
              value={draft.fields.location.value}
              suggestions={LOCATION_SUGGESTIONS}
              variant="dropdown"
              onChange={(next) => onField("location", next)}
            />
          </EditableField>

          <EditableField
            label={COVERAGE_LABELS.salary}
            display={<p>{orMock(salaryLabel(draft), MOCK.salary)}</p>}
            editing={editing}
          >
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
            display={<p>{orMock(draft.fields.industryType.value, MOCK.industryType)}</p>}
            editing={editing}
          >
            <TagInput
              id="rp-industry"
              value={draft.fields.industryType.value}
              suggestions={INDUSTRY_SUGGESTIONS}
              variant="dropdown"
              onChange={(next) => onField("industryType", next)}
            />
          </EditableField>

          <EditableField
            label={COVERAGE_LABELS.workMode}
            display={
              <p>{orMock(WORK_MODE_LABEL[draft.fields.workMode.value] ?? draft.fields.workMode.value, MOCK.workMode)}</p>
            }
            editing={editing}
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

function RequirementsTab({
  draft,
  onPreview,
  onField,
  editing,
  onEdit,
  onDiscard,
  onSave,
}: {
  draft: JobDraft;
  onPreview: (patch: Partial<JobPreviewFields>) => void;
  onField: (id: "mustHaves" | "redFlags", value: string) => void;
  editing: boolean;
  onEdit: () => void;
  onDiscard: () => void;
  onSave: () => void;
}) {
  return (
    <div className="jd-cards">
      <section className="app-card">
        <header className="app-card-head">
          <h2>Requirements</h2>
          <div className="app-card-head-actions">
            <TabEditControls editing={editing} onEdit={onEdit} onDiscard={onDiscard} onSave={onSave} label="Requirements" />
          </div>
        </header>
        <div className="app-card-body role-profile-fields">
          <EditableField
            label="Skills expected"
            display={<p>{orMock(draft.preview.expectedSkills, MOCK.expectedSkills)}</p>}
            editing={editing}
          >
            <PointList
              id="rp-skills-expected"
              value={draft.preview.expectedSkills}
              onChange={(next) => onPreview({ expectedSkills: next })}
            />
          </EditableField>

          <EditableField
            label="Must haves & red flags"
            display={
              <MustHaveRedFlagTable
                mustHaves={orMock(draft.fields.mustHaves.value, MOCK.mustHaves)}
                redFlags={orMock(draft.fields.redFlags.value, MOCK.redFlags)}
              />
            }
            editing={editing}
          >
            <div className="req-edit-group">
              <span className="req-edit-sublabel">Must haves</span>
              <PointList
                id="rp-must-haves"
                value={draft.fields.mustHaves.value}
                onChange={(next) => onField("mustHaves", next)}
              />
              <span className="req-edit-sublabel">Red flags</span>
              <PointList
                id="rp-red-flags"
                value={draft.fields.redFlags.value}
                onChange={(next) => onField("redFlags", next)}
              />
            </div>
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
  editing,
  onEdit,
  onDiscard,
  onSave,
}: {
  draft: JobDraft;
  onPreview: (patch: Partial<JobPreviewFields>) => void;
  onRoleProfile: (patch: Partial<RoleProfileFields>) => void;
  editing: boolean;
  onEdit: () => void;
  onDiscard: () => void;
  onSave: () => void;
}) {
  return (
    <div className="jd-cards">
      <section className="app-card">
        <header className="app-card-head">
          <h2>Sourcing playbook</h2>
          <div className="app-card-head-actions">
            <TabEditControls
              editing={editing}
              onEdit={onEdit}
              onDiscard={onDiscard}
              onSave={onSave}
              label="Sourcing playbook"
            />
          </div>
        </header>
        <div className="app-card-body role-profile-fields">
          <EditableField
            label="Target companies"
            display={<p>{orMock(draft.preview.targetCompanies, MOCK.targetCompanies)}</p>}
            editing={editing}
          >
            <PointList
              id="rp-target-companies"
              value={draft.preview.targetCompanies}
              onChange={(next) => onPreview({ targetCompanies: next })}
            />
          </EditableField>

          <EditableField
            label="Target sectors"
            display={<p>{orMock(draft.preview.industrySectors, MOCK.industrySectors)}</p>}
            editing={editing}
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
            display={<p>{orMock(draft.roleProfile.avoidLookalikes, MOCK.avoidLookalikes)}</p>}
            editing={editing}
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

function TrashIcon() {
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

function EvaluationTab({
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

// Each tab only owns a slice of the shared draft. Snapshotting the whole
// draft on entry and restoring just that tab's slice on Discard means a
// discard in one tab can never clobber concurrent edits made in another.
function restoreTabSlice(id: TabId, current: JobDraft, snapshot: JobDraft): JobDraft {
  switch (id) {
    case "overview":
      return {
        ...current,
        roleProfile: {
          ...current.roleProfile,
          headline: snapshot.roleProfile.headline,
          portrait: snapshot.roleProfile.portrait,
          department: snapshot.roleProfile.department,
        },
        fields: {
          ...current.fields,
          experienceYears: snapshot.fields.experienceYears,
          location: snapshot.fields.location,
          salary: snapshot.fields.salary,
          industryType: snapshot.fields.industryType,
          workMode: snapshot.fields.workMode,
        },
        salaryCurrency: snapshot.salaryCurrency,
      };
    case "requirements":
      return {
        ...current,
        preview: { ...current.preview, expectedSkills: snapshot.preview.expectedSkills },
        fields: {
          ...current.fields,
          mustHaves: snapshot.fields.mustHaves,
          redFlags: snapshot.fields.redFlags,
        },
      };
    case "sourcing":
      return {
        ...current,
        preview: {
          ...current.preview,
          targetCompanies: snapshot.preview.targetCompanies,
          industrySectors: snapshot.preview.industrySectors,
        },
        roleProfile: { ...current.roleProfile, avoidLookalikes: snapshot.roleProfile.avoidLookalikes },
      };
    case "evaluation":
      return {
        ...current,
        roleProfile: { ...current.roleProfile, evaluationFramework: snapshot.roleProfile.evaluationFramework },
      };
  }
}

export function RoleProfilePage() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<JobDraft>(() => hydrate());
  const [tab, setTab] = useState<TabId>("overview");
  const [editingTabs, setEditingTabs] = useState<Record<TabId, boolean>>({
    overview: false,
    requirements: false,
    sourcing: false,
    evaluation: false,
  });
  const [summaryEditing, setSummaryEditing] = useState(false);
  const [tabSnapshots, setTabSnapshots] = useState<Partial<Record<TabId, JobDraft>>>({});
  const draftRef = useRef(draft);
  draftRef.current = draft;

  function beginTabEdit(id: TabId) {
    setTabSnapshots((current) => ({ ...current, [id]: structuredClone(draftRef.current) }));
    setEditingTabs((current) => ({ ...current, [id]: true }));
  }

  function discardTabEdit(id: TabId) {
    const snapshot = tabSnapshots[id];
    if (snapshot) {
      setDraft((current) => restoreTabSlice(id, current, snapshot));
    }
    setEditingTabs((current) => ({ ...current, [id]: false }));
  }

  function saveTabEdit(id: TabId) {
    setEditingTabs((current) => ({ ...current, [id]: false }));
  }

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
    id:
      | "designation"
      | "experienceYears"
      | "location"
      | "salary"
      | "industryType"
      | "workMode"
      | "mustHaves"
      | "redFlags",
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
        <RoleSummaryHeader
          draft={draft}
          editing={summaryEditing}
          onToggleEditing={() => setSummaryEditing((v) => !v)}
          onField={onField}
          onRoleProfile={onRoleProfile}
          onCurrency={onCurrency}
        />
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
          <OverviewTab
            draft={draft}
            onRoleProfile={onRoleProfile}
            onField={onField}
            onCurrency={onCurrency}
            editing={editingTabs.overview}
            onEdit={() => beginTabEdit("overview")}
            onDiscard={() => discardTabEdit("overview")}
            onSave={() => saveTabEdit("overview")}
          />
        </TabPanel>
        <TabPanel id="requirements" active={tab === "requirements"}>
          <RequirementsTab
            draft={draft}
            onPreview={onPreview}
            onField={onField}
            editing={editingTabs.requirements}
            onEdit={() => beginTabEdit("requirements")}
            onDiscard={() => discardTabEdit("requirements")}
            onSave={() => saveTabEdit("requirements")}
          />
        </TabPanel>
        <TabPanel id="sourcing" active={tab === "sourcing"}>
          <SourcingTab
            draft={draft}
            onPreview={onPreview}
            onRoleProfile={onRoleProfile}
            editing={editingTabs.sourcing}
            onEdit={() => beginTabEdit("sourcing")}
            onDiscard={() => discardTabEdit("sourcing")}
            onSave={() => saveTabEdit("sourcing")}
          />
        </TabPanel>
        <TabPanel id="evaluation" active={tab === "evaluation"}>
          <EvaluationTab
            draft={draft}
            onFramework={onFramework}
            editing={editingTabs.evaluation}
            onEdit={() => beginTabEdit("evaluation")}
            onDiscard={() => discardTabEdit("evaluation")}
            onSave={() => saveTabEdit("evaluation")}
          />
        </TabPanel>
      </main>
      <footer className="footer">
        <div className="footer-actions">
          <button type="button" className="btn ghost" onClick={() => navigate(wizardBackTo(2))}>
            Back
          </button>
          <button type="button" className="btn primary" onClick={onContinue}>
            Continue
          </button>
        </div>
      </footer>
    </div>
  );
}
