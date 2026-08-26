import { useEffect, useRef, type ReactNode } from "react";
import { STANDARD_FIELD_META } from "./applicationCatalog";
import { splitTags } from "./formControlUtils";
import { salaryLabel } from "./jobsStore";
import {
  contextVisibleInPreview,
  previewTargetId,
  scrollChildIntoContainer,
  type PreviewAnchor,
} from "./previewScroll";
import type {
  ApplicationConfig,
  JobDraft,
  StandardFieldId,
} from "./types";

const WORK_MODE_LABEL: Record<string, string> = {
  WFH: "Remote",
  WFO: "On-site",
  Hybrid: "Hybrid",
};

export function ApplicationPreview({
  draft,
  config,
  mode,
  onMode,
  activeAnchor,
}: {
  draft: JobDraft;
  config: ApplicationConfig;
  mode: "mobile" | "desktop";
  onMode: (mode: "mobile" | "desktop") => void;
  activeAnchor: PreviewAnchor | null;
}) {
  const screen = (
    <PreviewApplyScreen
      draft={draft}
      config={config}
      activeAnchor={activeAnchor}
    />
  );

  return (
    <aside className="preview-pane">
      <div className="preview-toolbar">
        <div className="device-toggle" role="group" aria-label="Preview device">
          <button
            type="button"
            className={mode === "desktop" ? "on" : ""}
            onClick={() => onMode("desktop")}
          >
            Desktop
          </button>
          <button
            type="button"
            className={mode === "mobile" ? "on" : ""}
            onClick={() => onMode("mobile")}
          >
            Mobile
          </button>
        </div>
      </div>
      {mode === "mobile" ? (
        <PhoneDevice>{screen}</PhoneDevice>
      ) : (
        <div className="desktop-frame">{screen}</div>
      )}
    </aside>
  );
}

function PhoneDevice({ children }: { children: ReactNode }) {
  return (
    <div className="phone-stage">
      <div className="phone-device">
        <span className="phone-btn silent" aria-hidden="true" />
        <span className="phone-btn vol-up" aria-hidden="true" />
        <span className="phone-btn vol-down" aria-hidden="true" />
        <span className="phone-btn power" aria-hidden="true" />
        <div className="phone-chassis">
          <div className="phone-island" aria-hidden="true" />
          <div className="phone-screen">
            <div className="phone-status-bar" aria-hidden="true">
              <span className="phone-status-time">9:41</span>
              <span className="phone-status-glyphs">
                <svg
                  className="phone-status-signal"
                  viewBox="0 0 18 12"
                  width="18"
                  height="12"
                >
                  <rect x="0" y="7" width="3" height="5" rx="0.5" fill="currentColor" />
                  <rect x="5" y="5" width="3" height="7" rx="0.5" fill="currentColor" />
                  <rect x="10" y="3" width="3" height="9" rx="0.5" fill="currentColor" />
                  <rect x="15" y="0" width="3" height="12" rx="0.5" fill="currentColor" />
                </svg>
                <svg
                  className="phone-status-wifi"
                  viewBox="0 0 16 12"
                  width="16"
                  height="12"
                >
                  <path
                    d="M8 10.5a1.3 1.3 0 100-2.6 1.3 1.3 0 000 2.6zM4.7 7a4.7 4.7 0 016.6 0M2 4.3a8.4 8.4 0 0112 0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="phone-status-battery">
                  <span className="phone-status-battery-shell">
                    <span className="phone-status-battery-fill" />
                  </span>
                  <span className="phone-status-battery-cap" />
                </span>
              </span>
            </div>
            {children}
          </div>
          <div className="phone-home-indicator" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

function PreviewApplyScreen({
  draft,
  config,
  activeAnchor,
}: {
  draft: JobDraft;
  config: ApplicationConfig;
  activeAnchor: PreviewAnchor | null;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const lastTargetId = useRef<string | null>(null);
  const pointerOnSheet = useRef(false);
  const title = draft.fields.designation.value.trim() || "Untitled role";
  const workMode = draft.fields.workMode.value.trim();
  const workLabel = WORK_MODE_LABEL[workMode] ?? workMode;
  const locations = splitTags(draft.fields.location.value);
  const pay = salaryLabel(draft);
  const hasResume = config.standardOrder.some(
    (field) => field.id === "resume" && field.required !== "skipped",
  );
  const companyVisible = contextVisibleInPreview(
    config.context.company.shown,
    config.context.company.text,
  );
  const roleVisible = contextVisibleInPreview(
    config.context.role.shown,
    config.context.role.text,
  );

  useEffect(() => {
    if (!activeAnchor) return;
    if (pointerOnSheet.current) return;
    const targetId = previewTargetId(activeAnchor, {
      company: companyVisible,
      role: roleVisible,
    });
    if (lastTargetId.current === targetId) return;
    const container = frameRef.current;
    if (!container) return;
    if (targetId === "preview-job") {
      lastTargetId.current = targetId;
      container.scrollTo({ top: 0 });
      return;
    }
    const el = container.querySelector(`#${targetId}`);
    if (!(el instanceof HTMLElement)) return;
    lastTargetId.current = targetId;
    scrollChildIntoContainer(container, el);
  }, [activeAnchor, companyVisible, roleVisible]);

  return (
    <div
      className="preview-screen"
      ref={frameRef}
      onPointerEnter={() => {
        pointerOnSheet.current = true;
      }}
      onPointerLeave={() => {
        pointerOnSheet.current = false;
      }}
    >
      <header className="preview-job" id="preview-job">
        <p className="preview-brand">Career Passport</p>
        <h3>{title}</h3>
        {workLabel || locations.length ? (
          <p className="preview-meta-row">
            {[workLabel, ...locations].filter(Boolean).map((part, i) => (
              <span key={part}>
                {i > 0 ? <span className="preview-meta-dot">·</span> : null}
                {part}
              </span>
            ))}
          </p>
        ) : null}
        {pay !== "—" ? <p className="preview-salary">{pay}</p> : null}
      </header>
      <div className="preview-body">
        {companyVisible ? (
          <section className="preview-copy preview-section-card" id="preview-company">
            <h4 className="preview-eyebrow">Company</h4>
            <p>{config.context.company.text}</p>
          </section>
        ) : null}
        {roleVisible ? (
          <section className="preview-copy preview-section-card" id="preview-role">
            <h4 className="preview-eyebrow">Role</h4>
            <p>{config.context.role.text}</p>
          </section>
        ) : null}
        {hasResume ? <AutofillCard /> : null}
        <div className="preview-fields preview-section-card" id="preview-fields">
          <p className="preview-eyebrow">Your details</p>
          <p className="preview-req">Fields marked * are required</p>
          <label className="preview-field">
            <span>
              <span className="preview-required-mark">*</span> First name
            </span>
            <input type="text" name="firstName" autoComplete="given-name" />
          </label>
          <label className="preview-field">
            <span>
              <span className="preview-required-mark">*</span> Last name
            </span>
            <input type="text" name="lastName" autoComplete="family-name" />
          </label>
          <label className="preview-field">
            <span>
              <span className="preview-required-mark">*</span> Email
            </span>
            <input type="email" name="email" autoComplete="email" />
          </label>
          {config.standardOrder
            .filter(
              (field) =>
                field.id !== "resume" && field.required !== "skipped",
            )
            .map((field) => (
              <PreviewStandard
                key={field.id}
                id={field.id}
                required={field.required === "mandatory"}
              />
            ))}
        </div>
        <div className="preview-questions preview-section-card" id="preview-questions">
          {config.items.length > 0 ? (
            <p className="preview-eyebrow">Questions</p>
          ) : null}
          {config.items.map((item) =>
            item.kind === "section" ? (
              <div key={item.id} className="preview-section">
                <h4>{item.title || "Untitled section"}</h4>
                {item.description ? <p>{item.description}</p> : null}
              </div>
            ) : (
              <div key={item.id} className="preview-field">
                {item.imageUrl ? (
                  <img className="preview-question-image" src={item.imageUrl} alt="" />
                ) : null}
                <span>
                  {item.required === "mandatory" ? (
                    <span className="preview-required-mark">*</span>
                  ) : null}{" "}
                  {item.prompt || "Question"}
                </span>
                {item.type === "paragraph" ? (
                  <textarea rows={3} />
                ) : item.type === "short_answer" ? (
                  <input type="text" />
                ) : item.type === "dropdown" ? (
                  <select defaultValue="">
                    <option value="" disabled>
                      Choose
                    </option>
                    {item.options
                      .filter((o) => o.trim())
                      .map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                  </select>
                ) : (
                  <ul className="preview-options">
                    {item.options
                      .filter((o) => o.trim())
                      .map((option) => (
                        <li key={option}>
                          <label>
                            <input
                              type={
                                item.type === "multiple_choice"
                                  ? "radio"
                                  : "checkbox"
                              }
                              name={item.type === "multiple_choice" ? item.id : undefined}
                            />{" "}
                            {option}
                          </label>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            ),
          )}
          <button type="button" className="preview-submit">
            Submit application
          </button>
        </div>
      </div>
    </div>
  );
}

function AutofillCard() {
  return (
    <section className="preview-autofill">
      <p className="preview-autofill-kicker">
        <span aria-hidden="true">⚡</span> Autofill application
      </p>
      <p>
        Save time by importing your resume in one of the following formats:
        .pdf, .doc, .docx, .odt, or .rtf.
      </p>
      <button type="button" className="preview-import" disabled>
        Import resume from
        <span aria-hidden="true">▾</span>
      </button>
    </section>
  );
}

function PreviewStandard({
  id,
  required,
}: {
  id: StandardFieldId;
  required: boolean;
}) {
  const meta = STANDARD_FIELD_META[id];
  const star = required ? <span className="preview-required-mark">*</span> : null;
  if (id === "coverLetter") {
    return (
      <label className="preview-field">
        <span>
          {star} {meta.label}
        </span>
        <textarea rows={3} />
      </label>
    );
  }
  const type =
    id === "linkedinUrl" || id === "portfolioUrl"
      ? "url"
      : id === "availableStartDate"
        ? "date"
        : "text";
  return (
    <label className="preview-field">
      <span>
        {star} {meta.label}
      </span>
      <input type={type} />
    </label>
  );
}
