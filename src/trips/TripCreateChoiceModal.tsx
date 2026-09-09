import { useDialogFocus } from "../shared/useDialogFocus";
import { useState, type JSX } from "react";
import { SparkleIcon } from "../shared/icons";
import { DIFFICULTIES, DIFFICULTY_LABELS } from "../types";
import type { Difficulty, PipelineStage } from "../types";

/**
 * Choice modal shown when the user clicks "Create a Trip" — lets them pick
 * between building the trip manually or having it auto-built with AI.
 *
 * Styled to match the existing `role="dialog"` backdrop/card pattern used by
 * ShareComposeModal (backdrop click + explicit close button both call
 * onClose), but uses trips.css classes since this lives in src/trips/.
 */
export type TripCreateChoiceModalProps = {
  open: boolean;
  stages: PipelineStage[];
  onClose: () => void;
  onSelectManual: () => void;
  onSelectAI: (opts: { difficulty: Difficulty; pipelineStageId: string }) => void;
  /**
   * TRP-01: a secondary creation path for component trips (`ops.assessments`), reachable from
   * this same canonical Create control instead of a second "Generate AI trip" entry point
   * elsewhere. Omit to hide the option (e.g. for callers that only ever create full Trips).
   */
  onSelectComponent?: () => void;
};

export function TripCreateChoiceModal({
  open,
  stages,
  onClose,
  onSelectManual,
  onSelectAI,
  onSelectComponent,
}: TripCreateChoiceModalProps): JSX.Element | null {
  const [aiSelected, setAiSelected] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [pipelineStageId, setPipelineStageId] = useState("");

  const dialogRef = useDialogFocus(open, handleClose);
  if (!open) return null;

  function handleClose() {
    setAiSelected(false);
    setDifficulty("medium");
    setPipelineStageId("");
    onClose();
  }

  function handleBuild() {
    if (!pipelineStageId) return;
    onSelectAI({ difficulty, pipelineStageId });
  }

  return (
    <div
      className="trip-choice-modal-backdrop"
      role="presentation"
      onClick={handleClose}
    >
      <div
        className="trip-choice-modal"
        role="dialog"
        ref={dialogRef}
        tabIndex={-1}
        aria-modal="true"
        aria-label="How do you want to build this trip?"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="trip-choice-modal-close"
          onClick={handleClose}
          aria-label="Close"
        >
          ×
        </button>

        <h2 className="trip-choice-modal-heading">
          How do you want to build this trip?
        </h2>

        <div className="trip-choice-modal-options">
          <button
            type="button"
            className="trip-choice-card"
            onClick={onSelectManual}
          >
            <span className="trip-choice-card-title">Build manually</span>
            <span className="trip-choice-card-blurb">
              Start with a blank trip.
            </span>
          </button>

          <button
            type="button"
            className={`trip-choice-card trip-choice-card-ai${aiSelected ? " trip-choice-card-expanded" : ""}`}
            aria-expanded={aiSelected}
            onClick={() => setAiSelected(value => !value)}
          >
            <span className="trip-choice-card-title">
              <SparkleIcon />
              Build with AI
            </span>
            <span className="trip-choice-card-blurb">
              Draft rounds from the role’s playbook.
            </span>
          </button>
        </div>

        {aiSelected ? (
          <div className="trip-choice-ai-options" onClick={(e) => e.stopPropagation()}>
            <label className="trip-choice-ai-field">
              <span>Difficulty</span>
              <select
                className="pill-select select-icon"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {DIFFICULTY_LABELS[d]}
                  </option>
                ))}
              </select>
            </label>

            <label className="trip-choice-ai-field">
              <span>Pipeline stage</span>
              <select
                className={`pill-select select-icon${pipelineStageId ? "" : " is-placeholder"}`}
                value={pipelineStageId}
                onChange={(e) => setPipelineStageId(e.target.value)}
              >
                <option value="" disabled>
                  Choose a stage
                </option>
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="btn primary"
              disabled={!pipelineStageId}
              onClick={handleBuild}
            >
              Build trip
            </button>
          </div>
        ) : null}

        {onSelectComponent ? (
          <button type="button" className="trip-choice-secondary-link" onClick={onSelectComponent}>
            Or create a trip component instead
          </button>
        ) : null}
      </div>
    </div>
  );
}
