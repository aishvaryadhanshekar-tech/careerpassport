import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MISSING_DETAILS_ID,
  revealMissingDetails,
} from "./analysisScroll";
import { applyExtraction } from "./applyAnalysis";
import { continueEnabled, generateEnabled } from "./continueAction";
import { extractFromTranscript } from "./extractJobFields";
import { getCurrentJobId, startNewJob, upsertJobFromDraft } from "./jobsStore";
import { loadDraft, saveDraft } from "./storage";
import { Composer } from "./collectJob/Composer";
import { FieldGrid, FlagsChoice } from "./collectJob/JobFieldsForm";
import { useAttachments } from "./collectJob/useAttachments";
import { useSpeechRecording } from "./collectJob/useSpeechRecording";
import {
  COVERAGE_IDS,
  REQUIRED_COVERAGE_IDS,
  FLAG_IDS,
  coveredCount,
  isFieldCovered,
  type CoverageId,
  type FlagId,
  type JobDraft,
} from "./types";

function missingFrom(draft: JobDraft): CoverageId[] {
  if (!draft.analysedOnce) return [];
  return REQUIRED_COVERAGE_IDS.filter(
    (id) => !isFieldCovered(id, draft.fields, draft.salaryCurrency),
  );
}

export function CollectJobPage() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<JobDraft>(() => loadDraft());
  const [analysing, setAnalysing] = useState(false);
  const [buildPhase, setBuildPhase] = useState(0);
  const [missingIds, setMissingIds] = useState<CoverageId[]>(() =>
    missingFrom(loadDraft()),
  );
  const [hintsOpen, setHintsOpen] = useState(false);

  const draftRef = useRef(draft);
  draftRef.current = draft;

  const {
    recording,
    interim,
    elapsedMs,
    micBlocked,
    micFailed,
    noSpeechApi,
    limitHit,
    recordingRef,
    updateTranscript,
    startRecording,
    stopRecording,
  } = useSpeechRecording({ draftRef, setDraft });

  const { fileErrors, addFiles, removeAttachment } = useAttachments({
    draftRef,
    setDraft,
    attachmentCount: draft.attachments.length,
  });

  const covered = coveredCount(draft.fields, draft.salaryCurrency);
  const hasContent =
    draft.transcript.trim() !== "" || draft.attachments.length > 0;
  const allCovered = covered === REQUIRED_COVERAGE_IDS.length;
  const canContinue = continueEnabled({ recording, analysing, allCovered });
  const canGenerate = generateEnabled({ recording, analysing, hasContent });

  useEffect(() => {
    const t = window.setTimeout(() => saveDraft(draftRef.current), 2000);
    return () => window.clearTimeout(t);
  }, [draft]);

  useEffect(() => {
    if (!analysing) {
      setBuildPhase(0);
      return;
    }
    const id = window.setInterval(() => {
      setBuildPhase((p) => p + 1);
    }, 850);
    return () => window.clearInterval(id);
  }, [analysing]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setHintsOpen(false);
      if (recordingRef.current) stopRecording();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function analyse(): Promise<JobDraft | null> {
    if (recording || analysing || !hasContent) return null;
    setAnalysing(true);
    await new Promise((r) => setTimeout(r, 3400));
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

  function setExpectedSkills(next: string) {
    setDraft((d) => ({ ...d, preview: { ...d.preview, expectedSkills: next } }));
  }

  function setFlag(id: FlagId, value: boolean) {
    setDraft((d) => ({ ...d, flags: { ...d.flags, [id]: value } }));
  }

  const missingVisible = useMemo(() => {
    if (!draft.analysedOnce) return [];
    return REQUIRED_COVERAGE_IDS.filter((id) => missingIds.includes(id));
  }, [draft.analysedOnce, missingIds]);

  const anyFlag = FLAG_IDS.some((id) => draft.flags[id]);
  const showFlagsBlock = draft.analysedOnce && (draft.flagsPromptShown || anyFlag);

  function continueNext(from: JobDraft = draftRef.current) {
    saveDraft(from);
    const id = getCurrentJobId() ?? startNewJob();
    upsertJobFromDraft(id, from);
    navigate("/role-profile");
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
    window.setTimeout(() => document.getElementById(`field-${id}`)?.focus(), 0);
  }

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

      <Composer
        draft={draft}
        recording={recording}
        interim={interim}
        elapsedMs={elapsedMs}
        analysing={analysing}
        buildPhase={buildPhase}
        limitHit={limitHit}
        fileErrors={fileErrors}
        canGenerate={canGenerate}
        hintsOpen={hintsOpen}
        onHintsToggle={() => setHintsOpen((v) => !v)}
        onHintsClose={() => setHintsOpen(false)}
        onJumpToCoverage={jumpToCoverage}
        addFiles={addFiles}
        removeAttachment={removeAttachment}
        updateTranscript={updateTranscript}
        startRecording={startRecording}
        stopRecording={stopRecording}
        onGenerate={onGenerate}
      />

      {draft.analysedOnce ? (
      <section className="follow-up">
        <section id={MISSING_DETAILS_ID}>
          <h2 className="follow-up-title">Job details</h2>
          <p className="follow-up-sub">
            {missingVisible.length > 0
              ? "We've pre-filled what we could from what you shared. Fields outlined in red still need your input."
              : `All ${REQUIRED_COVERAGE_IDS.length} required fields covered. Review the rest below if you want, then continue.`}
          </p>
          <FieldGrid
            ids={COVERAGE_IDS}
            draft={draft}
            missingIds={missingVisible}
            onField={setField}
            onCurrency={(v) => setDraft((d) => ({ ...d, salaryCurrency: v }))}
            onExpectedSkills={setExpectedSkills}
          />
        </section>

        {showFlagsBlock && (
          <section className="flags">
            <h3>Select to apply</h3>
            <FlagsChoice draft={draft} onFlag={setFlag} />
          </section>
        )}
      </section>
      ) : null}

      {draft.analysedOnce ? (
        <footer className="footer">
          <div className="meta">
            {`${covered}/${REQUIRED_COVERAGE_IDS.length} covered`}
          </div>
          <div className="footer-actions">
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
          </div>
        </footer>
      ) : null}
    </div>
  );
}
