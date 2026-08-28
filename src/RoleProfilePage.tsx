import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentJobId, startNewJob, upsertJobFromDraft } from "./jobsStore";
import { EvaluationTab } from "./roleProfile/EvaluationTab";
import { hydrate, restoreTabSlice, type EditKey, type TabId } from "./roleProfile/hydrate";
import { RequirementsTab } from "./roleProfile/RequirementsTab";
import { RoleSidebar } from "./roleProfile/RoleSidebar";
import { SourcingTab } from "./roleProfile/SourcingTab";
import { saveDraft } from "./storage";
import { TabPanel, Tabs } from "./Tabs";
import { wizardBackTo } from "./wizardHeader";
import {
  type Currency,
  type EvaluationCriterion,
  type JobDraft,
  type JobPreviewFields,
  type RoleProfileFields,
} from "./types";

export function RoleProfilePage() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<JobDraft>(() => hydrate());
  const [tab, setTab] = useState<TabId>("requirements");
  const [editingTabs, setEditingTabs] = useState<Record<EditKey, boolean>>({
    summary: false,
    requirements: false,
    sourcing: false,
    evaluation: false,
  });
  const [tabSnapshots, setTabSnapshots] = useState<Partial<Record<EditKey, JobDraft>>>({});
  const draftRef = useRef(draft);
  draftRef.current = draft;

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

  // The sidebar pencil is a plain toggle: entering takes a snapshot, leaving commits.
  function toggleSummaryEdit() {
    if (editingTabs.summary) saveTabEdit("summary");
    else beginTabEdit("summary");
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
    <div className="app-shell create-job preview-page role-profile-page">
      <main className="preview-main">
        <div className="preview-layout">
          <RoleSidebar
            draft={draft}
            editable
            editing={editingTabs.summary}
            onToggleEditing={toggleSummaryEdit}
            onField={onField}
            onRoleProfile={onRoleProfile}
            onCurrency={onCurrency}
          />
          <div className="preview-content">
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
        </div>
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
