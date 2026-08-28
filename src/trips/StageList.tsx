import { type JSX, useState } from "react";
import { removeStage, reorderStages, STAGE_TYPE_META, updateStage } from "../tripStages";
import type { Trip } from "../types";
import { DoADemoEditor } from "./DoADemoEditor";
import { PickAndDefendEditor } from "./PickAndDefendEditor";
import { RapidFireEditor } from "./RapidFireEditor";

export type StageListProps = {
  trip: Trip;
  onChange: (patch: Partial<Trip>) => void;
};

export function StageList({ trip, onChange }: StageListProps): JSX.Element {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  return (
    <section className="trip-card">
      <header className="trip-card-head">
        <h2>Stages ({trip.stages.length})</h2>
      </header>
      <div className="trip-card-body">
        {trip.stages.length === 0 ? (
          <p className="stage-list-empty">No stages added yet — pick one above.</p>
        ) : (
          trip.stages.map((stage, index) => (
            <div
              key={stage.id}
              className="stage-row"
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex === null) return;
                onChange({ stages: reorderStages(trip.stages, dragIndex, index) });
                setDragIndex(null);
              }}
            >
              <div className="stage-row-head">
                <span className="drag-handle" aria-hidden="true">
                  ⋮⋮
                </span>
                <span>{STAGE_TYPE_META[stage.type].label}</span>
                <button
                  type="button"
                  className="stage-row-remove"
                  aria-label="Remove stage"
                  onClick={() => onChange({ stages: removeStage(trip.stages, stage.id) })}
                >
                  ×
                </button>
              </div>
              {stage.type === "rapid_fire" ? (
                <RapidFireEditor
                  stage={stage}
                  onChange={(next) => onChange({ stages: updateStage(trip.stages, stage.id, next) })}
                />
              ) : null}
              {stage.type === "pick_and_defend" ? (
                <PickAndDefendEditor
                  stage={stage}
                  onChange={(next) => onChange({ stages: updateStage(trip.stages, stage.id, next) })}
                />
              ) : null}
              {stage.type === "do_a_demo" ? (
                <DoADemoEditor
                  stage={stage}
                  onChange={(next) => onChange({ stages: updateStage(trip.stages, stage.id, next) })}
                />
              ) : null}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
