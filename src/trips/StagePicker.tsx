import { type JSX } from "react";
import { addStage, STAGE_TYPE_META } from "../tripStages";
import type { StageType, Trip } from "../types";

export type StagePickerProps = {
  trip: Trip;
  disabled: boolean;
  onChange: (patch: Partial<Trip>) => void;
};

export function StagePicker({ trip, disabled, onChange }: StagePickerProps): JSX.Element {
  return (
    <section className="trip-card">
      <header className="trip-card-head">
        <h2>Add a stage</h2>
        <p>Each stage reveals something specific — pick the ones that fit this role.</p>
      </header>
      <div className="trip-card-body">
        {disabled ? (
          <p className="trip-section-locked-note">
            Generate your spine above to start adding stages.
          </p>
        ) : (
          <div className="stage-picker-grid">
            {Object.entries(STAGE_TYPE_META).map(([type, meta]) => {
              if (!meta.live) {
                return (
                  <div
                    key={type}
                    className="stage-picker-card disabled-stage-card"
                  >
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
                  onClick={() =>
                    onChange({ stages: addStage(trip.stages, type as StageType) })
                  }
                >
                  <span className="stage-picker-card-label">{meta.label}</span>
                  <span className="stage-picker-card-blurb">{meta.blurb}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
