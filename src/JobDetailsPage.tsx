import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import "./JobDetailsPage.css";
import "./job/jobTabs.css";
import { getJob } from "./jobsStore";
import { PublishSuccess } from "./PublishSuccess";
import { hydrateFromJob } from "./shared/hydrateFromJob";
import { ShareComposeModal } from "./ShareComposeModal";
import { Tabs } from "./Tabs";
import type { JobDraft } from "./types";

/**
 * Shell for everything under /jobs/:id — job header, the page-level tab bar, and the
 * post-publish overlays. Tab bodies render through <Outlet/> and read the hydrated draft
 * from outlet context (see job/jobContext.ts) so the draft is loaded exactly once.
 *
 * The Trip *builder* deliberately lives outside this shell as a full-page route; it is a
 * focused editor with its own publish bar and back link.
 */

const JOB_TABS = [
  { id: "overview", label: "Job Overview", path: "" },
  { id: "trips", label: "Trips", path: "trips" },
  { id: "pipeline", label: "Pipeline", path: "pipeline" },
  { id: "prospects", label: "Prospects", path: "prospects" },
  { id: "setup", label: "Setup", path: "setup" },
] as const;

function activeTabFor(pathname: string, jobId: string): string {
  const rest = pathname.replace(`/jobs/${jobId}`, "").replace(/^\//, "");
  if (rest === "") return "overview";
  const segment = rest.split("/")[0];
  return JOB_TABS.find((t) => t.path === segment)?.id ?? "overview";
}

export function JobDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const job = id ? getJob(id) : null;
  const [draft] = useState<JobDraft | null>(() => (id ? hydrateFromJob(id) : null));

  // Step 4 navigates here immediately on publish and flags the arrival in router state, so the
  // celebration and share composer play over the published job rather than over the wizard.
  const justPublished =
    (location.state as { justPublished?: boolean } | null)?.justPublished === true;
  const [publishPhase, setPublishPhase] = useState<"celebrating" | "sharing" | "done">(
    justPublished ? "celebrating" : "done",
  );

  useEffect(() => {
    document.querySelector(".layout-content")?.scrollTo(0, 0);
  }, []);

  // Clear the flag so a refresh or a back-then-forward doesn't replay the celebration.
  // Done through the router rather than history.replaceState, which would clobber the
  // key/idx bookkeeping React Router keeps in history state. publishPhase was already
  // seeded from the initial value, so dropping the flag here doesn't cancel the overlay.
  useEffect(() => {
    if (justPublished) navigate(location.pathname, { replace: true, state: null });
  }, [justPublished, navigate, location.pathname]);

  if (!id || !job || !draft) {
    return (
      <div className="app-shell jd-not-found">
        <p>Job not found.</p>
        <Link to="/">Back to jobs</Link>
      </div>
    );
  }

  const title = draft.fields.designation.value || job.title;
  const activeTab = activeTabFor(location.pathname, id);

  return (
    <div className="app-shell preview-page jd-page">
      {/* The kanban wants every pixel it can get, so it opts out of the 1200px page measure. */}
      <main className={`preview-main${activeTab === "pipeline" ? " is-wide" : ""}`}>
        <header className="jd-header">
          <Link to="/" className="jd-back-link">
            ← Back to jobs
          </Link>
          <div className="jd-header-row">
            <h1 className="jd-title">{title}</h1>
            <span className="jd-status-badge">Published</span>
          </div>
        </header>

        <div className="job-pagetabs">
          <Tabs
            ariaLabel="Job sections"
            active={activeTab}
            onChange={(next) => {
              const tab = JOB_TABS.find((t) => t.id === next);
              if (tab) navigate(`/jobs/${id}${tab.path ? `/${tab.path}` : ""}`);
            }}
            tabs={JOB_TABS.map((t) => ({ id: t.id, label: t.label }))}
          />
        </div>

        <div className="job-tab-body">
          <Outlet context={{ jobId: id, job, draft, title }} />
        </div>
      </main>

      {publishPhase === "celebrating" ? (
        <PublishSuccess
          jobTitle={title}
          destinations={job.publishDestinations}
          onDone={() => setPublishPhase("sharing")}
        />
      ) : null}
      {publishPhase === "sharing" ? (
        <ShareComposeModal
          jobTitle={title}
          applicationLink={`${window.location.origin}/jobs/${id}/apply`}
          onClose={() => setPublishPhase("done")}
        />
      ) : null}
    </div>
  );
}

/** Placeholder body shared by the tabs that are not built out yet. */
export function JobTabEmpty({
  icon,
  title,
  blurb,
}: {
  icon: string;
  title: string;
  blurb: string;
}) {
  return (
    <div className="job-tab-empty">
      <span className="job-tab-empty-icon" aria-hidden="true">
        {icon}
      </span>
      <h2>{title}</h2>
      <p>{blurb}</p>
    </div>
  );
}
