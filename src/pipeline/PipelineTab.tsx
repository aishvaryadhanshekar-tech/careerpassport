import { useMemo, useRef, useState, type JSX } from "react";
import {
  addStage,
  bulkMoveCandidates,
  bulkSendMessage,
  countsByStage,
  getBoard,
  moveCandidate,
  scheduleInterview,
  sendMessage,
  setTripStatus,
} from "../candidatesStore";
import { SendMessageMenu } from "../communications/SendMessageMenu";
import { useJobContext } from "../job/jobContext";
import { PROFILE } from "../profile";
import {
  ARCHIVE_STAGE_ID,
  type Candidate,
  type MessageTemplate,
  type PipelineBoard,
  type PipelineStage,
  type TemplateValues,
} from "../types";
import { BulkActionsBar } from "./BulkActionsBar";
import { CandidateCard } from "./CandidateCard";
import { CandidateDrawer } from "./CandidateDrawer";
import {
  CandidateFilterBar,
  CandidateTable,
  ColumnPickerButton,
  type ColumnId,
} from "./CandidateTable";
import { EMPTY_CANDIDATE_FILTERS, filterCandidates, type CandidateFilters } from "./pipelineFilters";
import "./pipeline.css";
import { loadVisibleColumns, saveVisibleColumns } from "../pipelineColumnsPref";

/** Placeholder until the workspace/org model carries a real company name. */
const COMPANY_NAME = "Conte";

/** No template's scope names this id, so templatesForStage(stageId) falls through to just
 * the stage-agnostic ("all") templates — exactly what a mixed-stage bulk selection needs. */
const MIXED_STAGE_SENTINEL = "__mixed__";

function StageColumn({
  stage,
  candidates,
  count,
  isDropTarget,
  onDropCandidate,
  onDragOverColumn,
  onDragLeaveColumn,
  selectAllChecked,
  selectAllIndeterminate,
  onToggleColumnSelect,
  children,
}: {
  stage: PipelineStage;
  candidates: Candidate[];
  count: number;
  isDropTarget: boolean;
  onDropCandidate: (candidateId: string) => void;
  onDragOverColumn: () => void;
  onDragLeaveColumn: () => void;
  selectAllChecked: boolean;
  selectAllIndeterminate: boolean;
  onToggleColumnSelect: (on: boolean) => void;
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
        {candidates.length > 0 ? (
          <input
            type="checkbox"
            className="pipeline-column-select"
            checked={selectAllChecked}
            ref={(el) => {
              if (el) el.indeterminate = selectAllIndeterminate;
            }}
            onChange={(e) => onToggleColumnSelect(e.target.checked)}
            aria-label={`Select all candidates in ${stage.label}`}
          />
        ) : null}
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

function BoardIcon(): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.5" y="2" width="4" height="12" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="6.5" y="2" width="4" height="8" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="11.5" y="2" width="3" height="10" rx="1" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function TableIcon(): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.5" y="2" width="13" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M1.5 6.5h13M1.5 10.5h13M6 2v12" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function PipelineTab(): JSX.Element {
  const { jobId, draft } = useJobContext();
  const [board, setBoard] = useState<PipelineBoard>(() => getBoard(jobId));
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [openCandidateId, setOpenCandidateId] = useState<string | null>(null);
  const [view, setView] = useState<"board" | "table">("board");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<CandidateFilters>(EMPTY_CANDIDATE_FILTERS);
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnId>>(() => loadVisibleColumns());

  function handleVisibleColumnsChange(next: Set<ColumnId>) {
    setVisibleColumns(next);
    saveVisibleColumns(next);
  }

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

  function toggleOne(id: string, on: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleMany(ids: string[], on: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      for (const id of ids) {
        if (on) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  const visibleCandidates = useMemo(
    () => filterCandidates(board.candidates, filters),
    [board.candidates, filters],
  );

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    for (const candidate of board.candidates) {
      for (const tag of candidate.tags) tags.add(tag);
    }
    return [...tags].sort();
  }, [board.candidates]);

  const selectedCandidates = useMemo(
    () => board.candidates.filter((c) => selected.has(c.id)),
    [board.candidates, selected],
  );

  const commonStageId =
    selectedCandidates.length > 0 &&
    selectedCandidates.every((c) => c.stageId === selectedCandidates[0].stageId)
      ? selectedCandidates[0].stageId
      : MIXED_STAGE_SENTINEL;

  const bulkPreviewValues: TemplateValues = {
    candidate_name: selectedCandidates.length === 1 ? selectedCandidates[0].name : "the candidate",
    job_title: jobTitle,
    company: COMPANY_NAME,
    sender_name: PROFILE.name,
    stage:
      commonStageId !== MIXED_STAGE_SENTINEL
        ? (board.stages.find((s) => s.id === commonStageId)?.label ?? "current")
        : "their current stage",
  };

  function handleBulkMove(toStageId: string) {
    setBoard(bulkMoveCandidates(jobId, [...selected], toStageId));
    clearSelection();
  }

  function handleBulkArchive() {
    setBoard(bulkMoveCandidates(jobId, [...selected], ARCHIVE_STAGE_ID));
    clearSelection();
  }

  function handleBulkSend(template: MessageTemplate) {
    setBoard(bulkSendMessage(jobId, [...selected], template, templateValuesFor));
    clearSelection();
  }

  return (
    <>
      <div className="pipeline-toolbar">
        <div className={`pipeline-toolbar-row${selected.size > 0 ? " is-sticky" : ""}`}>
          <div className="pipeline-toolbar-left">
            {selected.size > 0 ? (
              <BulkActionsBar
                selectedCount={selected.size}
                stages={board.stages}
                onClear={clearSelection}
                onMoveToStage={handleBulkMove}
                onArchive={handleBulkArchive}
                sendMessageSlot={
                  <SendMessageMenu
                    stageId={commonStageId}
                    values={bulkPreviewValues}
                    buttonClassName="btn"
                    onSend={handleBulkSend}
                  />
                }
              />
            ) : view === "table" ? (
              <>
                <CandidateFilterBar
                  filters={filters}
                  onChange={setFilters}
                  stages={board.stages}
                  availableTags={availableTags}
                />
                <ColumnPickerButton
                  visibleColumns={visibleColumns}
                  onChange={handleVisibleColumnsChange}
                />
              </>
            ) : null}
          </div>
          <div className="view-toggle" role="group" aria-label="Pipeline view">
            <button
              type="button"
              className={view === "board" ? "on" : ""}
              onClick={() => setView("board")}
              aria-label="Board view"
              title="Board view"
            >
              <BoardIcon />
            </button>
            <button
              type="button"
              className={view === "table" ? "on" : ""}
              onClick={() => setView("table")}
              aria-label="Table view"
              title="Table view"
            >
              <TableIcon />
            </button>
          </div>
        </div>
      </div>

      {view === "table" ? (
        <CandidateTable
          candidates={visibleCandidates}
          stages={board.stages}
          selected={selected}
          visibleColumns={visibleColumns}
          onToggleOne={toggleOne}
          onToggleAll={(on) =>
            toggleMany(
              visibleCandidates.map((c) => c.id),
              on,
            )
          }
          onOpen={(candidateId) => setOpenCandidateId(candidateId)}
        />
      ) : (
        <div className="pipeline-board">
          {board.stages.map((stage) => {
            const stageCandidates = board.candidates.filter((c) => c.stageId === stage.id);
            const stageIds = stageCandidates.map((c) => c.id);
            const stageSelectedCount = stageIds.filter((id) => selected.has(id)).length;
            return (
              <StageColumn
                key={stage.id}
                stage={stage}
                count={counts[stage.id] ?? 0}
                candidates={stageCandidates}
                isDropTarget={dropTarget === stage.id}
                onDragOverColumn={() => setDropTarget(stage.id)}
                onDragLeaveColumn={() =>
                  setDropTarget((current) => (current === stage.id ? null : current))
                }
                onDropCandidate={(candidateId) => handleDrop(stage.id, candidateId)}
                selectAllChecked={stageIds.length > 0 && stageSelectedCount === stageIds.length}
                selectAllIndeterminate={
                  stageSelectedCount > 0 && stageSelectedCount < stageIds.length
                }
                onToggleColumnSelect={(on) => toggleMany(stageIds, on)}
              >
                {(candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    stages={board.stages}
                    selected={selected.has(candidate.id)}
                    onToggleSelect={(on) => toggleOne(candidate.id, on)}
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
                        scheduleInterview(
                          jobId,
                          candidate.id,
                          Date.now() + 2 * 24 * 60 * 60 * 1000,
                        ),
                      )
                    }
                    onDragStateChange={(dragging) => {
                      if (!dragging) setDropTarget(null);
                    }}
                  />
                )}
              </StageColumn>
            );
          })}

          <AddStage onAdd={(label) => setBoard(addStage(jobId, label))} />
        </div>
      )}

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
