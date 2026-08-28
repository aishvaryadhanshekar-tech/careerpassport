import type { JSX, ReactNode } from "react";
import { ChoiceRow, SalaryInput, TagInput } from "../formControls";
import { salaryLabel } from "../jobsStore";
import { SparkleIcon } from "../shared/icons";
import { WORK_MODE_LABEL } from "../shared/labels";
import {
  COVERAGE_LABELS,
  DEPARTMENT_OPTIONS,
  FLAG_IDS,
  FLAG_LABELS,
  INDUSTRY_SUGGESTIONS,
  LOCATION_SUGGESTIONS,
  WORK_MODE_OPTIONS,
  type Currency,
  type JobDraft,
  type RoleProfileFields,
} from "../types";
import { MOCK, orMock } from "./mock";
import { TabEditToggle } from "./TabEditControls";

/**
 * The "who is this role" sidebar, shared by Role Profile, Step 4 preview, and Job Details.
 *
 * All three pages previously hand-rolled this: Step3Page's `RolePreviewSidebar` and
 * JobDetailsPage's `DetailsSidebar` were near-byte-identical clones, and Role Profile had a
 * different full-width `RoleSummaryHeader` that showed `designation` where the other two showed
 * `headline`. One component now covers all three.
 *
 * Read-only mode (Step 4, Job Details) renders exactly what those pages rendered before.
 * Editable mode (Role Profile) swaps the heading, byline and detail rows for inline controls.
 *
 * `headline` is the heading and `portrait` the byline — the labels "Headline"/"Portrait" are
 * deliberately not shown; the values speak for themselves.
 */

export type RoleSidebarField =
  | "designation"
  | "experienceYears"
  | "location"
  | "salary"
  | "industryType"
  | "workMode";

type CommonProps = {
  draft: JobDraft;
  /** Extra block pinned to the bottom of the card (publish destinations / published-to badges). */
  footer?: ReactNode;
};

type ReadOnlyProps = CommonProps & {
  editable?: false;
  /** Step 4 shows an "Experience type" row; Job Details does not. */
  showExperienceType?: boolean;
};

type EditableProps = CommonProps & {
  editable: true;
  editing: boolean;
  onToggleEditing: () => void;
  onField: (id: RoleSidebarField, value: string) => void;
  onRoleProfile: (patch: Partial<RoleProfileFields>) => void;
  onCurrency: (v: Currency | null) => void;
};

export type RoleSidebarProps = ReadOnlyProps | EditableProps;

export function RoleSidebar(props: RoleSidebarProps): JSX.Element {
  const { draft, footer } = props;

  // Role Profile falls back to demo copy on an empty draft (the header this replaced did the
  // same, and its tabs still do) so the page never looks broken in the prototype. The read-only
  // pages show the real, possibly-empty values.
  const useMock = props.editable === true;

  const designation = draft.fields.designation.value;
  const department = mockable(draft.roleProfile.department.value, MOCK.department, useMock);
  const companyType = draft.fields.companyType.value;
  const headline =
    draft.roleProfile.headline.value ||
    designation ||
    (useMock ? MOCK.headline : "Untitled role");
  const portrait = mockable(draft.roleProfile.portrait.value, MOCK.portrait, useMock);
  const activeFlags = FLAG_IDS.filter((id) => draft.flags[id]);

  if (props.editable) {
    const { editing, onToggleEditing, onField, onRoleProfile, onCurrency } = props;

    if (editing) {
      return (
        <aside className="preview-sidebar">
          <div className="preview-sidebar-card is-editing">
            <div className="preview-sidebar-edit-head">
              <span className="preview-sidebar-edit-title">Role summary</span>
              <TabEditToggle editing onToggle={onToggleEditing} label="Role summary" />
            </div>

            <label className="preview-sidebar-edit-field">
              <span className="jd-summary-stat-label">Headline</span>
              <input
                className="pill-input"
                value={draft.roleProfile.headline.value}
                placeholder="e.g. Senior Product Manager · B2B SaaS"
                onChange={(e) =>
                  onRoleProfile({ headline: { value: e.target.value, source: "user" } })
                }
              />
            </label>

            <label className="preview-sidebar-edit-field">
              <span className="jd-summary-stat-label">Portrait</span>
              <textarea
                className="pill-input area-input"
                rows={4}
                value={draft.roleProfile.portrait.value}
                placeholder="A short description of who this person is."
                onChange={(e) =>
                  onRoleProfile({ portrait: { value: e.target.value, source: "user" } })
                }
              />
            </label>

            <label className="preview-sidebar-edit-field">
              <span className="jd-summary-stat-label">{COVERAGE_LABELS.designation}</span>
              <input
                className="pill-input"
                value={draft.fields.designation.value}
                placeholder={COVERAGE_LABELS.designation}
                onChange={(e) => onField("designation", e.target.value)}
              />
            </label>

            <label className="preview-sidebar-edit-field">
              <span className="jd-summary-stat-label">Department</span>
              <select
                className={`pill-select select-icon${department ? "" : " is-placeholder"}`}
                aria-label="Department"
                value={department}
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

            <label className="preview-sidebar-edit-field">
              <span className="jd-summary-stat-label">{COVERAGE_LABELS.location}</span>
              <TagInput
                id="rp-summary-location"
                value={draft.fields.location.value}
                suggestions={LOCATION_SUGGESTIONS}
                variant="dropdown"
                onChange={(next) => onField("location", next)}
              />
            </label>

            <label className="preview-sidebar-edit-field">
              <span className="jd-summary-stat-label">{COVERAGE_LABELS.workMode}</span>
              <ChoiceRow
                options={WORK_MODE_OPTIONS}
                value={draft.fields.workMode.value}
                ariaLabel={COVERAGE_LABELS.workMode}
                onSelect={(option) => onField("workMode", option)}
              />
            </label>

            <label className="preview-sidebar-edit-field">
              <span className="jd-summary-stat-label">{COVERAGE_LABELS.salary}</span>
              <SalaryInput
                id="rp-summary-salary"
                value={draft.fields.salary.value}
                currency={draft.salaryCurrency}
                onChange={(next) => onField("salary", next)}
                onCurrency={onCurrency}
              />
            </label>

            <label className="preview-sidebar-edit-field">
              <span className="jd-summary-stat-label">{COVERAGE_LABELS.experienceYears}</span>
              <input
                className="pill-input"
                value={draft.fields.experienceYears.value}
                onChange={(e) => onField("experienceYears", e.target.value)}
              />
            </label>

            <label className="preview-sidebar-edit-field">
              <span className="jd-summary-stat-label">{COVERAGE_LABELS.industryType}</span>
              <TagInput
                id="rp-summary-industry"
                value={draft.fields.industryType.value}
                suggestions={INDUSTRY_SUGGESTIONS}
                variant="dropdown"
                onChange={(next) => onField("industryType", next)}
              />
            </label>

            {footer}
          </div>
        </aside>
      );
    }

    // Editable page, but not currently editing — same presentation as read-only, plus a pencil.
    return (
      <SidebarCard
        headline={headline}
        subline={[department, companyType].filter(Boolean).join(" · ")}
        portrait={portrait}
        activeFlags={activeFlags}
        detailRows={detailRowsFor(draft, false, true)}
        footer={footer}
        editToggle={<TabEditToggle editing={false} onToggle={onToggleEditing} label="Role summary" />}
      />
    );
  }

  return (
    <SidebarCard
      headline={headline}
      subline={[department, companyType].filter(Boolean).join(" · ")}
      portrait={portrait}
      activeFlags={activeFlags}
      detailRows={detailRowsFor(draft, props.showExperienceType ?? false)}
      footer={footer}
    />
  );
}

/** Demo fallback, used only on Role Profile. Never written back into the draft. */
function mockable(value: string, mock: string, useMock: boolean): string {
  if (!useMock) return value;
  return orMock(value, mock);
}

function detailRowsFor(draft: JobDraft, showExperienceType: boolean, useMock = false) {
  const workModeRaw = draft.fields.workMode.value;
  const workMode = WORK_MODE_LABEL[workModeRaw] ?? workModeRaw;
  const rows = [
    {
      label: COVERAGE_LABELS.location,
      value: mockable(draft.fields.location.value, MOCK.location, useMock) || "—",
    },
    {
      label: COVERAGE_LABELS.workMode,
      value: mockable(workMode, MOCK.workMode, useMock) || "—",
    },
    {
      label: COVERAGE_LABELS.salary,
      value: mockable(salaryLabel(draft), MOCK.salary, useMock),
    },
    {
      label: COVERAGE_LABELS.experienceYears,
      value: mockable(draft.fields.experienceYears.value, MOCK.experienceYears, useMock) || "—",
    },
  ];
  if (showExperienceType) {
    rows.push({
      label: COVERAGE_LABELS.experienceType,
      value: draft.fields.experienceType.value || "—",
    });
  }
  rows.push({
    label: COVERAGE_LABELS.industryType,
    value: mockable(draft.fields.industryType.value, MOCK.industryType, useMock) || "—",
  });
  return rows;
}

function SidebarCard({
  headline,
  subline,
  portrait,
  activeFlags,
  detailRows,
  footer,
  editToggle,
}: {
  headline: string;
  subline: string;
  portrait: string;
  activeFlags: readonly (keyof typeof FLAG_LABELS)[];
  detailRows: { label: string; value: string }[];
  footer?: ReactNode;
  editToggle?: ReactNode;
}): JSX.Element {
  return (
    <aside className="preview-sidebar">
      <div className="preview-sidebar-card">
        {editToggle ? (
          <div className="preview-sidebar-edit-head">
            <span className="preview-sidebar-edit-title">Role summary</span>
            {editToggle}
          </div>
        ) : null}
        <h2 className="preview-sidebar-name">{headline}</h2>
        {subline ? <p className="preview-sidebar-subline">{subline}</p> : null}
        {activeFlags.length > 0 ? (
          <div className="preview-sidebar-tags">
            {activeFlags.map((id) => (
              <span className="preview-sidebar-tag" key={id}>
                {FLAG_LABELS[id]}
              </span>
            ))}
          </div>
        ) : null}
        {portrait ? (
          <div className="preview-sidebar-summary">
            <SparkleIcon />
            <p>{portrait}</p>
          </div>
        ) : null}
        <dl className="preview-sidebar-details">
          {detailRows.map((row) => (
            <div className="preview-sidebar-detail-row" key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
        {footer}
      </div>
    </aside>
  );
}
