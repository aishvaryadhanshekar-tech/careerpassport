import { LibraryFilters } from "../canvasJob/LibraryFilters";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { demoService } from "../demo/service";
import { useDemoProject } from "../demo/useDemoProject";
import { AssessmentsPanel } from "../hiring/AssessmentsPanel";
import { operations } from "../hiring/service";
import { buildTripWithAI } from "../tripAIBuild";
import { updateInferenceCard } from "../tripInference";
import { createTrip, createTripShellForAI, duplicateTrip, publishTrip, updateTrip } from "../tripsStore";
import type { Difficulty, JobDraft, PipelineStage, Trip } from "../types";
import { Tabs, TabPanel } from "../Tabs";
import { AIBuildLoader } from "./AIBuildLoader";
import { TripCreateChoiceModal } from "./TripCreateChoiceModal";
import { TripPreview } from "./TripPreview";
import { TripPublishBar } from "./TripPublishBar";
import { TripRoundTabs } from "./TripRoundTabs";
import { TripStatusBadge } from "./TripStatusBadge";
import "./trips.css";
import "./pipeline-trip-workspace.css";

type WorkspaceTab = "edit" | "preview" | "insights" | "assign";
const WORKSPACE_TABS: { id: WorkspaceTab; label: string }[] = [
  { id: "edit", label: "Edit" },
  { id: "preview", label: "Preview" },
  { id: "insights", label: "Insights" },
  { id: "assign", label: "Assign" },
];

/** Sentinel `assessmentId` meaning "open the component-trip editor on a brand-new draft". */
const NEW_ASSESSMENT = "__new__";

/**
 * TRP-01: this is the canonical Trips library — the one list users see for both full Trips
 * (`draft.trips`) and component trips (`ops.assessments`). Each row still dispatches into its
 * own existing full editor; the two record types are never cast into one another.
 */
export function PipelineTripWorkspace({ jobId, draft, setDraft, tripId, onSelectTrip, pipelineStages, startCreating = false }: {
  jobId: string;
  draft: JobDraft;
  setDraft: Dispatch<SetStateAction<JobDraft>>;
  tripId: string | null;
  onSelectTrip: (id: string) => void;
  startCreating?: boolean;
  pipelineStages: PipelineStage[];
}) {
  const project = useDemoProject(jobId);
  const ops = project ? operations(project) : null;
  const [libraryQuery,setLibraryQuery]=useState('');
  const [libraryStatus,setLibraryStatus]=useState('');
  const [libraryType,setLibraryType]=useState('');
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const assessmentTypeOptions = [...new Set(Object.values(ops?.assessments ?? {}).flatMap(a=>a.levers.map(l=>l.type)))];
  const libraryQueryLower = libraryQuery.trim().toLowerCase();
  const libraryTrips=draft.trips.filter(t=>`${t.title} ${t.spine}`.toLowerCase().includes(libraryQueryLower)&&(!libraryStatus||t.status===libraryStatus)&&(!libraryType||t.stages.some(s=>s.type===libraryType)));
  const libraryAssessments=Object.values(ops?.assessments ?? {}).filter(a=>a.title.toLowerCase().includes(libraryQueryLower)&&(!libraryStatus||(a.publishedAt?'published':'draft')===libraryStatus)&&(!libraryType||a.levers.some(l=>l.type===libraryType)));
  const [tab, setTab] = useState<WorkspaceTab>("edit");
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("mobile");
  const [creating, setCreating] = useState(startCreating);
  const [building, setBuilding] = useState<{ id: string; options: { difficulty: Difficulty; pipelineStageId: string } } | null>(null);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const trip = draft.trips.find((item) => item.id === tripId);
  const readOnly = trip?.status === "published";

  useEffect(() => {
    setTab("edit");
    setSelectedCandidates([]);
    setNotice("");
    setError("");
    if (tripId) setAssessmentId(null);
  }, [tripId]);

  /** Runs a component-trip (`ops.assessments`) action, matching HiringWorkspace's own `run` so AssessmentsPanel needs no changes to its own error/notice handling when embedded here. */
  function run(action: () => unknown, message = "") {
    try {
      const result = action();
      if (result instanceof Promise) {
        void result
          .then(() => { setError(""); setNotice(message); })
          .catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to complete this action."));
      } else {
        setError("");
        setNotice(message);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to complete this action.");
    }
  }

  function addCreated(result: { draft: JobDraft; tripId: string }) {
    const created = result.draft.trips.find((item) => item.id === result.tripId);
    if (!created) return;
    setDraft((current) => current.trips.some((item) => item.id === created.id) ? current : { ...current, trips: [...current.trips, created] });
    setCreating(false);
    onSelectTrip(result.tripId);
  }

  function createWithAI(options: { difficulty: Difficulty; pipelineStageId: string }) {
    const result = createTripShellForAI(draft, options);
    addCreated(result);
    setBuilding({ id: result.tripId, options });
  }

  function finishBuild() {
    if (!building) return;
    const task = building;
    setDraft((current) => {
      const target = current.trips.find((item) => item.id === task.id);
      if (!target || target.status === "published") return current;
      const built = buildTripWithAI(current, task.options);
      return updateTrip(current, task.id, { ...built, id: target.id, createdAt: target.createdAt });
    });
    setBuilding(null);
  }

  function patchTrip(patch: Partial<Trip>) {
    if (!tripId) return;
    setDraft((current) => {
      const target = current.trips.find((item) => item.id === tripId);
      if (!target || target.status === "published") return current;
      return updateTrip(current, tripId, { ...patch, id: target.id, status: target.status, createdAt: target.createdAt });
    });
  }

  function publish() {
    if (!tripId) return;
    setDraft((current) => {
      const target = current.trips.find((item) => item.id === tripId);
      return target && target.status === "draft" && target.stages.length > 0 ? publishTrip(current, tripId) : current;
    });
    setNotice("Trip published. Select candidates in Assign to send it.");
  }

  function assign() {
    if (!trip || trip.status !== "published") return;
    const sent: string[] = [];
    try {
      for (const candidateId of selectedCandidates) {
        demoService().assignFullTrip(jobId, candidateId, trip.id, trip);
        sent.push(candidateId);
      }
      setError("");
      setNotice(`Trip sent to ${sent.length} candidate${sent.length === 1 ? "" : "s"}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to assign this trip.");
      if (sent.length) setNotice(`Sent to ${sent.length} candidate${sent.length === 1 ? "" : "s"} before the error.`);
    }
    setSelectedCandidates((current) => current.filter((id) => !sent.includes(id)));
  }

  const candidates = Object.values(project?.candidates ?? {}).filter((candidate) =>
    (!stageFilter || candidate.stageId === stageFilter) && `${candidate.name} ${candidate.email}`.toLowerCase().includes(query.toLowerCase()));

  const assessment = assessmentId && assessmentId !== NEW_ASSESSMENT ? ops?.assessments[assessmentId] : undefined;

  // TRP-05: a compact, left-aligned back link beside the title/status, instead of a
  // full-width bordered button competing with the header's Create action.
  if (trip || assessmentId) {
    return <section className="pipeline-trip-workspace" aria-label="Trips workspace">
      {error && <p className="pipeline-trip-error" role="alert">{error}</p>}
      {notice && <p className="pipeline-trip-notice" role="status">{notice}</p>}
      {trip ? <>
        <header className="pipeline-trip-header pipeline-trip-header-editor">
          <button type="button" className="pipeline-trip-back" onClick={()=>onSelectTrip("")}>← Trip library</button>
          <div className="pipeline-trip-title-row"><h3>{trip.title || "Untitled trip"}</h3><TripStatusBadge status={trip.status} /></div>
        </header>
        <Tabs tabs={WORKSPACE_TABS} active={tab} onChange={(id) => setTab(id as WorkspaceTab)} ariaLabel="Trip views" />
        <TabPanel id="edit" active={tab === "edit"}>
          {readOnly && <p className="pipeline-trip-notice">Published trips are read-only. Duplicate to edit.</p>}
          <fieldset className="pipeline-trip-fields" disabled={readOnly || building !== null}>
            <legend className="pipeline-trip-sr-only">Edit trip</legend>
            <label className="pipeline-trip-field">Trip title<input value={trip.title} onChange={(event) => patchTrip({ title: event.target.value })} /></label>
            <TripRoundTabs key={trip.id} trip={trip} draft={draft} pipelineStages={pipelineStages} onChange={patchTrip} />
          </fieldset>
          <footer className="pipeline-trip-publish"><TripPublishBar trip={trip} onPublish={publish} onDuplicate={() => addCreated(duplicateTrip(draft, trip.id))} /></footer>
        </TabPanel>
        <TabPanel id="preview" active={tab === "preview"}>
          <TripPreview key={trip.id} trip={trip} mode={previewMode} onMode={setPreviewMode} />
        </TabPanel>
        <TabPanel id="insights" active={tab === "insights"}>
          <p className="pipeline-trip-notice">These insights inform generated rounds. Existing questions change only when you rewrite them.</p>
          <fieldset className="pipeline-trip-fields" disabled={readOnly}><legend className="pipeline-trip-sr-only">Trip insights</legend>
            {trip.inferenceCards.map((card) => <label key={card.id} className="pipeline-trip-field">{card.title}<textarea rows={3} value={card.content} onChange={(event) => patchTrip({ inferenceCards: updateInferenceCard(trip.inferenceCards, card.id, event.target.value) })} /></label>)}
          </fieldset>
        </TabPanel>
        <TabPanel id="assign" active={tab === "assign"}>
          <div className="pipeline-trip-assign">
            {!readOnly && <p className="pipeline-trip-notice">Publish this trip before assigning it.</p>}
            <label className="pipeline-trip-field">Search candidates<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or email" /></label>
            <label className="pipeline-trip-field">Stage<select value={stageFilter} onChange={(event) => setStageFilter(event.target.value)}><option value="">All stages</option>{pipelineStages.map((stage) => <option key={stage.id} value={stage.id}>{stage.label}</option>)}</select></label>
            <div className="pipeline-trip-roster">
              {candidates.length === 0 && <p>No candidates match.</p>}
              {candidates.map((candidate) => {
                const assignments = Object.values(project?.assignments ?? {}).filter((assignment) => assignment.candidateId === candidate.id && assignment.tripId === trip.id);
                const pending = assignments.some((assignment) => assignment.status === "assigned");
                const completed = assignments.some((assignment) => assignment.status === "completed");
                return <div key={candidate.id}><label className="pipeline-trip-candidate"><input type="checkbox" disabled={!readOnly || pending || completed} checked={selectedCandidates.includes(candidate.id)} onChange={(event) => setSelectedCandidates((current) => event.target.checked ? [...current, candidate.id] : current.filter((id) => id !== candidate.id))} /><span><strong>{candidate.name}</strong><small>{candidate.email}</small></span><small>{pending ? "Sent" : completed ? "Completed" : pipelineStages.find((stage) => stage.id === candidate.stageId)?.label ?? candidate.stageId}</small></label>{assignments.map((assignment) => <a className="pipeline-trip-invite" key={assignment.id} href={`/demo/trip/${jobId}/${encodeURIComponent(assignment.id)}`} target="_blank" rel="noreferrer">{assignment.status === "completed" ? "View submitted trip" : "Open candidate trip"} ↗</a>)}</div>;
              })}
            </div>
            <button type="button" className="btn primary" disabled={!readOnly || selectedCandidates.length === 0} onClick={assign}>Assign to {selectedCandidates.length} selected</button>
          </div>
        </TabPanel>
      </> : project && ops ? (
        // Component trip (`ops.assessments`): dispatches into its own existing full editor
        // (AssessmentsPanel), embedded here so the library stays canonical (TRP-01).
        <AssessmentsPanel
          jobId={jobId}
          project={project}
          ops={ops}
          run={run}
          embedded
          focusId={assessment ? assessmentId ?? undefined : undefined}
          startOnMount={assessmentId === NEW_ASSESSMENT}
          onExit={() => setAssessmentId(null)}
        />
      ) : null}
    </section>;
  }

  return <section className="pipeline-trip-workspace" aria-label="Trips workspace">
    <header className="pipeline-trip-header">
      <h3 className="pipeline-trip-library-heading">Trip library</h3>
      <button type="button" onClick={() => setCreating(true)}>＋ Create trip</button>
    </header>
    <TripCreateChoiceModal
      open={creating}
      stages={pipelineStages}
      onClose={() => setCreating(false)}
      onSelectManual={() => addCreated(createTrip(draft))}
      onSelectAI={createWithAI}
      onSelectComponent={() => { setCreating(false); setAssessmentId(NEW_ASSESSMENT); }}
    />
    <AIBuildLoader active={building !== null} onComplete={finishBuild} />
    {error && <p className="pipeline-trip-error" role="alert">{error}</p>}
    {notice && <p className="pipeline-trip-notice" role="status">{notice}</p>}
    <div className="pipeline-trip-library">
      <LibraryFilters query={libraryQuery} onQuery={setLibraryQuery} status={libraryStatus} onStatus={setLibraryStatus} types={[...new Set(draft.trips.flatMap(t=>t.stages.map(s=>s.type))), ...assessmentTypeOptions]} type={libraryType} onType={setLibraryType} label="trips"/>
      {(draft.trips.length>0||Object.keys(ops?.assessments??{}).length>0)&&!libraryTrips.length&&!libraryAssessments.length&&<p>No trips match these filters.</p>}
      {draft.trips.length === 0 && !Object.keys(ops?.assessments??{}).length ? <p>Create a trip to add assessment rounds to your pipeline.</p> : <>
        {libraryTrips.map((item) => <button className="pipeline-trip-library-row" type="button" key={`trip-${item.id}`} onClick={() => onSelectTrip(item.id)}>
          <span><strong>{item.title || "Untitled trip"}</strong><small>{item.stages.length} rounds · {item.stages.reduce((sum, stage) => sum + stage.durationMinutes, 0)} min</small></span>
          <span className="pipeline-trip-library-row-meta"><span className="pipeline-trip-kind-badge">Trip</span><TripStatusBadge status={item.status} /></span>
        </button>)}
        {libraryAssessments.map((item) => <button className="pipeline-trip-library-row" type="button" key={`component-${item.id}`} onClick={() => setAssessmentId(item.id)}>
          <span><strong>{item.title || "Untitled trip"}</strong><small>{item.levers.length} components · {item.stage || "No target stage"}</small></span>
          <span className="pipeline-trip-library-row-meta"><span className="pipeline-trip-kind-badge">Component</span><TripStatusBadge status={item.publishedAt ? "published" : "draft"} /></span>
        </button>)}
      </>}
    </div>
  </section>;
}
