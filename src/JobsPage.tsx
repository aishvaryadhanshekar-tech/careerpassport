import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { filterJobs } from "./jobsListQuery";
import {
  deleteJobs,
  formatUpdated,
  getJob,
  listJobs,
  openJob,
  startNewJob,
  type JobRecord,
} from "./jobsStore";

type View = "table" | "cards";

export function JobsPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobRecord[]>(() => listJobs());
  const [view, setView] = useState<View>("table");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string[] | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isEmpty = jobs.length === 0;
  const searchExpanded = searchOpen || query.trim() !== "";
  const visible = useMemo(() => filterJobs(jobs, query), [jobs, query]);
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const visibleSelectedCount = visible.filter((job) => selectedSet.has(job.id)).length;
  const allVisibleSelected =
    visible.length > 0 && visibleSelectedCount === visible.length;
  const someVisibleSelected =
    visibleSelectedCount > 0 && !allVisibleSelected;

  useEffect(() => {
    setJobs(listJobs());
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const t = e.target;
      if (t instanceof Element && t.closest("[data-job-menu]")) return;
      setMenuId(null);
      if (t instanceof Element && t.closest("[data-jobs-search]")) return;
      if (query.trim() === "") setSearchOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (pendingDelete) {
        setPendingDelete(null);
        return;
      }
      if (searchExpanded && query.trim() === "") {
        setSearchOpen(false);
        return;
      }
      setMenuId(null);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [pendingDelete, query, searchExpanded]);

  useEffect(() => {
    if (!searchOpen) return;
    searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!pendingDelete) return;
    cancelRef.current?.focus();
  }, [pendingDelete]);

  function refresh() {
    const next = listJobs();
    setJobs(next);
    setSelected((ids) => ids.filter((id) => next.some((job) => job.id === id)));
    setMenuId(null);
  }

  function createJob() {
    startNewJob();
    navigate("/create-job");
  }

  function open(id: string) {
    const job = getJob(id);
    if (job?.status === "Published") {
      navigate(`/jobs/${id}`);
      return;
    }
    if (openJob(id)) navigate("/create-job");
  }

  function toggleOne(id: string, on: boolean) {
    setSelected((ids) => (on ? [...ids, id] : ids.filter((item) => item !== id)));
  }

  function toggleAll(on: boolean) {
    const visibleIds = visible.map((job) => job.id);
    setSelected((ids) => {
      if (on) return [...new Set([...ids, ...visibleIds])];
      return ids.filter((id) => !visibleIds.includes(id));
    });
  }

  function requestDelete(ids: string[]) {
    if (!ids.length) return;
    setPendingDelete(ids);
    setMenuId(null);
  }

  function performDelete() {
    if (!pendingDelete?.length) return;
    deleteJobs(pendingDelete);
    setPendingDelete(null);
    refresh();
  }

  const pendingRecords = pendingDelete
    ? jobs.filter((job) => pendingDelete.includes(job.id))
    : [];
  const confirmTitle =
    pendingRecords.length === 1
      ? `Delete “${pendingRecords[0].title}”?`
      : `Delete ${pendingRecords.length} jobs?`;

  return (
    <div className={`app-shell jobs-page${isEmpty ? " jobs-empty" : ""}`}>
      <header className="jobs-header">
        <h1 className="page-title">
          {isEmpty ? "Jobs" : `Jobs (${jobs.length})`}
        </h1>
        <div className="jobs-actions">
          {selected.length > 0 ? (
            <>
              <span className="jobs-selected-count">
                {selected.length} selected
              </span>
              <button
                type="button"
                className="btn danger"
                onClick={() => requestDelete(selected)}
              >
                Delete
              </button>
            </>
          ) : null}
          {!isEmpty ? (
            <>
              <div className="jobs-search" data-jobs-search>
                {searchExpanded ? (
                  <label className="jobs-search-field">
                    <span className="sr-only">Search jobs</span>
                    <SearchIcon />
                    <input
                      ref={searchInputRef}
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search jobs"
                    />
                  </label>
                ) : (
                  <button
                    type="button"
                    className="jobs-search-btn"
                    aria-label="Search jobs"
                    onClick={() => setSearchOpen(true)}
                  >
                    <SearchIcon />
                  </button>
                )}
              </div>
              <div className="view-toggle" role="group" aria-label="View">
                <button
                  type="button"
                  className={view === "table" ? "on" : ""}
                  onClick={() => setView("table")}
                  aria-label="Table view"
                  title="Table view"
                >
                  <TableIcon />
                </button>
                <button
                  type="button"
                  className={view === "cards" ? "on" : ""}
                  onClick={() => setView("cards")}
                  aria-label="Card view"
                  title="Card view"
                >
                  <CardsIcon />
                </button>
              </div>
            </>
          ) : null}
          <button type="button" className="btn primary" onClick={createJob}>
            Create a job
          </button>
        </div>
      </header>

      <div className="jobs-body">
        <div className="jobs-panel">
          <div className="jobs-panel-body">
            {isEmpty ? (
              <div className="empty-jobs">
                <JobsEmptyIllustration />
                <h2 className="empty-jobs-title">Welcome to your jobs</h2>
                <p className="empty-jobs-sub">
                  Jobs help you collect the role details and start hiring. Create
                  a job to get started.
                </p>
                <button
                  type="button"
                  className="btn primary empty-jobs-cta"
                  onClick={createJob}
                >
                  <BriefcaseIcon />
                  Create a job
                </button>
              </div>
            ) : visible.length === 0 ? (
              <div className="empty-jobs empty-jobs-filter">
                <h2 className="empty-jobs-title">No jobs match</h2>
                <p className="empty-jobs-sub">
                  Nothing matches “{query.trim()}”. Try a different search.
                </p>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setQuery("");
                    setSearchOpen(true);
                  }}
                >
                  Clear search
                </button>
              </div>
            ) : view === "table" ? (
              <div className="table-wrap">
                <table className="jobs-table">
                  <thead>
                    <tr>
                      <th className="jobs-check">
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = someVisibleSelected;
                          }}
                          onChange={(e) => toggleAll(e.target.checked)}
                          aria-label="Select all jobs"
                        />
                      </th>
                      <th>Job</th>
                      <th>Location</th>
                      <th>WFO/WFH</th>
                      <th>Salary</th>
                      <th>Status</th>
                      <th>Updated</th>
                      <th className="jobs-row-actions">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((job) => (
                      <tr
                        key={job.id}
                        tabIndex={0}
                        className={selectedSet.has(job.id) ? "is-selected" : ""}
                        onClick={() => open(job.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            open(job.id);
                          }
                        }}
                      >
                        <td
                          className="jobs-check"
                          onClick={stopRow}
                          onKeyDown={stopRow}
                        >
                          <input
                            type="checkbox"
                            checked={selectedSet.has(job.id)}
                            onChange={(e) => toggleOne(job.id, e.target.checked)}
                            aria-label={`Select ${job.title}`}
                          />
                        </td>
                        <td>
                          <b>{job.title}</b>
                        </td>
                        <td>{job.location}</td>
                        <td>{job.workMode}</td>
                        <td>{job.salaryLabel}</td>
                        <td>
                          <span className="status-loz">{job.status}</span>
                        </td>
                        <td className="num">{formatUpdated(job.updatedAt)}</td>
                        <td
                          className="jobs-row-actions"
                          onClick={stopRow}
                          onKeyDown={stopRow}
                        >
                          <JobMenu
                            open={menuId === job.id}
                            label={`Actions for ${job.title}`}
                            onToggle={() =>
                              setMenuId((id) => (id === job.id ? null : job.id))
                            }
                            onDelete={() => requestDelete([job.id])}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="job-cards">
                {visible.map((job) => (
                  <div
                    className={`job-card${selectedSet.has(job.id) ? " is-selected" : ""}`}
                    key={job.id}
                  >
                    <div className="job-card-tools">
                      <input
                        type="checkbox"
                        checked={selectedSet.has(job.id)}
                        onChange={(e) => toggleOne(job.id, e.target.checked)}
                        aria-label={`Select ${job.title}`}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <JobMenu
                        open={menuId === job.id}
                        label={`Actions for ${job.title}`}
                        onToggle={() =>
                          setMenuId((id) => (id === job.id ? null : job.id))
                        }
                        onDelete={() => requestDelete([job.id])}
                      />
                    </div>
                    <button
                      type="button"
                      className="job-card-main"
                      onClick={() => open(job.id)}
                    >
                      <div className="job-card-top">
                        <h2>{job.title}</h2>
                        <span className="status-loz">{job.status}</span>
                      </div>
                      <p>
                        {job.location} · {job.workMode}
                      </p>
                      <p className="job-card-salary">{job.salaryLabel}</p>
                      <p className="job-card-meta">{formatUpdated(job.updatedAt)}</p>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {pendingDelete ? (
        <div
          className="jobs-dialog-backdrop"
          onClick={() => setPendingDelete(null)}
        >
          <div
            className="jobs-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="jobs-delete-title"
            aria-describedby="jobs-delete-copy"
            onClick={stopRow}
          >
            <h2 id="jobs-delete-title">{confirmTitle}</h2>
            <p id="jobs-delete-copy">This cannot be undone.</p>
            <div className="jobs-dialog-actions">
              <button
                type="button"
                className="btn"
                ref={cancelRef}
                onClick={() => setPendingDelete(null)}
              >
                Cancel
              </button>
              <button type="button" className="btn danger" onClick={performDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function stopRow(e: { stopPropagation: () => void }) {
  e.stopPropagation();
}

function JobMenu({
  open,
  label,
  onToggle,
  onDelete,
}: {
  open: boolean;
  label: string;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="job-menu" data-job-menu>
      <button
        type="button"
        className="job-menu-btn"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={onToggle}
      >
        <MoreIcon />
      </button>
      {open ? (
        <div className="job-menu-pop" role="menu">
          <button
            type="button"
            role="menuitem"
            className="job-menu-item danger"
            onClick={onDelete}
          >
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}

function JobsEmptyIllustration() {
  return (
    <svg
      className="empty-jobs-art"
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M28 88c8 10 22 16 32 16s24-6 32-16c-6 4-14 6-22 6-10 0-18-2-24-6-6-4-12-4-18 0Z"
        fill="#d0d5dd"
        opacity="0.7"
      />
      <path
        d="M34 82c6 8 16 12 26 12s20-4 26-12c-5 3-11 5-18 5-8 0-15-2-20-5-5-3-9-3-14 0Z"
        fill="#9aa0a6"
        opacity="0.45"
      />
      <rect x="34" y="22" width="52" height="62" rx="8" fill="#e8eaed" />
      <rect x="40" y="28" width="40" height="50" rx="4" fill="#fff" />
      <circle cx="48" cy="42" r="2.5" fill="#1f1b16" />
      <rect x="56" y="40" width="18" height="4" rx="2" fill="#d0d5dd" />
      <circle cx="48" cy="54" r="2.5" fill="#1f1b16" />
      <rect x="56" y="52" width="22" height="4" rx="2" fill="#d0d5dd" />
      <circle cx="48" cy="66" r="2.5" fill="#1f1b16" />
      <rect x="56" y="64" width="14" height="4" rx="2" fill="#d0d5dd" />
      <path
        d="M92 28v8M88 32h8"
        stroke="#1f1b16"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M100 40v5M97.5 42.5h5"
        stroke="#1f1b16"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect
        x="1.5"
        y="5.5"
        width="13"
        height="8.5"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M6 5.5V4.2C6 3.5 6.5 3 7.2 3h1.6C9.5 3 10 3.5 10 4.2v1.3"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path d="M1.5 9h13" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function TableIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.5" y="2" width="13" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M1.5 6.5h13M1.5 10.5h13M6 2v12" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function CardsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9" y="1.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="1.5" y="9" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9" y="9" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="4.25" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.2 10.2 13.5 13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="3.5" r="1.2" fill="currentColor" />
      <circle cx="8" cy="8" r="1.2" fill="currentColor" />
      <circle cx="8" cy="12.5" r="1.2" fill="currentColor" />
    </svg>
  );
}
