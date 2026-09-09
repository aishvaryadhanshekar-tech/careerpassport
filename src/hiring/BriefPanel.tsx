import { useState } from "react";
import type { JobDraft } from "../types";
import { Field, Tabs, copy, type PanelProps } from "./shared";

export function BriefPanel({
  jobId,
  project,
  ops,
  draft,
  run,
}: PanelProps & { draft: JobDraft }) {
  const [tab, setTab] = useState("Brief");
  const [editing, setEditing] = useState(false);
  const s = ops.setup;
  const [document, setDocument] = useState<Record<string, string>>({
    "Job title": draft.fields.designation.value,
    Opening: s.companyBrief || draft.roleProfile.portrait.value,
    Location: draft.fields.location.value,
    "Work mode": draft.fields.workMode.value,
    Employment: draft.fields.experienceType.value,
    Experience: draft.fields.experienceYears.value,
    Compensation: `${draft.salaryCurrency || ""} ${draft.fields.salary.value} ${draft.salaryPeriod}`,
    Responsibilities: s.responsibilities || "",
    "Must-have skills": draft.fields.mustHaves.value,
    "Good-to-have skills": s.goodToHave || "",
    Benefits: s.benefits || "",
    "Tech & tags": s.tags || "",
  });
  const [hidden, setHidden] = useState<string[]>([]);
  const [platform, setPlatform] = useState("LinkedIn"),
    [tone, setTone] = useState("Warm"),
    [sender, setSender] = useState("Demo Recruiter"),
    [input, setInput] = useState(""),
    [message, setMessage] = useState("");
  const link = `${location.origin}/demo/apply/${jobId}?recruiter=${encodeURIComponent(sender)}`;
  return (
    <>
      <Tabs
        values={["Brief", "Download JD", "Share application link"]}
        active={tab}
        onChange={setTab}
      />
      {tab === "Brief" && (
        <>
          <div className="hire-brief">
            <span>
              {s.status ||
                (project.configuration.published ? "Active" : "Draft")}{" "}
              BRIEF ·{" "}
              {draft.publishDestinations.marketplace
                ? "Marketplace"
                : "Internal team"}
            </span>
            <h2>{draft.fields.designation.value || "Untitled role"}</h2>
            <p>
              {[
                draft.fields.location.value,
                draft.fields.workMode.value,
                draft.fields.experienceYears.value &&
                  `${draft.fields.experienceYears.value} years`,
                draft.fields.salary.value &&
                  `${draft.salaryCurrency || ""} ${draft.fields.salary.value}`,
              ]
                .filter(Boolean)
                .join(" · ") || "Add role details to build your brief."}
            </p>
          </div>
          <h3>Recruiter brief</h3>
          <p>
            {s.companyBrief ||
              draft.roleProfile.portrait.value ||
              "Add role details to create the brief."}
          </p>
          <div className="hire-form-grid">
            {[
              [
                "Ideal candidate",
                draft.preview.idealCandidate ||
                  draft.roleProfile.portrait.value,
              ],
              [
                "Tribal details",
                [s.reportingHierarchy, draft.fields.workMode.value, s.team]
                  .filter(Boolean)
                  .join(" · "),
              ],
              [
                "Skills expected",
                draft.preview.expectedSkills || draft.fields.mustHaves.value,
              ],
              [
                "Must-haves / red flags",
                `${draft.fields.mustHaves.value}\n${draft.fields.redFlags.value}`,
              ],
              [
                "Sourcing playbook",
                `Targets: ${s.prospectCompanies || draft.preview.targetCompanies || "Not specified"}\nChannels: ${s.channels || "Not specified"}\nAvoid: ${s.noGoCompanies || draft.roleProfile.avoidLookalikes || "Not specified"}`,
              ],
              [
                "Evaluation framework",
                draft.roleProfile.evaluationFramework
                  .map((c) => `${c.label} · ${c.type} · ${c.importance}`)
                  .join("\n"),
              ],
            ].map(([label, value]) => (
              <article className="hire-card" key={label}>
                <h3>{label}</h3>
                <p className="hire-pre">{value.trim() || "Not specified"}</p>
              </article>
            ))}
          </div>
        </>
      )}
      {tab === "Download JD" && (
        <>
          <p className="hire-callout">
            Edits apply to this download only; job settings stay unchanged.
          </p>
          <div className="hire-actions">
            <button onClick={() => setEditing((v) => !v)}>
              {editing ? "Preview document" : "Edit document"}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setTimeout(() => window.print(), 80);
              }}
            >
              Print / Save PDF
            </button>
          </div>
          {editing ? (
            <div className="hire-form-grid">
              {Object.entries(document).map(([key, value]) => (
                <div key={key}>
                  <Field
                    label={key}
                    value={value}
                    type={
                      [
                        "Responsibilities",
                        "Must-have skills",
                        "Good-to-have skills",
                        "Opening",
                      ].includes(key)
                        ? "textarea"
                        : "text"
                    }
                    onChange={(v) => setDocument((d) => ({ ...d, [key]: v }))}
                  />
                  {key !== "Job title" && (
                    <label>
                      <input
                        type="checkbox"
                        checked={!hidden.includes(key)}
                        onChange={(e) =>
                          setHidden((h) =>
                            e.target.checked
                              ? h.filter((k) => k !== key)
                              : [...h, key],
                          )
                        }
                      />{" "}
                      Shown
                    </label>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <article className="hire-export">
              {Object.entries(document)
                .filter(([key, value]) => value && !hidden.includes(key))
                .map(([key, value]) => (
                  <section key={key}>
                    {key === "Job title" ? (
                      <h1>{value}</h1>
                    ) : (
                      <>
                        <h3>{key}</h3>
                        <p className="hire-pre">
                          {key === "Responsibilities"
                            ? value.split("\n").slice(0, 5).join("\n")
                            : value}
                        </p>
                      </>
                    )}
                  </section>
                ))}
            </article>
          )}
        </>
      )}
      {tab === "Share application link" && (
        <>
          <div className="hire-form-grid">
            <Field
              label="Platform"
              value={platform}
              options={["LinkedIn", "Email", "WhatsApp"]}
              onChange={setPlatform}
            />
            <Field
              label="Tone"
              value={tone}
              options={["Warm", "Direct", "Editorial"]}
              onChange={setTone}
            />
            <Field
              label="Sender"
              value={sender}
              options={[ops.owner, ...Object.keys(ops.members)]}
              onChange={setSender}
            />
            <Field
              label="Your input"
              value={input}
              onChange={setInput}
              type="textarea"
            />
          </div>
          <button
            onClick={() =>
              setMessage(
                `${tone === "Warm" ? "Hello! We’d love to meet our next" : tone === "Direct" ? "Now hiring:" : "A new opportunity:"} ${draft.fields.designation.value}.\n${draft.fields.location.value} · ${draft.fields.workMode.value}\n${input}\n\nApply: ${link}\n— ${sender}`,
              )
            }
          >
            ✦ Generate demo message
          </button>
          <h3>
            {platform} · {tone}
          </h3>
          <Field
            label="Message preview · editable"
            type="textarea"
            value={message}
            onChange={setMessage}
          />
          <div className="hire-actions">
            <button
              disabled={!message}
              onClick={() => run(() => copy(message), "Message copied.")}
            >
              Copy message
            </button>
            <button
              onClick={() => run(() => copy(link), "Application link copied.")}
            >
              Copy link
            </button>
          </div>
          <p className="hire-link">{link}</p>
        </>
      )}
    </>
  );
}
