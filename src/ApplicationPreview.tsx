import { useEffect, useRef, useState, type ReactNode } from "react";
import { STANDARD_FIELD_META } from "./applicationCatalog";
import { splitTags } from "./formControlUtils";
import { salaryLabel } from "./jobsStore";
import {
  contextVisibleInPreview,
  previewTargetId,
  scrollChildIntoContainer,
  type PreviewAnchor,
} from "./previewScroll";
import { WORK_MODE_LABEL } from "./shared/labels";
import type {
  ApplicationConfig,
  JobDraft,
  StandardFieldId,
} from "./types";

type PreviewTab = "overview" | "application";

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
      mode={mode}
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
        <MonitorDevice>{screen}</MonitorDevice>
      )}
    </aside>
  );
}

function MonitorDevice({ children }: { children: ReactNode }) {
  return (
    <div className="monitor-stage">
      <div className="monitor-device">
        <div className="monitor-chassis">
          <div className="monitor-screen">{children}</div>
        </div>
        <div className="monitor-neck" aria-hidden="true" />
        <div className="monitor-base" aria-hidden="true" />
      </div>
    </div>
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
  mode,
}: {
  draft: JobDraft;
  config: ApplicationConfig;
  activeAnchor: PreviewAnchor | null;
  mode: "mobile" | "desktop";
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const lastTargetId = useRef<string | null>(null);
  const pointerOnSheet = useRef(false);
  const showTabs = mode === "mobile";
  const [tab, setTab] = useState<PreviewTab>("overview");
  const title = draft.fields.designation.value.trim() || "Untitled role";
  const workMode = draft.fields.workMode.value.trim();
  const workLabel = WORK_MODE_LABEL[workMode] ?? workMode;
  const locations = splitTags(draft.fields.location.value);
  const pay = salaryLabel(draft);
  const requirements = draft.fields.mustHaves.value.trim();
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
    const targetTab: PreviewTab =
      activeAnchor === "fields" || activeAnchor === "questions"
        ? "application"
        : "overview";
    if (showTabs && tab !== targetTab) {
      // Switch tab first; once the matching tab's content is mounted this
      // effect re-runs (tab is a dependency) and performs the actual scroll.
      lastTargetId.current = null;
      setTab(targetTab);
      return;
    }
    if (lastTargetId.current === targetId) return;
    const container = frameRef.current;
    if (!container) return;
    if (targetId === "preview-job") {
      lastTargetId.current = targetId;
      container.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = container.querySelector(`#${targetId}`);
    if (!(el instanceof HTMLElement)) return;
    lastTargetId.current = targetId;
    scrollChildIntoContainer(container, el);
  }, [activeAnchor, companyVisible, roleVisible, showTabs, tab]);

  const headerNode = (
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
  );

  const overviewSections = (
    <>
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
      {requirements ? (
        <section className="preview-copy preview-section-card" id="preview-requirements">
          <h4 className="preview-eyebrow">Requirements</h4>
          <p>{requirements}</p>
        </section>
      ) : null}
    </>
  );

  const applicationSections = (
    <>
      {hasResume && !showTabs ? <AutofillCard /> : null}
      <div className="preview-fields preview-section-card" id="preview-fields">
        <p className="preview-eyebrow">Your details</p>
        <label className="preview-field">
          <span>First name</span>
          <input type="text" name="firstName" autoComplete="given-name" />
        </label>
        <label className="preview-field">
          <span>Last name</span>
          <input type="text" name="lastName" autoComplete="family-name" />
        </label>
        <label className="preview-field">
          <span>Email</span>
          <input type="email" name="email" autoComplete="email" />
        </label>
        {config.standardOrder
          .filter(
            (field) =>
              field.id !== "resume" && field.required !== "skipped",
          )
          .map((field) => <PreviewStandard key={field.id} id={field.id} />)}
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
              <span>{item.prompt || "Question"}</span>
              {item.type === "paragraph" ? (
                <textarea rows={3} />
              ) : item.type === "short_answer" ? (
                <input type="text" />
              ) : item.type === "date" ? (
                <input type="date" />
              ) : item.type === "time" ? (
                <input type="time" />
              ) : item.type === "file_upload" ? (
                <input
                  type="file"
                  multiple={(item.maxFiles ?? 1) > 1}
                  accept={
                    item.restrictFileTypes && item.allowedFileTypes?.length
                      ? item.allowedFileTypes.join(",")
                      : undefined
                  }
                />
              ) : item.type === "linear_scale" ? (
                <div className="preview-scale">
                  {item.scaleMinLabel ? <span>{item.scaleMinLabel}</span> : null}
                  {Array.from(
                    {
                      length: (item.scaleMax ?? 5) - (item.scaleMin ?? 1) + 1,
                    },
                    (_, index) => (item.scaleMin ?? 1) + index,
                  ).map((value) => (
                    <label key={value} className="preview-scale-option">
                      <input type="radio" name={item.id} />
                      <span>{value}</span>
                    </label>
                  ))}
                  {item.scaleMaxLabel ? <span>{item.scaleMaxLabel}</span> : null}
                </div>
              ) : item.type === "rating" ? (
                <div className="preview-rating" aria-hidden="true">
                  {Array.from({ length: item.ratingMax ?? 5 }).map((_, index) => (
                    <span key={index} className="preview-rating-glyph">
                      {item.ratingIcon === "heart"
                        ? "♡"
                        : item.ratingIcon === "thumb"
                          ? "👍"
                          : "☆"}
                    </span>
                  ))}
                </div>
              ) : item.type === "multiple_choice_grid" || item.type === "checkbox_grid" ? (
                <table className="preview-grid">
                  <thead>
                    <tr>
                      <th />
                      {(item.columns ?? []).map((column, columnIndex) => (
                        <th key={columnIndex}>{column || `Column ${columnIndex + 1}`}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(item.rows ?? []).map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        <td>{row || `Row ${rowIndex + 1}`}</td>
                        {(item.columns ?? []).map((_, columnIndex) => (
                          <td key={columnIndex}>
                            <input
                              type={item.type === "multiple_choice_grid" ? "radio" : "checkbox"}
                              name={
                                item.type === "multiple_choice_grid"
                                  ? `${item.id}-${rowIndex}`
                                  : undefined
                              }
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
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
    </>
  );

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
      {showTabs ? (
        <>
          {headerNode}
          <div className="preview-tabbar" role="tablist" aria-label="Job preview sections">
            <button
              type="button"
              role="tab"
              id="preview-tab-overview"
              aria-selected={tab === "overview"}
              aria-controls="preview-tabpanel-overview"
              className={`preview-tab-btn${tab === "overview" ? " active" : ""}`}
              onClick={() => setTab("overview")}
            >
              Overview
            </button>
            <button
              type="button"
              role="tab"
              id="preview-tab-application"
              aria-selected={tab === "application"}
              aria-controls="preview-tabpanel-application"
              className={`preview-tab-btn${tab === "application" ? " active" : ""}`}
              onClick={() => setTab("application")}
            >
              Application
            </button>
          </div>
          {tab === "overview" ? (
            <div
              role="tabpanel"
              id="preview-tabpanel-overview"
              aria-labelledby="preview-tab-overview"
            >
              <div className="preview-body">{overviewSections}</div>
            </div>
          ) : (
            <div
              role="tabpanel"
              id="preview-tabpanel-application"
              aria-labelledby="preview-tab-application"
            >
              <div className="preview-body">{applicationSections}</div>
            </div>
          )}
        </>
      ) : (
        <>
          {headerNode}
          <div className="preview-body">
            {overviewSections}
            {applicationSections}
          </div>
        </>
      )}
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

function PreviewStandard({ id }: { id: StandardFieldId }) {
  const meta = STANDARD_FIELD_META[id];
  if (id === "coverLetter") {
    return (
      <label className="preview-field">
        <span>{meta.label}</span>
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
      <span>{meta.label}</span>
      <input type={type} />
    </label>
  );
}
