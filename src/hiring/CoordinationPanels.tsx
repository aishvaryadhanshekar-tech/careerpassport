import { useState } from "react";
import { demoService } from "../demo/service";
import { TEAM, reviewFor } from "./catalog";
import { change, moveCandidate } from "./service";
import { Field, Tabs, Empty, type PanelProps } from "./shared";
import type { Task } from "./types";

export function TeamPanel({ jobId, ops, run }: PanelProps) {
  const [person, setPerson] = useState(""),
    [role, setRole] = useState("Sourcing"),
    [transfer, setTransfer] = useState("");
  return (
    <>
      <p className="hire-intro">
        Demo admin access · no sign-in required.
      </p>
      <section className="hire-brief">
        <small>JOB OWNER · ADMIN</small>
        <h2>{ops.owner}</h2>
      </section>
      <div className="hire-form-grid">
        <Field
          label="Add team member"
          value={person}
          options={TEAM.filter((n) => n !== ops.owner && !ops.members[n])}
          onChange={setPerson}
        />
        <Field
          label="Collaborator role"
          value={role}
          options={["Sourcing", "Screening", "HM rep"]}
          onChange={setRole}
        />
      </div>
      <button
        disabled={!person}
        onClick={() =>
          run(() => {
            change(
              jobId,
              `Added ${person} as ${role}`,
              (o) => {
                if (person === o.owner)
                  throw new Error("The owner already has admin access.");
                o.members[person] = role;
              },
              "Team",
            );
            setPerson("");
          }, "Collaborator added.")
        }
      >
        Add collaborator
      </button>
      {Object.entries(ops.members).map(([name, value]) => (
        <div className="hire-card" key={name}>
          <h3>{name}</h3>
          <Field
            label={`Role for ${name}`}
            value={value}
            options={["Sourcing", "Screening", "HM rep"]}
            onChange={(v) =>
              run(
                () =>
                  change(
                    jobId,
                    `Changed ${name} role to ${v}`,
                    (o) => {
                      o.members[name] = v;
                    },
                    "Team",
                  ),
                "Team role updated.",
              )
            }
          />
          <button
            onClick={() => {
              if (confirm(`Remove ${name} from this job?`))
                run(
                  () =>
                    change(
                      jobId,
                      `Removed collaborator ${name}`,
                      (o) => {
                        delete o.members[name];
                      },
                      "Team",
                    ),
                  "Collaborator removed; history is preserved.",
                );
            }}
          >
            Remove collaborator
          </button>
        </div>
      ))}
      <section className="hire-card">
        <h3>Transfer ownership</h3>
        <Field
          label="New owner"
          value={transfer}
          options={Object.keys(ops.members)}
          onChange={setTransfer}
        />
        <small>
          The incoming owner leaves the collaborator list. The former owner
          remains an HM representative in this demo.
        </small>
        <button
          disabled={!transfer}
          onClick={() => {
            if (confirm(`Transfer this job to ${transfer}?`))
              run(() => {
                change(
                  jobId,
                  `Transferred ownership from ${ops.owner} to ${transfer}`,
                  (o) => {
                    if (!o.members[transfer])
                      throw new Error("Select an existing collaborator.");
                    o.members[o.owner] = "HM rep";
                    delete o.members[transfer];
                    o.owner = transfer;
                  },
                  "Team",
                );
                setTransfer("");
              }, "Ownership transferred.");
          }}
        >
          Transfer ownership
        </button>
      </section>
      <h3>External partner access</h3>
      <button
        onClick={() =>
          run(
            () =>
              change(
                jobId,
                "Received demo partner access request",
                (o) => {
                  const id = crypto.randomUUID();
                  o.partners[id] = {
                    name: "Northstar Talent",
                    email: "hello@northstar.demo",
                    about:
                      "Technology recruitment · Bengaluru · northstar.demo · Requester: Asha Rao",
                    status: "Pending",
                  };
                },
                "Team",
              ),
            "Sample partner request received.",
          )
        }
      >
        Simulate partner request
      </button>
      {Object.entries(ops.partners).map(([id, p]) => (
        <article className="hire-card" key={id}>
          <h3>
            {p.name} · {p.status}
          </h3>
          <p>{p.email}</p>
          <p>{p.about}</p>
          <div className="hire-actions">
            {(p.status === "Pending"
              ? (["Approved", "Declined"] as const)
              : p.status === "Approved"
                ? (["Revoked"] as const)
                : []
            ).map((status) => (
              <button
                key={status}
                onClick={() =>
                  run(
                    () =>
                      change(
                        jobId,
                        `${status} partner access: ${p.name}`,
                        (o) => {
                          o.partners[id].status = status;
                        },
                        "Team",
                      ),
                    `Partner access ${status.toLowerCase()}.`,
                  )
                }
              >
                {status === "Approved"
                  ? "Approve"
                  : status === "Declined"
                    ? "Decline"
                    : "Revoke access"}
              </button>
            ))}
          </div>
        </article>
      ))}
    </>
  );
}

export function TasksPanel({
  jobId,
  ops,
  project,
  run,
  onCandidate,
}: PanelProps & { onCandidate: (id: string) => void }) {
  const [mode, setMode] = useState("On you"),
    [tab, setTab] = useState("Outreach"),
    [showDone, setShowDone] = useState(false);
  const derived: Task[] = Object.values(project.candidates).flatMap((c) => {
    const status = reviewFor(c, ops).status;
    const items: Task[] = [];
    if (/Awaiting.*feedback/i.test(status))
      items.push({
        id: `feedback:${c.id}`,
        candidateId: c.id,
        title: `Record interview feedback for ${c.name}`,
        type: "Feedback",
        assignedTo: "Demo Recruiter",
        createdBy: "System",
        due: project.clock,
        done: false,
      });
    if (/Pending client/i.test(status))
      items.push({
        id: `client:${c.id}`,
        candidateId: c.id,
        title: `Follow up with client on ${c.name}`,
        type: "Client",
        assignedTo: "Demo Recruiter",
        createdBy: "System",
        due: project.clock,
        done: false,
      });
    return items;
  });
  Object.values(project.deliveries)
    .filter((d) => d.status === "scheduled")
    .forEach((d) =>
      derived.push({
        id: `outreach:${d.id}`,
        candidateId: d.candidateId,
        title: `${d.name} → ${d.recipient}`,
        type: "Outreach",
        assignedTo: "Demo Recruiter",
        createdBy: "System",
        due: d.dueAt,
        done: false,
      }),
    );
  const all = Object.values(
    Object.fromEntries(
      [...derived, ...Object.values(ops.tasks)].map((t) => [t.id, t]),
    ),
  );
  const scoped = all.filter(
    (t) =>
      (mode === "On you"
        ? t.assignedTo === "Demo Recruiter"
        : t.createdBy === "Demo Recruiter") &&
      (showDone || !t.done),
  );
  const tabs =
    mode === "By me"
      ? ["Assigned", "Meetings"]
      : [
          "Outreach",
          "Followup",
          "Feedback",
          "Client",
          "Assigned",
          "Meetings",
          ...(Object.keys(ops.partners).length ? ["Sub-vendors"] : []),
        ];
  const requests = Object.entries(ops.partners).filter(
    ([, p]) => p.status === "Pending",
  );
  return (
    <>
      <div className="hire-section-head">
        <h2>{scoped.length + requests.length} actions</h2>
        <label>
          <input
            type="checkbox"
            checked={showDone}
            onChange={(e) => setShowDone(e.target.checked)}
          />{" "}
          Include completed
        </label>
      </div>
      <Tabs
        values={["On you", "By me"]}
        active={mode}
        onChange={(m) => {
          setMode(m);
          setTab(m === "By me" ? "Assigned" : "Outreach");
        }}
      />
      {mode === "On you" &&
        requests.map(([id, p]) => (
          <article className="hire-callout" key={id}>
            <strong>Partner interest request · {p.name}</strong>
            <p>{p.about}</p>
            <div className="hire-actions">
              {(["Approved", "Declined"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() =>
                    run(() =>
                      change(
                        jobId,
                        `${status} partner access: ${p.name}`,
                        (o) => {
                          o.partners[id].status = status;
                        },
                        "Team",
                      ),
                    )
                  }
                >
                  {status === "Approved" ? "Approve" : "Decline"}
                </button>
              ))}
            </div>
          </article>
        ))}
      <Tabs values={tabs} active={tab} onChange={setTab} />
      {tab === "Sub-vendors" ? (
        Object.entries(ops.partners)
          .filter(([, p]) => p.status === "Approved")
          .map(([id, p]) => (
            <article className="hire-card" key={id}>
              <h3>{p.name}</h3>
              <p>{p.email}</p>
              <button
                onClick={() =>
                  run(() =>
                    change(
                      jobId,
                      `Revoked partner access: ${p.name}`,
                      (o) => {
                        o.partners[id].status = "Revoked";
                      },
                      "Team",
                    ),
                  )
                }
              >
                Revoke access
              </button>
            </article>
          ))
      ) : (
        <>
          {scoped
            .filter(
              (t) =>
                t.type === tab ||
                (mode === "By me" &&
                  tab === "Assigned" &&
                  t.type !== "Meetings"),
            )
            .map((t) => (
              <article className="hire-card" key={t.id}>
                <small>
                  {t.done
                    ? "Completed"
                    : t.due < project.clock
                      ? "Overdue"
                      : "Upcoming"}{" "}
                  · {new Date(t.due).toLocaleString()}
                </small>
                <h3>{t.title}</h3>
                <p>
                  Assigned to {t.assignedTo} · By {t.createdBy}
                </p>
                <div className="hire-actions">
                  <button
                    disabled={!project.candidates[t.candidateId]}
                    onClick={() => onCandidate(t.candidateId)}
                  >
                    Open candidate
                  </button>
                  <button
                    onClick={() =>
                      run(() =>
                        change(
                          jobId,
                          `${t.done ? "Reopened" : "Completed"} task: ${t.title}`,
                          (o) => {
                            o.tasks[t.id] = { ...t, done: !t.done };
                          },
                          "Candidates",
                          t.candidateId,
                        ),
                      )
                    }
                  >
                    {t.done ? "Reopen" : "Mark done"}
                  </button>
                  <button
                    onClick={() =>
                      run(() =>
                        change(
                          jobId,
                          `Rescheduled task: ${t.title}`,
                          (o) => {
                            o.tasks[t.id] = { ...t, due: t.due + 86400000 };
                          },
                          "Candidates",
                          t.candidateId,
                        ),
                      )
                    }
                  >
                    Follow up tomorrow
                  </button>
                </div>
              </article>
            ))}
          {!scoped.some(
            (t) =>
              t.type === tab ||
              (mode === "By me" && tab === "Assigned" && t.type !== "Meetings"),
          ) && (
            <Empty>
              Nothing waiting here. Assign a note from candidate review to add
              work to this queue.
            </Empty>
          )}
        </>
      )}
    </>
  );
}

export function ClientPanel({ jobId, project, ops, run }: PanelProps) {
  const [active, setActive] = useState(
      Object.keys(project.candidates)[0] || "",
    ),
    [text, setText] = useState(""),
    [attachment, setAttachment] = useState(""),
    [when, setWhen] = useState("");
  const candidates = Object.values(project.candidates).sort(
    (a, b) =>
      (ops.threads[b.id]?.messages.at(-1)?.at || 0) -
      (ops.threads[a.id]?.messages.at(-1)?.at || 0),
  );
  const candidate = project.candidates[active],
    thread = ops.threads[active];
  function send(reply = false) {
    run(
      () => {
        if (!candidate || (!reply && !text.trim() && !attachment))
          throw new Error("Add a message or attachment.");
        change(
          jobId,
          `${reply ? "Demo client replied" : "Sent client message"} about ${candidate.name}`,
          (o, p) => {
            o.threads[active] ??= { status: "Feedback pending", messages: [] };
            o.threads[active].messages.push({
              id: crypto.randomUUID(),
              at: p.clock,
              sender: reply ? "HM · David" : "You",
              text: reply
                ? `Thanks for sharing ${candidate.name}. Please arrange a 30-minute conversation and send the assessment summary.`
                : text.trim(),
              attachment: reply ? undefined : attachment,
            });
          },
          "Candidates",
          active,
        );
        setText("");
        setAttachment("");
      },
      reply
        ? "Simulated client reply added."
        : "Message stored in this candidate’s thread.",
    );
  }
  return (
    <>
      <p className="hire-intro">
        Client-only threads · candidates cannot see these messages.
      </p>
      <div className="hire-client-layout">
        <nav>
          {candidates.map((c) => (
            <button
              className={active === c.id ? "is-active" : ""}
              key={c.id}
              onClick={() => {
                setActive(c.id);
                setText("");
                setAttachment("");
              }}
            >
              <strong>{c.name}</strong>
              <small>
                {ops.threads[c.id]?.status || "No client conversation"}
              </small>
            </button>
          ))}
        </nav>
        <section>
          {candidate ? (
            <>
              <h3>Communication: {candidate.name}</h3>
              <small>CLIENT: {ops.setup.client || "Acme Corp"} · HM</small>
              <div className="hire-chat">
                {thread?.messages.map((m) => (
                  <article
                    className={m.sender === "You" ? "from-you" : ""}
                    key={m.id}
                  >
                    <small>
                      {m.sender} · {new Date(m.at).toLocaleString()}
                    </small>
                    <p>{m.text}</p>
                    {m.attachment && (
                      <small>Attachment: {m.attachment}</small>
                    )}
                  </article>
                ))}
                {!thread?.messages.length && (
                  <Empty>Start this candidate’s client conversation.</Empty>
                )}
              </div>
              <div className="hire-actions">
                <button
                  onClick={() =>
                    run(() => {
                      moveCandidate(
                        jobId,
                        active,
                        "archive",
                        "Rejected by client",
                      );
                      change(
                        jobId,
                        "Client decision: rejected",
                        (o) => {
                          o.threads[active] ??= { status: "", messages: [] };
                          o.threads[active].status = "Rejected";
                        },
                        "Candidates",
                        active,
                      );
                    }, "Candidate archived: rejected by client.")
                  }
                >
                  Reject
                </button>
                <button
                  onClick={() =>
                    run(() => {
                      moveCandidate(jobId, active, "archive", "On hold");
                      change(
                        jobId,
                        "Client decision: on hold",
                        (o) => {
                          o.threads[active] ??= { status: "", messages: [] };
                          o.threads[active].status = "On hold";
                        },
                        "Candidates",
                        active,
                      );
                    }, "Candidate put on hold.")
                  }
                >
                  On hold
                </button>
              </div>
              <Field
                label="Schedule interview"
                value={when}
                type="datetime-local"
                onChange={setWhen}
              />
              <button
                disabled={!when}
                onClick={() =>
                  run(() => {
                    demoService().schedule(
                      jobId,
                      active,
                      new Date(when).getTime(),
                    );
                    moveCandidate(
                      jobId,
                      active,
                      "interviewing",
                      "Interview scheduled",
                    );
                    change(
                      jobId,
                      "Client interview scheduled",
                      (o, p) => {
                        o.threads[active] ??= { status: "", messages: [] };
                        o.threads[active].status = "Upcoming interview";
                        const id = crypto.randomUUID();
                        o.tasks[id] = {
                          id,
                          candidateId: active,
                          title: `Interview: ${candidate.name}`,
                          type: "Meetings",
                          assignedTo: "Demo Recruiter",
                          createdBy: "Demo Recruiter",
                          due: new Date(when).getTime(),
                          done: false,
                        };
                        o.threads[active].messages.push({
                          id,
                          at: p.clock,
                          sender: "You",
                          text: `Interview scheduled: ${new Date(when).toLocaleString()}`,
                        });
                      },
                      "Candidates",
                      active,
                    );
                  }, "Interview scheduled and meeting task created.")
                }
              >
                Confirm schedule
              </button>
              <Field
                label="Message to client"
                type="textarea"
                value={text}
                onChange={setText}
              />
              <label className="hire-field">
                Attach file (demo metadata)
                <input
                  type="file"
                  onChange={(e) =>
                    setAttachment(e.target.files?.[0]?.name || "")
                  }
                />
              </label>
              {attachment && <small>{attachment}</small>}
              <div className="hire-actions">
                <button
                  disabled={!text.trim() && !attachment}
                  className="funnel-primary"
                  onClick={() => send()}
                >
                  Send
                </button>
                <button onClick={() => send(true)}>
                  Simulate client reply
                </button>
              </div>
            </>
          ) : (
            <Empty>
              No candidates yet. Load a demo scenario or submit an application.
            </Empty>
          )}
        </section>
      </div>
    </>
  );
}

export function ActivityPanel({ project, ops }: PanelProps) {
  const [scope, setScope] = useState("This job"),
    [category, setCategory] = useState("All"),
    [range, setRange] = useState("30"),
    [actor, setActor] = useState("All"),
    [sort, setSort] = useState("Newest"),
    [page, setPage] = useState(0),
    [from, setFrom] = useState(""),
    [to, setTo] = useState("");
  const projects = scope === "Organization" ? demoService().list() : [project];
  const events = projects.flatMap((p) =>
    [
      ...(p.operations?.activity || []),
      ...Object.values(p.candidates).flatMap((c) =>
        c.timeline.map((e) => ({
          ...e,
          candidateId: c.id,
          actor: e.actor === "team" ? "Hiring team" : c.name,
          category: "Candidates",
        })),
      ),
    ].map((e) => ({
      ...e,
      job: p.configuration.draft.fields.designation.value,
    })),
  );
  const filtered = events
    .filter(
      (e) =>
        (category === "All" || e.category === category) &&
        (actor === "All" || actor === e.actor) &&
        (range === "custom"
          ? (!from || e.at >= new Date(from).getTime()) &&
            (!to || e.at < new Date(to).getTime() + 86400000)
          : e.at >= project.clock - Number(range) * 86400000),
    )
    .sort((a, b) => (sort === "Newest" ? b.at - a.at : a.at - b.at));
  return (
    <>
      <p className="hire-intro">
        Activity is recorded automatically and cannot be edited.
      </p>
      <div className="hire-actions">
        <label className="hire-filter">
          <span>Scope</span>
          <select
            aria-label="Activity scope"
            value={scope}
            onChange={(e) => {
              setScope(e.target.value);
              setPage(0);
            }}
          >
            {["This job", "Organization"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="hire-filter">
          <span>Category</span>
          <select
            aria-label="Activity category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(0);
            }}
          >
            {["All", "Candidates", "Jobs", "Team", "Settings"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="hire-filter">
          <span>Date range</span>
          <select
            aria-label="Activity range"
            value={range}
            onChange={(e) => {
              setRange(e.target.value);
              setPage(0);
            }}
          >
            {[
              ["1", "Last 24 hours"],
              ["7", "Last 7 days"],
              ["30", "Last 30 days"],
              ["90", "Last 90 days"],
              ["custom", "Custom dates"],
            ].map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="hire-filter">
          <span>Actor</span>
          <select
            aria-label="Activity actor"
            value={actor}
            onChange={(e) => {
              setActor(e.target.value);
              setPage(0);
            }}
          >
            <option>All</option>
            {Array.from(new Set(events.map((e) => e.actor))).map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </label>
        <label className="hire-filter">
          <span>Sort</span>
          <select
            aria-label="Activity order"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option>Newest</option>
            <option>Oldest</option>
          </select>
        </label>
      </div>
      {range === "custom" && (
        <div className="hire-form-grid">
          <Field label="From" type="date" value={from} onChange={setFrom} />
          <Field label="To" type="date" value={to} onChange={setTo} />
        </div>
      )}
      <p>
        {filtered.length} events · {ops.activity.length} job-tool changes
      </p>
      {filtered.slice(page * 25, page * 25 + 25).map((e) => (
        <article className="hire-timeline" key={e.id}>
          <small>
            {new Date(e.at).toLocaleString()} · {e.category} · {e.actor}
            {scope === "Organization" ? ` · ${e.job}` : ""}
          </small>
          <p>{e.label}</p>
        </article>
      ))}
      {!filtered.length && <Empty>No activity in this period.</Empty>}
      <div className="hire-actions">
        <button disabled={!page} onClick={() => setPage((p) => p - 1)}>
          Previous
        </button>
        <span>Page {page + 1}</span>
        <button
          disabled={(page + 1) * 25 >= filtered.length}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </>
  );
}
