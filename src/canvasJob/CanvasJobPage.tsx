import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactFlowInstance } from "@xyflow/react";
import { useNavigate } from "react-router-dom";
import { CanvasActionBar } from "./CanvasActionBar";
import { CanvasAINudge } from "./CanvasAINudge";
import { CanvasAskAI } from "./CanvasAskAI";
import { CanvasBoard } from "./CanvasBoard";
import { CanvasSidePanel } from "./CanvasSidePanel";
import { getCanvasNudge, getCanvasStatuses, isNodeUnlocked } from "./canvasStatus";
import { ApplicationPanel } from "./panels/ApplicationPanel";
import { JobDetailsPanel } from "./panels/JobDetailsPanel";
import { PublishPanel } from "./panels/PublishPanel";
import { RoleProfilePanel } from "./panels/RoleProfilePanel";
import { getCurrentJobId, getJob, startNewJob, upsertJobFromDraft, type JobRecord } from "../jobsStore";
import { loadDraft, saveDraft } from "../storage";
import type { CanvasNodeId, JobDraft } from "../types";
import "./canvas-job.css";

const NODE_TITLE: Record<CanvasNodeId, string> = {
  jobDetails: "Job Details",
  roleProfile: "Role Profile",
  application: "Application",
  publish: "Preview & Publish",
};

export function CanvasJobPage() {
  const navigate = useNavigate();
  const [jobId] = useState<string>(() => getCurrentJobId() ?? startNewJob());
  const [draft, setDraft] = useState<JobDraft>(() => loadDraft());
  const [job, setJob] = useState<JobRecord | null>(() => getJob(jobId));
  const [activePanel, setActivePanel] = useState<CanvasNodeId | null>(null);
  const [startPanelRecording, setStartPanelRecording] = useState(false);
  const [askAiOpen, setAskAiOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  const draftRef = useRef(draft);
  draftRef.current = draft;
  const rfInstanceRef = useRef<ReactFlowInstance | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      saveDraft(draftRef.current);
      setJob(upsertJobFromDraft(jobId, draftRef.current));
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [draft, jobId]);

  useEffect(() => {
    return () => {
      saveDraft(draftRef.current);
      upsertJobFromDraft(jobId, draftRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const statuses = useMemo(() => getCanvasStatuses(draft, job), [draft, job]);
  const nudge = useMemo(() => getCanvasNudge(draft, statuses), [draft, statuses]);

  function openNode(id: CanvasNodeId) {
    if (!isNodeUnlocked(id, statuses)) return;
    setAskAiOpen(false);
    setStartPanelRecording(false);
    setActivePanel(id);
  }

  function closePanel() {
    setActivePanel(null);
    setStartPanelRecording(false);
    saveDraft(draftRef.current);
    setJob(upsertJobFromDraft(jobId, draftRef.current));
  }

  function onRecord() {
    setAskAiOpen(false);
    setStartPanelRecording(true);
    setActivePanel("jobDetails");
  }

  function onPublished(record: JobRecord) {
    setJob(record);
    navigate(`/jobs/${jobId}`, { state: { justPublished: true } });
  }

  return (
    <div className="canvas-job-page">
      <header className="canvas-job-header">
        <h1 className="page-title">{draft.fields.designation.value.trim() || "New job"}</h1>
      </header>

      <div className="canvas-job-columns">
        <div className="canvas-job-canvas-col">
          <CanvasAINudge nudge={nudge} visible={activePanel === null} />
          <CanvasBoard
            statuses={statuses}
            onOpenNode={openNode}
            onInit={(instance) => (rfInstanceRef.current = instance)}
            onMove={(_, viewport) => setZoom(viewport.zoom)}
          />

          <CanvasActionBar
            visible={activePanel === null}
            onRecord={onRecord}
            onAskAI={() => setAskAiOpen((v) => !v)}
            onFitView={() => rfInstanceRef.current?.fitView({ padding: 0.35 })}
            zoom={zoom}
            onZoomIn={() => rfInstanceRef.current?.zoomIn({ duration: 150 })}
            onZoomOut={() => rfInstanceRef.current?.zoomOut({ duration: 150 })}
            onZoomReset={() => rfInstanceRef.current?.zoomTo(1, { duration: 200 })}
          />

          <CanvasAskAI open={askAiOpen} nudge={nudge} onClose={() => setAskAiOpen(false)} />
        </div>

        <CanvasSidePanel
          open={activePanel !== null}
          title={activePanel ? NODE_TITLE[activePanel] : ""}
          onClose={closePanel}
          onAnimationComplete={() => rfInstanceRef.current?.fitView({ padding: 0.35, duration: 200 })}
        >
          {activePanel === "jobDetails" ? (
            <JobDetailsPanel draft={draft} setDraft={setDraft} startInRecording={startPanelRecording} />
          ) : null}
          {activePanel === "roleProfile" ? <RoleProfilePanel draft={draft} setDraft={setDraft} /> : null}
          {activePanel === "application" ? <ApplicationPanel draft={draft} setDraft={setDraft} /> : null}
          {activePanel === "publish" ? (
            <PublishPanel jobId={jobId} draft={draft} setDraft={setDraft} onPublished={onPublished} />
          ) : null}
        </CanvasSidePanel>
      </div>
    </div>
  );
}
