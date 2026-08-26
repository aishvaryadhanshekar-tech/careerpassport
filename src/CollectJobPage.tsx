import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MISSING_DETAILS_ID,
  revealMissingDetails,
} from "./analysisScroll";
import { applyExtraction } from "./applyAnalysis";
import {
  continueEnabled,
  generateEnabled,
  generateLabel,
} from "./continueAction";
import { extractFromTranscript } from "./extractJobFields";
import {
  ACCEPT,
  formatBytes,
  formatDuration,
  ingestFiles,
  kindFor,
  uid,
} from "./files";
import { getCurrentJobId, startNewJob, upsertJobFromDraft } from "./jobsStore";
import { liveInterimGap } from "./liveTranscript";
import { loadDraft, saveDraft } from "./storage";
import { ChoiceRow, PointList, SalaryInput, TagInput } from "./formControls";
import {
  COMPANY_TYPE_OPTIONS,
  COVERAGE_LABELS,
  REQUIRED_COVERAGE_IDS,
  EXPERIENCE_TYPE_OPTIONS,
  FLAG_IDS,
  FLAG_LABELS,
  INDUSTRY_SUGGESTIONS,
  LOCATION_SUGGESTIONS,
  WORK_MODE_OPTIONS,
  coveredCount,
  isFieldCovered,
  type CoverageId,
  type Currency,
  type FlagId,
  type JobDraft,
} from "./types";

const TRANSCRIPT_MAX = 20000;

function speechCtor(): (new () => SpeechRecognition) | null {
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

function missingFrom(draft: JobDraft): CoverageId[] {
  if (!draft.analysedOnce) return [];
  return REQUIRED_COVERAGE_IDS.filter(
    (id) => !isFieldCovered(id, draft.fields, draft.salaryCurrency),
  );
}

export function CollectJobPage() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<JobDraft>(() => loadDraft());
  const [recording, setRecording] = useState(false);
  const [interim, setInterim] = useState("");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [analysing, setAnalysing] = useState(false);
  const [showCaptured, setShowCaptured] = useState(false);
  const [missingIds, setMissingIds] = useState<CoverageId[]>(() =>
    missingFrom(loadDraft()),
  );
  const [dragging, setDragging] = useState(false);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [micBlocked, setMicBlocked] = useState(false);
  const [micFailed, setMicFailed] = useState(false);
  const [noSpeechApi, setNoSpeechApi] = useState(false);
  const [limitHit, setLimitHit] = useState(false);
  const [hintsOpen, setHintsOpen] = useState(false);

  const draftRef = useRef(draft);
  draftRef.current = draft;
  const recordingRef = useRef(false);
  const startedAtRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const appendNewlineRef = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const hintsRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);

  const covered = coveredCount(draft.fields, draft.salaryCurrency);
  const hasContent =
    draft.transcript.trim() !== "" || draft.attachments.length > 0;
  const allCovered = covered === REQUIRED_COVERAGE_IDS.length;
  const canContinue = continueEnabled({ recording, analysing, allCovered });
  const canGenerate = generateEnabled({ recording, analysing, hasContent });
  const speechAvailable = Boolean(speechCtor());

  useEffect(() => {
    if (!speechAvailable) setNoSpeechApi(true);
  }, [speechAvailable]);

  useEffect(() => {
    const t = window.setTimeout(() => saveDraft(draftRef.current), 2000);
    return () => window.clearTimeout(t);
  }, [draft]);

  useEffect(() => {
    return () => {
      draftRef.current.attachments.forEach((a) =>
        URL.revokeObjectURL(a.blobUrl),
      );
    };
  }, []);

  useEffect(() => {
    if (!recording) return;
    const id = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAtRef.current);
    }, 200);
    return () => window.clearInterval(id);
  }, [recording]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const mirror = mirrorRef.current;
    if (!canvas || !mirror) return;
    mirror.scrollTop = canvas.scrollTop;
    mirror.scrollLeft = canvas.scrollLeft;
  }, [recording, interim, draft.transcript]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setHintsOpen(false);
      if (recordingRef.current) stopRecording();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!hintsOpen) return;
    function onDoc(e: MouseEvent) {
      if (hintsRef.current && !hintsRef.current.contains(e.target as Node)) {
        setHintsOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [hintsOpen]);

  function updateTranscript(next: string) {
    if (next.length > TRANSCRIPT_MAX) {
      setLimitHit(true);
      next = next.slice(0, TRANSCRIPT_MAX);
    } else {
      setLimitHit(false);
    }
    setDraft((d) => ({ ...d, transcript: next }));
  }

  async function startRecording() {
    setMicFailed(false);
    setMicBlocked(false);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setMicBlocked(true);
      } else {
        setMicFailed(true);
      }
      return;
    }
    streamRef.current = stream;

    const Ctor = speechCtor();
    if (Ctor) {
      const rec = new Ctor();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-IN";
      rec.onresult = (event) => {
        let finals = "";
        let live = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const piece = event.results[i][0]?.transcript ?? "";
          if (event.results[i].isFinal) finals += piece;
          else live += piece;
        }
        if (finals.trim()) {
          setDraft((d) => {
            const prefix = appendNewlineRef.current && d.transcript.trim()
              ? d.transcript.endsWith("\n")
                ? ""
                : "\n"
              : "";
            appendNewlineRef.current = false;
            const gap =
              d.transcript && !d.transcript.endsWith(" ") && !prefix ? " " : "";
            return {
              ...d,
              transcript: `${d.transcript}${prefix}${gap}${finals.trim()}`.slice(
                0,
                TRANSCRIPT_MAX,
              ),
            };
          });
        }
        setInterim(live.trim());
      };
      rec.onerror = (event) => {
        if (event.error === "no-speech") return;
        if (
          event.error === "not-allowed" ||
          event.error === "service-not-allowed"
        ) {
          setMicBlocked(true);
          stopRecording();
        }
      };
      rec.onend = () => {
        if (recordingRef.current) {
          try {
            rec.start();
          } catch {
            /* already started */
          }
        }
      };
      try {
        rec.start();
        recognitionRef.current = rec;
      } catch {
        setNoSpeechApi(true);
      }
    } else {
      setNoSpeechApi(true);
    }

    appendNewlineRef.current = draftRef.current.transcript.trim() !== "";
    startedAtRef.current = Date.now();
    setElapsedMs(0);
    setInterim("");
    recordingRef.current = true;
    setRecording(true);
  }

  function stopRecording() {
    recordingRef.current = false;
    setRecording(false);
    setInterim("");
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    recognitionRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function addFiles(list: File[]) {
    const { accepted, errors } = ingestFiles(list, draft.attachments.length);
    setFileErrors(errors);
    if (!accepted.length) return;
    setDraft((d) => ({
      ...d,
      attachments: [
        ...d.attachments,
        ...accepted.map((file) => ({
          id: uid(),
          name: file.name,
          mime: file.type,
          sizeBytes: file.size,
          kind: kindFor(file),
          blobUrl: URL.createObjectURL(file),
        })),
      ],
    }));
  }

  function removeAttachment(id: string) {
    setDraft((d) => {
      const file = d.attachments.find((a) => a.id === id);
      if (file) URL.revokeObjectURL(file.blobUrl);
      return {
        ...d,
        attachments: d.attachments.filter((a) => a.id !== id),
      };
    });
  }

  async function analyse(): Promise<JobDraft | null> {
    if (recording || analysing || !hasContent) return null;
    setAnalysing(true);
    await new Promise((r) => setTimeout(r, 1100));
    const current = draftRef.current;
    const extraction =
      current.transcript.trim() === ""
        ? null
        : extractFromTranscript(current.transcript);
    const next = applyExtraction(current, extraction);
    const missing = missingFrom(next);
    setDraft(next);
    setMissingIds(missing);
    saveDraft(next);
    setAnalysing(false);
    window.setTimeout(() => {
      requestAnimationFrame(() => {
        if (missing.length > 0) {
          const scroller = document.querySelector(".layout-content");
          revealMissingDetails(
            scroller instanceof HTMLElement ? scroller : null,
            document.getElementById(MISSING_DETAILS_ID),
          );
          document
            .getElementById(`field-${missing[0]}`)
            ?.focus({ preventScroll: true });
        } else {
          document.getElementById("continue-btn")?.focus();
        }
      });
    }, 0);
    return next;
  }

  function setField(id: CoverageId, value: string) {
    setDraft((d) => {
      const fields = {
        ...d.fields,
        [id]: { value, source: "user" as const },
      };
      const nextCurrency = d.salaryCurrency;
      const nowCovered = isFieldCovered(id, fields, nextCurrency);
      if (!nowCovered && !missingIds.includes(id) && d.analysedOnce) {
        setMissingIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
      }
      return { ...d, fields };
    });
  }

  function setFlag(id: FlagId, value: boolean) {
    setDraft((d) => ({ ...d, flags: { ...d.flags, [id]: value } }));
  }

  const missingVisible = useMemo(() => {
    if (!draft.analysedOnce) return [];
    return REQUIRED_COVERAGE_IDS.filter((id) => missingIds.includes(id));
  }, [draft.analysedOnce, missingIds]);

  const capturedIds = useMemo(() => {
    return REQUIRED_COVERAGE_IDS.filter(
      (id) =>
        isFieldCovered(id, draft.fields, draft.salaryCurrency) &&
        !missingIds.includes(id),
    );
  }, [draft, missingIds]);

  const anyFlag = FLAG_IDS.some((id) => draft.flags[id]);
  const showFlagsBlock = draft.analysedOnce && draft.flagsPromptShown;
  const showFlagsInCaptured =
    showCaptured && anyFlag && !showFlagsBlock;

  function continueNext(from: JobDraft = draftRef.current) {
    saveDraft(from);
    const id = getCurrentJobId() ?? startNewJob();
    upsertJobFromDraft(id, from);
    navigate("/step-2");
  }

  function onContinue() {
    if (!canContinue) return;
    continueNext();
  }

  function onGenerate() {
    if (!canGenerate) return;
    void analyse();
  }

  function jumpToCoverage(id: CoverageId) {
    const on = isFieldCovered(id, draft.fields, draft.salaryCurrency);
    if (!draft.analysedOnce && !on) return;
    setHintsOpen(false);
    if (on) {
      setShowCaptured(true);
      window.setTimeout(() => document.getElementById(`field-${id}`)?.focus(), 0);
    } else if (draft.analysedOnce) {
      document.getElementById(`field-${id}`)?.focus();
    }
  }

  const recordLabel = recording
    ? "Stop recording"
    : draft.transcript.trim() === ""
      ? "Start recording"
      : "Continue recording";

  return (
    <div className="app-shell create-job">
      {micBlocked && (
        <div className="banner">
          Microphone is blocked. Allow it in the browser, or type instead.
        </div>
      )}
      {micFailed && (
        <div className="banner">
          Couldn’t reach the microphone. Type or attach a file instead.
        </div>
      )}
      {noSpeechApi && (
        <div className="banner">
          Live transcription isn’t available in this browser. You can still
          record audio and type the notes.
        </div>
      )}

      <div className="composer-stage">
      <div
        className={`composer${dragging ? " drop" : ""}${recording ? " recording" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles([...e.dataTransfer.files]);
        }}
      >
        <div className="composer-head">
          <div className="composer-status">
            {recording ? (
              <>
                <span className="dot" />
                <span className="timer" aria-live="polite">
                  {formatDuration(elapsedMs)}
                </span>
                <span className="composer-status-label">Recording</span>
              </>
            ) : (
              <span className="composer-status-label">Describe the role</span>
            )}
          </div>
          <div className="hints-wrap" ref={hintsRef}>
            <button
              type="button"
              className="hints-btn"
              aria-label="Hints"
              aria-expanded={hintsOpen}
              aria-controls="hints-popover"
              onClick={() => setHintsOpen((v) => !v)}
            >
              <BulbIcon />
            </button>
            {hintsOpen ? (
              <div
                id="hints-popover"
                className="hints-popover"
                role="dialog"
                aria-label="Coverage hints"
              >
                <p className="hints-intro">
                  Mention these while you talk — we’ll extract them when you
                  Continue.
                </p>
                <ul className="hints-list">
                  {REQUIRED_COVERAGE_IDS.map((id) => {
                    const on = isFieldCovered(
                      id,
                      draft.fields,
                      draft.salaryCurrency,
                    );
                    return (
                      <li key={id}>
                        <button
                          type="button"
                          className={`hint-item${on ? " covered" : draft.analysedOnce ? " missing" : ""}`}
                          onClick={() => jumpToCoverage(id)}
                        >
                          {COVERAGE_LABELS[id]}
                          {draft.analysedOnce ? (
                            <span>{on ? "Covered" : "Missing"}</span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </div>
        </div>

        {fileErrors.length > 0 || draft.attachments.length > 0 ? (
          <div className="composer-attachments">
            {fileErrors.map((err) => (
              <p key={err} className="banner">
                {err}
              </p>
            ))}
            {draft.attachments.length > 0 ? (
              <div className="chips">
                {draft.attachments.map((file) => (
                  <div className="chip" key={file.id}>
                    <b title={file.name}>{file.name}</b>
                    <span>{formatBytes(file.sizeBytes)}</span>
                    {file.kind === "audio" ? (
                      <audio src={file.blobUrl} controls preload="metadata" />
                    ) : null}
                    <button
                      type="button"
                      className="x"
                      aria-label={`Remove ${file.name}`}
                      onClick={() => removeAttachment(file.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="composer-canvas-wrap">
          {recording && interim ? (
            <>
              <div ref={mirrorRef} className="composer-canvas-mirror" aria-hidden="true">{draft.transcript}<span className="interim-inline">{`${liveInterimGap(draft.transcript)}${interim}`}</span></div>
              <span className="sr-only" aria-live="polite">
                {interim}
              </span>
            </>
          ) : null}
          <textarea
            ref={canvasRef}
            className={`composer-canvas${recording && interim ? " live" : ""}`}
            aria-label="Role notes"
            placeholder="Example: Senior backend engineer, 5–8 years, Bangalore hybrid, ₹45–60L, ownership of payments services, on-call OK..."
            value={draft.transcript}
            onChange={(e) => updateTranscript(e.target.value)}
            onScroll={() => {
              const canvas = canvasRef.current;
              const mirror = mirrorRef.current;
              if (!canvas || !mirror) return;
              mirror.scrollTop = canvas.scrollTop;
              mirror.scrollLeft = canvas.scrollLeft;
            }}
            disabled={analysing}
          />
        </div>
        {limitHit ? (
          <p className="limit-note">Transcript limit reached</p>
        ) : null}

        <div className="composer-foot">
          <input
            ref={fileRef}
            type="file"
            hidden
            multiple
            accept={ACCEPT}
            onChange={(e) => {
              addFiles([...e.target.files ?? []]);
              e.target.value = "";
            }}
          />
          <div className="composer-actions">
            <button
              type="button"
              className="composer-tool-btn"
              disabled={recording || analysing}
              onClick={() => fileRef.current?.click()}
            >
              <PaperclipIcon />
              Upload
            </button>
            <button
              type="button"
              className={`composer-tool-btn${recording ? " on" : ""}`}
              onClick={recording ? stopRecording : startRecording}
              disabled={analysing}
              aria-label={recordLabel}
              title={recordLabel}
            >
              {recording ? <StopIcon /> : <MicIcon />}
              {recording ? "Stop" : "Record"}
            </button>
          </div>
          <button
            type="button"
            id="generate-btn"
            className="btn primary"
            disabled={!canGenerate}
            aria-disabled={!canGenerate}
            onClick={onGenerate}
          >
            {generateLabel({ analysing, analysedOnce: draft.analysedOnce })}
          </button>
        </div>

      </div>
      </div>

      {draft.analysedOnce ? (
      <section className="follow-up">
        {missingVisible.length === 0 && (
          <p className="helper" style={{ marginTop: 20 }}>
            All {REQUIRED_COVERAGE_IDS.length} covered. Review them below if you
            want, then continue.
          </p>
        )}

        {missingVisible.length > 0 && (
          <section id={MISSING_DETAILS_ID}>
            <h2 className="follow-up-title">Help us fill the gaps</h2>
            <p className="follow-up-sub">
              We extracted what we could from what you shared. Add the rest, then
              continue.
            </p>
            <FieldGrid
              ids={missingVisible}
              draft={draft}
              required
              onField={setField}
              onCurrency={(v) => setDraft((d) => ({ ...d, salaryCurrency: v }))}
            />
          </section>
        )}

        {showFlagsBlock && (
          <section className="flags">
            <h3>Select to apply</h3>
            <FlagsChoice draft={draft} onFlag={setFlag} />
          </section>
        )}

        {covered >= 1 && (
          <div className="section">
            <button
              type="button"
              className="btn ghost"
              onClick={() => setShowCaptured((v) => !v)}
            >
              {showCaptured
                ? "Hide what we captured"
                : `Show what we captured (${covered})`}
            </button>
            {showCaptured && (
              <div style={{ marginTop: 16 }}>
                <FieldGrid
                  ids={capturedIds}
                  draft={draft}
                  required={false}
                  onField={setField}
                  onCurrency={(v) =>
                    setDraft((d) => ({ ...d, salaryCurrency: v }))
                  }
                />
                {showFlagsInCaptured && (
                  <div className="flags">
                    <h3>Select to apply</h3>
                    <FlagsChoice draft={draft} onFlag={setFlag} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>
      ) : null}

      {draft.analysedOnce ? (
        <footer className="footer">
          <div className="meta">
            {`${covered}/${REQUIRED_COVERAGE_IDS.length} covered`}
          </div>
          <button
            type="button"
            id="continue-btn"
            className="btn primary"
            disabled={!canContinue}
            aria-disabled={!canContinue}
            onClick={onContinue}
          >
            Continue
          </button>
        </footer>
      ) : null}
    </div>
  );
}

const FORM_SECTIONS: { title: string; fields: CoverageId[] }[] = [
  {
    title: "Role",
    fields: ["designation", "experienceYears", "workMode", "experienceType"],
  },
  {
    title: "Company & location",
    fields: ["location", "industryType", "companyType"],
  },
  { title: "Compensation", fields: ["salary"] },
  {
    title: "Must haves & red flags",
    fields: ["mustHaves", "redFlags", "searchStrategy"],
  },
];

const WIDE_FIELDS = new Set<CoverageId>(["searchStrategy"]);

const POINT_FIELDS = new Set<CoverageId>(["mustHaves", "redFlags"]);

const TAG_FIELDS: Partial<Record<CoverageId, readonly string[]>> = {
  location: LOCATION_SUGGESTIONS,
  industryType: INDUSTRY_SUGGESTIONS,
};

const CHOICE_FIELDS: Partial<Record<CoverageId, readonly string[]>> = {
  workMode: WORK_MODE_OPTIONS,
  companyType: COMPANY_TYPE_OPTIONS,
  experienceType: EXPERIENCE_TYPE_OPTIONS,
};

function FlagsChoice({
  draft,
  onFlag,
}: {
  draft: JobDraft;
  onFlag: (id: FlagId, value: boolean) => void;
}) {
  const selected = FLAG_IDS.filter((id) => draft.flags[id]).map(
    (id) => FLAG_LABELS[id],
  );
  return (
    <ChoiceRow
      options={FLAG_IDS.map((id) => FLAG_LABELS[id])}
      value={selected}
      ariaLabel="Select to apply"
      onSelect={(label) => {
        const id = FLAG_IDS.find((item) => FLAG_LABELS[item] === label);
        if (id) onFlag(id, !draft.flags[id]);
      }}
    />
  );
}

function FieldGrid({
  ids,
  draft,
  required,
  onField,
  onCurrency,
}: {
  ids: CoverageId[];
  draft: JobDraft;
  required: boolean;
  onField: (id: CoverageId, value: string) => void;
  onCurrency: (v: Currency | null) => void;
}) {
  if (ids.length === 0) return null;

  function renderField(id: CoverageId) {
    return (
      <FieldControl
        key={id}
        id={id}
        draft={draft}
        required={required}
        onField={onField}
        onCurrency={onCurrency}
      />
    );
  }

  return (
    <>
      {FORM_SECTIONS.map((section) => {
        const visible = section.fields.filter((id) => ids.includes(id));
        if (visible.length === 0) return null;
        return (
          <section className="form-section" key={section.title}>
            <h3 className="form-section-title">{section.title}</h3>
            <div className="form-section-grid">
              {visible.map(renderField)}
            </div>
          </section>
        );
      })}
    </>
  );
}

function FieldControl({
  id,
  draft,
  required,
  onField,
  onCurrency,
}: {
  id: CoverageId;
  draft: JobDraft;
  required: boolean;
  onField: (id: CoverageId, value: string) => void;
  onCurrency: (v: Currency | null) => void;
}) {
  const inputId = `field-${id}`;
  const value = draft.fields[id].value;
  const choiceOptions = CHOICE_FIELDS[id];
  let control;
  if (id === "salary") {
    control = (
      <SalaryInput
        id={inputId}
        value={value}
        currency={draft.salaryCurrency}
        onChange={(next) => onField(id, next)}
        onCurrency={onCurrency}
      />
    );
  } else if (id === "searchStrategy") {
    control = (
      <textarea
        id={inputId}
        className="pill-input area-input"
        value={value}
        onChange={(e) => onField(id, e.target.value)}
      />
    );
  } else if (POINT_FIELDS.has(id)) {
    control = (
      <PointList
        id={inputId}
        value={value}
        onChange={(next) => onField(id, next)}
      />
    );
  } else if (id in TAG_FIELDS) {
    control = (
      <TagInput
        id={inputId}
        value={value}
        suggestions={TAG_FIELDS[id] ?? []}
        onChange={(next) => onField(id, next)}
      />
    );
  } else if (choiceOptions) {
    control = (
      <ChoiceRow
        id={inputId}
        options={choiceOptions}
        value={value}
        ariaLabel={COVERAGE_LABELS[id]}
        onSelect={(option) => onField(id, option)}
      />
    );
  } else {
    control = (
      <input
        id={inputId}
        className="pill-input"
        value={value}
        onChange={(e) => onField(id, e.target.value)}
      />
    );
  }
  return (
    <div className={`field${WIDE_FIELDS.has(id) ? " field-wide" : ""}`}>
      <label htmlFor={inputId}>
        {COVERAGE_LABELS[id]}
        {required ? <span className="req">*</span> : null}
      </label>
      {control}
    </div>
  );
}

function BulbIcon() {
  return (
    <svg
      className="bulb-icon"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 2.5a4 4 0 0 0-2.2 7.3c.4.3.7.8.7 1.3v.4h3v-.4c0-.5.3-1 .7-1.3A4 4 0 0 0 8 2.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M6.5 12.5h3M7 13.5h2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PaperclipIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M10.2 4.4 5.1 9.5a2.2 2.2 0 1 0 3.1 3.1l5.3-5.3a3.5 3.5 0 0 0-4.9-4.9L3.3 7.7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="6.5" y="2.5" width="5" height="8" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M4.5 8.5a4.5 4.5 0 0 0 9 0M9 13v2.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="2.5" y="2.5" width="9" height="9" rx="1.5" fill="currentColor" />
    </svg>
  );
}
