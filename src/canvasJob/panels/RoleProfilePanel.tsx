import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { EvaluationTab } from "../../roleProfile/EvaluationTab";
import { restoreTabSlice, withPreview, withRoleProfile, type EditKey, type TabId } from "../../roleProfile/hydrate";
import { RequirementsTab } from "../../roleProfile/RequirementsTab";
import { RoleSidebar } from "../../roleProfile/RoleSidebar";
import { SourcingTab } from "../../roleProfile/SourcingTab";
import { TabPanel, Tabs } from "../../Tabs";
import type {
  Currency,
  EvaluationCriterion,
  JobDraft,
  JobPreviewFields,
  RoleProfileFields,
} from "../../types";

export function RoleProfilePanel({
  draft,
  setDraft,
}: {
  draft: JobDraft;
  setDraft: Dispatch<SetStateAction<JobDraft>>;
}) {
  const [tab, setTab] = useState<TabId>("requirements");
  const [editingTabs, setEditingTabs] = useState<Record<EditKey, boolean>>({
    summary: false,
    requirements: false,
    sourcing: false,
    evaluation: false,
    application: false,
  });
  const [tabSnapshots, setTabSnapshots] = useState<Partial<Record<EditKey, JobDraft>>>({});
  const draftRef = useRef(draft);
  draftRef.current = draft;

  // Same derivation the linear wizard's hydrate() runs on first visit — simply opening this node
  // once is what marks it "done" (roleProfileGenerated), matching the wizard's permissive
  // "Continue is always enabled" rule for this step.
  useEffect(() => {
    setDraft((current) => withRoleProfile(withPreview(current)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function beginTabEdit(id: EditKey) {
    setTabSnapshots((current) => ({ ...current, [id]: structuredClone(draftRef.current) }));
    setEditingTabs((current) => ({ ...current, [id]: true }));
  }

  function discardTabEdit(id: EditKey) {
    const snapshot = tabSnapshots[id];
    if (snapshot) {
      setDraft((current) => restoreTabSlice(id, current, snapshot));
    }
    setEditingTabs((current) => ({ ...current, [id]: false }));
  }

  function saveTabEdit(id: EditKey) {
    setEditingTabs((current) => ({ ...current, [id]: false }));
  }

  function toggleSummaryEdit() {
    if (editingTabs.summary) saveTabEdit("summary");
    else beginTabEdit("summary");
  }

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

  return (
    <div className="canvas-panel-scroll canvas-role-profile-panel">
      <RoleSidebar
        draft={draft}
        editable
        editing={editingTabs.summary}
        onToggleEditing={toggleSummaryEdit}
        onField={onField}
        onRoleProfile={onRoleProfile}
        onCurrency={onCurrency}
      />
      <Tabs
        ariaLabel="Role profile sections"
        active={tab}
        onChange={(id) => setTab(id as TabId)}
        tabs={[
          { id: "requirements", label: "Requirements" },
          { id: "sourcing", label: "Sourcing Playbook" },
          { id: "evaluation", label: "Evaluation Framework" },
        ]}
      />
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
    </div>
  );
}
