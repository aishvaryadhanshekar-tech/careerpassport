import { useRef, useState } from "react";
import { ApplicationPreview } from "../ApplicationPreview";
import { CustomQuestionsCard } from "../CustomQuestionsCard";
import { getBoard, sendMessage } from "../candidatesStore";
import { upsertJobFromDraft } from "../jobsStore";
import { EvaluationTab } from "../roleProfile/EvaluationTab";
import { restoreTabSlice, type EditKey } from "../roleProfile/hydrate";
import { RequirementsTab } from "../roleProfile/RequirementsTab";
import { RoleSidebar } from "../roleProfile/RoleSidebar";
import { SourcingTab } from "../roleProfile/SourcingTab";
import { TabEditControls } from "../roleProfile/TabEditControls";
import { TabPanel, Tabs } from "../Tabs";
import type {
  Currency,
  EvaluationCriterion,
  JobDraft,
  JobPreviewFields,
  RoleProfileFields,
} from "../types";
import { useJobContext } from "./jobContext";
import { JobActionSummary } from "./NextStepNudge";

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M2.5 6.3 4.8 8.6 9.5 3.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DestinationBadges({
  destinations,
}: {
  destinations: { internal: boolean; marketplace: boolean };
}) {
  const items: { label: string; active: boolean }[] = [
    { label: "Internal", active: destinations.internal },
    { label: "Marketplace", active: destinations.marketplace },
  ];
  return (
    <div className="jd-destinations">
      {items.map((item) => (
        <span
          key={item.label}
          className={`jd-destination-badge${item.active ? " active" : ""}`}
        >
          {item.active ? <CheckIcon /> : null}
          {item.label}
        </span>
      ))}
    </div>
  );
}

/**
 * Job Overview: the role sidebar plus the role content — Requirements, Sourcing Playbook,
 * Evaluation Framework and Application Summary — all editable in place, plus the
 * post-publish action summary. This absorbed the never-built "Setup" tab: there was no
 * separate config surface to merge, just this tab's read-only afterimage of the wizard.
 */
export function JobOverviewTab() {
  const { jobId, job, draft, setDraft } = useJobContext();
  const [tab, setTab] = useState<"details" | "application">("details");
  const [mode, setMode] = useState<"mobile" | "desktop">("desktop");
  const [board, setBoard] = useState(() => getBoard(jobId));
  const config = draft.application;

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
    upsertJobFromDraft(jobId, draftRef.current);
  }

  // The sidebar pencil is a plain toggle: entering takes a snapshot, leaving commits.
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
    <>
      <JobActionSummary
        jobId={jobId}
        job={job}
        draft={draft}
        board={board}
        onSendMessage={(candidateId, template, values) =>
          setBoard(sendMessage(jobId, candidateId, template, values))
        }
      />
      <div className="preview-layout">
        <RoleSidebar
          draft={draft}
          editable
          editing={editingTabs.summary}
          onToggleEditing={toggleSummaryEdit}
          onField={onField}
          onRoleProfile={onRoleProfile}
          onCurrency={onCurrency}
          footer={
            <div className="jd-published-to">
              <span className="jd-published-to-label">Published to</span>
              <DestinationBadges destinations={job.publishDestinations} />
            </div>
          }
        />
        <div className="preview-content">
          <div className="jo-subtabs-sticky">
            <Tabs
              ariaLabel="Job overview sections"
              active={tab}
              onChange={(nextTab) => setTab(nextTab as "details" | "application")}
              tabs={[
                { id: "details", label: "Role Details" },
                { id: "application", label: "Application Summary" },
              ]}
            />
          </div>
          <TabPanel id="details" active={tab === "details"}>
            <RequirementsTab
              draft={draft}
              onPreview={onPreview}
              onField={onField}
              editing={editingTabs.requirements}
              onEdit={() => beginTabEdit("requirements")}
              onDiscard={() => discardTabEdit("requirements")}
              onSave={() => saveTabEdit("requirements")}
            />
            <SourcingTab
              draft={draft}
              onPreview={onPreview}
              onRoleProfile={onRoleProfile}
              editing={editingTabs.sourcing}
              onEdit={() => beginTabEdit("sourcing")}
              onDiscard={() => discardTabEdit("sourcing")}
              onSave={() => saveTabEdit("sourcing")}
            />
            <EvaluationTab
              draft={draft}
              onFramework={onFramework}
              editing={editingTabs.evaluation}
              onEdit={() => beginTabEdit("evaluation")}
              onDiscard={() => discardTabEdit("evaluation")}
              onSave={() => saveTabEdit("evaluation")}
            />
          </TabPanel>
          <TabPanel id="application" active={tab === "application"}>
            {config ? (
              <div className="jd-cards">
                <div className="app-card-head-actions jo-application-edit-toggle">
                  <TabEditControls
                    editing={editingTabs.application}
                    onEdit={() => beginTabEdit("application")}
                    onDiscard={() => discardTabEdit("application")}
                    onSave={() => saveTabEdit("application")}
                    label="Application"
                  />
                </div>
                {editingTabs.application ? (
                  <CustomQuestionsCard
                    config={config}
                    onChange={(next) => setDraft((current) => ({ ...current, application: next }))}
                  />
                ) : (
                  <ApplicationPreview
                    draft={draft}
                    config={config}
                    mode={mode}
                    onMode={setMode}
                    activeAnchor={null}
                  />
                )}
              </div>
            ) : null}
          </TabPanel>
        </div>
      </div>
    </>
  );
}
