import { useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { createTrip, updateTrip } from "../../tripsStore";
import { countsByStage, getBoard, moveCandidate } from "../../candidatesStore";
import { templatesForStage } from "../../communications/templates";
import type { CanvasNodeId, JobDraft, PipelineBoard } from "../../types";

const STAGE_LABELS: Record<Extract<CanvasNodeId, "prospects" | "pipeline" | "interview">, string> = {
  prospects: "Prospects",
  pipeline: "Pipeline",
  interview: "Interview",
};

function candidateStageIds(id: keyof typeof STAGE_LABELS): string[] {
  if (id === "prospects") return ["applied"];
  if (id === "pipeline") return ["screened", "submitted"];
  return ["interviewing", "offered"];
}

export function FunnelPanel({
  node,
  jobId,
  draft,
  setDraft,
  onBoardChanged,
}: {
  node: Extract<CanvasNodeId, "prospects" | "pipeline" | "interview">;
  jobId: string;
  draft: JobDraft;
  setDraft: Dispatch<SetStateAction<JobDraft>>;
  onBoardChanged: (board: PipelineBoard) => void;
}) {
  const [board, setBoard] = useState(() => getBoard(jobId));
  const stageIds = candidateStageIds(node);
  const counts = countsByStage(board);
  const candidates = useMemo(
    () => board.candidates.filter((candidate) => stageIds.includes(candidate.stageId)),
    [board, stageIds.join(",")],
  );
  const total = stageIds.reduce((sum, id) => sum + (counts[id] ?? 0), 0);

  function refresh(next: PipelineBoard) {
    setBoard(next);
    onBoardChanged(next);
  }

  function move(candidateId: string) {
    const destination = node === "prospects" ? "screened" : node === "pipeline" ? "interviewing" : "offered";
    refresh(moveCandidate(jobId, candidateId, destination));
  }

  function addTrip() {
    const result = createTrip(draft);
    setDraft(result.draft);
  }

  return (
    <div className="canvas-panel-scroll canvas-funnel-panel">
      <div className="funnel-summary">
        <span className="funnel-count">{total}</span>
        <span><strong>{STAGE_LABELS[node]}</strong><br /><small>{node === "prospects" ? "Incoming applications" : node === "pipeline" ? "Candidates completing trips" : "Candidates in interview rounds"}</small></span>
      </div>

      <section className="canvas-funnel-section">
        <div className="canvas-funnel-section-head"><h3>Candidates</h3><span>{candidates.length}</span></div>
        {candidates.length === 0 ? <p className="muted">No candidates in this stage yet.</p> : (
          <div className="canvas-candidate-list">
            {candidates.map((candidate) => (
              <div className="canvas-candidate-row" key={candidate.id}>
                <div><strong>{candidate.name}</strong><small>{candidate.email}</small></div>
                <span className="candidate-status">{candidate.tripStatus === "completed" ? `${candidate.tripScore}% trip` : candidate.tripStatus}</span>
                {node !== "interview" ? <button type="button" className="btn small" onClick={() => move(candidate.id)}>Move forward</button> : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="canvas-funnel-section">
        <div className="canvas-funnel-section-head"><h3>{node === "interview" ? "Rounds & trips" : "Trip assignments"}</h3><button type="button" className="btn small" onClick={addTrip}>+ Create trip</button></div>
        {draft.trips.length === 0 ? <p className="muted">Create a trip here and assign it when candidates reach this stage.</p> : draft.trips.map((trip) => (
          <div className="canvas-trip-row" key={trip.id}>
            <div><strong>{trip.title}</strong><small>{trip.stages.length} stages · {trip.difficulty}</small></div>
            <select aria-label={`Assign ${trip.title}`} value={trip.pipelineStageId ?? ""} onChange={(e) => setDraft((current) => updateTrip(current, trip.id, { pipelineStageId: e.target.value || null }))}>
              <option value="">Unassigned</option><option value="prospects">Prospects</option><option value="pipeline">Pipeline</option><option value="interview">Interview</option>
            </select>
          </div>
        ))}
      </section>

      <section className="canvas-funnel-section">
        <div className="canvas-funnel-section-head"><h3>Suggested communications</h3></div>
        {templatesForStage(node === "prospects" ? "applied" : node === "pipeline" ? "screened" : "interviewing").slice(0, 3).map((template) => (
          <div className="canvas-communication-row" key={template.id}><div><strong>{template.name}</strong><small>{template.blurb}</small></div><span>{template.channel.toUpperCase()}</span></div>
        ))}
      </section>
    </div>
  );
}
