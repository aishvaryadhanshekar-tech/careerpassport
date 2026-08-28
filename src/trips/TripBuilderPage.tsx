import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "../JobDetailsPage.css";
import "./trips.css";
import { getBoard } from "../candidatesStore";
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
import { DIFFICULTIES, DIFFICULTY_LABELS } from "../types";
import type { Difficulty, JobDraft, Trip } from "../types";
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
  const pipelineStages = id ? getBoard(id).stages : [];

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
          <div className="jd-header-row trip-builder-title-row">
            <Link to={`/jobs/${id}/trips`} className="jd-back-btn" aria-label="Back to trips">
              <BackArrowIcon />
            </Link>
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

            <section className="trip-card">
              <div className="trip-card-head">
                <h2>Trip settings</h2>
                <p>Which pipeline stage this trip is sent at, and how hard AI-generated rounds should be.</p>
              </div>
              <div className="trip-card-body">
                <label className="trip-round-duration-field">
                  <span>Pipeline stage</span>
                  <select
                    className={`pill-select select-icon${trip.pipelineStageId ? "" : " is-placeholder"}`}
                    value={trip.pipelineStageId ?? ""}
                    onChange={(e) => updateTrip({ pipelineStageId: e.target.value || null })}
                  >
                    <option value="" disabled>
                      Choose a stage
                    </option>
                    {pipelineStages.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="trip-round-duration-field">
                  <span>Difficulty</span>
                  <select
                    className="pill-select select-icon"
                    value={trip.difficulty}
                    onChange={(e) => updateTrip({ difficulty: e.target.value as Difficulty })}
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>
                        {DIFFICULTY_LABELS[d]}
                      </option>
                    ))}
                  </select>
                </label>
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

/** Mirrors JobDetailsPage's wizard-header back arrow, for the same icon-only back affordance here. */
function BackArrowIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M16 10H5M9.25 5.75 4.5 10l4.75 4.25"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
