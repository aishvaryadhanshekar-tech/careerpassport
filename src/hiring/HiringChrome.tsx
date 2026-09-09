import { useDialogFocus } from "../shared/useDialogFocus";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listJobs, startNewJob } from "../jobsStore";
import { demoService } from "../demo/service";
import { CAPABILITIES } from "./catalog";

/** Job-scoped chrome: navigation and demo notifications, never a second jobs workflow. */
export function HiringChrome({
  jobId,
  beforeNavigate,
  onTool,
}: {
  jobId: string;
  beforeNavigate: () => void;
  onTool: (nodeId: string) => void;
}) {
  const navigate = useNavigate(),
    [open, setOpen] = useState(""),
    [query, setQuery] = useState("");
  const [, refresh] = useState(0);
  const [read, setRead] = useState<string[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem("cp.hiring.notifications.read") || "[]",
      );
    } catch {
      return [];
    }
  });
  useEffect(() => demoService().subscribe(() => refresh((v) => v + 1)), []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => (v === "Search" ? "" : "Search"));
        setQuery("");
      }
      if (e.key === "Escape") setOpen("");
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const dialogRef = useDialogFocus(Boolean(open), () => setOpen(""));
  const projects = demoService().list();
  const notifications = projects.flatMap((p) => [
    ...Object.values(p.operations?.tasks || {})
      .filter((t) => !t.done && t.assignedTo === "Demo Recruiter")
      .map((t) => ({ id: t.id, jobId: p.id, title: t.title })),
    ...Object.entries(p.operations?.partners || {})
      .filter(([, v]) => v.status === "Pending")
      .map(([id, v]) => ({
        id,
        jobId: p.id,
        title: `${v.name} requested sourcing access`,
      })),
  ]);
  const unread = notifications.filter((n) => !read.includes(n.id));
  const matches = (v: string) => v.toLowerCase().includes(query.toLowerCase());
  function job(id: string, tool?: string) {
    beforeNavigate();
    setOpen("");
    if (id === jobId) {
      if (tool) onTool(tool);
    } else navigate(`/jobs/${id}/canvas${tool ? `?tool=${tool}` : ""}`);
  }
  return (
    <div className="hire-chrome">
      <button
        onClick={() => {
          setOpen((v) => (v === "Jobs" ? "" : "Jobs"));
          setQuery("");
        }}
      >
        Switch job ▾
      </button>
      <button
        aria-label="Search actions, jobs, candidates"
        onClick={() => {
          setOpen("Search");
          setQuery("");
        }}
      >
        ⌘ K
      </button>
      <button
        aria-label={`Notifications · ${unread.length} unread`}
        onClick={() =>
          setOpen((v) => (v === "Notifications" ? "" : "Notifications"))
        }
      >
        Actions {unread.length > 0 ? `(${unread.length})` : ""}
      </button>
      {open && createPortal(
        <div className="hire-chrome-backdrop" onClick={() => setOpen("")}>
          <section
            className="hire-chrome-dialog"
            role="dialog"
        ref={dialogRef}
        tabIndex={-1}
            aria-modal="true"
            aria-label={open}
            onClick={(e) => e.stopPropagation()}
          >
            <header>
              <h3>
                {open === "Search"
                  ? "Go anywhere in your hiring workspace"
                  : open}
              </h3>
              <button aria-label="Close navigation" onClick={() => setOpen("")}>
                ×
              </button>
            </header>
            {open === "Notifications" ? (
              <>
                <button
                  onClick={() => {
                    const next = [
                      ...new Set([...read, ...notifications.map((n) => n.id)]),
                    ];
                    localStorage.setItem(
                      "cp.hiring.notifications.read",
                      JSON.stringify(next),
                    );
                    setRead(next);
                  }}
                >
                  Mark all read
                </button>
                {notifications.map((n) => (
                  <button
                    className="hire-chrome-result"
                    key={n.id}
                    onClick={() => job(n.jobId, "cap-tasks")}
                  >
                    <strong>{n.title}</strong>
                    <small>
                      {read.includes(n.id) ? "Read" : "New"} · Action needed
                    </small>
                  </button>
                ))}
                {!notifications.length && (
                  <p>No pending assignments or partner requests.</p>
                )}
              </>
            ) : (
              <>
                <input
                  autoFocus
                  aria-label="Search navigation"
                  placeholder={
                    open === "Jobs"
                      ? "Search jobs…"
                      : "Search actions, jobs, candidates…"
                  }
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      e.currentTarget.parentElement
                        ?.querySelector<HTMLButtonElement>(
                          ".hire-chrome-result",
                        )
                        ?.click();
                  }}
                />
                {!query && (
                  <>
                    <button
                      className="hire-chrome-result"
                      onClick={() => {
                        beforeNavigate();
                        startNewJob();
                        navigate("/create-job-canvas");
                        setOpen("");
                      }}
                    >
                      ＋ New job
                    </button>
                    <button
                      className="hire-chrome-result"
                      onClick={() => {
                        beforeNavigate();
                        navigate("/settings");
                      }}
                    >
                      Settings
                    </button>
                  </>
                )}
                {open === "Search" &&
                  CAPABILITIES.filter((c) => matches(c.title)).map((c) => (
                    <button
                      key={c.id}
                      className="hire-chrome-result"
                      onClick={() => {
                        onTool(`cap-${c.id}`);
                        setOpen("");
                      }}
                    >
                      <strong>{c.title}</strong>
                      <small>{c.description}</small>
                    </button>
                  ))}
                <small>JOBS</small>
                {listJobs()
                  .filter((j) => matches(j.title))
                  .sort(
                    (a, b) => Number(b.id === jobId) - Number(a.id === jobId),
                  )
                  .map((j) => (
                    <button
                      key={j.id}
                      className="hire-chrome-result"
                      onClick={() => job(j.id)}
                    >
                      <strong>{j.title}</strong>
                      <small>
                        {j.id === jobId ? "Recently viewed · " : ""}
                        {demoService().get(j.id)?.operations?.setup.status ||
                          j.status}{" "}
                        · {j.location}
                      </small>
                    </button>
                  ))}
                {open === "Search" &&
                  query &&
                  projects.flatMap((p) =>
                    Object.values(p.candidates)
                      .filter((c) => matches(c.name))
                      .map((c) => (
                        <button
                          key={`${p.id}-${c.id}`}
                          className="hire-chrome-result"
                          onClick={() => job(p.id, "cap-review")}
                        >
                          <strong>{c.name}</strong>
                          <small>
                            {p.configuration.draft.fields.designation.value}
                          </small>
                        </button>
                      )),
                  )}
                {query &&
                  !listJobs().some((j) => matches(j.title)) &&
                  (open === "Jobs" ||
                    (!CAPABILITIES.some((c) => matches(c.title)) &&
                      !projects.some((p) =>
                        Object.values(p.candidates).some((c) =>
                          matches(c.name),
                        ),
                      ))) && (
                    <p>
                      No results. Try a job, candidate or action.
                    </p>
                  )}
              </>
            )}
          </section>
        </div>,
        document.querySelector(".funnel-workspace") || document.body,
      )}
    </div>
  );
}
