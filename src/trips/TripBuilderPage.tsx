import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "../JobDetailsPage.css";
import "./trips.css";
import { getJob, upsertJobFromDraft } from "../jobsStore";
import { hydrateFromJob } from "../shared/hydrateFromJob";
import { saveDraft } from "../storage";
import {
  duplicateTrip,
  getTrip,
  publishTrip,
  updateTrip as updateTripInDraft,
} from "../tripsStore";
import type { JobDraft, Trip } from "../types";
import { InferenceCardsSection } from "./InferenceCardsSection";
import { SpineEditor } from "./SpineEditor";
import { StagePicker } from "./StagePicker";
import { StageList } from "./StageList";
import { TripPublishBar } from "./TripPublishBar";
import { TripStatusBadge } from "./TripStatusBadge";

export function TripBuilderPage() {
  const { id, tripId } = useParams<{ id: string; tripId: string }>();
  const navigate = useNavigate();
  const job = id ? getJob(id) : null;
  const [draft, setDraft] = useState<JobDraft | null>(() => (id ? hydrateFromJob(id) : null));
  const draftRef = useRef(draft);
  draftRef.current = draft;

  useEffect(() => {
    document.querySelector(".layout-content")?.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (draftRef.current && id) {
        saveDraft(draftRef.current);
        upsertJobFromDraft(id, draftRef.current);
      }
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [draft, id]);

  useEffect(() => {
    return () => {
      if (draftRef.current && id) {
        saveDraft(draftRef.current);
        upsertJobFromDraft(id, draftRef.current);
      }
    };
  }, [id]);

  const trip = draft && tripId ? getTrip(draft, tripId) : null;

  if (!id || !tripId || !job || !draft || !trip) {
    return (
      <div className="app-shell jd-not-found">
        <p>Trip not found.</p>
        <Link to={id ? `/jobs/${id}/trips` : "/"}>Back to trips</Link>
      </div>
    );
  }

  function updateTrip(patch: Partial<Trip>) {
    if (trip?.status === "published") return;
    setDraft((current) => {
      if (!current || !tripId) return current;
      return updateTripInDraft(current, tripId, patch);
    });
  }

  function handlePublish() {
    if (!draft || !tripId || !id) return;
    const next = publishTrip(draft, tripId);
    setDraft(next);
    saveDraft(next);
    upsertJobFromDraft(id, next);
  }

  function handleDuplicate() {
    if (!draft || !tripId || !id) return;
    const { draft: next, tripId: newTripId } = duplicateTrip(draft, tripId);
    setDraft(next);
    saveDraft(next);
    upsertJobFromDraft(id, next);
    navigate(`/jobs/${id}/trips/${newTripId}`);
  }

  return (
    <div className="app-shell jd-page">
      <main className="preview-main">
        <header className="jd-header">
          <Link to={`/jobs/${id}/trips`} className="jd-back-link">
            ← Back to trips
          </Link>
          <div className="jd-header-row">
            <h1 className="jd-title">{trip.title || "Untitled trip"}</h1>
            <TripStatusBadge status={trip.status} />
          </div>
        </header>

        <div
          className={`trip-builder-sections${trip.status === "published" ? " trip-builder-readonly" : ""}`}
        >
          {trip.status === "published" ? (
            <p className="trip-section-locked-note">
              This trip is published and locked. Duplicate it below to make changes.
            </p>
          ) : null}
          <section className="trip-builder-section">
            <InferenceCardsSection trip={trip} draft={draft} onChange={updateTrip} />
          </section>

          <section className={`trip-builder-section${trip.inferenceCardsLocked ? "" : " disabled"}`}>
            {!trip.inferenceCardsLocked ? (
              <p className="trip-builder-gate-note">
                Lock your inference cards to unlock the spine.
              </p>
            ) : null}
            <SpineEditor
              trip={trip}
              draft={draft}
              onChange={updateTrip}
              disabled={!trip.inferenceCardsLocked}
            />
          </section>

          <section className={`trip-builder-section${trip.spineGenerated ? "" : " disabled"}`}>
            {!trip.spineGenerated ? (
              <p className="trip-builder-gate-note">
                Generate the spine to unlock stage selection.
              </p>
            ) : null}
            <StagePicker trip={trip} onChange={updateTrip} disabled={!trip.spineGenerated} />
          </section>

          <section className="trip-builder-section">
            <StageList trip={trip} onChange={updateTrip} />
          </section>
        </div>

        <TripPublishBar trip={trip} onPublish={handlePublish} onDuplicate={handleDuplicate} />
      </main>
    </div>
  );
}
