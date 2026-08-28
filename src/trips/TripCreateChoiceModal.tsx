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
};

export function TripCreateChoiceModal({
  open,
  stages,
  onClose,
  onSelectManual,
  onSelectAI,
}: TripCreateChoiceModalProps): JSX.Element | null {
  const [aiSelected, setAiSelected] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [pipelineStageId, setPipelineStageId] = useState("");

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
        <p className="trip-choice-modal-subheading">
          You can start from scratch or let us draft the rounds for you.
        </p>

        <div className="trip-choice-modal-options">
          <button
            type="button"
            className="trip-choice-card"
            onClick={onSelectManual}
          >
            <span className="trip-choice-card-title">Build manually</span>
            <span className="trip-choice-card-blurb">
              Start from a blank template and fill it in yourself.
            </span>
          </button>

          <div
            className={`trip-choice-card trip-choice-card-ai${aiSelected ? " trip-choice-card-expanded" : ""}`}
            role="button"
            tabIndex={0}
            onClick={() => setAiSelected(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setAiSelected(true);
            }}
          >
            <span className="trip-choice-card-badge">Recommended</span>
            <span className="trip-choice-card-title">
              <SparkleIcon />
              Build with AI
            </span>
            <span className="trip-choice-card-blurb">
              We'll auto-generate rounds using your role's playbook —
              recommended.
            </span>

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
          </div>
        </div>
      </div>
    </div>
  );
}
