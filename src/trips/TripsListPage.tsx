import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "../JobDetailsPage.css";
import "./trips.css";
import { getJob, openJob, upsertJobFromDraft } from "../jobsStore";
import { loadDraft, saveDraft } from "../storage";
import { createTrip } from "../tripsStore";
import type { JobDraft, Trip } from "../types";

function hydrateFromJob(id: string): JobDraft | null {
  if (!openJob(id)) return null;
  return loadDraft();
}

function TripStatusBadge({ status }: { status: Trip["status"] }) {
  return (
    <span className={`trip-status-badge ${status}`}>
      {status === "published" ? "Published" : "Draft"}
    </span>
  );
}

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

export function TripsListPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const job = id ? getJob(id) : null;
  const [draft, setDraft] = useState<JobDraft | null>(() => (id ? hydrateFromJob(id) : null));

  useEffect(() => {
    document.querySelector(".layout-content")?.scrollTo(0, 0);
  }, []);

  if (!id || !job || !draft) {
    return (
      <div className="app-shell jd-not-found">
        <p>Job not found.</p>
        <Link to="/">Back to jobs</Link>
      </div>
    );
  }

  const title = draft.fields.designation.value || job.title;

  function handleCreateTrip() {
    if (!draft || !id) return;
    const { draft: next, tripId } = createTrip(draft);
    saveDraft(next);
    upsertJobFromDraft(id, next);
    setDraft(next);
    navigate(`/jobs/${id}/trips/${tripId}`);
  }

  return (
    <div className="app-shell jd-page">
      <main className="preview-main">
        <header className="jd-header">
          <Link to={`/jobs/${id}`} className="jd-back-link">
            ← Back to job details
          </Link>
          <div className="jd-header-row">
            <h1 className="jd-title">Trips</h1>
          </div>
          <p className="jd-subline">{title}</p>
        </header>

        {draft.trips.length === 0 ? (
          <div className="trips-empty">
            <h2>No trips yet</h2>
            <p>
              Don&apos;t just decide who to interview. Decide what you need to know before you
              interview them.
            </p>
            <button type="button" className="btn primary" onClick={handleCreateTrip}>
              Create a trip
            </button>
          </div>
        ) : (
          <>
            <div className="trips-list-actions">
              <button type="button" className="btn primary" onClick={handleCreateTrip}>
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
      </main>
    </div>
  );
}
