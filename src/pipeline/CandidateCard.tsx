import { useEffect, useRef, useState, type JSX } from "react";
import { SendMessageMenu } from "../communications/SendMessageMenu";
import {
  AI_FLAG_LABELS,
  AI_FLAG_SHORT_LABELS,
  ARCHIVE_STAGE_ID,
  type Candidate,
  type MessageTemplate,
  type PipelineStage,
  type TemplateValues,
} from "../types";

function originLabel(candidate: Candidate): string {
  return candidate.origin.kind === "applied"
    ? "Application submitted"
    : `Submitted by ${candidate.origin.by}`;
}

/**
 * The ⋯ menu. Exists so stage moves are possible without dragging — drag-and-drop alone is
 * unusable by keyboard and awkward on touch.
 */
function CardMenu({
  candidate,
  stages,
  onMove,
  onSendTrip,
  onSchedule,
}: {
  candidate: Candidate;
  stages: PipelineStage[];
  onMove: (stageId: string) => void;
  onSendTrip: () => void;
  onSchedule: () => void;
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="card-menu-wrap" ref={wrapRef}>
      <button
        type="button"
        className="card-menu-btn"
        aria-label={`Actions for ${candidate.name}`}
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        ⋯
      </button>
      {open ? (
        <div className="card-menu" role="menu" onClick={(e) => e.stopPropagation()}>
          <span className="card-menu-label">Move to</span>
          {stages.map((stage) => (
            <button
              key={stage.id}
              type="button"
              role="menuitem"
              disabled={stage.id === candidate.stageId}
              onClick={() => {
                onMove(stage.id);
                setOpen(false);
              }}
            >
              {stage.label}
            </button>
          ))}
          <span className="card-menu-label">Actions</span>
          <button
            type="button"
            role="menuitem"
            disabled={candidate.tripStatus !== "none"}
            onClick={() => {
              onSendTrip();
              setOpen(false);
            }}
          >
            {candidate.tripStatus === "none" ? "Send Trip" : "Trip already sent"}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onSchedule();
              setOpen(false);
            }}
          >
            {candidate.interviewAt ? "Reschedule interview" : "Schedule interview"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** Marks the verdict as AI-produced. Same four-point sparkle the AI build loader uses, so
 * provenance reads the same way across the app. */
function SparkleIcon(): JSX.Element {
  return (
    <svg
      className="candidate-verdict-star"
      width="11"
      height="11"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 1c.5 3.1 1.2 4.5 2.4 5.3C11.4 7 12.9 7.5 15 8c-3.1.5-4.5 1.2-5.3 2.4C9 11.4 8.5 12.9 8 15c-.5-3.1-1.2-4.5-2.4-5.3C4.6 9 3.1 8.5 1 8c3.1-.5 4.5-1.2 5.3-2.4C7 4.6 7.5 3.1 8 1Z" />
    </svg>
  );
}

export function CandidateCard({
  candidate,
  stages,
  onOpen,
  onMove,
  onSendTrip,
  onSchedule,
  onSendMessage,
  templateValues,
  onDragStateChange,
}: {
  candidate: Candidate;
  stages: PipelineStage[];
  onOpen: () => void;
  onMove: (stageId: string) => void;
  onSendTrip: () => void;
  onSchedule: () => void;
  onSendMessage: (template: MessageTemplate) => void;
  templateValues: TemplateValues;
  onDragStateChange: (dragging: boolean) => void;
}): JSX.Element {
  const [dragging, setDragging] = useState(false);
  // One primary action per card, by precedence. A candidate with no Trip yet needs one
  // whatever column they were dragged into, so this is no longer gated on Applied — moving
  // someone to Screened or Interviewing surfaces the CTA there instead of hiding it.
  // Archive is terminal, so it gets no primary action at all.
  const needsTrip =
    candidate.tripStatus === "none" && candidate.stageId !== ARCHIVE_STAGE_ID;
  const needsInterview =
    !needsTrip && candidate.stageId === "interviewing" && !candidate.interviewAt;

  return (
    <div
      className={`candidate-card${dragging ? " is-dragging" : ""}`}
      role="button"
      tabIndex={0}
      draggable
      aria-label={`${candidate.name}, ${originLabel(candidate)}`}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", candidate.id);
        e.dataTransfer.effectAllowed = "move";
        setDragging(true);
        onDragStateChange(true);
      }}
      onDragEnd={() => {
        setDragging(false);
        onDragStateChange(false);
      }}
    >
      <div className="candidate-card-top">
        <span className="candidate-card-name">{candidate.name}</span>
        {/* Beside the name: the AI verdict is the second thing a hiring manager needs, and
          * down in the chip row it had the same shape and weight as the neutral origin and
          * score chips, so nothing won the eye. */}
        {candidate.aiFlag ? (
          <span
            className={`candidate-verdict verdict-${candidate.aiFlag}`}
            title={AI_FLAG_LABELS[candidate.aiFlag]}
          >
            <SparkleIcon />
            {AI_FLAG_SHORT_LABELS[candidate.aiFlag]}
          </span>
        ) : null}
        <CardMenu
          candidate={candidate}
          stages={stages}
          onMove={onMove}
          onSendTrip={onSendTrip}
          onSchedule={onSchedule}
        />
      </div>

      <p className="candidate-card-meta">{candidate.location}</p>
      {/* "Application submitted" is true of every applicant, so the chip carried no signal
        * and just added a row. A referral is worth surfacing, so that variant stays. */}
      {candidate.origin.kind === "submitted_by" ? (
        <span className="candidate-card-origin">{originLabel(candidate)}</span>
      ) : null}

      {candidate.tripStatus !== "none" ? (
        <div className="candidate-card-chips">
          {candidate.tripStatus === "sent" ? (
            <span className="trip-pending">Trip sent</span>
          ) : null}
          {typeof candidate.tripScore === "number" ? (
            <span className="candidate-score">Trip Score: {candidate.tripScore}</span>
          ) : null}
        </div>
      ) : null}

      {/* One action row on every card, so the primary action — whichever stage supplies it —
        * always sits in the same place and Message is a consistent secondary beside it. */}
      <div className="candidate-card-actions">
        {needsTrip ? (
          <button
            type="button"
            className="btn primary candidate-card-action"
            onClick={(e) => {
              e.stopPropagation();
              onSendTrip();
            }}
          >
            Send Trip
          </button>
        ) : null}

        {needsInterview ? (
          <button
            type="button"
            className="btn primary candidate-card-action"
            onClick={(e) => {
              e.stopPropagation();
              onSchedule();
            }}
          >
            Schedule interview
          </button>
        ) : null}

        <SendMessageMenu
          stageId={candidate.stageId}
          values={templateValues}
          buttonClassName="btn candidate-card-icon"
          iconOnly
          onSend={onSendMessage}
        />
      </div>
    </div>
  );
}
