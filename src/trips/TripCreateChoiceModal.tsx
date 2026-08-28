import type { JSX } from "react";
import { SparkleIcon } from "../shared/icons";

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
  onClose: () => void;
  onSelectManual: () => void;
  onSelectAI: () => void;
};

export function TripCreateChoiceModal({
  open,
  onClose,
  onSelectManual,
  onSelectAI,
}: TripCreateChoiceModalProps): JSX.Element | null {
  if (!open) return null;

  return (
    <div
      className="trip-choice-modal-backdrop"
      role="presentation"
      onClick={onClose}
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
          onClick={onClose}
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

          <button
            type="button"
            className="trip-choice-card trip-choice-card-ai"
            onClick={onSelectAI}
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
          </button>
        </div>
      </div>
    </div>
  );
}
