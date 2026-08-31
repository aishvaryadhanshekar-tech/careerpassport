import { useEffect, useRef, useState, type JSX } from "react";
import type { PipelineStage } from "../types";

/**
 * The sticky toolbar that appears once one or more candidates are selected, on either the
 * kanban board or the table view. Selection state and the "which candidates" logic live with
 * the caller (leader) — this component only renders the actions and reports what was chosen.
 *
 * `sendMessageSlot` is a node the caller passes in rather than something this component
 * builds: bulk messaging has to look at every selected candidate's stage to decide which
 * templates apply, and that data only the caller has.
 */
export function BulkActionsBar({
  selectedCount,
  stages,
  onClear,
  onMoveToStage,
  onArchive,
  sendMessageSlot,
}: {
  selectedCount: number;
  stages: PipelineStage[];
  onClear: () => void;
  onMoveToStage: (stageId: string) => void;
  onArchive: () => void;
  sendMessageSlot: React.ReactNode;
}): JSX.Element {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [moveValue, setMoveValue] = useState("");
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!confirmOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setConfirmOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [confirmOpen]);

  useEffect(() => {
    if (!confirmOpen) return;
    cancelRef.current?.focus();
  }, [confirmOpen]);

  function confirmArchive() {
    onArchive();
    setConfirmOpen(false);
  }

  return (
    <div className="pipeline-bulk-bar">
      <span className="pipeline-bulk-bar-count">
        {selectedCount} selected
        <button
          type="button"
          className="pipeline-bulk-bar-clear"
          onClick={onClear}
          aria-label="Clear selection"
        >
          Clear ×
        </button>
      </span>

      <span className="pipeline-bulk-bar-spacer" />

      <div className="pipeline-bulk-bar-item">
        <select
          className="pipeline-bulk-move-select"
          aria-label="Move to stage"
          value={moveValue}
          onChange={(e) => {
            const stageId = e.target.value;
            setMoveValue("");
            if (stageId) onMoveToStage(stageId);
          }}
        >
          <option value="">Move to stage…</option>
          {stages.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.label}
            </option>
          ))}
        </select>
      </div>

      <div className="pipeline-bulk-bar-item">{sendMessageSlot}</div>

      <div className="pipeline-bulk-bar-item">
        <button type="button" className="btn danger" onClick={() => setConfirmOpen(true)}>
          Archive
        </button>
      </div>

      {confirmOpen ? (
        <div className="jobs-dialog-backdrop" onClick={() => setConfirmOpen(false)}>
          <div
            className="jobs-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="bulk-archive-title"
            aria-describedby="bulk-archive-copy"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="bulk-archive-title">Archive {selectedCount} candidates?</h2>
            <p id="bulk-archive-copy">
              They&apos;ll move to the Archive stage. This can be undone by moving them again.
            </p>
            <div className="jobs-dialog-actions">
              <button
                type="button"
                className="btn"
                ref={cancelRef}
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </button>
              <button type="button" className="btn danger" onClick={confirmArchive}>
                Archive
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
