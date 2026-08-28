import { useRef, useState, type JSX } from "react";
import {
  addStage,
  countsByStage,
  getBoard,
  moveCandidate,
  scheduleInterview,
  sendMessage,
  setTripStatus,
} from "../candidatesStore";
import { useJobContext } from "../job/jobContext";
import { PROFILE } from "../profile";
import type { Candidate, PipelineBoard, PipelineStage, TemplateValues } from "../types";
import { CandidateCard } from "./CandidateCard";
import { CandidateDrawer } from "./CandidateDrawer";
import "./pipeline.css";

/** Placeholder until the workspace/org model carries a real company name. */
const COMPANY_NAME = "Conte";

function StageColumn({
  stage,
  candidates,
  count,
  isDropTarget,
  onDropCandidate,
  onDragOverColumn,
  onDragLeaveColumn,
  children,
}: {
  stage: PipelineStage;
  candidates: Candidate[];
  count: number;
  isDropTarget: boolean;
  onDropCandidate: (candidateId: string) => void;
  onDragOverColumn: () => void;
  onDragLeaveColumn: () => void;
  children: (candidate: Candidate) => JSX.Element;
}): JSX.Element {
  return (
    <section
      className={`pipeline-column${isDropTarget ? " is-drop-target" : ""}`}
      aria-label={`${stage.label}, ${count} candidate${count === 1 ? "" : "s"}`}
      onDragOver={(e) => {
        // Without preventDefault the browser refuses the drop entirely.
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        onDragOverColumn();
      }}
      onDragLeave={onDragLeaveColumn}
      onDrop={(e) => {
        e.preventDefault();
        const id = e.dataTransfer.getData("text/plain");
        if (id) onDropCandidate(id);
      }}
    >
      <header className="pipeline-column-head">
        <span className="pipeline-column-title">{stage.label}</span>
        <span className={`pipeline-count${count > 0 ? " is-filled" : ""}`}>{count}</span>
      </header>
      <div className="pipeline-column-body">
        {candidates.length === 0 ? (
          <p className="pipeline-empty-slot">Drop candidates here</p>
        ) : (
          candidates.map((candidate) => children(candidate))
        )}
      </div>
    </section>
  );
}

function AddStage({ onAdd }: { onAdd: (label: string) => void }): JSX.Element {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function submit() {
    if (label.trim() === "") return;
    onAdd(label);
    setLabel("");
    setOpen(false);
  }

  if (!open) {
    return (
      <div className="pipeline-add-stage">
        <button
          type="button"
          className="pipeline-add-stage-btn"
          onClick={() => {
            setOpen(true);
            window.setTimeout(() => inputRef.current?.focus(), 0);
          }}
        >
          + Add Stage
        </button>
      </div>
    );
  }

  return (
    <div className="pipeline-add-stage">
      <div className="pipeline-add-stage-form">
        <input
          ref={inputRef}
          className="pill-input"
          placeholder="Stage name"
          aria-label="New stage name"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") {
              setLabel("");
              setOpen(false);
            }
          }}
        />
        <div className="pipeline-add-stage-actions">
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              setLabel("");
              setOpen(false);
            }}
          >
            Cancel
          </button>
          <button type="button" className="btn primary" onClick={submit}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

export function PipelineTab(): JSX.Element {
  const { jobId, draft } = useJobContext();
  const [board, setBoard] = useState<PipelineBoard>(() => getBoard(jobId));
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [openCandidateId, setOpenCandidateId] = useState<string | null>(null);

  const counts = countsByStage(board);
  const jobTitle = draft.fields.designation.value.trim() || "this role";

  /** Token values for a message template. Stage label, not id — it renders in the body. */
  function templateValuesFor(candidate: Candidate): TemplateValues {
    const stage = board.stages.find((s) => s.id === candidate.stageId);
    return {
      candidate_name: candidate.name,
      job_title: jobTitle,
      company: COMPANY_NAME,
      sender_name: PROFILE.name,
      stage: stage?.label ?? "current",
    };
  }
  const openCandidate = openCandidateId
    ? (board.candidates.find((c) => c.id === openCandidateId) ?? null)
    : null;

  function handleDrop(stageId: string, candidateId: string) {
    setDropTarget(null);
    setBoard(moveCandidate(jobId, candidateId, stageId));
  }

  return (
    <>
      <div className="pipeline-board">
        {board.stages.map((stage) => (
          <StageColumn
            key={stage.id}
            stage={stage}
            count={counts[stage.id] ?? 0}
            candidates={board.candidates.filter((c) => c.stageId === stage.id)}
            isDropTarget={dropTarget === stage.id}
            onDragOverColumn={() => setDropTarget(stage.id)}
            onDragLeaveColumn={() =>
              setDropTarget((current) => (current === stage.id ? null : current))
            }
            onDropCandidate={(candidateId) => handleDrop(stage.id, candidateId)}
          >
            {(candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                stages={board.stages}
                onOpen={() => setOpenCandidateId(candidate.id)}
                onMove={(toStageId) => setBoard(moveCandidate(jobId, candidate.id, toStageId))}
                onSendTrip={() => setBoard(setTripStatus(jobId, candidate.id, "sent"))}
                onSendMessage={(template) =>
                  setBoard(
                    sendMessage(jobId, candidate.id, template, templateValuesFor(candidate)),
                  )
                }
                templateValues={templateValuesFor(candidate)}
                onSchedule={() =>
                  // Prototype: schedule two days out rather than opening a date picker.
                  setBoard(
                    scheduleInterview(jobId, candidate.id, Date.now() + 2 * 24 * 60 * 60 * 1000),
                  )
                }
                onDragStateChange={(dragging) => {
                  if (!dragging) setDropTarget(null);
                }}
              />
            )}
          </StageColumn>
        ))}

        <AddStage onAdd={(label) => setBoard(addStage(jobId, label))} />
      </div>

      {openCandidate ? (
        <CandidateDrawer
          jobId={jobId}
          candidate={openCandidate}
          criteria={draft.roleProfile.evaluationFramework}
          stages={board.stages}
          onClose={() => setOpenCandidateId(null)}
          onBoardChange={setBoard}
        />
      ) : null}
    </>
  );
}
