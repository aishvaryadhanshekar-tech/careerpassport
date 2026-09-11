import { useEffect, useRef, useState, type JSX } from "react";
import { EvaluationTab } from "../../roleProfile/EvaluationTab";
import { restoreTabSlice } from "../../roleProfile/hydrate";
import { RequirementsTab } from "../../roleProfile/RequirementsTab";
import { RoleSidebar, type RoleSidebarField } from "../../roleProfile/RoleSidebar";
import { SourcingTab } from "../../roleProfile/SourcingTab";
import { tabKeyboard } from "../../shared/tabKeyboard";
import type { Currency, EvaluationCriterion, JobDraft, JobPreviewFields, RoleProfileFields } from "../../types";
import { BRIEF_SECTIONS, type BriefSectionKey } from "./buildPhase";
import type { BriefInspectorProps } from "./contract";

const NOT_EDITING: Record<BriefSectionKey, boolean> = {
  summary: false,
  requirements: false,
  sourcing: false,
  evaluation: false,
};

function TabCheck(): JSX.Element {
  return (
    <svg className="insight-tab-check" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="8" fill="currentColor" />
      <path d="M4.6 8.2l2.2 2.2 4.6-4.8" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** The Role brief inspector: one panel, a tab per section, each reusing its Role Profile editor. */
export function InsightPanel({
  draft,
  setDraft,
  tab,
  onTab,
  reviewed,
  canGenerate,
  onReviewed,
  onGenerate,
}: BriefInspectorProps): JSX.Element {
  const [editing, setEditing] = useState(NOT_EDITING);
  const snapshots = useRef<Partial<Record<BriefSectionKey, JobDraft>>>({});
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const activeTab = useRef<HTMLButtonElement>(null);

  // A clipped tab scrolls into view when it becomes active, by click, keyboard or the workspace.
  useEffect(() => {
    activeTab.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [tab]);

  // Same snapshot/discard contract as RoleProfilePanel, one snapshot per section.
  function beginEdit(key: BriefSectionKey) {
    snapshots.current[key] = structuredClone(draftRef.current);
    setEditing((current) => ({ ...current, [key]: true }));
  }
  function discardEdit(key: BriefSectionKey) {
    const saved = snapshots.current[key];
    if (saved) setDraft((current) => restoreTabSlice(key, current, saved));
    setEditing((current) => ({ ...current, [key]: false }));
  }
  function saveEdit(key: BriefSectionKey) {
    setEditing((current) => ({ ...current, [key]: false }));
  }

  function onField(id: RoleSidebarField | "mustHaves" | "redFlags", value: string) {
    setDraft((current) => ({ ...current, fields: { ...current.fields, [id]: { value, source: "user" } } }));
  }
  function onRoleProfile(patch: Partial<RoleProfileFields>) {
    setDraft((current) => ({ ...current, roleProfile: { ...current.roleProfile, ...patch } }));
  }
  function onPreview(patch: Partial<JobPreviewFields>) {
    setDraft((current) => ({ ...current, preview: { ...current.preview, ...patch } }));
  }
  function onFramework(next: EvaluationCriterion[]) {
    setDraft((current) => ({ ...current, roleProfile: { ...current.roleProfile, evaluationFramework: next } }));
  }
  function onCurrency(value: Currency | null) {
    setDraft((current) => ({ ...current, salaryCurrency: value }));
  }
  const edit = (key: BriefSectionKey) => ({
    editing: editing[key],
    onEdit: () => beginEdit(key),
    onDiscard: () => discardEdit(key),
    onSave: () => saveEdit(key),
  });

  const allReviewed = BRIEF_SECTIONS.every((section) => reviewed.includes(section.key));
  const lastToReview = BRIEF_SECTIONS.every((section) => section.key === tab || reviewed.includes(section.key));

  return (
    <section className="insight-panel">
      <div className="insight-tabs" role="tablist" aria-label="Role brief sections" onKeyDown={tabKeyboard}>
        {BRIEF_SECTIONS.map((section) => {
          const active = section.key === tab;
          const done = reviewed.includes(section.key);
          return (
            <button
              key={section.key}
              ref={active ? activeTab : undefined}
              type="button"
              role="tab"
              id={`brief-tab-${section.key}`}
              aria-selected={active}
              aria-controls={`brief-tabpanel-${section.key}`}
              tabIndex={active ? 0 : -1}
              className={`insight-tab ${active ? "insight-tab-active" : ""}`}
              onClick={() => onTab(section.key)}
            >
              {section.label}
              {done && (
                <>
                  <TabCheck />
                  <span className="sr-only"> (reviewed)</span>
                </>
              )}
            </button>
          );
        })}
      </div>

      <div
        className="insight-panel-body"
        role="tabpanel"
        id={`brief-tabpanel-${tab}`}
        aria-labelledby={`brief-tab-${tab}`}
      >
        {tab === "summary" && (
          <RoleSidebar
            draft={draft}
            editable
            editing={editing.summary}
            onToggleEditing={() => (editing.summary ? saveEdit("summary") : beginEdit("summary"))}
            onField={onField}
            onRoleProfile={onRoleProfile}
            onCurrency={onCurrency}
          />
        )}
        {tab === "requirements" && (
          <RequirementsTab draft={draft} onPreview={onPreview} onField={onField} {...edit("requirements")} />
        )}
        {tab === "sourcing" && (
          <SourcingTab draft={draft} onPreview={onPreview} onRoleProfile={onRoleProfile} {...edit("sourcing")} />
        )}
        {tab === "evaluation" && <EvaluationTab draft={draft} onFramework={onFramework} {...edit("evaluation")} />}
      </div>

      <div className="insight-panel-footer">
        {reviewed.includes(tab) && <span className="insight-panel-done">✓ Reviewed</span>}
        {allReviewed ? (
          canGenerate && (
            <button type="button" className="funnel-primary" onClick={onGenerate}>
              Generate pipeline →
            </button>
          )
        ) : (
          <>
            {canGenerate && (
              <button type="button" className="ai-build-ghost" onClick={onGenerate}>
                Skip review
              </button>
            )}
            <button
              type="button"
              className="funnel-primary"
              onClick={() => {
                saveEdit(tab);
                onReviewed(tab);
              }}
            >
              {lastToReview ? "Looks good" : "Looks good → next"}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
