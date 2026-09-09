import { useState, type Dispatch, type SetStateAction } from "react";
import { CURRENCIES, PERIODS, type CoverageId, type JobDraft } from "../types";
import { RoleProfilePanel } from "../canvasJob/panels/RoleProfilePanel";
import { change } from "./service";
import { demoService } from "../demo/service";
import { emptyOperations } from "./catalog";
import { Field, Tabs, type PanelProps } from "./shared";

type Setting = {
  key: string;
  label: string;
  type?: string;
  options?: readonly string[];
  canonical?: CoverageId;
};
const sections: Record<string, Setting[]> = {
  "Role & comp": [
    { key: "title", label: "Job title", canonical: "designation" },
    { key: "client", label: "Client" },
    { key: "department", label: "Department" },
    { key: "team", label: "Team" },
    {
      key: "employment",
      label: "Employment type",
      canonical: "experienceType",
      options: ["Full-time", "Part-time", "Contract", "Internship", "Founding"],
    },
    {
      key: "experienceLevel",
      label: "Experience level",
      options: ["Entry", "Mid-level", "Senior", "Lead", "Executive"],
    },
    { key: "openPositions", label: "Open positions", type: "number" },
    { key: "location", label: "Location", canonical: "location" },
    {
      key: "mode",
      label: "Location type",
      canonical: "workMode",
      options: ["WFO", "WFH", "Hybrid", "On-site", "Remote"],
    },
    { key: "ctcMin", label: "CTC minimum (currency units)", type: "number" },
    { key: "ctcMax", label: "CTC maximum (currency units)", type: "number" },
    { key: "noticePeriodDays", label: "Notice period (days)", type: "number" },
  ],
  Requirements: [
    {
      key: "mustHaves",
      label: "Must-have skills · one per line, optionally years",
      canonical: "mustHaves",
      type: "textarea",
    },
    { key: "goodToHave", label: "Good-to-have skills", type: "textarea" },
    { key: "education", label: "Education" },
    { key: "certifications", label: "Training & certifications" },
    { key: "yoeMin", label: "Experience minimum (years)", type: "number" },
    { key: "yoeMax", label: "Experience maximum (years)", type: "number" },
    {
      key: "prospectCompanies",
      label: "Prospect companies · one per line",
      type: "textarea",
    },
  ],
  "Job description": [
    {
      key: "responsibilities",
      label: "Responsibilities · one per line",
      type: "textarea",
    },
    {
      key: "qualifications",
      label: "JD qualifications (separate from requirements)",
      type: "textarea",
    },
    { key: "benefits", label: "Benefits", type: "textarea" },
    { key: "tags", label: "Tech & tags" },
    {
      key: "internalNotes",
      label: "Internal notes · hiring team only",
      type: "textarea",
    },
    { key: "industry", label: "Company industry", canonical: "industryType" },
    { key: "companySize", label: "Company size" },
    { key: "businessModel", label: "Business model", canonical: "companyType" },
    { key: "reportingHierarchy", label: "Reporting hierarchy" },
    { key: "companyBrief", label: "Company brief", type: "textarea" },
  ],
  "Sourcing brief": [
    {
      key: "channels",
      label: "Sourcing channels · one per line",
      type: "textarea",
    },
    {
      key: "noGoCompanies",
      label: "No-go companies · exact names, one per line",
      type: "textarea",
    },
    {
      key: "diversityPreference",
      label: "Sourcing context / diversity preference",
      type: "textarea",
    },
    { key: "hmAudio", label: "Hiring-manager audio URL", type: "url" },
  ],
  "Visibility & posting": [{ key: "careersSlug", label: "Careers slug" }],
  Lifecycle: [
    {
      key: "status",
      label: "Status",
      options: ["draft", "active", "paused", "closed"],
    },
    { key: "targetCloseDate", label: "Target close date", type: "date" },
    { key: "headcountFilled", label: "Headcount filled", type: "number" },
    {
      key: "closedAt",
      label: "Closed at (manually recorded)",
      type: "datetime-local",
    },
  ],
};
const ROLE_COMP_ROLE_KEYS = [
  "title",
  "client",
  "department",
  "team",
  "employment",
  "experienceLevel",
  "openPositions",
];
const ROLE_COMP_LOCATION_KEYS = ["location", "mode"];
const ROLE_COMP_RANGE_KEYS = ["ctcMin", "ctcMax"];
const ROLE_COMP_AVAILABILITY_KEYS = ["noticePeriodDays"];
export function SetupPanel({
  jobId,
  ops,
  project,
  run,
  draft,
  setDraft,
}: PanelProps & {
  draft: JobDraft;
  setDraft: Dispatch<SetStateAction<JobDraft>>;
}) {
  const [tab, setTab] = useState("Role & comp");
  const [clients, setClients] = useState<string[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem("cp.hiring.clients") ||
          '["Career Passport","Acme Corp"]',
      );
    } catch {
      return ["Career Passport"];
    }
  });
  const [newClient, setNewClient] = useState("");
  const [values, setValues] = useState<Record<string, string>>({
    status: project.configuration.published ? "active" : "draft",
    ...ops.setup,
    ...ops.setupDraft,
  });
  const [dirty, setDirty] = useState(
    Boolean(Object.keys(ops.setupDraft ?? {}).length),
  );
  function edit(key: string, value: string) {
    setValues((s) => ({ ...s, [key]: value }));
    setDirty(true);
    run(() =>
      demoService().transact(jobId, (p) => {
        p.operations ??= emptyOperations();
        p.operations.setupDraft = { ...p.operations.setupDraft, [key]: value };
      }),
    );
  }
  function save() {
    run(() => {
      const sectionKeys = (sections[tab] ?? [])
        .map((f) => f.key)
        .concat(
          tab === "Job description"
            ? ["jdDocument"]
            : tab === "Visibility & posting"
              ? ["postLinkedIn", "postNaukri", "postIndeed", "postInstahyre"]
              : [],
        );
      const changes = Object.fromEntries(
        Object.entries(ops.setupDraft ?? {}).filter(([key]) =>
          sectionKeys.includes(key),
        ),
      );
      for (const [lo, hi] of [
        ["ctcMin", "ctcMax"],
        ["yoeMin", "yoeMax"],
      ])
        if (values[lo] && values[hi] && Number(values[lo]) > Number(values[hi]))
          throw new Error("Minimum must not exceed maximum.");
      change(
        jobId,
        `Saved ${tab}: ${(sections[tab] ?? []).map((f) => f.label).join(", ")}`,
        (o) => {
          o.setup = { ...o.setup, ...changes };
          o.setupDraft = Object.fromEntries(
            Object.entries(o.setupDraft ?? {}).filter(
              ([key]) => !sectionKeys.includes(key),
            ),
          );
        },
      );
      setDraft((d) => ({
        ...d,
        fields: {
          ...d.fields,
          ...("ctcMin" in changes || "ctcMax" in changes
            ? {
                salary: {
                  value:
                    values.ctcMin || values.ctcMax
                      ? `${values.ctcMin || "0"}–${values.ctcMax || "open"}`
                      : "",
                  source: "user" as const,
                },
              }
            : {}),
          ...("yoeMin" in changes || "yoeMax" in changes
            ? {
                experienceYears: {
                  value:
                    values.yoeMin || values.yoeMax
                      ? `${values.yoeMin || "0"}–${values.yoeMax || "open"}`
                      : "",
                  source: "user" as const,
                },
              }
            : {}),
        },
        roleProfile: {
          ...d.roleProfile,
          department: {
            value: changes.department ?? d.roleProfile.department.value,
            source: "user",
          },
        },
      }));
      setDirty(
        Object.keys(ops.setupDraft ?? {}).some(
          (key) => !sectionKeys.includes(key),
        ),
      );
    }, `${tab} saved.`);
  }
  function renderRoleCompField(f: Setting) {
    return (
      <Field
        key={f.key}
        label={f.label}
        value={
          f.canonical
            ? draft.fields[f.canonical].value
            : (values[f.key] ??
              (f.key === "department" ? draft.roleProfile.department.value : ""))
        }
        type={f.type}
        options={f.options}
        suggestions={f.key === "client" ? clients : undefined}
        wide={f.type === "textarea"}
        onChange={(v) =>
          f.canonical
            ? setDraft((d) => ({
                ...d,
                fields: {
                  ...d.fields,
                  [f.canonical!]: { value: v, source: "user" },
                },
              }))
            : edit(f.key, v)
        }
      />
    );
  }
  return (
    <>
      <Tabs
        values={[...Object.keys(sections), "Evaluation & playbook"]}
        active={tab}
        onChange={(v) => {
          if (
            dirty &&
            !confirm(
              "Leave this section? Unsaved settings will remain here until you save.",
            )
          )
            return;
          setTab(v);
        }}
      />
      {tab === "Evaluation & playbook" ? (
        <RoleProfilePanel draft={draft} setDraft={setDraft} />
      ) : (
        <>
          {tab === "Role & comp" ? (
            <div className="hire-form-sections">
              <fieldset className="hire-field-group">
                <legend>Role</legend>
                <div className="hire-form-grid">
                  {sections[tab]
                    .filter((f) => ROLE_COMP_ROLE_KEYS.includes(f.key))
                    .map((f) => renderRoleCompField(f))}
                </div>
              </fieldset>
              <fieldset className="hire-field-group">
                <legend>Location</legend>
                <div className="hire-form-grid">
                  {sections[tab]
                    .filter((f) => ROLE_COMP_LOCATION_KEYS.includes(f.key))
                    .map((f) => renderRoleCompField(f))}
                </div>
              </fieldset>
              <fieldset className="hire-field-group">
                <legend>Compensation</legend>
                <div className="hire-form-grid">
                  <Field
                    label="Currency"
                    value={draft.salaryCurrency ?? ""}
                    options={CURRENCIES}
                    onChange={(v) =>
                      setDraft((d) => ({
                        ...d,
                        salaryCurrency: v as JobDraft["salaryCurrency"],
                      }))
                    }
                  />
                  <Field
                    label="Salary period"
                    value={draft.salaryPeriod}
                    options={PERIODS}
                    onChange={(v) =>
                      setDraft((d) => ({
                        ...d,
                        salaryPeriod: v as JobDraft["salaryPeriod"],
                      }))
                    }
                  />
                  <div className="hire-comp-range hire-wide">
                    {sections[tab]
                      .filter((f) => ROLE_COMP_RANGE_KEYS.includes(f.key))
                      .map((f) => renderRoleCompField(f))}
                  </div>
                </div>
              </fieldset>
              <fieldset className="hire-field-group">
                <legend>Availability</legend>
                <div className="hire-form-grid">
                  {sections[tab]
                    .filter((f) => ROLE_COMP_AVAILABILITY_KEYS.includes(f.key))
                    .map((f) => renderRoleCompField(f))}
                </div>
              </fieldset>
            </div>
          ) : (
            <div className="hire-form-grid">
              {sections[tab].map((f) => renderRoleCompField(f))}
            </div>
          )}
          {tab === "Role & comp" && (
            <details>
              <summary>Manage clients</summary>
              <Field
                label="New client name"
                value={newClient}
                onChange={setNewClient}
              />
              <button
                disabled={!newClient.trim()}
                onClick={() =>
                  run(() => {
                    const next = [...new Set([...clients, newClient.trim()])];
                    localStorage.setItem(
                      "cp.hiring.clients",
                      JSON.stringify(next),
                    );
                    setClients(next);
                    edit("client", newClient.trim());
                    setNewClient("");
                  }, "Client added to the selection list.")
                }
              >
                Add client
              </button>
              {clients.map((c) => (
                <div className="hire-list-row" key={c}>
                  <span>{c}</span>
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          "Remove this client from future selections? Existing job references stay intact.",
                        )
                      )
                        run(() => {
                          const next = clients.filter((v) => v !== c);
                          localStorage.setItem(
                            "cp.hiring.clients",
                            JSON.stringify(next),
                          );
                          setClients(next);
                        }, "Client removed from the selection list.");
                    }}
                  >
                    Remove from list
                  </button>
                </div>
              ))}
            </details>
          )}
          {tab === "Job description" && (
            <>
              <label className="hire-field">
                Upload JD (document metadata in demo)
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) edit("jdDocument", f.name);
                  }}
                />
              </label>
              {values.jdDocument && <p>Attached: {values.jdDocument}</p>}
              <button
                onClick={() => {
                  edit(
                    "responsibilities",
                    `Own outcomes for ${draft.fields.designation.value || "this role"}\nPartner with cross-functional teams\nMeasure and improve customer impact\nDocument decisions and trade-offs\nMentor peers and share learning`,
                  );
                  edit("qualifications", draft.fields.mustHaves.value);
                }}
              >
                ✦ Generate demo JD
              </button>
            </>
          )}
          {tab === "Sourcing brief" && (
            <p className="hire-muted">
              No-go companies are flagged for review; candidates are not
              automatically ranked or rejected.
            </p>
          )}
          {tab === "Visibility & posting" && (
            <>
              <Field
                label="Posting destination"
                value={
                  draft.publishDestinations.marketplace
                    ? "Marketplace"
                    : "Internal team"
                }
                options={["Internal team", "Marketplace"]}
                onChange={(v) =>
                  setDraft((d) => ({
                    ...d,
                    publishDestinations: {
                      internal: true,
                      marketplace: v === "Marketplace",
                    },
                  }))
                }
              />
              <p className="hire-muted">
                Visibility is separate from job status. Demo posting sends
                nothing to external job boards.
              </p>
              <div className="hire-actions">
                {["LinkedIn", "Naukri", "Indeed", "Instahyre"].map((v) => (
                  <label key={v}>
                    <input
                      type="checkbox"
                      checked={values[`post${v}`] === "true"}
                      onChange={(e) =>
                        edit(`post${v}`, String(e.target.checked))
                      }
                    />{" "}
                    {v}
                  </label>
                ))}
              </div>
            </>
          )}
          {tab === "Lifecycle" && (
            <div className="hire-actions">
              {["paused", "closed", "active"].map((status) => (
                <button
                  key={status}
                  onClick={() =>
                    run(() => {
                      change(jobId, `Changed job status to ${status}`, (o) => {
                        o.setup.status = status;
                      });
                      setValues((v) => ({ ...v, status }));
                    }, `Job ${status}.`)
                  }
                >
                  {status === "active"
                    ? "Restore active"
                    : status === "paused"
                      ? "Pause job"
                      : "Close job"}
                </button>
              ))}
            </div>
          )}
          <div className="hire-sticky-actions">
            <small>
              {dirty
                ? "Unsaved section settings"
                : "Role fields autosave · section settings saved explicitly"}
            </small>
            <button className="funnel-primary" onClick={save}>
              Save {tab}
            </button>
          </div>
        </>
      )}
    </>
  );
}
