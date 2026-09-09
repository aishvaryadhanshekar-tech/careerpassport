import { useState } from "react";
import { demoService, toBoard } from "../demo/service";
import { APPROVED_WA, TOKENS, CALL_TOKENS } from "./catalog";
import { change, operations, renderMessage, sendOutreach } from "./service";
import type { Approval, MessageTemplate } from "./types";
import { Field, Tabs, Empty, type PanelProps } from "./shared";

export function MessagesPanel({ jobId, project, ops, run }: PanelProps) {
  const [tab, setTab] = useState("Email"),
    [query, setQuery] = useState(""),
    [editing, setEditing] = useState<MessageTemplate | null>(null),
    [request, setRequest] = useState<Approval | null>(null);
  const [previewId, setPreviewId] = useState(
    Object.keys(project.candidates)[0] || "",
  );
  const templates = Object.values(ops.templates).filter(
    (t) =>
      t.channel === tab && t.name.toLowerCase().includes(query.toLowerCase()),
  );
  const approved = [
    ...APPROVED_WA,
    ...Object.values(ops.approvals)
      .filter((a) => a.status === "Approved")
      .map((a) => ({
        id: a.id,
        body: a.body,
        slots: Math.max(
          0,
          ...Array.from(a.body.matchAll(/\{\{(\d+)\}\}/g), (m) => Number(m[1])),
        ),
      })),
  ];
  const stageOptions = [
    "All",
    "prospects",
    ...toBoard(project).stages.map((s) => s.id),
  ];
  const orgTemplates = demoService()
    .list()
    .filter((p) => p.id !== jobId)
    .flatMap((p) =>
      Object.values(operations(p).templates).filter(
        (t) => t.scope === "Organization",
      ),
    );
  function create() {
    setEditing({
      id: crypto.randomUUID(),
      name: `New ${tab === "AI call" ? "calling agent" : "template"}`,
      channel: tab as MessageTemplate["channel"],
      stage: tab === "AI call" ? "applied" : "All",
      scope: "Job",
      tone: "Warm",
      subject: "",
      body: "",
      default: false,
      slots: [],
    });
  }
  function patch(values: Partial<MessageTemplate>) {
    setEditing((v) => (v ? { ...v, ...values } : v));
  }
  function save() {
    if (!editing) return;
    run(() => {
      if (!editing.name.trim()) throw new Error("Give the template a name.");
      if (editing.channel === "AI call" && editing.stage === "All")
        throw new Error("Calling agents must belong to a specific stage.");
      if (editing.channel === "WhatsApp") {
        const a = approved.find((t) => t.id === editing.approvedId);
        if (!a) throw new Error("Choose a platform-approved template.");
        if (
          Array.from({ length: a.slots }, (_, i) => editing.slots[i]).some(
            (v) => !v?.trim(),
          )
        )
          throw new Error("Fill every numbered WhatsApp variable.");
      } else if (!editing.body.trim())
        throw new Error("Add message content or an agent script.");
      change(
        jobId,
        `Saved ${editing.channel} template: ${editing.name}`,
        (o) => {
          if (editing.default)
            Object.values(o.templates)
              .filter(
                (t) =>
                  t.channel === editing.channel &&
                  (t.channel !== "AI call" || t.stage === editing.stage),
              )
              .forEach((t) => {
                t.default = false;
              });
          o.templates[editing.id] = editing;
        },
      );
      setEditing(null);
    }, "Template saved.");
  }
  let preview = { subject: "", body: "" };
  if (editing) {
    try {
      const c = project.candidates[previewId];
      preview = renderMessage(
        editing,
        project,
        c?.name || "Alex Morgan",
        c?.location,
      );
    } catch (e) {
      preview.body = (e as Error).message;
    }
  }
  return (
    <>
      <p className="hire-intro">
        Demo outbox only. WhatsApp requires approved templates; calls require
        a provisioned stage agent.
      </p>
      <Tabs
        values={[
          "Email",
          "WhatsApp",
          "AI call",
          "Approvals",
          "Organization library",
        ]}
        active={tab}
        onChange={(v) => {
          setTab(v);
          setEditing(null);
        }}
      />
      {["Email", "WhatsApp", "AI call"].includes(tab) && (
        <>
          {/* TRP-04: switch to a focused editor view instead of appending the form after the
              (possibly long) library list, where clicking Edit/Duplicate/Create could look like
              nothing happened. */}
          {!editing && (
          <div className="hire-actions">
            <input
              aria-label="Search outreach templates"
              placeholder="Search templates…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="funnel-primary" onClick={create}>
              ＋ {tab === "AI call" ? "Create agent" : "Create template"}
            </button>
          </div>
          )}
          {!editing && templates.map((t) => (
            <article className="hire-card" key={t.id}>
              <div className="hire-section-head">
                <h3>{t.name}</h3>
                <small>
                  {t.default ? "Default · " : ""}
                  {t.scope} · {t.stage}
                </small>
              </div>
              <p>
                {t.channel === "AI call"
                  ? t.provisioned
                    ? "Provisioned · demo calling enabled"
                    : "Not provisioned"
                  : t.subject || t.approvedId}
              </p>
              <div className="hire-actions">
                <button onClick={() => setEditing(structuredClone(t))}>
                  Edit
                </button>
                <button
                  onClick={() =>
                    setEditing({
                      ...structuredClone(t),
                      id: crypto.randomUUID(),
                      name: `${t.name} copy`,
                      default: false,
                      provisioned: false,
                    })
                  }
                >
                  Duplicate
                </button>
                <button
                  onClick={() =>
                    run(
                      () =>
                        change(
                          jobId,
                          `Set default ${t.channel} template`,
                          (o) => {
                            Object.values(o.templates)
                              .filter(
                                (x) =>
                                  x.channel === t.channel &&
                                  (x.channel !== "AI call" ||
                                    x.stage === t.stage),
                              )
                              .forEach((x) => {
                                x.default = x.id === t.id;
                              });
                          },
                        ),
                      "Default updated.",
                    )
                  }
                >
                  Set default
                </button>
                {t.channel === "AI call" && (
                  <button
                    onClick={() =>
                      run(
                        () =>
                          change(
                            jobId,
                            "Updated demo agent provisioning",
                            (o) => {
                              o.templates[t.id].provisioned = !t.provisioned;
                            },
                          ),
                        t.provisioned
                          ? "Agent unprovisioned."
                          : "Demo stage agent provisioned.",
                      )
                    }
                  >
                    {t.provisioned ? "Unprovision" : "Provision demo agent"}
                  </button>
                )}
                <button
                  onClick={() => {
                    if (
                      confirm(
                        `Delete template “${t.name}”? Existing delivery history is preserved.`,
                      )
                    )
                      run(
                        () =>
                          change(jobId, `Deleted template ${t.name}`, (o) => {
                            delete o.templates[t.id];
                          }),
                        "Template deleted. Existing messages remain in history.",
                      );
                  }}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
          {!editing && !templates.length && (
            <Empty>
              No {tab} templates yet. Create one to enable outreach from
              candidate and prospect reviews.
            </Empty>
          )}
          {editing && (
            <section className="hire-card">
              <button
                type="button"
                className="hire-back-link"
                onClick={() => setEditing(null)}
              >
                ← Back to templates
              </button>
              <h3>
                {editing.channel === "AI call"
                  ? "Stage calling agent"
                  : "Template editor"}
              </h3>
              <div className="hire-form-grid">
                <Field
                  label="Template name"
                  value={editing.name}
                  onChange={(name) => patch({ name })}
                />
                <Field
                  label="Stage scope"
                  value={editing.stage}
                  options={stageOptions}
                  onChange={(stage) => patch({ stage, provisioned: false })}
                />
                <Field
                  label="Visibility scope"
                  value={editing.scope}
                  options={["Job", "Organization"]}
                  onChange={(scope) =>
                    patch({ scope: scope as MessageTemplate["scope"] })
                  }
                />
                <Field
                  label="Tone"
                  value={editing.tone}
                  options={["Warm", "Direct", "Editorial"]}
                  onChange={(tone) => patch({ tone })}
                />
              </div>
              <label>
                <input
                  type="checkbox"
                  checked={editing.default}
                  onChange={(e) => patch({ default: e.target.checked })}
                />{" "}
                Use as default
              </label>
              {editing.channel === "WhatsApp" ? (
                <>
                  <Field
                    label="Platform-approved template"
                    value={editing.approvedId || ""}
                    options={approved.map((a) => a.id)}
                    onChange={(approvedId) => patch({ approvedId, slots: [] })}
                  />
                  <pre className="hire-template-preview">
                    {approved.find((a) => a.id === editing.approvedId)?.body ||
                      "Choose an approved body. Approved text is read-only."}
                  </pre>
                  {Array.from(
                    {
                      length:
                        approved.find((a) => a.id === editing.approvedId)
                          ?.slots || 0,
                    },
                    (_, i) => (
                      <Field
                        key={i}
                        label={`Variable {{${i + 1}}}`}
                        value={editing.slots[i] || ""}
                        onChange={(value) => {
                          const slots = [...editing.slots];
                          slots[i] = value;
                          patch({ slots });
                        }}
                      />
                    ),
                  )}
                </>
              ) : (
                <>
                  {editing.channel === "Email" && (
                    <Field
                      label="Subject"
                      value={editing.subject}
                      onChange={(subject) => patch({ subject })}
                    />
                  )}
                  <Field
                    label={
                      editing.channel === "AI call"
                        ? "Agent script · duration can be specified in the script"
                        : "Message body"
                    }
                    type="textarea"
                    value={editing.body}
                    onChange={(body) => patch({ body })}
                  />
                  <button
                    onClick={() =>
                      patch({
                        body:
                          editing.channel === "AI call"
                            ? "You are calling {{candidate_name}} about {{job_title}} at {{company_name}}. Introduce yourself, ask if now is a good time, explain the role and confirm interest. Keep the call under three minutes. Today is {{current_day}}, {{current_date}}."
                            : `${editing.tone === "Direct" ? "Hello" : "Hi"} {{first_name}},\n\nWe’re hiring a {{job_title}} at {{company_name}} in {{location}}. Your experience caught our attention. Would you be open to a conversation?\n\nBest,\n{{sender_name}}`,
                        subject: "An opportunity: {{job_title}}",
                      })
                    }
                  >
                    ✦ Draft demo content
                  </button>
                </>
              )}
              <details>
                <summary>
                  Insert variables ·{" "}
                  {editing.channel === "AI call"
                    ? "6 calling tokens"
                    : "9 outreach tokens"}
                </summary>
                <div className="hire-tags">
                  {(editing.channel === "AI call" ? CALL_TOKENS : TOKENS).map(
                    (token) => (
                      <button
                        key={token}
                        onClick={() =>
                          editing.channel === "WhatsApp"
                            ? patch({
                                slots: [...editing.slots, `{{${token}}}`],
                              })
                            : patch({ body: editing.body + ` {{${token}}}` })
                        }
                      >{`{{${token}}}`}</button>
                    ),
                  )}
                </div>
                <p className="hire-muted">
                  For WhatsApp, type named tokens inside the numbered variable
                  fields.
                </p>
              </details>
              <p className="hire-muted">
                Detected variables:{" "}
                {Array.from(
                  new Set(
                    (
                      editing.body +
                      editing.subject +
                      editing.slots.join(" ")
                    ).match(/\{\{.*?\}\}/g) || [],
                  ),
                ).join(", ") || "None"}
              </p>
              <label className="hire-field">
                Preview candidate
                <select
                  aria-label="Preview candidate"
                  value={previewId}
                  onChange={(e) => setPreviewId(e.target.value)}
                >
                  <option value="">Sample Alex Morgan</option>
                  {Object.values(project.candidates).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="hire-template-preview">
                <strong>{preview.subject}</strong>
                <p>{preview.body}</p>
              </div>
              <div className="hire-actions">
                <button className="funnel-primary" onClick={save}>
                  Save template
                </button>
                <button onClick={() => setEditing(null)}>Cancel</button>
                <button
                  disabled={!previewId}
                  onClick={() =>
                    run(
                      () => sendOutreach(jobId, [previewId], editing),
                      "Demo send recorded in outbox.",
                    )
                  }
                >
                  Send demo preview
                </button>
              </div>
            </section>
          )}
        </>
      )}
      {tab === "Approvals" && (
        <>
          <p>
            Demo approval only; templates are not registered with WhatsApp.
          </p>
          <button
            onClick={() =>
              setRequest({
                id: crypto.randomUUID(),
                name: "",
                purpose: "",
                language: "English",
                category: "UTILITY",
                header: "",
                body: "",
                samples: "",
                buttons: "",
                status: "Pending",
              })
            }
          >
            Request new WhatsApp template
          </button>
          {request && (
            <section className="hire-card">
              <div className="hire-form-grid">
                {(
                  [
                    "name",
                    "purpose",
                    "language",
                    "category",
                    "header",
                    "body",
                    "samples",
                    "buttons",
                  ] as const
                ).map((k) => (
                  <Field
                    key={k}
                    label={
                      k === "header"
                        ? "Header · NONE / TEXT / IMAGE / VIDEO / DOCUMENT + content"
                        : k === "buttons"
                          ? "Buttons · one per line: TYPE | label | target | sample"
                          : k
                    }
                    value={request[k]}
                    type={
                      ["body", "samples", "buttons"].includes(k)
                        ? "textarea"
                        : "text"
                    }
                    options={
                      k === "category"
                        ? ["UTILITY", "MARKETING", "AUTHENTICATION"]
                        : undefined
                    }
                    onChange={(v) => setRequest({ ...request, [k]: v })}
                  />
                ))}
              </div>
              <small>
                Button types: WEBSITE, QUICK_REPLY, CALL_NUMBER, COPY_CODE,
                WA_CALL, OPEN_FORM. Use numbered variables such as {"{{1}}"} and
                provide sample values.
              </small>
              <div className="hire-actions">
                <button
                  onClick={() =>
                    run(() => {
                      if (!request.name.trim() || !request.body.trim())
                        throw new Error("Template name and body are required.");
                      if (
                        /\{\{\d+\}\}/.test(request.body) &&
                        !request.samples.trim()
                      )
                        throw new Error(
                          "Add sample values for numbered variables.",
                        );
                      change(
                        jobId,
                        "Requested WhatsApp template approval",
                        (o) => {
                          o.approvals[request.id] = request;
                        },
                      );
                      setRequest(null);
                    }, "Request pending demo approval.")
                  }
                >
                  Submit approval request
                </button>
                <button onClick={() => setRequest(null)}>Cancel</button>
              </div>
            </section>
          )}
          {Object.values(ops.approvals).map((a) => (
            <article className="hire-card" key={a.id}>
              <h3>
                {a.name} · {a.status}
              </h3>
              <p>{a.body}</p>
              {a.status === "Pending" && (
                <div className="hire-actions">
                  {(["Approved", "Declined"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() =>
                        run(
                          () =>
                            change(
                              jobId,
                              `Demo WhatsApp request ${status.toLowerCase()}`,
                              (o) => {
                                o.approvals[a.id].status = status;
                              },
                            ),
                          `Template ${status.toLowerCase()}.`,
                        )
                      }
                    >
                      Simulate {status.toLowerCase()}
                    </button>
                  ))}
                </div>
              )}
            </article>
          ))}
        </>
      )}
      {tab === "Organization library" && (
        <>
          {orgTemplates.map((t) => (
            <article className="hire-card" key={t.id}>
              <h3>{t.name}</h3>
              <p>
                {t.channel} · {t.stage}
              </p>
              <button
                onClick={() =>
                  run(
                    () =>
                      change(
                        jobId,
                        "Copied organization template into job",
                        (o) => {
                          const id = crypto.randomUUID();
                          o.templates[id] = {
                            ...t,
                            id,
                            scope: "Job",
                            default: false,
                            provisioned: false,
                          };
                        },
                      ),
                    "Copied into this job.",
                  )
                }
              >
                Use in this job
              </button>
            </article>
          ))}
          {!orgTemplates.length && (
            <Empty>
              Templates shared with the organization in other demo jobs will
              appear here.
            </Empty>
          )}
        </>
      )}
    </>
  );
}
