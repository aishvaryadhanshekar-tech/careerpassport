import { useEffect, useState } from "react";
import { DEFAULT_PIPELINE_STAGES, CANDIDATE_TAG_SUGGESTIONS } from "../types";
import { demoService, toBoard } from "../demo/service";
import { useDictation } from "../shared/useDictation";
import { reviewFor, STAGES, TEAM } from "./catalog";
import { change, moveCandidate, sendOutreach } from "./service";
import { DataFilters, matches, type Condition } from "./DataFilters";
import { Field, Tabs, Empty, copy, type PanelProps } from "./shared";

const REVIEW_FILTER_LABELS: Record<string, string> = {
  status: "Status",
  owner: "Owner",
  confidence: "Confidence",
  tripStatus: "Trip status",
  source: "Source",
  location: "Location",
};
const REVIEW_SECONDARY_FILTER_KEYS = [
  "owner",
  "confidence",
  "tripStatus",
  "source",
  "location",
];
export function ReviewPanel({
  jobId,
  project,
  ops,
  run,
  initialCandidate,
  detailOnly = false,
}: PanelProps & { initialCandidate?: string; detailOnly?: boolean }) {
  const [stage, setStage] = useState("All"),
    [query, setQuery] = useState(""),
    [view, setView] = useState("Table"),
    [conditions, setConditions] = useState<Condition[]>([]);
  const [quick, setQuick] = useState<Record<string, string>>({});
  const [active, setActive] = useState<string | null>(initialCandidate || null),
    [selected, setSelected] = useState<string[]>([]),
    [evidence, setEvidence] = useState("Résumé"),
    [feedbackTab, setFeedbackTab] = useState("Feedback");
  const [moveStage, setMoveStage] = useState("screened"),
    [moveStatus, setMoveStatus] = useState(STAGES.screened[0]),
    [templateId, setTemplateId] = useState(""),
    [owner, setOwner] = useState(TEAM[0]);
  const [note, setNote] = useState(""),
    [assignee, setAssignee] = useState(""),
    [taskType, setTaskType] = useState("Feedback"),
    [due, setDue] = useState(""),
    [customTag, setCustomTag] = useState("");
  const [sort, setSort] = useState("Newest applied"),
    [page, setPage] = useState(0);
  const [columns, setColumns] = useState<string[]>(() => {
    try {
      return (
        JSON.parse(localStorage.getItem("cp.review.columns") || "null") ?? [
          "status",
          "verified",
          "confidence",
          "owner",
          "tripStatus",
          "appliedAt",
        ]
      );
    } catch {
      return ["status", "owner"];
    }
  });
  const dictation = useDictation({ value: note, onChange: setNote });
  const rows = Object.values(project.candidates).map((c) => ({
    ...c,
    ...reviewFor(c, ops),
    answersText: Object.values(c.answers).join(" "),
    tags: c.tags.join(", "),
    appliedAtText: new Date(c.appliedAt).toLocaleDateString(),
  }));
  const filtered = rows
    .filter(
      (c) =>
        (stage === "All" || c.stageId === stage) &&
        Object.entries(quick).every(
          ([k, v]) => !v || String(c[k as keyof typeof c]) === v,
        ) &&
        matches(c, query, conditions),
    )
    .sort((a, b) =>
      sort === "Name"
        ? a.name.localeCompare(b.name)
        : sort === "Oldest applied"
          ? a.appliedAt - b.appliedAt
          : b.appliedAt - a.appliedAt,
    );
  const candidate = active ? project.candidates[active] : undefined;
  const review = candidate ? reviewFor(candidate, ops) : undefined;
  const stages = toBoard(project).stages;
  const assignments = Object.values(project.assignments).filter(
    (a) => a.candidateId === active,
  );
  const sends = Object.values(project.deliveries).filter(
    (d) => d.candidateId === active,
  );
  const targetIds = candidate ? [candidate.id] : selected;
  function go(offset: number) {
    const i = filtered.findIndex((c) => c.id === active),
      next = filtered[i + offset];
    if (next) setActive(next.id);
  }
  function advance() {
    if (!candidate) return;
    const i = DEFAULT_PIPELINE_STAGES.findIndex(
      (s) => s.id === candidate.stageId,
    );
    if (i < 0 || i >= 4) return;
    const next = DEFAULT_PIPELINE_STAGES[i + 1].id;
    run(
      () => moveCandidate(jobId, candidate.id, next, STAGES[next][0]),
      "Candidate advanced.",
    );
  }
  useEffect(() => {
    if (detailOnly) return;
    const listener = (e: KeyboardEvent) => {
      if (
        !active ||
        (e.target instanceof HTMLElement &&
          e.target.closest(
            "input,textarea,select,[contenteditable=true]",
          )) ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey
      )
        return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      }
      if (e.key.toLowerCase() === "a") advance();
      if (e.key.toLowerCase() === "r") {
        setMoveStage("archive");
        setMoveStatus(STAGES.archive[0]);
      }
      if (e.key === "Escape") {
        e.stopPropagation();
        setActive(null);
      }
    };
    window.addEventListener("keydown", listener, true);
    return () => window.removeEventListener("keydown", listener, true);
  });
  function postNote() {
    if (!candidate || !note.trim()) return;
    run(() => {
      change(
        jobId,
        `Added ${feedbackTab.toLowerCase()} for ${candidate.name}`,
        (o, p) => {
          const c = p.candidates[candidate.id],
            id = crypto.randomUUID();
          c.notes.push({
            id,
            body: note.trim(),
            author: TEAM[0],
            createdAt: p.clock,
            mentions: assignee
              ? [assignee]
              : TEAM.filter((n) => note.includes(`@${n}`)),
          });
          const assigned = assignee || TEAM.find((n) => note.includes(`@${n}`));
          if (assigned || due)
            o.tasks[id] = {
              id,
              candidateId: c.id,
              title: note.trim(),
              type: taskType,
              assignedTo: assigned || TEAM[0],
              createdBy: TEAM[0],
              due: due ? new Date(due).getTime() : p.clock + 86400000,
              done: false,
            };
          c.timeline.push({
            id,
            at: p.clock,
            actor: "team",
            label: `Feedback added${assigned ? ` · assigned to ${assigned}` : ""}`,
          });
        },
        "Candidates",
        candidate.id,
      );
      setNote("");
    }, "Note saved. Assigned work appears in Action on you.");
  }
  function renderQuickFilter(k: string) {
    return (
      <label key={k} className="hire-filter">
        <span>{REVIEW_FILTER_LABELS[k] ?? k}</span>
        <select
          aria-label={`Filter ${REVIEW_FILTER_LABELS[k] ?? k}`}
          value={quick[k] || ""}
          onChange={(e) => {
            setQuick((v) => ({ ...v, [k]: e.target.value }));
            setPage(0);
          }}
        >
          <option value="">All {REVIEW_FILTER_LABELS[k] ?? k}</option>
          {Array.from(new Set(rows.map((r) => String(r[k as keyof typeof r]))))
            .filter(Boolean)
            .map((v) => (
              <option key={v}>{v}</option>
            ))}
        </select>
      </label>
    );
  }
  const activeSecondaryFilterCount = REVIEW_SECONDARY_FILTER_KEYS.filter(
    (k) => quick[k],
  ).length;
  return (
    <>
      <p className="hire-intro">
        Stage and status are separate. Feedback is optional when moving candidates.
      </p>
      <div className="hire-stage-strip">
        <button
          className={stage === "All" ? "is-active" : ""}
          onClick={() => {
            setStage("All");
            setPage(0);
          }}
        >
          All {rows.length}
        </button>
        {stages.map((s) => (
          <button
            key={s.id}
            className={stage === s.id ? "is-active" : ""}
            onClick={() => {
              setStage(s.id);
              setPage(0);
            }}
          >
            {s.label}
            <strong>{rows.filter((c) => c.stageId === s.id).length}</strong>
          </button>
        ))}
      </div>
      <div className="hire-actions">
        <input
          aria-label="Search candidate review"
          placeholder="Search names, skills, answers, tags…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
        />
        {renderQuickFilter("status")}
        <select
          aria-label="Candidate sort"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          {["Newest applied", "Oldest applied", "Name"].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
        <button
          onClick={() => setView((v) => (v === "Table" ? "Cards" : "Table"))}
        >
          {view === "Table" ? "Cards view" : "Table view"}
        </button>
      </div>
      <details className="hire-secondary-filters">
        <summary>
          Filters
          {activeSecondaryFilterCount > 0 && (
            <span className="hire-filter-count">
              {activeSecondaryFilterCount}
            </span>
          )}
        </summary>
        <div className="hire-actions">
          {REVIEW_SECONDARY_FILTER_KEYS.map((k) => renderQuickFilter(k))}
        </div>
      </details>
      <DataFilters
        scope={`${jobId}-review`}
        fields={[
          "name",
          "email",
          "phone",
          "status",
          "owner",
          "confidence",
          "verified",
          "tripStatus",
          "source",
          "location",
          "experience",
          "company",
          "tags",
          "answersText",
          "tripScore",
          "appliedAt",
        ]}
        conditions={conditions}
        onChange={(v) => {
          setConditions(v);
          setPage(0);
        }}
      />
      <details>
        <summary>Table columns</summary>
        <div className="hire-actions">
          {[
            "status",
            "verified",
            "confidence",
            "owner",
            "tripStatus",
            "appliedAt",
            "email",
            "phone",
            "company",
            "experience",
            "stageId",
            "location",
            "source",
          ].map((k) => (
            <label key={k}>
              <input
                type="checkbox"
                checked={columns.includes(k)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...columns, k]
                    : columns.filter((v) => v !== k);
                  setColumns(next);
                  localStorage.setItem(
                    "cp.review.columns",
                    JSON.stringify(next),
                  );
                }}
              />
              {k}
            </label>
          ))}
        </div>
      </details>
      {selected.length > 0 && !candidate && (
        <p className="hire-callout">
          {selected.length} selected · bulk actions below the list.
        </p>
      )}
      {view === "Table" ? (
        <div className="hire-table-wrap">
          <table className="hire-table">
            <thead>
              <tr>
                <th>
                  <input
                    aria-label="Select review queue"
                    type="checkbox"
                    checked={
                      filtered.length > 0 &&
                      filtered.every((c) => selected.includes(c.id))
                    }
                    onChange={(e) =>
                      setSelected(
                        e.target.checked ? filtered.map((c) => c.id) : [],
                      )
                    }
                  />
                </th>
                <th>Candidate</th>
                {columns.map((k) => (
                  <th key={k}>{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(page * 10, page * 10 + 10).map((c) => (
                <tr key={c.id}>
                  <td>
                    <input
                      aria-label={`Select ${c.name}`}
                      type="checkbox"
                      checked={selected.includes(c.id)}
                      onChange={(e) =>
                        setSelected((v) =>
                          e.target.checked
                            ? [...v, c.id]
                            : v.filter((id) => id !== c.id),
                        )
                      }
                    />
                  </td>
                  <td>
                    <button onClick={() => setActive(c.id)}>{c.name}</button>
                    <small>{c.email}</small>
                  </td>
                  {columns.map((k) => (
                    <td key={k}>
                      {k === "appliedAt"
                        ? c.appliedAtText
                        : k === "verified"
                          ? c.verified
                            ? "Verified"
                            : "Not verified"
                          : String(c[k as keyof typeof c] ?? "") || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="hire-form-grid">
          {filtered.slice(page * 10, page * 10 + 10).map((c) => (
            <button
              className="hire-candidate-card"
              key={c.id}
              onClick={() => setActive(c.id)}
            >
              <strong>{c.name}</strong>
              <span>{c.status}</span>
              <small>
                {c.confidence} · {c.owner} · {c.tripStatus}
              </small>
            </button>
          ))}
        </div>
      )}
      {!filtered.length && (
        <Empty>
          No matching candidates. Submit a demo application or promote a
          prospect.
        </Empty>
      )}
      <div className="hire-actions">
        <button disabled={!page} onClick={() => setPage((p) => p - 1)}>
          Previous page
        </button>
        <span>
          {filtered.length} results · Page {page + 1}
        </span>
        <button
          disabled={(page + 1) * 10 >= filtered.length}
          onClick={() => setPage((p) => p + 1)}
        >
          Next page
        </button>
      </div>
      {targetIds.length > 0 && (
        <section className="hire-card">
          <h3>
            {candidate
              ? `Decision · ${candidate.name}`
              : `Bulk action · ${selected.length} candidates`}
          </h3>
          <div className="hire-form-grid">
            <label className="hire-field">
              Move to stage
              <select
                aria-label="Move to stage"
                value={moveStage}
                onChange={(e) => {
                  setMoveStage(e.target.value);
                  setMoveStatus(
                    (STAGES[e.target.value] ?? STAGES.interviewing)[0],
                  );
                }}
              >
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <Field
              label="Move to status"
              value={moveStatus}
              options={STAGES[moveStage] ?? STAGES.interviewing}
              onChange={setMoveStatus}
            />
          </div>
          <div className="hire-actions">
            <button
              onClick={() =>
                run(
                  () =>
                    targetIds.forEach((id) =>
                      moveCandidate(jobId, id, moveStage, moveStatus),
                    ),
                  "Stage and status updated.",
                )
              }
            >
              Confirm move
            </button>
            {candidate &&
              !["offered", "archive"].includes(candidate.stageId) && (
                <button onClick={advance}>Advance (A)</button>
              )}
            <button
              onClick={() => {
                setMoveStage("archive");
                setMoveStatus(STAGES.archive[0]);
              }}
            >
              Reject · choose reason (R)
            </button>
          </div>
          <div className="hire-actions">
            <select
              aria-label="Assign owner"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
            >
              {TEAM.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
            <button
              onClick={() =>
                run(
                  () =>
                    change(
                      jobId,
                      `Assigned candidate ownership to ${owner}`,
                      (o, p) =>
                        targetIds.forEach((id) => {
                          o.reviews[id] = {
                            ...reviewFor(p.candidates[id], o),
                            owner,
                          };
                        }),
                      "Candidates",
                    ),
                  "Owner assigned.",
                )
              }
            >
              Assign owner
            </button>
            <select
              aria-label="Review outreach template"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            >
              <option value="">Outreach template</option>
              {Object.values(ops.templates).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.channel} · {t.name}
                </option>
              ))}
            </select>
            <button
              disabled={!templateId}
              onClick={() =>
                run(
                  () =>
                    sendOutreach(jobId, targetIds, ops.templates[templateId]),
                  "Simulated outreach is in the outbox.",
                )
              }
            >
              Send to {targetIds.length}
            </button>
          </div>
        </section>
      )}
      {candidate && review && (
        <section className="hire-review">
          <div className="hire-section-head">
            <div>
              <h2>{candidate.name}</h2>
              <small>
                {review.status} · {review.confidence}
              </small>
            </div>
            <div className="hire-actions">
              <button
                disabled={filtered.findIndex((c) => c.id === active) <= 0}
                onClick={() => go(-1)}
              >
                ←
              </button>
              <button
                disabled={
                  filtered.findIndex((c) => c.id === active) >=
                  filtered.length - 1
                }
                onClick={() => go(1)}
              >
                →
              </button>
              <button
                aria-label="Close candidate review"
                onClick={() => setActive(null)}
              >
                ×
              </button>
            </div>
          </div>
          <div className="hire-actions">
            <button
              onClick={() => run(() => copy(candidate.email), "Email copied.")}
            >
              {candidate.email}
            </button>
            <button
              disabled={!candidate.phone}
              onClick={() => run(() => copy(candidate.phone), "Phone copied.")}
            >
              {candidate.phone || "No phone"}
            </button>
          </div>
          <div className="hire-review-panes">
            <div>
              <Tabs
                values={[
                  "Résumé",
                  "Application",
                  "Trip",
                  "Evaluation",
                  "Communications",
                ]}
                active={evidence}
                onChange={setEvidence}
              />
              {evidence === "Résumé" && (
                <>
                  <h3>{candidate.resumeFileName || "No résumé attached"}</h3>
                  <p className="hire-muted">
                    Demo profile evidence · no real document is uploaded.
                  </p>
                  <p>
                    {Object.values(candidate.answers).slice(0, 3).join("\n")}
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    aria-label="Update candidate CV"
                    onChange={(e) =>
                      run(() => {
                        const f = e.target.files?.[0];
                        if (f) {
                          if (f.size > 10 * 1024 * 1024)
                            throw new Error("CV must be below 10 MB.");
                          change(
                            jobId,
                            "Updated CV metadata",
                            (_, p) => {
                              p.candidates[candidate.id].resumeFileName =
                                f.name;
                            },
                            "Candidates",
                            candidate.id,
                          );
                        }
                      })
                    }
                  />
                </>
              )}
              {evidence === "Application" &&
                Object.entries(candidate.answers).map(([k, v]) => (
                  <div key={k} className="hire-card">
                    <small>{k}</small>
                    <p>{v}</p>
                  </div>
                ))}
              {evidence === "Trip" && (
                <>
                  {assignments.map((a) => (
                    <article key={a.id} className="hire-card">
                      <h3>{a.title}</h3>
                      <p>{a.instructions}</p>
                      <p>
                        {a.status}
                        {a.score !== undefined ? ` · ${a.score}%` : ""}
                      </p>
                      {a.status !== "completed" && (
                        <button
                          onClick={() =>
                            run(
                              () => demoService().complete(jobId, a.id, 82),
                              "Demo response recorded.",
                            )
                          }
                        >
                          Simulate strong response
                        </button>
                      )}
                    </article>
                  ))}
                  {Object.values(ops.assessments)
                    .filter((a) => a.invites[candidate.id])
                    .map((a) => (
                      <article className="hire-card" key={a.id}>
                        <h3>{a.title}</h3>
                        <p>
                          {a.invites[candidate.id].completed
                            ? "Completed"
                            : "Invited"}{" "}
                          · published v{a.version}
                        </p>
                        <a
                          target="_blank"
                          rel="noreferrer"
                          href={`/demo/assessment/${jobId}/${a.id}/${candidate.id}`}
                        >
                          Open invited candidate experience ↗
                        </a>
                      </article>
                    ))}
                  {!assignments.length &&
                    !Object.values(ops.assessments).some(
                      (a) => a.invites[candidate.id],
                    ) && <Empty>No assessment has been assigned.</Empty>}
                </>
              )}
              {evidence === "Evaluation" && (
                <>
                  <p>
                    Confidence: {review.confidence} · {candidate.ratings.length}{" "}
                    assessed criteria
                  </p>
                  <small>
                    {review.evaluatedAt
                      ? `Evaluated ${new Date(review.evaluatedAt).toLocaleString()}`
                      : "Not evaluated yet"}
                  </small>
                  {["Objective", "Subjective"].map((group) => (
                    <div key={group}>
                      <h3>{group}</h3>
                      {project.configuration.draft.roleProfile.evaluationFramework
                        .filter((c) =>
                          group === "Objective"
                            ? ["number_threshold", "must_have"].includes(c.type)
                            : !["number_threshold", "must_have"].includes(
                                c.type,
                              ),
                        )
                        .map((c) => (
                          <p key={c.id}>
                            {c.label} ·{" "}
                            {candidate.ratings.find(
                              (r) => r.criterionId === c.id,
                            )?.rating ?? "Not assessed"}{" "}
                            / 5
                          </p>
                        ))}
                    </div>
                  ))}
                  <button
                    onClick={() =>
                      run(
                        () =>
                          change(
                            jobId,
                            "Re-evaluated demo evidence",
                            (o, p) => {
                              const c = p.candidates[candidate.id],
                                avg = c.ratings.length
                                  ? c.ratings.reduce(
                                      (n, r) => n + r.rating,
                                      0,
                                    ) / c.ratings.length
                                  : 0;
                              o.reviews[c.id] = {
                                ...reviewFor(c, o),
                                confidence: !avg
                                  ? "Insufficient"
                                  : avg >= 4
                                    ? "Strong"
                                    : avg >= 3
                                      ? "Moderate"
                                      : avg >= 2
                                        ? "Emerging"
                                        : "Weak",
                                evaluatedAt: p.clock,
                              };
                            },
                            "Candidates",
                            candidate.id,
                          ),
                        "Demo confidence recalculated from your recorded ratings.",
                      )
                    }
                  >
                    Re-evaluate demo evidence
                  </button>
                </>
              )}
              {evidence === "Communications" && (
                <>
                  {sends.map((d) => (
                    <article className="hire-card" key={d.id}>
                      <h4>{d.name}</h4>
                      <p>{d.subject}</p>
                      <p className="hire-pre">{d.body}</p>
                      <small>{d.status}</small>
                    </article>
                  ))}
                  {!sends.length && <Empty>No communications yet.</Empty>}
                </>
              )}
            </div>
            <div>
              <Tabs
                values={["Feedback", "Timeline", "Notes"]}
                active={feedbackTab}
                onChange={setFeedbackTab}
              />
              {feedbackTab === "Timeline" ? (
                candidate.timeline
                  .slice()
                  .reverse()
                  .map((e) => (
                    <p className="hire-timeline" key={e.id}>
                      <small>{new Date(e.at).toLocaleString()}</small>
                      {e.label}
                    </p>
                  ))
              ) : (
                <>
                  {feedbackTab === "Feedback" && (
                    <>
                      <label>
                        <input
                          type="checkbox"
                          checked={review.verified}
                          onChange={(e) =>
                            run(() =>
                              change(
                                jobId,
                                "Changed verification flag",
                                (o, p) => {
                                  o.reviews[candidate.id] = {
                                    ...reviewFor(p.candidates[candidate.id], o),
                                    verified: e.target.checked,
                                  };
                                },
                                "Candidates",
                                candidate.id,
                              ),
                            )
                          }
                        />{" "}
                        Verified · independent of confidence
                      </label>
                      <div className="hire-tags">
                        {Array.from(
                          new Set([
                            ...CANDIDATE_TAG_SUGGESTIONS,
                            ...candidate.tags,
                            ...project.configuration.draft.fields.mustHaves.value
                              .split(/[,\n]/)
                              .map((v) => v.trim())
                              .filter(Boolean),
                          ]),
                        ).map((tag) => (
                          <button
                            key={tag}
                            aria-pressed={candidate.tags.includes(tag)}
                            className={
                              candidate.tags.includes(tag) ? "is-active" : ""
                            }
                            onClick={() =>
                              run(() =>
                                change(
                                  jobId,
                                  `Toggled feedback tag: ${tag}`,
                                  (_, p) => {
                                    const c = p.candidates[candidate.id];
                                    c.tags = c.tags.includes(tag)
                                      ? c.tags.filter((t) => t !== tag)
                                      : [...c.tags, tag];
                                  },
                                  "Candidates",
                                  candidate.id,
                                ),
                              )
                            }
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                      <div className="hire-actions">
                        <input
                          aria-label="Custom feedback tag"
                          value={customTag}
                          onChange={(e) => setCustomTag(e.target.value)}
                          placeholder="Add a tag"
                        />
                        <button
                          disabled={!customTag.trim()}
                          onClick={() =>
                            run(() => {
                              change(
                                jobId,
                                "Added custom feedback tag",
                                (_, p) => {
                                  const c = p.candidates[candidate.id];
                                  c.tags = [
                                    ...new Set([...c.tags, customTag.trim()]),
                                  ];
                                },
                              );
                              setCustomTag("");
                            })
                          }
                        >
                          Add
                        </button>
                      </div>
                      {project.configuration.draft.roleProfile.evaluationFramework.map(
                        (c) => (
                          <Field
                            key={c.id}
                            label={`${c.label} · 1–5`}
                            value={String(
                              candidate.ratings.find(
                                (r) => r.criterionId === c.id,
                              )?.rating || "",
                            )}
                            options={["1", "2", "3", "4", "5"]}
                            onChange={(v) =>
                              run(() =>
                                change(
                                  jobId,
                                  `Rated ${c.label}: ${v || "cleared"}`,
                                  (_, p) => {
                                    const target = p.candidates[candidate.id];
                                    target.ratings = [
                                      ...target.ratings.filter(
                                        (r) => r.criterionId !== c.id,
                                      ),
                                      ...(v
                                        ? [
                                            {
                                              criterionId: c.id,
                                              rating: Number(v),
                                            },
                                          ]
                                        : []),
                                    ];
                                  },
                                  "Candidates",
                                  candidate.id,
                                ),
                              )
                            }
                          />
                        ),
                      )}
                    </>
                  )}
                  <label className="hire-field">
                    Add a note
                    <textarea
                      aria-label="Candidate feedback note"
                      rows={4}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Capture evidence or @assign a teammate…"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          postNote();
                        }
                      }}
                    />
                  </label>
                  <div className="hire-actions">
                    <button
                      onClick={() =>
                        dictation.recording
                          ? dictation.stopRecording()
                          : void dictation.startRecording()
                      }
                    >
                      {dictation.recording ? "Stop dictation" : "Dictate note"}
                    </button>
                    <button disabled={!note.trim()} onClick={postNote}>
                      Post note
                    </button>
                  </div>
                  {(dictation.micBlocked ||
                    dictation.micFailed ||
                    dictation.noSpeechApi) && (
                    <small>
                      Dictation unavailable; type your note instead.
                    </small>
                  )}
                  <Field
                    label="Assign to / mention"
                    value={assignee}
                    options={TEAM}
                    onChange={setAssignee}
                  />
                  <Field
                    label="Follow-up type"
                    value={taskType}
                    options={["Feedback", "Followup", "Assigned", "Meetings"]}
                    onChange={setTaskType}
                  />
                  <Field
                    label="Follow-up / meeting time"
                    type="datetime-local"
                    value={due}
                    onChange={setDue}
                  />
                  {candidate.notes
                    .slice()
                    .reverse()
                    .map((n) => (
                      <article className="hire-card" key={n.id}>
                        <small>
                          {n.author} · {new Date(n.createdAt).toLocaleString()}
                        </small>
                        <p className="hire-pre">{n.body}</p>
                        {n.mentions.length > 0 && (
                          <small>Assigned to {n.mentions.join(", ")}</small>
                        )}
                      </article>
                    ))}
                </>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
