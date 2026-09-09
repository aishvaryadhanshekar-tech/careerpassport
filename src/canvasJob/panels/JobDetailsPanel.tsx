import { useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { MISSING_DETAILS_ID, revealMissingDetails } from "../../analysisScroll";
import { applyExtraction } from "../../applyAnalysis";
import { generateEnabled } from "../../continueAction";
import { extractFromTranscript } from "../../extractJobFields";
import { Composer } from "../../collectJob/Composer";
import { FieldGrid, FlagsChoice } from "../../collectJob/JobFieldsForm";
import { useAttachments } from "../../collectJob/useAttachments";
import { useSpeechRecording } from "../../collectJob/useSpeechRecording";
import {
  COVERAGE_IDS,
  FLAG_IDS,
  REQUIRED_COVERAGE_IDS,
  isFieldCovered,
  type CoverageId,
  type FlagId,
  type JobDraft,
} from "../../types";

function missingFrom(draft: JobDraft): CoverageId[] {
  if (!draft.analysedOnce) return [];
  return REQUIRED_COVERAGE_IDS.filter(
    (id) => !isFieldCovered(id, draft.fields, draft.salaryCurrency),
  );
}

export function JobDetailsPanel({
  draft,
  setDraft,
  startInRecording,
}: {
  draft: JobDraft;
  setDraft: Dispatch<SetStateAction<JobDraft>>;
  startInRecording: boolean;
}) {
  const [analysing, setAnalysing] = useState(false);
  const [buildPhase, setBuildPhase] = useState(0);
  const [missingIds, setMissingIds] = useState<CoverageId[]>(() => missingFrom(draft));
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
    updateTranscript,
    startRecording,
    stopRecording,
  } = useSpeechRecording({ draftRef, setDraft });

  const { fileErrors, addFiles, removeAttachment } = useAttachments({
    draftRef,
    setDraft,
    attachmentCount: draft.attachments.length,
  });

  const startedRecordingRef = useRef(false);
  useEffect(() => {
    if (startInRecording && !startedRecordingRef.current) {
      startedRecordingRef.current = true;
      void startRecording();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startInRecording]);

  useEffect(() => {
    if (!analysing) {
      setBuildPhase(0);
      return;
    }
    const id = window.setInterval(() => setBuildPhase((p) => p + 1), 850);
    return () => window.clearInterval(id);
  }, [analysing]);

  const hasContent = draft.transcript.trim() !== "" || draft.attachments.length > 0;
  const canGenerate = generateEnabled({ recording, analysing, hasContent });

  async function analyse() {
    if (recording || analysing || !hasContent) return;
    setAnalysing(true);
    await new Promise((r) => setTimeout(r, 3400));
    const current = draftRef.current;
    const extraction =
      current.transcript.trim() === "" ? null : extractFromTranscript(current.transcript);
    const next = applyExtraction(current, extraction);
    const missing = missingFrom(next);
    setDraft(next);
    setMissingIds(missing);
    setAnalysing(false);
    window.setTimeout(() => {
      requestAnimationFrame(() => {
        if (missing.length > 0) {
          const scroller = document.querySelector(".canvas-panel-body");
          revealMissingDetails(
            scroller instanceof HTMLElement ? scroller : null,
            document.getElementById(MISSING_DETAILS_ID),
          );
          document.getElementById(`field-${missing[0]}`)?.focus({ preventScroll: true });
        }
      });
    }, 0);
  }

  function setField(id: CoverageId, value: string) {
    setDraft((d) => {
      const fields = { ...d.fields, [id]: { value, source: "user" as const } };
      const nowCovered = isFieldCovered(id, fields, d.salaryCurrency);
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

  function jumpToCoverage(id: CoverageId) {
    const on = isFieldCovered(id, draft.fields, draft.salaryCurrency);
    if (!draft.analysedOnce && !on) return;
    setHintsOpen(false);
    window.setTimeout(() => document.getElementById(`field-${id}`)?.focus(), 0);
  }

  const missingVisible = useMemo(() => {
    if (!draft.analysedOnce) return [];
    return REQUIRED_COVERAGE_IDS.filter((id) => missingIds.includes(id));
  }, [draft.analysedOnce, missingIds]);

  const anyFlag = FLAG_IDS.some((id) => draft.flags[id]);
  const showFlagsBlock = draft.analysedOnce && (draft.flagsPromptShown || anyFlag);

  return (
    <div className="canvas-panel-scroll">
      {micBlocked && <div className="banner">Microphone is blocked. Allow it in the browser, or type instead.</div>}
      {micFailed && <div className="banner">Couldn’t reach the microphone. Type or attach a file instead.</div>}
      {noSpeechApi && (
        <div className="banner">
          Live transcription isn’t available in this browser. You can still record audio and type the notes.
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
        onGenerate={() => void analyse()}
      />

      {draft.analysedOnce ? (
        <section className="follow-up">
          <section id={MISSING_DETAILS_ID}>
            <h2 className="follow-up-title">Job details</h2>
            <p className="follow-up-sub">
              {missingVisible.length > 0
                ? "Complete the highlighted fields."
                : `All ${REQUIRED_COVERAGE_IDS.length} required fields covered.`}
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
    </div>
  );
}
