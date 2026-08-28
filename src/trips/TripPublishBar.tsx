import { type JSX } from "react";
import type { Trip } from "../types";

export type TripPublishBarProps = {
  trip: Trip;
  onPublish: () => void;
  onDuplicate: () => void;
};

/**
 * Renders just the publish/duplicate action(s) — the caller is expected to
 * wrap this in the shared `<footer className="footer">` / `.footer-actions`
 * structure (see footer-responsive.css) rather than its own footer chrome.
 */
export function TripPublishBar({ trip, onPublish, onDuplicate }: TripPublishBarProps): JSX.Element {
  if (trip.status === "published") {
    return (
      <>
        <p className="trip-publish-locked-banner">
          This trip is published and locked. Editing means duplicating it.
        </p>
        <div className="footer-actions">
          <button type="button" className="btn primary" onClick={onDuplicate}>
            Duplicate to edit
          </button>
        </div>
      </>
    );
  }

  const disabled = trip.stages.length === 0;

  return (
    <>
      {disabled ? (
        <p className="trip-publish-locked-banner">Add at least one stage before publishing.</p>
      ) : null}
      <div className="footer-actions">
        <button type="button" className="btn primary" disabled={disabled} onClick={onPublish}>
          Publish trip
        </button>
      </div>
    </>
  );
}
