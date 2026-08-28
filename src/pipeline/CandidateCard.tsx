import { useEffect, useRef, useState, type JSX } from "react";
import {
  AI_FLAG_LABELS,
  APPLIED_STAGE_ID,
  type Candidate,
  type PipelineStage,
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

export function CandidateCard({
  candidate,
  stages,
  onOpen,
  onMove,
  onSendTrip,
  onSchedule,
  onDragStateChange,
}: {
  candidate: Candidate;
  stages: PipelineStage[];
  onOpen: () => void;
  onMove: (stageId: string) => void;
  onSendTrip: () => void;
  onSchedule: () => void;
  onDragStateChange: (dragging: boolean) => void;
}): JSX.Element {
  const [dragging, setDragging] = useState(false);
  const isApplied = candidate.stageId === APPLIED_STAGE_ID;
  const isInterviewing = candidate.stageId === "interviewing";

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
        <CardMenu
          candidate={candidate}
          stages={stages}
          onMove={onMove}
          onSendTrip={onSendTrip}
          onSchedule={onSchedule}
        />
      </div>

      <p className="candidate-card-meta">{candidate.location}</p>
      <span className="candidate-card-origin">{originLabel(candidate)}</span>

      {candidate.tripStatus !== "none" ? (
        <div className="candidate-card-chips">
          {candidate.tripStatus === "sent" ? (
            <span className="trip-pending">Trip sent</span>
          ) : null}
          {typeof candidate.tripScore === "number" ? (
            <span className="candidate-score">Trip {candidate.tripScore}</span>
          ) : null}
          {candidate.aiFlag ? (
            <span className={`ai-flag ai-flag-${candidate.aiFlag}`}>
              {AI_FLAG_LABELS[candidate.aiFlag]}
            </span>
          ) : null}
        </div>
      ) : null}

      {isApplied && candidate.tripStatus === "none" ? (
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

      {isInterviewing && !candidate.interviewAt ? (
        <button
          type="button"
          className="btn ghost candidate-card-action"
          onClick={(e) => {
            e.stopPropagation();
            onSchedule();
          }}
        >
          Schedule interview
        </button>
      ) : null}
    </div>
  );
}
