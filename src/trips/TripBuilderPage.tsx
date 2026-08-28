import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "../JobDetailsPage.css";
import "./trips.css";
import { EditableField } from "../EditableField";
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
import { TripPublishBar } from "./TripPublishBar";
import { TripRoundTabs } from "./TripRoundTabs";
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
    <div className="app-shell jd-page trip-builder-page">
      <main className="preview-main">
        <header className="jd-header trip-builder-header">
          <Link to={`/jobs/${id}/trips`} className="jd-back-link">
            ← Back to trips
          </Link>
          <div className="jd-header-row trip-builder-title-row">
            <EditableField
              label="Trip title"
              display={<h1 className="jd-title">{trip.title || "Untitled trip"}</h1>}
            >
              <input
                className="trip-title-input"
                value={trip.title}
                placeholder="Untitled trip"
                onChange={(e) => updateTrip({ title: e.target.value })}
              />
            </EditableField>
            <TripStatusBadge status={trip.status} />
          </div>
        </header>

        {trip.status === "published" ? (
          <p className="trip-section-locked-note trip-builder-locked-note">
            This trip is published and locked. Duplicate it below to make changes.
          </p>
        ) : null}

        <div
          className={`trip-builder-columns${trip.status === "published" ? " trip-builder-readonly" : ""}`}
        >
          <div className="trip-builder-col trip-builder-col-left">
            <section className="trip-card">
              <div className="trip-card-head">
                <h2>Spine</h2>
                <p>
                  The scenario the whole trip sits inside — not a description of the
                  candidate, a situation they're dropped into.
                </p>
              </div>
              <div className="trip-card-body">
                <p className="trip-spine-text">{trip.spine || "Not generated yet."}</p>
              </div>
            </section>
          </div>

          <div className="trip-builder-col trip-builder-col-right">
            <TripRoundTabs trip={trip} draft={draft} onChange={updateTrip} />
          </div>
        </div>
      </main>

      <footer className="footer trip-builder-footer">
        <TripPublishBar trip={trip} onPublish={handlePublish} onDuplicate={handleDuplicate} />
      </footer>
    </div>
  );
}
