import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApplicationPreview } from "./ApplicationPreview";
import { EditableField } from "./EditableField";
import "./JobDetailsPage.css";
import { getJob, salaryLabel } from "./jobsStore";
import {
  ImportanceBadge,
  MustHaveRedFlagTable,
  criterionSummary,
} from "./RoleProfilePage";
import { loadDraft } from "./storage";
import { openJob } from "./jobsStore";
import { TabPanel, Tabs } from "./Tabs";
import { splitPoints } from "./formControlUtils";
import {
  COVERAGE_LABELS,
  EVAL_TYPE_LABELS,
  FLAG_IDS,
  FLAG_LABELS,
  type EvaluationCriterion,
  type JobDraft,
} from "./types";

const WORK_MODE_LABEL: Record<string, string> = {
  WFH: "Remote",
  WFO: "On-site",
  Hybrid: "Hybrid",
};

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 1.5 9.3 5 12.8 6.3 9.3 7.6 8 11.1 6.7 7.6 3.2 6.3 6.7 5 8 1.5Z"
        fill="currentColor"
      />
      <path
        d="M13 9.5 13.6 11.1 15.2 11.7 13.6 12.3 13 13.9 12.4 12.3 10.8 11.7 12.4 11.1 13 9.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

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

function DetailsSidebar({
  draft,
  destinations,
}: {
  draft: JobDraft;
  destinations: { internal: boolean; marketplace: boolean };
}) {
  const designation = draft.fields.designation.value;
  const department = draft.roleProfile.department.value;
  const companyType = draft.fields.companyType.value;
  const headline = draft.roleProfile.headline.value || designation || "Untitled role";
  const subline = [department, companyType].filter(Boolean).join(" · ");
  const portrait = draft.roleProfile.portrait.value;

  const activeFlags = FLAG_IDS.filter((id) => draft.flags[id]);

  const detailRows = [
    { label: COVERAGE_LABELS.location, value: draft.fields.location.value || "—" },
    {
      label: COVERAGE_LABELS.workMode,
      value: WORK_MODE_LABEL[draft.fields.workMode.value] ?? (draft.fields.workMode.value || "—"),
    },
    { label: COVERAGE_LABELS.salary, value: salaryLabel(draft) },
    { label: COVERAGE_LABELS.experienceYears, value: draft.fields.experienceYears.value || "—" },
    { label: COVERAGE_LABELS.industryType, value: draft.fields.industryType.value || "—" },
  ];

  return (
    <aside className="preview-sidebar">
      <div className="preview-sidebar-card">
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
        <div className="jd-published-to">
          <span className="jd-published-to-label">Published to</span>
          <DestinationBadges destinations={destinations} />
        </div>
      </div>
    </aside>
  );
}

function ReadOnlyCriterionRow({ criterion }: { criterion: EvaluationCriterion }) {
  return (
    <div className="criterion-row">
      <div className="criterion-row-main">
        <div className="criterion-row-head">
          <span className="criterion-row-label">{criterion.label || "Untitled criterion"}</span>
          <span className="type-badge">{EVAL_TYPE_LABELS[criterion.type]}</span>
          <ImportanceBadge importance={criterion.importance} />
        </div>
        <p className="criterion-row-subtitle">{criterionSummary(criterion)}</p>
      </div>
    </div>
  );
}

function RoleDetailsTab({ draft }: { draft: JobDraft }) {
  const criteria = draft.roleProfile.evaluationFramework;

  return (
    <div className="jd-cards">
      <section className="app-card">
        <header className="app-card-head">
          <h2>Requirements</h2>
        </header>
        <div className="app-card-body role-profile-fields">
          <EditableField
            label="Ideal candidate"
            editing={false}
            display={<p>{draft.preview.idealCandidate || "Not captured yet."}</p>}
          >
            <></>
          </EditableField>
          <EditableField
            label="Skills expected"
            editing={false}
            display={<ReadOnlyList value={draft.preview.expectedSkills} />}
          >
            <></>
          </EditableField>
          <EditableField
            label="Must haves & red flags"
            editing={false}
            display={
              <MustHaveRedFlagTable
                mustHaves={draft.fields.mustHaves.value}
                redFlags={draft.fields.redFlags.value}
              />
            }
          >
            <></>
          </EditableField>
        </div>
      </section>

      <section className="app-card">
        <header className="app-card-head">
          <h2>Sourcing playbook</h2>
        </header>
        <div className="app-card-body role-profile-fields">
          <EditableField
            label="Target companies"
            editing={false}
            display={<ReadOnlyList value={draft.preview.targetCompanies} />}
          >
            <></>
          </EditableField>
          <EditableField
            label="Target sectors"
            editing={false}
            display={<ReadOnlyList value={draft.preview.industrySectors} />}
          >
            <></>
          </EditableField>
          <EditableField
            label="Avoid look-alikes"
            editing={false}
            display={<ReadOnlyList value={draft.roleProfile.avoidLookalikes} />}
          >
            <></>
          </EditableField>
        </div>
      </section>

      <section className="app-card">
        <header className="app-card-head">
          <h2>Evaluation framework</h2>
        </header>
        <div className="app-card-body">
          {criteria.length === 0 ? (
            <p className="jd-empty">No criteria yet.</p>
          ) : (
            criteria.map((criterion) => (
              <ReadOnlyCriterionRow key={criterion.id} criterion={criterion} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function NextActionsTracker({ jobId }: { jobId: string }) {
  return (
    <div className="jd-tracker">
      <div className="jd-tracker-step done">
        <span className="jd-tracker-icon">
          <CheckIcon />
        </span>
        <div className="jd-tracker-body">
          <span className="jd-tracker-label">Job created</span>
        </div>
      </div>
      <div className="jd-tracker-connector" aria-hidden="true" />
      <Link to={`/jobs/${jobId}/trips`} className="jd-tracker-step current">
        <span className="jd-tracker-icon">2</span>
        <div className="jd-tracker-body">
          <span className="jd-tracker-label">Trips</span>
          <span className="jd-tracker-desc">
            Design the structured experience candidates go through before you interview them.
          </span>
        </div>
      </Link>
      <div className="jd-tracker-connector" aria-hidden="true" />
      <div className="jd-tracker-step upcoming">
        <span className="jd-tracker-icon">3</span>
        <div className="jd-tracker-body">
          <span className="jd-tracker-label">More steps coming</span>
        </div>
      </div>
    </div>
  );
}

function hydrateFromJob(id: string): JobDraft | null {
  if (!openJob(id)) return null;
  return loadDraft();
}

export function JobDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const job = id ? getJob(id) : null;
  const [draft] = useState<JobDraft | null>(() => (id ? hydrateFromJob(id) : null));
  const [tab, setTab] = useState<"details" | "application">("details");
  const [mode, setMode] = useState<"mobile" | "desktop">("desktop");

  useEffect(() => {
    document.querySelector(".layout-content")?.scrollTo(0, 0);
  }, []);

  if (!id || !job || !draft) {
    return (
      <div className="app-shell jd-not-found">
        <p>Job not found.</p>
        <Link to="/">Back to jobs</Link>
      </div>
    );
  }

  const config = draft.application;
  const title = draft.fields.designation.value || job.title;

  return (
    <div className="app-shell preview-page jd-page">
      <main className="preview-main">
        <header className="jd-header">
          <Link to="/" className="jd-back-link">
            ← Back to jobs
          </Link>
          <div className="jd-header-row">
            <h1 className="jd-title">{title}</h1>
            <span className="jd-status-badge">Published</span>
          </div>
        </header>

        <NextActionsTracker jobId={id} />

        <div className="preview-layout">
          <DetailsSidebar draft={draft} destinations={job.publishDestinations} />
          <div className="preview-content">
            <Tabs
              ariaLabel="Job details sections"
              active={tab}
              onChange={(nextTab) => setTab(nextTab as "details" | "application")}
              tabs={[
                { id: "details", label: "Role Details" },
                { id: "application", label: "Application Summary" },
              ]}
            />
            <TabPanel id="details" active={tab === "details"}>
              <RoleDetailsTab draft={draft} />
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
          </div>
        </div>
      </main>
    </div>
  );
}
