import { useEffect, useRef, useState } from "react";
import { generateLabel } from "../continueAction";
import { ACCEPT, formatBytes, formatDuration } from "../files";
import { liveInterimGap } from "../liveTranscript";
import type { CoverageId, JobDraft } from "../types";
import { CoverageHints } from "./CoverageHints";
import { MicIcon, PaperclipIcon, SparkleIcon, StopIcon } from "./icons";

export function Composer({
  draft,
  recording,
  interim,
  elapsedMs,
  analysing,
  buildPhase,
  limitHit,
  fileErrors,
  canGenerate,
  hintsOpen,
  onHintsToggle,
  onHintsClose,
  onJumpToCoverage,
  addFiles,
  removeAttachment,
  updateTranscript,
  startRecording,
  stopRecording,
  onGenerate,
}: {
  draft: JobDraft;
  recording: boolean;
  interim: string;
  elapsedMs: number;
  analysing: boolean;
  buildPhase: number;
  limitHit: boolean;
  fileErrors: string[];
  canGenerate: boolean;
  hintsOpen: boolean;
  onHintsToggle: () => void;
  onHintsClose: () => void;
  onJumpToCoverage: (id: CoverageId) => void;
  addFiles: (list: File[]) => void;
  removeAttachment: (id: string) => void;
  updateTranscript: (next: string) => void;
  startRecording: () => void;
  stopRecording: () => void;
  onGenerate: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const mirror = mirrorRef.current;
    if (!canvas || !mirror) return;
    mirror.scrollTop = canvas.scrollTop;
    mirror.scrollLeft = canvas.scrollLeft;
  }, [recording, interim, draft.transcript]);

  const recordLabel = recording
    ? "Stop recording"
    : draft.transcript.trim() === ""
      ? "Start recording"
      : "Continue recording";

  return (
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
          <CoverageHints
            draft={draft}
            open={hintsOpen}
            onToggle={onHintsToggle}
            onClose={onHintsClose}
            onJump={onJumpToCoverage}
          />
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
          {analysing ? (
            <span className="build-loading" aria-live="polite">
              <SparkleIcon />
              <span className="build-loading-text">
                {generateLabel({ analysing, analysedOnce: draft.analysedOnce, buildPhase })}
              </span>
            </span>
          ) : (
            <button
              type="button"
              id="generate-btn"
              className="btn primary"
              disabled={!canGenerate}
              aria-disabled={!canGenerate}
              onClick={onGenerate}
            >
              <SparkleIcon />
              {generateLabel({ analysing: false, analysedOnce: draft.analysedOnce })}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
