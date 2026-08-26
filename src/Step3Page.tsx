import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApplicationPreview } from "./ApplicationPreview";
import { deriveJobPreview } from "./derivePreviewFields";
import { splitPoints } from "./formControlUtils";
import { PointList, TagInput } from "./formControls";
import { getCurrentJobId, salaryLabel, startNewJob, upsertJobFromDraft } from "./jobsStore";
import { seedApplication } from "./seedApplication";
import { loadDraft, saveDraft } from "./storage";
import { TabPanel, Tabs } from "./Tabs";
import { COVERAGE_LABELS, INDUSTRY_SUGGESTIONS, type JobDraft } from "./types";

function withApplication(draft: JobDraft): JobDraft {
  if (draft.application) return draft;
  return { ...draft, application: seedApplication(draft) };
}

function withPreview(draft: JobDraft): JobDraft {
  if (draft.previewGenerated) return draft;
  return {
    ...draft,
    preview: deriveJobPreview(draft),
    previewGenerated: true,
  };
}

function hydrate(): JobDraft {
  return withPreview(withApplication(loadDraft()));
}

const WORK_MODE_LABEL: Record<string, string> = {
  WFH: "Remote",
  WFO: "On-site",
  Hybrid: "Hybrid",
};

function ReadOnlyList({ value }: { value: string }) {
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

function RoleSummaryCard({ draft }: { draft: JobDraft }) {
  const rows: { label: string; value: string }[] = [
    { label: COVERAGE_LABELS.designation, value: draft.fields.designation.value || "—" },
    {
      label: COVERAGE_LABELS.experienceYears,
      value: draft.fields.experienceYears.value || "—",
    },
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

function JobDetailsTab({
  draft,
  onPreview,
}: {
  draft: JobDraft;
  onPreview: (patch: Partial<JobDraft["preview"]>) => void;
}) {
  return (
    <div className="jd-cards">
      <RoleSummaryCard draft={draft} />

      <section className="app-card">
        <header className="app-card-head">
          <h2>Ideal candidate</h2>
        </header>
        <div className="app-card-body">
          <textarea
            className="pill-input area-input"
            rows={3}
            value={draft.preview.idealCandidate}
            onChange={(e) => onPreview({ idealCandidate: e.target.value })}
          />
        </div>
      </section>

      <section className="app-card">
        <header className="app-card-head">
          <h2>Expected skills</h2>
        </header>
        <div className="app-card-body">
          <PointList
            id="preview-expected-skills"
            value={draft.preview.expectedSkills}
            onChange={(next) => onPreview({ expectedSkills: next })}
          />
        </div>
      </section>

      <section className="app-card">
        <header className="app-card-head">
          <h2>Must haves</h2>
        </header>
        <div className="app-card-body">
          <ReadOnlyList value={draft.fields.mustHaves.value} />
        </div>
      </section>

      <section className="app-card">
        <header className="app-card-head">
          <h2>Red flags</h2>
        </header>
        <div className="app-card-body">
          <ReadOnlyList value={draft.fields.redFlags.value} />
        </div>
      </section>

      <section className="app-card">
        <header className="app-card-head">
          <h2>Evaluation criteria</h2>
        </header>
        <div className="app-card-body">
          <ReadOnlyList value={draft.fields.evaluationCriteria.value} />
        </div>
      </section>

      <section className="app-card">
        <header className="app-card-head">
          <h2>Sourcing playbook</h2>
        </header>
        <div className="app-card-body">
          <div className="field field-wide">
            <label htmlFor="preview-target-companies">Target companies</label>
            <PointList
              id="preview-target-companies"
              value={draft.preview.targetCompanies}
              onChange={(next) => onPreview({ targetCompanies: next })}
            />
          </div>
          <div className="field field-wide">
            <label htmlFor="preview-industry-sectors">Industry sectors</label>
            <TagInput
              id="preview-industry-sectors"
              value={draft.preview.industrySectors}
              suggestions={INDUSTRY_SUGGESTIONS}
              onChange={(next) => onPreview({ industrySectors: next })}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

export function Step3Page() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<JobDraft>(() => hydrate());
  const [tab, setTab] = useState<"details" | "application">("details");
  const [mode, setMode] = useState<"mobile" | "desktop">("mobile");
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

  function onPreview(patch: Partial<JobDraft["preview"]>) {
    setDraft((current) => ({
      ...current,
      preview: { ...current.preview, ...patch },
    }));
  }

  function onFinish() {
    const from = draftRef.current;
    saveDraft(from);
    const id = getCurrentJobId() ?? startNewJob();
    upsertJobFromDraft(id, from);
    navigate("/");
  }

  const config = draft.application;

  return (
    <div className="app-shell create-job preview-page">
      <main className="preview-main">
        <Tabs
          ariaLabel="Preview sections"
          active={tab}
          onChange={(id) => setTab(id as "details" | "application")}
          tabs={[
            { id: "details", label: "Job details" },
            { id: "application", label: "Application" },
          ]}
        />
        <TabPanel id="details" active={tab === "details"}>
          <JobDetailsTab draft={draft} onPreview={onPreview} />
        </TabPanel>
        <TabPanel id="application" active={tab === "application"}>
          {config ? (
            <ApplicationPreview
              draft={draft}
              config={config}
              mode={mode}
              onMode={setMode}
              activeAnchor={null}
            />
          ) : null}
        </TabPanel>
      </main>
      <footer className="footer">
        <button type="button" className="btn primary" onClick={onFinish}>
          Save & finish
        </button>
      </footer>
    </div>
  );
}
