import { useDialogFocus } from "../shared/useDialogFocus";
import { useState, type JSX } from "react";
import { Switch } from "../ContextCard";
import { generateTripRounds } from "../tripAIBuild";
import { addStage, STAGE_TYPE_META } from "../tripStages";
import { DIFFICULTIES, DIFFICULTY_LABELS } from "../types";
import type { Difficulty, JobDraft, StageType, Trip } from "../types";

const MAX_LEVER_COUNT = 5;

/**
 * Picks `count` lever types by cycling through the `live` entries of
 * STAGE_TYPE_META in declaration order (rapid_fire, do_a_demo,
 * pick_and_defend today), wrapping around once count exceeds the number of
 * live types. Exported for unit testing.
 */
export function pickLeverTypes(count: number): StageType[] {
  const liveTypes = (Object.entries(STAGE_TYPE_META) as [StageType, (typeof STAGE_TYPE_META)[StageType]][])
    .filter(([, meta]) => meta.live)
    .map(([type]) => type);
  if (liveTypes.length === 0 || count <= 0) return [];
  return Array.from({ length: count }, (_, i) => liveTypes[i % liveTypes.length]);
}

export type TripAddLeverModalProps = {
  open: boolean;
  trip: Trip;
  draft: JobDraft;
  onChange: (patch: Partial<Trip>) => void;
  onClose: () => void;
};

/**
 * Modal shown from the "+ Add round" button in TripRoundTabs. Asks how many
 * levers to add, at what difficulty, and whether to build them with AI.
 *
 * Styled to match TripCreateChoiceModal's dialog chrome (backdrop + card +
 * close button), the only dialog pattern in the app.
 */
export function TripAddLeverModal({
  open,
  trip,
  draft,
  onChange,
  onClose,
}: TripAddLeverModalProps): JSX.Element | null {
  const [count, setCount] = useState(1);
  const [difficulty, setDifficulty] = useState<Difficulty>(trip.difficulty);
  const [aiOn, setAiOn] = useState(true);
  const [manualRemaining, setManualRemaining] = useState<number | null>(null);

  const dialogRef = useDialogFocus(open, resetAndClose);
  if (!open) return null;

  function resetAndClose() {
    setCount(1);
    setDifficulty(trip.difficulty);
    setAiOn(true);
    setManualRemaining(null);
    onClose();
  }

  function handleConfirm() {
    if (aiOn) {
      const chosenTypes = pickLeverTypes(count);
      const newStages = generateTripRounds(trip.inferenceCards, draft, chosenTypes, difficulty);
      onChange({ stages: [...trip.stages, ...newStages] });
      resetAndClose();
    } else {
      setManualRemaining(count);
    }
  }

  function handleManualPick(type: StageType) {
    onChange({ stages: addStage(trip.stages, type) });
    setManualRemaining((remaining) => {
      const next = (remaining ?? 1) - 1;
      if (next <= 0) {
        resetAndClose();
        return null;
      }
      return next;
    });
  }

  const isManualPicking = manualRemaining !== null;

  return (
    <div className="trip-choice-modal-backdrop" role="presentation" onClick={resetAndClose}>
      <div
        className="trip-choice-modal lever-add-modal"
        role="dialog"
        ref={dialogRef}
        tabIndex={-1}
        aria-modal="true"
        aria-label="Add round"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="trip-choice-modal-close"
          onClick={resetAndClose}
          aria-label="Close"
        >
          ×
        </button>

        {isManualPicking ? (
          <>
            <h2 className="trip-choice-modal-heading">Pick a round type</h2>
            <p className="trip-choice-modal-subheading">
              {manualRemaining} remaining.
            </p>

            <div className="stage-picker-grid">
              {Object.entries(STAGE_TYPE_META).map(([type, meta]) => {
                if (!meta.live) {
                  return (
                    <div key={type} className="stage-picker-card disabled-stage-card">
                      <span className="stage-picker-card-label">{meta.label}</span>
                      <span className="stage-picker-card-blurb">{meta.blurb}</span>
                    </div>
                  );
                }
                return (
                  <button
                    key={type}
                    type="button"
                    className="stage-picker-card"
                    onClick={() => handleManualPick(type as StageType)}
                  >
                    <span className="stage-picker-card-label">{meta.label}</span>
                    <span className="stage-picker-card-blurb">{meta.blurb}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <h2 className="trip-choice-modal-heading">Add round</h2>

            <div className="lever-add-modal-field">
              <span className="lever-add-modal-field-label">How many rounds?</span>
              <div className="lever-add-modal-count-row">
                {Array.from({ length: MAX_LEVER_COUNT }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`lever-add-modal-count-btn${n === count ? " active" : ""}`}
                    onClick={() => setCount(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <label className="lever-add-modal-field">
              <span className="lever-add-modal-field-label">Difficulty</span>
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

            <div className="lever-add-modal-field lever-add-modal-ai-row">
              <span className="lever-add-modal-field-label">Build with AI</span>
              <Switch checked={aiOn} ariaLabel="Build with AI" onToggle={() => setAiOn((v) => !v)} />
            </div>

            <button type="button" className="btn primary lever-add-modal-confirm" onClick={handleConfirm}>
              {aiOn
                ? `Build ${count} round${count === 1 ? "" : "s"} with AI`
                : `Choose ${count} round type${count === 1 ? "" : "s"}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
