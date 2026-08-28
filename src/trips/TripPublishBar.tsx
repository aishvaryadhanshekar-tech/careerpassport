import { type JSX } from "react";
import type { Trip } from "../types";

export type TripPublishBarProps = {
  trip: Trip;
  onPublish: () => void;
  onDuplicate: () => void;
};

export function TripPublishBar({ trip, onPublish, onDuplicate }: TripPublishBarProps): JSX.Element {
  if (trip.status === "published") {
    return (
      <footer className="trip-publish-bar">
        <p className="trip-publish-locked-banner">
          This trip is published and locked. Editing means duplicating it.
        </p>
        <button type="button" className="btn primary" onClick={onDuplicate}>
          Duplicate to edit
        </button>
      </footer>
    );
  }

  const disabled = trip.stages.length === 0;

  return (
    <footer className="trip-publish-bar">
      {disabled ? <p>Add at least one stage before publishing.</p> : null}
      <button type="button" className="btn primary" disabled={disabled} onClick={onPublish}>
        Publish trip
      </button>
    </footer>
  );
}
