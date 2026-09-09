import { useState } from "react";
import { DemoApplication } from "../demo/DemoApplication";
import {
  attachPeople,
  change,
  downloadCSV,
  newProspect,
  parseCSV,
  pool,
  promote,
  removePerson,
  savePerson,
  sendOutreach,
} from "./service";
import { Field, Tabs, Empty, type PanelProps } from "./shared";
import { DataFilters, matches, type Condition } from "./DataFilters";
import { TEAM } from "./catalog";
import type { Prospect } from "./types";

const importFields = [
  "name",
  "email",
  "phone",
  "headline",
  "company",
  "location",
  "experience",
  "skills",
] as const;
const aliases: Record<string, string[]> = {
  name: ["name", "full name", "candidate"],
  headline: ["headline", "role", "title"],
  experience: ["experience", "years", "yoe"],
};
export function ProspectsPanel({ jobId, ops, project, run }: PanelProps) {
  const [tab, setTab] = useState("My leads"),
    [query, setQuery] = useState(""),
    [source, setSource] = useState(""),
    [intent, setIntent] = useState("");
  const [selected, setSelected] = useState<string[]>([]),
    [active, setActive] = useState<string | null>(null),
    [drawer, setDrawer] = useState("Candidate property");
  const [person, setPerson] = useState<Prospect | null>(null),
    [mode, setMode] = useState("Single prospect");
  const [csv, setCSV] = useState(""),
    [mapping, setMapping] = useState<Record<string, string>>({}),
    [rows, setRows] = useState<string[][]>([]),
    [importPreview, setImportPreview] = useState<Prospect[]>([]);
  const [quick, setQuick] = useState<Record<string, string>>({});
  const [conditions, setConditions] = useState<Condition[]>([]),
    [template, setTemplate] = useState(""),
    [outcomeNote, setOutcomeNote] = useState("");
  const [columns, setColumns] = useState([
    "headline",
    "source",
    "experience",
    "outcome",
    "location",
    "skills",
  ]);
  const all =
    tab === "Private people"
      ? Object.values(pool().people)
      : ops.prospectIds.map((id) => ops.prospects[id]).filter(Boolean);
  const filtered = all.filter(
    (p) =>
      (tab === "Private people" ||
        (tab === "My leads"
          ? p.owner === "Demo Recruiter"
          : p.owner !== "Demo Recruiter")) &&
      (!source || p.source === source) &&
      (!intent || p.intent === intent) &&
      (!quick.owner || p.owner === quick.owner) &&
      (!quick.email || Boolean(p.email)) &&
      (!quick.outcome || p.outcome === quick.outcome) &&
      (!quick.age ||
        p.createdAt >= project.clock - Number(quick.age) * 86400000) &&
      (!quick.experience ||
        (Number(p.experience) >= Number(quick.experience.split("-")[0]) &&
          Number(p.experience) <= Number(quick.experience.split("-")[1]))) &&
      (!quick.salary ||
        (parseFloat(p.compensation) >= Number(quick.salary.split("-")[0]) &&
          parseFloat(p.compensation) <= Number(quick.salary.split("-")[1]))) &&
      matches(
        {
          ...p,
          applicationStatus: p.candidateId ? "Submitted" : "Not submitted",
          outreachEmails: Object.values(project.deliveries).filter(
            (d) => d.candidateId === p.id && /Email/i.test(d.name),
          ).length,
        },
        query,
        conditions,
      ),
  );
  const current = active
    ? (ops.prospects[active] ?? pool().people[active])
    : undefined;
  const form =
    project.revisions[project.liveRevisionId ?? ""]?.draft.application;
  const templates = Object.values(ops.templates).filter(
    (t) => t.stage === "All" || t.stage === "prospects",
  );
  function sample() {
    run(
      () =>
        attachPeople(
          jobId,
          ["Riya Kapoor", "Dev Shah", "Sara Khan", "Nikhil Rao"].map(
            (name, i) =>
              newProspect({
                name,
                headline: [
                  "Product Designer",
                  "Design Lead",
                  "UX Researcher",
                  "Product Designer",
                ][i],
                company: ["Figma", "Atlassian", "Notion", "Acme"][i],
                email: `${name.split(" ")[0].toLowerCase()}@demo.example`,
                phone: `+9198765432${10 + i}`,
                location: i % 2 ? "Mumbai" : "Bengaluru",
                experience: String(4 + i),
                skills: "Research, product design, collaboration",
                owner: i < 2 ? TEAM[0] : TEAM[1],
                source: ["LinkedIn", "CSV", "Referral", "CV"][i],
              }),
          ),
        ),
      "Sample prospects added. They are not applicants yet.",
    );
  }
  function mapCSV() {
    run(() => {
      const parsed = parseCSV(csv);
      if (!parsed.length) throw new Error("Add CSV rows first.");
      setRows(parsed);
      setMapping(
        Object.fromEntries(
          importFields.map((f) => [
            f,
            String(
              parsed[0].findIndex((v) =>
                (aliases[f] ?? [f]).includes(v.toLowerCase()),
              ),
            ),
          ]),
        ),
      );
    }, "Review the mapping before import.");
  }
  function previewImport() {
    run(() => {
      const parsed = mode === "Positional CSV" ? parseCSV(csv) : rows.slice(1);
      const results = parsed.map((row) =>
        newProspect({
          ...Object.fromEntries(
            (mode === "Positional CSV"
              ? ["name", "email", "headline", "company", "location"]
              : importFields
            ).map((f, i) => [
              f,
              row[mode === "Positional CSV" ? i : Number(mapping[f])] || "",
            ]),
          ),
          source: "CSV",
        }),
      );
      if (results.some((p) => !p.name.trim()))
        throw new Error("Every row needs a mapped name.");
      setImportPreview(
        results.map((p) => ({
          ...p,
          headline: p.headline || "Imported prospect",
        })),
      );
    });
  }
  return (
    <>
      <p className="hire-intro">
        Private prospects need a completed application before candidate review.
      </p>
      <div className="hire-actions">
        <button
          className="funnel-primary"
          onClick={() => {
            setPerson(newProspect());
            setMode("Single prospect");
          }}
        >
          ＋ Add prospects
        </button>
        <button onClick={sample}>Load sample sourcing data</button>
      </div>
      {person && (
        <section className="hire-card">
          <Tabs
            values={[
              "Single prospect",
              "Positional CSV",
              "Mapped CSV",
              "CV upload",
            ]}
            active={mode}
            onChange={(v) => {
              setMode(v);
              setImportPreview([]);
            }}
          />
          {mode === "Single prospect" && (
            <>
              <div className="hire-form-grid">
                {(
                  [
                    "name",
                    "headline",
                    "company",
                    "email",
                    "phone",
                    "location",
                    "experience",
                    "skills",
                  ] as const
                ).map((key) => (
                  <Field
                    key={key}
                    label={`${key}${["name", "headline"].includes(key) ? " *" : ""}`}
                    value={person[key]}
                    onChange={(v) => setPerson({ ...person, [key]: v })}
                  />
                ))}
              </div>
              <label className="hire-field">
                Optional resume · PDF / PNG / JPG / WEBP, 20 MB
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={(e) =>
                    run(() => {
                      const f = e.target.files?.[0];
                      if (f) {
                        if (
                          f.size > 20 * 1024 * 1024 ||
                          !/\.(pdf|png|jpe?g|webp)$/i.test(f.name)
                        )
                          throw new Error(
                            "Choose a supported resume below 20 MB.",
                          );
                        setPerson({ ...person, resume: f.name });
                      }
                    })
                  }
                />
              </label>
              <Field
                label="Owner"
                value={person.owner}
                options={TEAM}
                onChange={(v) => setPerson({ ...person, owner: v })}
              />
              <button
                onClick={() =>
                  run(() => {
                    attachPeople(jobId, [person]);
                    setPerson(null);
                  }, "Prospect saved and attached to this job.")
                }
              >
                Save prospect
              </button>
            </>
          )}
          {["Positional CSV", "Mapped CSV"].includes(mode) && (
            <>
              <p className="hire-muted">
                {mode === "Positional CSV"
                  ? "No header: name, email, headline, company, location. Extra columns are ignored."
                  : "Header-based import with editable mapping. Name is required."}
              </p>
              <input
                aria-label="Upload prospect CSV"
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void f.text().then(setCSV);
                }}
              />
              <Field
                label="CSV content"
                type="textarea"
                value={csv}
                onChange={setCSV}
              />
              {mode === "Mapped CSV" && (
                <>
                  <button onClick={mapCSV}>Detect columns</button>
                  <div className="hire-form-grid">
                    {rows.length > 0 &&
                      importFields.map((f) => (
                        <label className="hire-field" key={f}>
                          {f}
                          <select
                            value={mapping[f] ?? "-1"}
                            onChange={(e) =>
                              setMapping((v) => ({ ...v, [f]: e.target.value }))
                            }
                          >
                            <option value="-1">Skip</option>
                            {rows[0].map((h, i) => (
                              <option key={i} value={i}>
                                {h}
                              </option>
                            ))}
                          </select>
                        </label>
                      ))}
                  </div>
                </>
              )}
              <button onClick={previewImport}>Preview import</button>
            </>
          )}
          {mode === "CV upload" && (
            <>
              <p>
                Up to 100 PDF, PNG, JPG or WEBP files, 20 MB each. Demo parsing
                uses filenames; original files are not uploaded.
              </p>
              <input
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                aria-label="Upload prospect CVs"
                onChange={(e) =>
                  run(() => {
                    const files = Array.from(e.target.files ?? []);
                    if (
                      files.length > 100 ||
                      files.some(
                        (f) =>
                          f.size > 20 * 1024 * 1024 ||
                          !/\.(pdf|png|jpe?g|webp)$/i.test(f.name),
                      )
                    )
                      throw new Error(
                        "Use up to 100 supported files, no larger than 20 MB each.",
                      );
                    setImportPreview(
                      files.map((f) =>
                        newProspect({
                          name: f.name
                            .replace(/\.[^.]+$/, "")
                            .replaceAll("_", " "),
                          headline: "Imported CV · review profile",
                          resume: f.name,
                          source: "CV",
                        }),
                      ),
                    );
                  })
                }
              />
            </>
          )}
          {importPreview.length > 0 && (
            <>
              <h3>Import preview · {importPreview.length} people</h3>
              {importPreview.slice(0, 8).map((p) => (
                <p key={p.id}>
                  {p.name} · {p.headline} · {p.email}
                </p>
              ))}
              <button
                className="funnel-primary"
                onClick={() =>
                  run(() => {
                    attachPeople(jobId, importPreview);
                    setPerson(null);
                    setImportPreview([]);
                  }, "Import completed into the private prospect pool.")
                }
              >
                Confirm import
              </button>
            </>
          )}
          <button onClick={() => setPerson(null)}>Cancel import</button>
        </section>
      )}
      <Tabs
        values={["My leads", "Team leads", "Private people"]}
        active={tab}
        onChange={(v) => {
          setTab(v);
          setSelected([]);
        }}
      />
      <div className="hire-actions">
        <input
          aria-label="Search prospects"
          placeholder="Search prospects, skills, company…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="Prospect source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        >
          <option value="">All sources</option>
          {["LinkedIn", "CSV", "CV", "Referral", "Sign-up"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          aria-label="Prospect intent"
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
        >
          <option value="">All intent</option>
          {["Open", "Active", "Passive"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <details>
        <summary>More sourcing filters</summary>
        <div className="hire-form-grid">
          {[
            ["owner", "Owner", TEAM],
            ["age", "Created in last (days)", ["1", "7", "30", "90"]],
            [
              "experience",
              "Experience (years)",
              ["0-2", "3-5", "6-9", "10-100"],
            ],
            [
              "salary",
              "Compensation (lakhs)",
              ["0-30", "30-50", "50-75", "75-100", "100-9999"],
            ],
            ["email", "Has email", ["Yes"]],
            [
              "outcome",
              "Outreach outcome",
              [
                "Pending review",
                "Email sent",
                "Message sent",
                "Connected",
                "Interested",
                "Callback",
                "Not interested",
                "Rejected",
              ],
            ],
          ].map(([key, label, choices]) => (
            <Field
              key={String(key)}
              label={String(label)}
              value={quick[String(key)] || ""}
              options={choices as string[]}
              onChange={(v) => setQuick((q) => ({ ...q, [String(key)]: v }))}
            />
          ))}
        </div>
        <button onClick={() => setQuick({})}>Clear quick filters</button>
      </details>
      <DataFilters
        scope={`${jobId}-prospects`}
        fields={[
          "name",
          "headline",
          "company",
          "location",
          "source",
          "owner",
          "experience",
          "outcome",
          "compensation",
          "skills",
          "intent",
          "education",
          "email",
          "phone",
          "createdAt",
          "hotlist",
          "applicationStatus",
          "outreachEmails",
        ]}
        conditions={conditions}
        onChange={setConditions}
      />
      <details>
        <summary>Table columns</summary>
        <div className="hire-actions">
          {[
            "headline",
            "source",
            "experience",
            "outcome",
            "compensation",
            "location",
            "skills",
            "intent",
            "education",
            "owner",
            "email",
            "phone",
          ].map((c) => (
            <label key={c}>
              <input
                type="checkbox"
                checked={columns.includes(c)}
                onChange={(e) =>
                  setColumns((v) =>
                    e.target.checked ? [...v, c] : v.filter((x) => x !== c),
                  )
                }
              />
              {c}
            </label>
          ))}
        </div>
      </details>
      {selected.length > 0 && (
        <div className="hire-bulk">
          <strong>{selected.length} selected</strong>
          {tab === "Private people" && (
            <button
              onClick={() =>
                run(
                  () =>
                    attachPeople(
                      jobId,
                      all.filter((p) => selected.includes(p.id)),
                    ),
                  "People attached to this job.",
                )
              }
            >
              Attach to this job
            </button>
          )}
          <button
            onClick={() =>
              run(() => {
                selected.forEach((id) => {
                  const p = all.find((p) => p.id === id);
                  if (p) savePerson({ ...p, hotlist: true });
                });
                change(jobId, "Added prospects to hotlist", (o) =>
                  selected.forEach((id) => {
                    if (o.prospects[id]) o.prospects[id].hotlist = true;
                  }),
                );
              }, "Added to hotlist.")
            }
          >
            Hotlist
          </button>
          <button
            onClick={() =>
              downloadCSV("prospects.csv", [
                ["name", "email", "headline", "company", "location"],
                ...all
                  .filter((p) => selected.includes(p.id))
                  .map((p) => [
                    p.name,
                    p.email,
                    p.headline,
                    p.company,
                    p.location,
                  ]),
              ])
            }
          >
            Export
          </button>
          <button
            onClick={() => {
              if (
                confirm(
                  "Remove selected people from this view? Other job attachments are preserved.",
                )
              )
                run(() => {
                  if (tab === "Private people") selected.forEach(removePerson);
                  else
                    change(jobId, "Detached prospects", (o) => {
                      o.prospectIds = o.prospectIds.filter(
                        (id) => !selected.includes(id),
                      );
                    });
                  setSelected([]);
                });
            }}
          >
            Remove
          </button>
          <select
            aria-label="Prospect outreach template"
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
          >
            <option value="">Choose outreach template</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.channel} · {t.name}
              </option>
            ))}
          </select>
          <button
            disabled={!template || tab === "Private people"}
            onClick={() =>
              run(
                () => sendOutreach(jobId, selected, ops.templates[template]),
                "Demo outreach added to the outbox.",
              )
            }
          >
            Send outreach
          </button>
        </div>
      )}
      <div className="hire-table-wrap">
        <table className="hire-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  aria-label="Select eligible prospects"
                  checked={
                    filtered.length > 0 &&
                    filtered
                      .filter(
                        (p) =>
                          !["Rejected", "Not interested"].includes(p.outcome),
                      )
                      .every((p) => selected.includes(p.id))
                  }
                  onChange={(e) =>
                    setSelected(
                      e.target.checked
                        ? filtered
                            .filter(
                              (p) =>
                                !["Rejected", "Not interested"].includes(
                                  p.outcome,
                                ),
                            )
                            .map((p) => p.id)
                        : [],
                    )
                  }
                />
              </th>
              <th>Candidate</th>
              {columns.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Select ${p.name}`}
                    checked={selected.includes(p.id)}
                    onChange={(e) =>
                      setSelected((v) =>
                        e.target.checked
                          ? [...v, p.id]
                          : v.filter((id) => id !== p.id),
                      )
                    }
                  />
                </td>
                <td>
                  <button
                    onClick={() => {
                      setActive(p.id);
                    }}
                  >
                    {p.name}
                  </button>
                  <small>
                    {p.candidateId ? "Application submitted" : "Not submitted"}
                    {p.hotlist ? " · Hotlist" : ""}
                  </small>
                </td>
                {columns.map((c) => (
                  <td key={c}>{String(p[c as keyof Prospect] ?? "") || "—"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!filtered.length && (
        <Empty>
          No prospects in this view. Add people or adjust your filters.
        </Empty>
      )}
      {current && (
        <section className="hire-card">
          <div className="hire-section-head">
            <h3>{current.name}</h3>
            <button aria-label="Close prospect" onClick={() => setActive(null)}>
              ×
            </button>
          </div>
          <Tabs
            values={[
              "Candidate property",
              "Application property",
              "Application",
              "Communication",
              "Resume",
              "Outreach",
            ]}
            active={drawer}
            onChange={setDrawer}
          />
          {drawer === "Candidate property" && (
            <>
              <div className="hire-form-grid">
                {(
                  [
                    "headline",
                    "company",
                    "email",
                    "phone",
                    "location",
                    "experience",
                    "skills",
                    "compensation",
                    "education",
                    "intent",
                  ] as const
                ).map((k) => (
                  <Field
                    key={k}
                    label={k}
                    value={current[k]}
                    onChange={(v) =>
                      run(
                        () =>
                          change(jobId, `Updated prospect ${k}`, (o) => {
                            o.prospects[current.id] ??= current;
                            o.prospects[current.id][k] = v;
                          }),
                        "",
                      )
                    }
                  />
                ))}
              </div>
              <div className="hire-signals">
                {[
                  "Demographic",
                  "Experience",
                  "Skill",
                  "Intent",
                  "Monetary",
                  "Alma mater",
                ].map((v, i) => (
                  <div key={v}>
                    <small>{v}</small>
                    <strong>
                      {[
                        current.location,
                        current.experience && `${current.experience} years`,
                        current.skills,
                        current.intent,
                        current.compensation,
                        current.education,
                      ][i] || "Not provided"}
                    </strong>
                  </div>
                ))}
              </div>
              {(ops.setup.noGoCompanies || "")
                .split("\n")
                .some(
                  (v) =>
                    v.trim() &&
                    v.trim().toLowerCase() === current.company.toLowerCase(),
                ) && (
                <p className="hire-callout">
                  This company matches your sourcing exclusion list. Review
                  before outreach.
                </p>
              )}
            </>
          )}
          {drawer === "Application property" && (
            <p>
              Source: {current.source} · Owner: {current.owner}
              <br />
              Status:{" "}
              {current.candidateId ? "Application submitted" : "Not submitted"}
              <br />
              Created {new Date(current.createdAt).toLocaleString()}
            </p>
          )}
          {drawer === "Application" && (
            <>
              <p>
                Submit the published application on this prospect’s behalf.
              </p>
              {!form ? (
                <Empty>Publish the role to enable applications.</Empty>
              ) : current.candidateId ? (
                <p className="hire-callout">
                  Application completed. Candidate is now in Applied. Their
                  submitted answers are available in Candidate review.
                </p>
              ) : (
                <DemoApplication
                  key={current.id}
                  projectId={jobId}
                  applicant={{ name: current.name, email: current.email }}
                  onSubmitApplication={(answers) =>
                    promote(jobId, current.id, answers)
                  }
                />
              )}
            </>
          )}
          {drawer === "Resume" && (
            <>
              <p>{current.resume || "No resume attached."}</p>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                aria-label="Attach prospect resume"
                onChange={(e) =>
                  run(() => {
                    const f = e.target.files?.[0];
                    if (f) {
                      if (f.size > 20 * 1024 * 1024)
                        throw new Error("Resume must be below 20 MB.");
                      change(
                        jobId,
                        "Attached prospect resume metadata",
                        (o) => {
                          o.prospects[current.id] ??= current;
                          o.prospects[current.id].resume = f.name;
                        },
                      );
                    }
                  })
                }
              />
              <small>Demo stores the filename, not file contents.</small>
            </>
          )}
          {drawer === "Communication" && (
            <>
              {Object.values(project.deliveries)
                .filter((d) => d.candidateId === current.id)
                .map((d) => (
                  <article key={d.id} className="hire-card">
                    <h4>{d.name}</h4>
                    <p>{d.body}</p>
                    <small>{d.status}</small>
                  </article>
                ))}
            </>
          )}
          {drawer === "Outreach" && (
            <>
              <Field
                label="Outcome"
                value={current.outcome}
                options={[
                  "Pending review",
                  "Email sent",
                  "Reminder email 1",
                  "Reminder email 2",
                  "Message sent",
                  "Reminder message 1",
                  "Reminder message 2",
                  "DNP",
                  "Connected",
                  "Interested",
                  "Callback",
                  "Not interested",
                  "Rejected",
                ]}
                onChange={(v) =>
                  run(
                    () =>
                      change(jobId, `Prospect outreach outcome: ${v}`, (o) => {
                        o.prospects[current.id] ??= current;
                        o.prospects[current.id].outcome = v;
                      }),
                    "",
                  )
                }
              />
              <Field
                label="Disposition note"
                value={outcomeNote}
                onChange={setOutcomeNote}
                type="textarea"
              />
              <button
                disabled={!outcomeNote.trim()}
                onClick={() =>
                  run(() => {
                    change(
                      jobId,
                      `${current.name} · ${current.outcome}: ${outcomeNote}`,
                      () => {},
                      "Candidates",
                      current.id,
                    );
                    setOutcomeNote("");
                  }, "Outreach note recorded.")
                }
              >
                Record outcome note
              </button>
              {ops.activity
                .filter((e) => e.candidateId === current.id)
                .map((e) => (
                  <p key={e.id}>{e.label}</p>
                ))}
            </>
          )}
        </section>
      )}
    </>
  );
}
