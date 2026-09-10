import { useRef, useState, type Dispatch, type JSX, type SetStateAction } from "react";
import { EvaluationTab } from "../../roleProfile/EvaluationTab";
import { restoreTabSlice } from "../../roleProfile/hydrate";
import { RequirementsTab } from "../../roleProfile/RequirementsTab";
import { RoleSidebar, type RoleSidebarField } from "../../roleProfile/RoleSidebar";
import { SourcingTab } from "../../roleProfile/SourcingTab";
import type {
  Currency,
  EvaluationCriterion,
  JobDraft,
  JobPreviewFields,
  RoleProfileFields,
} from "../../types";
import type { FunnelNode } from "../funnelModel";
import { BRIEF_SECTIONS, briefSections, type BriefSectionKey } from "./buildPhase";

export type InsightPanelProps = {
  item: FunnelNode;
  items: FunnelNode[];
  draft: JobDraft;
  setDraft: Dispatch<SetStateAction<JobDraft>>;
  /** Whether "Generate pipeline" is on offer right now (see briefHandoffOpen). */
  canGenerate: boolean;
  onOpen: (id: string) => void;
  onReviewed: (id: string) => void;
  onGenerate: () => void;
};

/** Inspector for Role brief nodes: the hub lists its sections; each section reuses its Role Profile editor. */
export function InsightPanel(props: InsightPanelProps): JSX.Element | null {
  const key = props.item.insightKey;
  if (key === "hub") return <BriefOverview {...props} />;
  if (!key) return null;
  return <BriefSection {...props} sectionKey={key} />;
}

function BriefOverview({ items, canGenerate, onOpen, onGenerate }: InsightPanelProps): JSX.Element {
  const sections = briefSections(items);
  const ready = sections.filter((section) => section.reviewed).length === BRIEF_SECTIONS.length;
  return (
    <section className="insight-panel">
      <p className="funnel-help">
        Drafted from your brief. These are the same four sections as the Role Profile step. Open one to check or
        edit it.
      </p>
      {sections.map((section) => (
        <button key={section.id} type="button" className="funnel-child" onClick={() => onOpen(section.id)}>
          <span>
            <small>{section.reviewed ? "Reviewed" : "To review"}</small>
            <strong>{section.title}</strong>
          </span>
          <span aria-hidden="true">{section.reviewed ? "✓" : "→"}</span>
        </button>
      ))}
      {canGenerate && (
        <div className="insight-panel-footer">
          {!ready && (
            <button type="button" className="ai-build-ghost" onClick={onGenerate}>
              Skip review
            </button>
          )}
          <button type="button" className="funnel-primary" disabled={!ready} onClick={onGenerate}>
            Generate pipeline →
          </button>
        </div>
      )}
    </section>
  );
}

function BriefSection({
  item,
  items,
  draft,
  setDraft,
  onReviewed,
  sectionKey,
}: InsightPanelProps & { sectionKey: BriefSectionKey }): JSX.Element {
  const [editing, setEditing] = useState(false);
  const snapshot = useRef<JobDraft | null>(null);

  // Same snapshot/discard contract as RoleProfilePage, scoped to this one section.
  function beginEdit() {
    snapshot.current = structuredClone(draft);
    setEditing(true);
  }
  function discardEdit() {
    const saved = snapshot.current;
    if (saved) setDraft((current) => restoreTabSlice(sectionKey, current, saved));
    setEditing(false);
  }
  function saveEdit() {
    setEditing(false);
  }

  function onField(id: RoleSidebarField | "mustHaves" | "redFlags", value: string) {
    setDraft((current) => ({
      ...current,
      fields: { ...current.fields, [id]: { value, source: "user" } },
    }));
  }
  function onRoleProfile(patch: Partial<RoleProfileFields>) {
    setDraft((current) => ({ ...current, roleProfile: { ...current.roleProfile, ...patch } }));
  }
  function onPreview(patch: Partial<JobPreviewFields>) {
    setDraft((current) => ({ ...current, preview: { ...current.preview, ...patch } }));
  }
  function onFramework(next: EvaluationCriterion[]) {
    setDraft((current) => ({
      ...current,
      roleProfile: { ...current.roleProfile, evaluationFramework: next },
    }));
  }
  function onCurrency(value: Currency | null) {
    setDraft((current) => ({ ...current, salaryCurrency: value }));
  }
  const edit = { editing, onEdit: beginEdit, onDiscard: discardEdit, onSave: saveEdit };

  const order = briefSections(items);
  const position = order.findIndex((section) => section.id === item.id);
  const othersDone = order.filter((section) => section.id !== item.id).every((section) => section.reviewed);
  const nextLabel = !othersDone
    ? "Looks good → next"
    : item.reviewed
      ? "Back to Role brief"
      : "Looks good — finish review";

  return (
    <section className="insight-panel">
      <p className="insight-panel-eyebrow">
        AI draft · section {position + 1} of {BRIEF_SECTIONS.length}
      </p>
      <div className="insight-panel-body">
        {sectionKey === "summary" && (
          <RoleSidebar
            draft={draft}
            editable
            editing={editing}
            onToggleEditing={() => (editing ? saveEdit() : beginEdit())}
            onField={onField}
            onRoleProfile={onRoleProfile}
            onCurrency={onCurrency}
          />
        )}
        {sectionKey === "requirements" && (
          <RequirementsTab draft={draft} onPreview={onPreview} onField={onField} {...edit} />
        )}
        {sectionKey === "sourcing" && (
          <SourcingTab draft={draft} onPreview={onPreview} onRoleProfile={onRoleProfile} {...edit} />
        )}
        {sectionKey === "evaluation" && <EvaluationTab draft={draft} onFramework={onFramework} {...edit} />}
      </div>
      <div className="insight-panel-footer">
        {item.reviewed && <span className="insight-panel-done">✓ Reviewed</span>}
        <button
          type="button"
          className="funnel-primary"
          onClick={() => {
            setEditing(false);
            onReviewed(item.id);
          }}
        >
          {nextLabel}
        </button>
      </div>
    </section>
  );
}
