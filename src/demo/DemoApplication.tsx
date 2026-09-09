import { useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { STANDARD_FIELD_META } from "../applicationCatalog";
import { CURRENCIES, type CustomQuestion } from "../types";
import { demoService } from "./service";
import { useDemoProject } from "./useDemoProject";
import "./demo.css";

export function DemoApplication({
  projectId,
  preview = false,
  applicant,
  onSubmitApplication,
}: {
  projectId?: string;
  preview?: boolean;
  applicant?: { name: string; email: string };
  onSubmitApplication?: (answers: Record<string, string>) => unknown;
}) {
  const params = useParams();
  const id = projectId ?? params.id ?? "";
  const project = useDemoProject(id);
  const draft = preview
    ? project?.configuration.draft
    : project?.revisions[project.liveRevisionId ?? ""]?.draft;
  const form = draft?.application;
  const [name, setName] = useState(applicant?.name ?? "");
  const [email, setEmail] = useState(applicant?.email ?? "");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const set = (key: string, value: string) =>
    setAnswers((a) => ({ ...a, [key]: value }));
  function sample() {
    const a: Record<string, string> = {};
    form?.standardOrder.forEach((f) => {
      a[f.id] = (
        {
          resume: "Alex-Morgan-Resume.pdf",
          coverLetter:
            "I enjoy solving customer problems with collaborative teams.",
          linkedinUrl: "https://linkedin.example/alex",
          portfolioUrl: "https://portfolio.example/alex",
          currentLocation: "Bangalore",
          yearsOfExperience: "6",
          expectedCtc: "40L",
          currentCtc: "32L",
          noticePeriod: "30 days",
          currentCompany: "Acme Studio",
          availableStartDate: "2026-10-01",
        } as Record<string, string>
      )[f.id];
    });
    form?.items.forEach((q) => {
      if (q.kind !== "question") return;
      a[q.id] =
        q.type === "file_upload"
          ? "Work-sample.pdf"
          : q.type.includes("grid")
            ? (q.rows ?? [])
                .map((row) => `${row}: ${q.columns?.[0] ?? ""}`)
                .join("\n")
            : ["multiple_choice", "checkboxes", "dropdown"].includes(q.type)
              ? (q.options[0] ?? "Yes")
              : q.type === "date"
                ? "2026-10-01"
                : q.type === "time"
                  ? "10:00"
                  : ["rating", "linear_scale"].includes(q.type)
                    ? "3"
                    : "I led a cross-functional project that improved activation by 24%. I am excited to bring this experience to the team.";
    });
    setName(applicant?.name ?? "Alex Morgan");
    setEmail(
      applicant?.email ??
        `alex.morgan.${Object.keys(project?.candidates ?? {}).length ?? 0}@example.com`,
    );
    setAnswers(a);
    setError("");
    setShowValidation(false);
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (preview) return;
    try {
      if (onSubmitApplication) onSubmitApplication(answers);
      else demoService().submit(id, name, email, answers);
      setSubmitted(true);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to submit.");
    }
  }
  function input(key: string, type = "text", required = false) {
    if (type === "file")
      return (
        <>
          <input
            aria-label={`Upload ${key}`}
            type="file"
            accept={key === "resume" ? ".pdf,.docx" : undefined}
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (
                key === "resume" &&
                files.some(
                  (f) =>
                    f.size > 10 * 1024 * 1024 || !/\.(pdf|docx)$/i.test(f.name),
                )
              ) {
                setError("Use a PDF or DOCX resume no larger than 10 MB.");
                e.target.value = "";
                return;
              }
              set(key, files.map((f) => f.name).join(", "));
              setError("");
            }}
          />
          {key === "resume" && <small>PDF or DOCX · up to 10 MB</small>}
          {answers[key] && <small>Attached: {answers[key]}</small>}
        </>
      );
    if (key === "noticePeriod")
      return (
        <select
          aria-label="Notice period"
          required={required}
          value={answers[key] ?? ""}
          onChange={(e) => set(key, e.target.value)}
        >
          <option value="">Select notice period</option>
          {[
            "Immediate",
            "15 days",
            "30 days",
            "60 days",
            "90 days",
            "More than 90 days",
          ].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      );
    if (key === "expectedCtc" || key === "currentCtc")
      return (
        <div className="demo-actions">
          <input
            aria-label={
              key === "expectedCtc"
                ? "Expected CTC amount"
                : "Current CTC amount"
            }
            required={required}
            value={answers[key] ?? ""}
            onChange={(e) => set(key, e.target.value)}
          />
          <select
            aria-label={
              key === "expectedCtc"
                ? "Expected CTC currency"
                : "Current CTC currency"
            }
            value={answers[`${key}Currency`] ?? draft?.salaryCurrency ?? "INR"}
            onChange={(e) => set(`${key}Currency`, e.target.value)}
          >
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      );
    return (
      <input
        type={type}
        required={required}
        value={answers[key] ?? ""}
        onChange={(e) => set(key, e.target.value)}
      />
    );
  }
  function question(q: CustomQuestion) {
    const required = q.required === "mandatory";
    if (q.type === "paragraph")
      return (
        <textarea
          required={required}
          value={answers[q.id] ?? ""}
          onChange={(e) => set(q.id, e.target.value)}
        />
      );
    if (["dropdown", "multiple_choice", "checkboxes"].includes(q.type))
      return (
        <select
          required={required}
          multiple={q.type === "checkboxes"}
          value={
            q.type === "checkboxes"
              ? (answers[q.id]?.split(" | ") ?? [])
              : (answers[q.id] ?? "")
          }
          onChange={(e) =>
            set(
              q.id,
              q.type === "checkboxes"
                ? Array.from(e.target.selectedOptions)
                    .map((o) => o.value)
                    .join(" | ")
                : e.target.value,
            )
          }
        >
          {q.type !== "checkboxes" && (
            <option value="">Choose an answer</option>
          )}
          {q.options.map((option, i) => (
            <option key={i}>{option}</option>
          ))}
        </select>
      );
    if (q.type.includes("grid"))
      return (
        <div>
          {(q.rows ?? []).map((row, i) => {
            const saved =
              (answers[q.id] ?? "")
                .split("\n")
                .find((s) => s.startsWith(`${row}: `))
                ?.slice(row.length + 2) ?? "";
            return (
              <label key={i}>
                {row}
                <select
                  required={required || q.requireResponsePerRow}
                  multiple={q.type === "checkbox_grid"}
                  value={
                    q.type === "checkbox_grid" ? saved.split(" | ") : saved
                  }
                  onChange={(e) => {
                    const value =
                      q.type === "checkbox_grid"
                        ? Array.from(e.target.selectedOptions)
                            .map((o) => o.value)
                            .join(" | ")
                        : e.target.value;
                    const rows = (answers[q.id] ?? "")
                      .split("\n")
                      .filter((s) => s && !s.startsWith(`${row}: `));
                    set(q.id, [...rows, `${row}: ${value}`].join("\n"));
                  }}
                >
                  <option value="">Choose</option>
                  {q.columns?.map((col, j) => (
                    <option key={j}>{col}</option>
                  ))}
                </select>
              </label>
            );
          })}
        </div>
      );
    if (q.type === "linear_scale" || q.type === "rating")
      return (
        <input
          type="number"
          required={required}
          min={q.scaleMin ?? 1}
          max={q.scaleMax ?? q.ratingMax ?? 5}
          value={answers[q.id] ?? ""}
          onChange={(e) => set(q.id, e.target.value)}
        />
      );
    return input(
      q.id,
      q.type === "file_upload"
        ? "file"
        : q.type === "date" || q.type === "time"
          ? q.type
          : "text",
      required,
    );
  }
  if (!draft || !form)
    return (
      <div className="demo-application">
        <main>
          <h1>Application not available</h1>
          <p>
            Publish the role first, then open this link in the same browser used
            for the demo.
          </p>
        </main>
      </div>
    );
  if (
    !preview &&
    ["paused", "closed"].includes(project?.operations?.setup.status ?? "")
  )
    return (
      <div className="demo-application">
        <main>
          <h1>Applications are currently paused.</h1>
          <p>
            The hiring team is not accepting new applications for this role.
          </p>
        </main>
      </div>
    );
  return (
    <div className="demo-application">
      <main>
        <span className="demo-badge">
          {preview ? "CANDIDATE PREVIEW" : "DEMO APPLICATION"}
        </span>
        <h1>{draft.fields.designation.value}</h1>
        <p className="demo-context">
          {draft.fields.location.value} · {draft.fields.experienceType.value} ·{" "}
          {draft.fields.workMode.value}
        </p>
        {submitted ? (
          <>
            <h2>Application received, {name.split(" ")[0]}.</h2>
            <p>
              The hiring team can now review your application.
            </p>
            <div className="demo-actions">
              <a className="demo-link" href={`/jobs/${id}/canvas`}>
                Return to hiring workspace
              </a>
            </div>
          </>
        ) : (
          <>
            {form.context.company.shown && (
              <p className="demo-context">{form.context.company.text}</p>
            )}
            {form.context.role.shown && (
              <p className="demo-context">{form.context.role.text}</p>
            )}
            <div className="demo-preview-state">
              <button type="button" onClick={sample}>
                Fill sample answers
              </button>
              {preview && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setName("");
                      setEmail("");
                      setAnswers({});
                      setShowValidation(false);
                    }}
                  >
                    Empty form
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAnswers({});
                      setName("");
                      setEmail("");
                      setShowValidation(true);
                    }}
                  >
                    Show required errors
                  </button>
                </>
              )}
            </div>
            {error && (
              <p className="demo-error" role="alert">
                {error}
              </p>
            )}
            <form onSubmit={submit}>
              <label>
                Full name<span className="demo-required">Required</span>
                <input
                  required
                  readOnly={Boolean(applicant)}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {showValidation && !name && (
                  <small className="demo-error">Enter your full name.</small>
                )}
              </label>
              <label>
                Email<span className="demo-required">Required</span>
                <input
                  required
                  type="email"
                  readOnly={Boolean(applicant)}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {showValidation && !email && (
                  <small className="demo-error">Enter your email.</small>
                )}
              </label>
              {form.standardOrder
                .filter((f) => f.required !== "skipped")
                .map((f) => (
                  <label key={f.id}>
                    {STANDARD_FIELD_META[f.id].label}
                    {f.required === "mandatory" && (
                      <span className="demo-required">Required</span>
                    )}
                    {input(
                      f.id,
                      f.id === "resume"
                        ? "file"
                        : f.id === "availableStartDate"
                          ? "date"
                          : ["linkedinUrl", "portfolioUrl"].includes(f.id)
                            ? "url"
                            : "text",
                      f.required === "mandatory",
                    )}
                    {showValidation &&
                      f.required === "mandatory" &&
                      !answers[f.id] && (
                        <small className="demo-error">
                          This field is required.
                        </small>
                      )}
                  </label>
                ))}
              {form.items.map((q) =>
                q.kind === "section" ? (
                  <section key={q.id}>
                    <h2>{q.title}</h2>
                    <p>{q.description}</p>
                  </section>
                ) : (
                  <div key={q.id}>
                    <label>
                      {q.prompt}
                      {q.required === "mandatory" && (
                        <span className="demo-required">Required</span>
                      )}
                      {question(q)}
                    </label>
                    {showValidation &&
                      q.required === "mandatory" &&
                      !answers[q.id] && (
                        <small className="demo-error">
                          Please answer this question.
                        </small>
                      )}
                  </div>
                ),
              )}
              {!preview && (
                <>
                  <small>
                    Demo only. Uploaded files are represented by their
                    filenames; no file content is sent.
                  </small>
                  <div className="demo-actions">
                    <button type="submit">
                      {applicant
                        ? "Complete application & promote"
                        : "Submit application →"}
                    </button>
                  </div>
                </>
              )}
            </form>
          </>
        )}
      </main>
    </div>
  );
}
