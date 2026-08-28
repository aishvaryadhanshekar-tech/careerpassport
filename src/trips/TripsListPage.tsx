import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./trips.css";
import { getBoard } from "../candidatesStore";
import { useJobContext } from "../job/jobContext";
import { upsertJobFromDraft } from "../jobsStore";
import { saveDraft } from "../storage";
import { buildTripWithAI } from "../tripAIBuild";
import { createTrip, createTripShellForAI, updateTrip as updateTripInDraft } from "../tripsStore";
import type { Difficulty, JobDraft, Trip } from "../types";
import { AIBuildLoader } from "./AIBuildLoader";
import { TripCreateChoiceModal } from "./TripCreateChoiceModal";
import { TripStatusBadge } from "./TripStatusBadge";

function TripRow({ jobId, trip }: { jobId: string; trip: Trip }) {
  return (
    <Link to={`/jobs/${jobId}/trips/${trip.id}`} className="trips-list-row">
      <div className="trips-list-row-main">
        <span className="trips-list-row-title">{trip.title || "Untitled trip"}</span>
        <span className="trips-list-row-meta">
          {trip.stages.length} stage{trip.stages.length === 1 ? "" : "s"} · Updated{" "}
          {new Date(trip.updatedAt).toLocaleDateString()}
        </span>
      </div>
      <TripStatusBadge status={trip.status} />
    </Link>
  );
}

/**
 * Trips tab body. The job header and tab bar are owned by the JobDetailsPage shell, and the
 * draft arrives through outlet context — this component used to hydrate its own copy, which
 * re-ran `openJob`'s write side effect on every tab switch.
 */
export function TripsListPage() {
  const { jobId: id, draft: initialDraft } = useJobContext();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<JobDraft>(initialDraft);
  const [choiceOpen, setChoiceOpen] = useState(false);
  const [aiBuildingTripId, setAiBuildingTripId] = useState<string | null>(null);
  const [aiOpts, setAiOpts] = useState<{ difficulty: Difficulty; pipelineStageId: string } | null>(
    null,
  );
  const stages = getBoard(id).stages;

  function persist(next: JobDraft) {
    saveDraft(next);
    upsertJobFromDraft(id, next);
    setDraft(next);
  }

  function handleSelectManual() {
    const { draft: next, tripId } = createTrip(draft);
    persist(next);
    setChoiceOpen(false);
    navigate(`/jobs/${id}/trips/${tripId}`);
  }

  function handleSelectAI(opts: { difficulty: Difficulty; pipelineStageId: string }) {
    const { draft: next, tripId } = createTripShellForAI(draft, opts);
    persist(next);
    setChoiceOpen(false);
    setAiOpts(opts);
    setAiBuildingTripId(tripId);
  }

  function handleAIComplete() {
    const tripId = aiBuildingTripId;
    if (!tripId || !aiOpts) return;
    const built = buildTripWithAI(draft, aiOpts);
    const {
      id: _builtId,
      createdAt: _builtCreatedAt,
      updatedAt: _builtUpdatedAt,
      status: _builtStatus,
      ...patch
    } = built;
    const next = updateTripInDraft(draft, tripId, patch);
    persist(next);
    setAiBuildingTripId(null);
    setAiOpts(null);
    navigate(`/jobs/${id}/trips/${tripId}`);
  }

  return (
    <>
      <TripCreateChoiceModal
        open={choiceOpen}
        stages={stages}
        onClose={() => setChoiceOpen(false)}
        onSelectManual={handleSelectManual}
        onSelectAI={handleSelectAI}
      />
      <AIBuildLoader active={!!aiBuildingTripId} onComplete={handleAIComplete} />
      {draft.trips.length === 0 ? (
          <div className="trips-empty">
            <h2>No trips yet</h2>
            <p>
              Don&apos;t just decide who to interview. Decide what you need to know before you
              interview them.
            </p>
            <button type="button" className="btn primary" onClick={() => setChoiceOpen(true)}>
              Create a trip
            </button>
          </div>
        ) : (
          <>
            <div className="trips-list-actions">
              <button type="button" className="btn primary" onClick={() => setChoiceOpen(true)}>
                Create a trip
              </button>
            </div>
            <div className="trips-list">
              {draft.trips.map((trip) => (
                <TripRow key={trip.id} jobId={id} trip={trip} />
              ))}
            </div>
          </>
        )}
    </>
  );
}
