import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import "../JobDetailsPage.css";
import "./trips.css";
import { EditableField } from "../EditableField";
import { getJob, upsertJobFromDraft } from "../jobsStore";
import { hydrateFromJob } from "../shared/hydrateFromJob";
import { saveDraft } from "../storage";
import { buildTripWithAI } from "../tripAIBuild";
import {
  duplicateTrip,
  getTrip,
  publishTrip,
  updateTrip as updateTripInDraft,
} from "../tripsStore";
import type { JobDraft, Trip } from "../types";
import { AIBuildLoader } from "./AIBuildLoader";
import { TripPublishBar } from "./TripPublishBar";
import { TripRoundTabs } from "./TripRoundTabs";
import { TripStatusBadge } from "./TripStatusBadge";

export function TripBuilderPage() {
  const { id, tripId } = useParams<{ id: string; tripId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const job = id ? getJob(id) : null;
  const [draft, setDraft] = useState<JobDraft | null>(() => (id ? hydrateFromJob(id) : null));
  const draftRef = useRef(draft);
  draftRef.current = draft;

  const showAILoader = searchParams.get("ai") === "1";

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

  function handleAIComplete() {
    if (!draft || !tripId || !id) return;
    const built = buildTripWithAI(draft);
    const {
      id: _builtId,
      createdAt: _builtCreatedAt,
      updatedAt: _builtUpdatedAt,
      status: _builtStatus,
      title: _builtTitle,
      ...patch
    } = built;
    const next = updateTripInDraft(draft, tripId, patch);
    setDraft(next);
    saveDraft(next);
    upsertJobFromDraft(id, next);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("ai");
    setSearchParams(nextParams, { replace: true });
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
      {showAILoader ? <AIBuildLoader active onComplete={handleAIComplete} /> : null}
      <main className="preview-main">
        <header className="jd-header">
          <Link to={`/jobs/${id}/trips`} className="jd-back-link">
            ← Back to trips
          </Link>
        </header>

        <div
          className={`trip-builder-layout${trip.status === "published" ? " trip-builder-readonly" : ""}`}
        >
          {trip.status === "published" ? (
            <p className="trip-section-locked-note">
              This trip is published and locked. Duplicate it below to make changes.
            </p>
          ) : null}

          <div className="trip-builder-left">
            <div className="trip-builder-title-row">
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
                <h2>Inference cards</h2>
                <p>What the system understood about the role.</p>
              </div>
              <div className="trip-card-body">
                {trip.inferenceCardsLocked && trip.inferenceCards.length > 0 ? (
                  <div className="inference-cards-condensed">
                    {trip.inferenceCards.map((card) => (
                      <div className="inference-card-condensed" key={card.id}>
                        <h3>{card.title}</h3>
                        <p>{card.content || "Not generated yet."}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="trip-section-locked-note">Not generated yet.</p>
                )}
              </div>
            </section>

            <TripPublishBar trip={trip} onPublish={handlePublish} onDuplicate={handleDuplicate} />
          </div>

          <div className="trip-builder-right">
            <TripRoundTabs trip={trip} draft={draft} onChange={updateTrip} />
          </div>
        </div>
      </main>
    </div>
  );
}
