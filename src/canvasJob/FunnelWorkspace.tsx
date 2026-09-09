import { tabKeyboard } from "../shared/tabKeyboard";
import { useAttachments } from "../collectJob/useAttachments";
import { editPipelineConnection } from "./pipelineConnections";
import { LibraryFilters } from "./LibraryFilters";
import { PublishComparison } from "./PublishComparison";
import { CanvasBlockToolbar } from "./CanvasBlockToolbar";
import { PipelineCandidates, needsDecision } from "./PipelineCandidates";
import { PipelineTripWorkspace } from "../trips/PipelineTripWorkspace";
import { PipelineNodeTools } from "./PipelineNodeTools";
import { migratePipeline, layoutPipeline, candidateStageNode, insertPipelineStage, reorderPipelineStage } from "./pipelineModel";
import { migratePipelineTrips } from "./pipelineTrips";
import { CanvasGlobalAssistant } from "./CanvasGlobalAssistant";
import { globalDemoReply } from "./globalAssistantModel";
import { InspectorResizeHandle } from "./InspectorResizeHandle";
import { CanvasNodeChat, type CanvasChatMessage } from "./CanvasNodeAssistant";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { ReactFlowInstance, Viewport } from "@xyflow/react";
import {
  getCurrentJobId,
  getJob,
  openJob,
  startNewJob,
  upsertJobFromDraft,
  publishJob,
} from "../jobsStore";
import { loadDraft, saveDraft } from "../storage";
import { getBoard, saveCanvasBoard } from "../candidatesStore";
import {
  DEFAULT_PIPELINE_STAGES,
  type JobDraft,
  type PipelineBoard,
  type CoverageId,
  type ApplicationConfig,
} from "../types";
import { MESSAGE_TEMPLATES } from "../communications/templates";
import { FieldGrid, FlagsChoice } from "../collectJob/JobFieldsForm";
import { seedApplication } from "../seedApplication";
import { ApplicationPanel } from "./panels/ApplicationPanel";
import { DemoApplication } from "../demo/DemoApplication";
import { DemoPanel, DemoToolbar } from "../demo/DemoPanel";
import { demoService, toBoard } from "../demo/service";
import { demoDraft, demoNodes } from "../demo/fixtures";
import type { DemoProject } from "../demo/types";
import { JobDetailsPanel } from "./panels/JobDetailsPanel";
import { FunnelCanvas } from "./FunnelCanvas";
import {
  baseFunnel,
  expandFunnel,
  resetFunnelLayout,
  node,
  publishErrors,
  removeBranch,
  templateFunnel,
  type FunnelNode,
} from "./funnelModel";
import "./canvas-job.css";
import "./funnel.css";
import "./pipeline-builder.css";
import "./workspace-responsive.css";
import "./flow-visual.css";
import { CAPABILITIES, withCapabilities } from "../hiring/catalog";
import { HiringWorkspace } from "../hiring/HiringWorkspace";
import { WorkspaceInfo } from "./WorkspaceInfo";
import { HiringChrome } from "../hiring/HiringChrome";

type Saved = {
  nodes: FunnelNode[];
  draft: JobDraft;
  board: PipelineBoard;
  started: boolean;
  viewport?: Viewport;
  published: boolean;
};
function read(id: string): Saved | null {
  const project = demoService().get(id);
  if (project) return { ...project.configuration, board: toBoard(project) };
  try {
    const v = JSON.parse(localStorage.getItem(`cp.funnel.${id}`) ?? "null");
    return v?.nodes && v?.draft?.fields && v?.board?.candidates ? v : null;
  } catch {
    return null;
  }
}
function bucket(id: string) {
  return id === "applied"
    ? "prospects"
    : ["screened", "submitted"].includes(id)
      ? "pipeline"
      : id === "archive"
        ? "archive"
        : "interview";
}
export function FunnelWorkspace() {
  const { id } = useParams();
  return <FunnelWorkspaceInner key={id ?? getCurrentJobId() ?? "new-job"} />;
}
function FunnelWorkspaceInner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [jobId] = useState(() => {
    if (id) {
      openJob(id);
      return id;
    }
    return getCurrentJobId() ?? startNewJob();
  });
  const [saved] = useState(() => read(jobId));
  const [initial] = useState(() => migratePipelineTrips(migratePipeline(
    saved?.nodes ?? (getJob(jobId) ? withCapabilities(expandFunnel(baseFunnel())) : baseFunnel()),
    saved?.board ?? getBoard(jobId)), saved?.draft ?? loadDraft()));
  const [draft, setDraft] = useState(initial.draft);
  const [items, setItems] = useState(initial.nodes);
  useEffect(() => {
    if (items.some(n => n.kind === 'trip' && !n.tripId && !n.placeholder) || (items.some(n=>n.kind==='stage') && !items.some(n=>n.stageKey))) {
      const next = migratePipelineTrips(migratePipeline(items, board), draft);
      setItems(next.nodes); setDraft(next.draft);
    }
  }, [items]);
  useEffect(()=>{
    setItems(all=>{
      let changed=false;
      const next=all.map(n=>{const t=n.tripId?draft.trips.find(t=>t.id===n.tripId):undefined;if(!t)return n;const duration=t.stages.reduce((sum,s)=>sum+s.durationMinutes,0);if(n.title===t.title&&n.description===t.spine&&n.duration===duration)return n;changed=true;return {...n,title:t.title,description:t.spine,duration};});
      return changed?next:all;
    });
  },[draft.trips]);
  const [board, setBoard] = useState<PipelineBoard>(
    () =>
      saved?.board ??
      (getJob(jobId)?.status === "Published"
        ? getBoard(jobId)
        : { stages: [...DEFAULT_PIPELINE_STAGES], candidates: [] }),
  );
  const [started, setStarted] = useState(saved?.started ?? !!getJob(jobId));
  const [published, setPublished] = useState(
    saved?.published ?? getJob(jobId)?.status === "Published",
  );
  const [demoOpen, setDemoOpen] = useState(false);
  const [,refreshProject]=useState(0);
  const [lifecycle, setLifecycle] = useState(
    () => demoService().get(jobId)?.operations?.setup.status || "",
  );
  const [active, setActive] = useState<string | null>(
    new URLSearchParams(location.search).get("tool"),
  );
  const [pipelineProposal,setPipelineProposal]=useState<{nodes:FunnelNode[];draft:JobDraft}|null>(null);
  const [reviewPublish,setReviewPublish]=useState(false);
  const [reviewed,setReviewed]=useState(false);
  const attachmentDraftRef=useRef(draft);attachmentDraftRef.current=draft;
  const {addFiles:attachDocuments,removeAttachment:removeDocument,fileErrors:documentErrors}=useAttachments({draftRef:attachmentDraftRef,setDraft,attachmentCount:draft.attachments.length});
  const documentInput=useRef<HTMLInputElement>(null);
  const [overview,setOverview]=useState(false);
  const [insertion,setInsertion]=useState<{parent:string;version:number}>();
  // TRP-01: the classic `/jobs/:id/trips` tab now redirects here with `?tab=trips` so it opens
  // straight into the canonical Trips library instead of duplicating it (see TripsListPage).
  const initialTab = new URLSearchParams(location.search).get("tab") === "trips" ? "trips" : "pipeline";
  const [workspaceTab,setWorkspaceTab]=useState<"pipeline"|"candidates"|"trips"|"communications"|"decisions">(initialTab);
  const [tripViewId,setTripViewId]=useState<string|null>(null);
  const [pendingTrip,setPendingTrip]=useState<{parent:string;outcome:'always'|'success'|'failure';placeholderId?:string}|null>(null);
  const [libraryQuery,setLibraryQuery]=useState('');
  const [libraryStatus,setLibraryStatus]=useState('');
  const [libraryType,setLibraryType]=useState('');
  const [attachment, setAttachment] = useState<{parent:string; kind:'trip'|'communication'; placeholderId?:string; outcome:'always'|'success'|'failure'} | null>(null);
  const [focus, setFocus] = useState(initialTab === "trips");
  const [candidateStage, setCandidateStage] = useState<string|null>(null);
  const [preview, setPreview] = useState(false);
  const [ai, setAI] = useState(false);
  useEffect(()=>{setLibraryQuery('');setLibraryStatus('');setLibraryType('');},[attachment?.kind,attachment?.parent]);
  const [globalOpen, setGlobalOpen] = useState(Boolean(saved?.started && saved.nodes.length === 1));
  const [globalPrompt, setGlobalPrompt] = useState("");
  const [globalModel, setGlobalModel] = useState("Claude");
  const [globalMessages, setGlobalMessages] = useState<CanvasChatMessage[]>([]);
  const [inspectorWidth, setInspectorWidth] = useState<number>();
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const prompt = active ? prompts[active] || "" : "";
  const setPrompt = (value: string) => { if (active) setPrompts((all) => ({ ...all, [active]: value })); };
  const [conversations, setConversations] = useState<Record<string, CanvasChatMessage[]>>({});
  const [formSuggestion, setFormSuggestion] =
    useState<ApplicationConfig | null>(null);
  const [suggestion, setSuggestion] = useState<FunnelNode[] | null>(null);
  const [notice, setNotice] = useState("");
  const [saveState, setSaveState] = useState("Saved");
  const [templates, setTemplates] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const flow = useRef<ReactFlowInstance | null>(null);
  const viewport = useRef(saved?.viewport);
  const centerTimer = useRef<number | undefined>(undefined);
  const [resetVersion, setResetVersion] = useState(0);
  const [detailOrigin,setDetailOrigin]=useState<{id:string;viewport?:Viewport;scroll:number;focus:boolean}|null>(null);
  const returningDetail=useRef(false);
  const restoreScroll=useRef<number|null>(null);
  const inspectorScroll = useRef<HTMLDivElement | null>(null);
  const surface = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const scroll=restoreScroll.current??0;restoreScroll.current=null;
    const frame=requestAnimationFrame(()=>{if(inspectorScroll.current)inspectorScroll.current.scrollTop=scroll;});
    return()=>cancelAnimationFrame(frame);
  }, [active]);
  const current = useRef<Saved>({
    nodes: items,
    draft,
    board,
    started,
    published,
  });
  current.current = { nodes: items, draft, board, started, published };
  const selected = workspaceTab==='trips' ? {...node('capability','Trips','job','cap-assessments'),capability:'assessments' as const} : workspaceTab==='communications' ? {...node('capability','Communications','job','cap-messages'),capability:'messages' as const} : (workspaceTab==='decisions'||workspaceTab==='candidates') ? {...node('capability','Candidates','job','cap-review'),capability:'review' as const} : items.find((n) => n.id === active);
  const liveProject=demoService().get(jobId);
  const messageTemplates=[...MESSAGE_TEMPLATES,...Object.values(liveProject?.operations?.templates||{}).map(t=>({id:t.id,name:t.name,subject:t.subject,body:t.body,channel:t.channel.toLowerCase()}))];
  const filteredTrips=draft.trips.filter(t=>`${t.title} ${t.spine}`.toLowerCase().includes(libraryQuery.trim().toLowerCase())&&(!libraryStatus||t.status===libraryStatus)&&(!libraryType||t.stages.some(s=>s.type===libraryType)));
  const filteredMessages=messageTemplates.filter(t=>`${t.name} ${t.subject} ${t.body}`.toLowerCase().includes(libraryQuery.trim().toLowerCase())&&(!libraryType||t.channel===libraryType));
  const decisionCount=liveProject?Object.values(liveProject.candidates).filter(c=>needsDecision(c,liveProject)).length:0;
  const counts: Record<string, number> = {};
  // On narrow screens, an expanded hiring detail panel collapses the app/job global chrome
  // (sidenav-as-topbar, workflow tabs, review banner) via a body class so more of the
  // viewport reaches the panel's own content; leaving focus removes the class and every
  // hidden element reappears exactly as it was (nothing is unmounted, only hidden).
  const panelExpanded = Boolean(
    started && selected?.kind === "capability" && (focus || workspaceTab !== "pipeline"),
  );
  useEffect(() => {
    document.body.classList.toggle("funnel-panel-expanded", panelExpanded);
    return () => document.body.classList.remove("funnel-panel-expanded");
  }, [panelExpanded]);
  // A newly-created node is not in the click handler's state yet; focus after it is rendered.
  useEffect(() => {
    if(returningDetail.current){returningDetail.current=false;return;}
    if (!active || active.startsWith("cap-")) return;
    const position = layoutPipeline(items).find((n) => n.id === active)?.position;
    if (!position) return;
    centerTimer.current = window.setTimeout(
      () =>
        flow.current?.setCenter(position.x + 130, position.y + 60 + (globalOpen ? Math.min(220, (surface.current?.clientHeight ?? 600) * 0.25) / 0.9 : 0), {
          zoom: 0.9,
          duration: 250,
        }),
      60,
    );
    return () => window.clearTimeout(centerTimer.current);
  }, [active, items.length, globalOpen]);
  board.candidates.forEach((c) => {
    const b = candidateStageNode(items, c.stageId)?.id ?? bucket(c.stageId);
    counts[b] = (counts[b] ?? 0) + 1;
    if (c.stageId !== b) counts[c.stageId] = (counts[c.stageId] ?? 0) + 1;
  });
  function save() {
    try {
      const config = { ...current.current, viewport: viewport.current };
      const project = demoService().saveConfiguration(
        jobId,
        config,
        current.current.board,
      );
      saveDraft(config.draft);
      upsertJobFromDraft(jobId, config.draft);
      saveCanvasBoard(jobId, toBoard(project));
      setSaveState("Saved");
    } catch {
      setSaveState("Could not save");
    }
  }
  function loadScenario(project: DemoProject) {
    const config = project.configuration;
    current.current = { ...config, board: toBoard(project) };
    setDraft(config.draft);
    const migrated = migratePipelineTrips(migratePipeline(withCapabilities(config.nodes), toBoard(project)), config.draft);
    setItems(migrated.nodes); setDraft(migrated.draft);
    setBoard(toBoard(project));
    setStarted(config.started);
    setPublished(config.published);
    setActive(null);
    setGlobalOpen(false);
    setGlobalPrompt("");
    setGlobalMessages([]);
    setDemoOpen(false);
    setPreview(false);
    saveDraft(config.draft);
    upsertJobFromDraft(jobId, config.draft);
    if (config.published) publishJob(jobId, config.draft);
    setNotice(
      "Sample demo loaded.",
    );
    requestAnimationFrame(() =>
      flow.current?.fitView({ padding: 0.2, duration: 250 }),
    );
  }
  function importRole(role: string) {
    setDraft(demoDraft(role));
    setItems((all) => withCapabilities(expandFunnel(all)));
    setNotice(
      role +
        " imported from the sample source. Review the role and publish when ready.",
    );
  }
  useEffect(
    () =>
      demoService().subscribe(() => {
        refreshProject(v=>v+1);
        const project = demoService().get(jobId);
        if (project) {
          setLifecycle(project.operations?.setup.status || "");
          const updated = toBoard(project);
          setBoard((previous) =>
            JSON.stringify(previous) === JSON.stringify(updated)
              ? previous
              : updated,
          );
        }
      }),
    [jobId],
  );

  useEffect(() => {
    setSaveState("Unsaved changes");
    const timer = setTimeout(save, 650);
    return () => clearTimeout(timer);
  }, [items, draft, started, published]);
  useEffect(() => {
    const flush = () => {
      try {
        demoService().saveConfiguration(
          jobId,
          { ...current.current, viewport: viewport.current },
          current.current.board,
        );
      } catch {
        /* keep editing */
      }
    };
    window.addEventListener("pagehide", flush);
    return () => {
      flush();
      window.removeEventListener("pagehide", flush);
    };
  }, [jobId]);
  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActive(null);
        setPreview(false);
        setAI(false);
        setDemoOpen(false);
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  function returnToOrigin(pipelineOnly=false){
    const fallback=CAPABILITIES.find(c=>`cap-${c.id}`===active)?.parent||selected?.parent||'job';
    const id=detailOrigin?.id||fallback;
    returningDetail.current=true;restoreScroll.current=pipelineOnly?0:detailOrigin?.scroll||0;
    window.clearTimeout(centerTimer.current);
    setWorkspaceTab('pipeline');setCandidateStage(null);setReviewPublish(false);setDemoOpen(false);setPreview(false);setAI(false);setAttachment(null);setPendingTrip(null);
    setFocus(pipelineOnly?false:detailOrigin?.focus||false);
    setActive(pipelineOnly?null:items.some(n=>n.id===id)?id:'job');
    const previous=detailOrigin?.viewport;setDetailOrigin(null);
    if(previous)requestAnimationFrame(()=>{void flow.current?.setViewport(previous,{duration:0});});
  }
  function select(id: string) {
    if(id.startsWith('cap-')){
      if(active&&!active.startsWith('cap-')&&workspaceTab==='pipeline')setDetailOrigin({id:active,viewport:flow.current?.getViewport(),scroll:inspectorScroll.current?.scrollTop||0,focus});
    }else setDetailOrigin(null);
    setOverview(false);
    setReviewPublish(false);
    setWorkspaceTab("pipeline"); setCandidateStage(null);
    if (id.startsWith("cap-")) save();
    if (id.startsWith("cap-") && !items.some((n) => n.id === id)) {
      const capability=CAPABILITIES.find(c=>`cap-${c.id}`===id);
      if(capability) setItems(all=>[...all,{...node('capability',capability.id==='assessments'?'Trips library':capability.title,'job',id),capability:capability.id}]);
    }
    setAttachment(null);
    setDemoOpen(false);
    setActive(id);
    setAI(false);
    setSuggestion(null);
    setFormSuggestion(null);
    setPreview(false);
    const ancestors = new Set<string>();
    let parent = items.find((n) => n.id === id)?.parent;
    while (parent) {
      ancestors.add(parent);
      parent = items.find((n) => n.id === parent)?.parent;
    }
    setItems((all) =>
      all.some((n) => ancestors.has(n.id) && n.collapsed)
        ? all.map((n) => (ancestors.has(n.id) ? { ...n, collapsed: false } : n))
        : all,
    );
  }

  function patch(id: string, change: Partial<FunnelNode>) {
    setItems((all) => all.map((n) => (n.id === id ? { ...n, ...change } : n)));
  }
  function add(kind: "round" | "trip" | "communication", parent: string) {
    const next = node(
      kind,
      kind === "round"
        ? `Round ${items.filter((n) => n.kind === "round").length + 1}`
        : kind === "trip"
          ? "Untitled trip"
          : "New communication",
      parent,
    );
    setItems((all) => [
      ...all.map((n) => (n.id === parent ? { ...n, collapsed: false } : n)),
      next,
    ]);
    select(next.id);
  }
  function start(role?: string, mode: "scratch" | "import" = "scratch") {
    setStarted(true);
    if (role) {
      setItems(withCapabilities(demoNodes(role)));
      setDraft(demoDraft(role));
      setNotice("Your " + role + " template is ready to tailor and publish.");
    } else {
      setItems(baseFunnel());
      setActive(mode === "import" ? "job" : null);
      setAI(false);
      setGlobalOpen(mode === "scratch");
      setGlobalPrompt("");
      setGlobalMessages([]);
    }
  }
  function build() {
    setItems(withCapabilities(expandFunnel(items)));
    setDraft((d) => ({
      ...d,
      application: d.application ?? seedApplication(d),
    }));
  }
  function remove(n: FunnelNode) {
    if (!window.confirm(`Remove “${n.title}” and its nested configuration?`))
      return;
    setItems((all) => removeBranch(all, n.id));
    setActive(n.parent);
  }
  function suggest() {
    if (!selected || !prompt.trim()) return;
    setSuggestion(null);
    setFormSuggestion(null);
    const reply = selected.kind === "capability"
      ? `Update ${selected.title} in the detail panel.`
      : `Suggested changes for ${selected.title}.`;
    setConversations((all) => ({ ...all, [selected.id]: [...(all[selected.id] || []), { role: "user", text: prompt.trim() }, { role: "assistant", text: reply }] }));
    setPrompt("");
    if (selected.kind === "capability") return;
    if (selected.kind === "job" || selected.kind === "stage") {
      const s = templateFunnel(draft.fields.designation.value || prompt);
      setSuggestion(
        selected.kind === "job"
          ? s
          : s.filter(
              (n) =>
                n.parent === selected.id ||
                s.find((p) => p.id === n.parent)?.parent === selected.id,
            ),
      );
    } else if (selected.kind === "round") {
      const t = node("trip", "Practical work sample", selected.id);
      t.description =
        prompt ||
        "Share an example of your work. Explain your decisions and the outcome.";
      const m = node("communication", "Round invitation", selected.id);
      m.body =
        "Hi {{candidate_name}},\n\nWe look forward to learning more about your work for {{job_title}}. Please complete the next step at a time that suits you.";
      setSuggestion([t, m]);
    } else if (selected.kind === "trip")
      setSuggestion([
        {
          ...selected,
          description: `${prompt || "Show how you approach a realistic task."}\n\n1. Explain your assumptions.\n2. Walk through your approach.\n3. Share trade-offs and how you would check your result.\n\nPlease spend no more than ${selected.duration} minutes.`,
        },
      ]);
    else if (selected.kind === "communication")
      setSuggestion([
        {
          ...selected,
          body: "Hi {{candidate_name}},\n\nThank you for your interest in {{job_title}} and the time you have shared with us. We would like to invite you to the next step. Please reply with any questions or accommodation requests.\n\nWe look forward to hearing from you.",
        },
      ]);
    else {
      const form = structuredClone(draft.application ?? seedApplication(draft));
      if (/portfolio|add|work sample/i.test(prompt)) {
        if (!form.standardOrder.some((f) => f.id === "portfolioUrl"))
          form.standardOrder.push({
            id: "portfolioUrl",
            required: "mandatory",
          });
        else
          form.standardOrder = form.standardOrder.map((f) =>
            f.id === "portfolioUrl" ? { ...f, required: "mandatory" } : f,
          );
        form.items.push({
          id: crypto.randomUUID(),
          kind: "question",
          type: "paragraph",
          prompt:
            "Choose one project from your portfolio. What was your contribution, and what changed for the customer?",
          required: "mandatory",
          options: [],
        });
      } else {
        form.standardOrder = form.standardOrder.map((f) =>
          ["resume", "linkedinUrl"].includes(f.id)
            ? f
            : { ...f, required: "optional" },
        );
        form.items = form.items
          .filter((q) => q.kind === "section" || q.required === "mandatory")
          .slice(0, 3);
      }
      setFormSuggestion(form);
    }
  }
  function accept() {
    if (selected && (formSuggestion || suggestion)) setConversations((all) => ({ ...all, [selected.id]: [...(all[selected.id] || []), { role: "assistant", text: "Changes applied." }] }));
    if (formSuggestion) {
      setDraft((d) => ({ ...d, application: formSuggestion }));
      setFormSuggestion(null);
      setNotice(
        "Suggested form changes applied. Preview the candidate experience to review.",
      );
      return;
    }
    if (!suggestion) return;
    setItems((all) => {
      let next = expandFunnel(all);
      for (const n of suggestion) {
        if (next.some((x) => x.id === n.id)) {
          if (!["job", "stage", "application"].includes(n.kind))
            next = next.map((x) => (x.id === n.id ? n : x));
        } else next.push(n);
      }
      return next;
    });
    setSuggestion(null);
    setNotice("Suggestions applied. Every field remains editable.");
  }
  function publish() {
    const missing = publishErrors(draft);
    if (missing.length) {
      select("job");
      setNotice("Complete before publishing: " + missing.join(", "));
      return;
    }
    if (!draft.application) {
      build();
      select("application");
      setNotice("Review the application form before publishing.");
      return;
    }
    try {
      save();
      const project = demoService().publish(jobId);
      publishJob(jobId, draft);
      setPublished(true);
      current.current = { ...current.current, published: true };
      setNotice(
        "Published version " +
          project.revisions[project.liveRevisionId!].number +
          ". Existing invitations are preserved.",
      );
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Unable to publish.");
    }
  }
  function field(key: CoverageId, value: string) {
    setDraft((d) => ({
      ...d,
      fields: { ...d.fields, [key]: { value, source: "user" } },
    }));
  }
  const ordered: FunnelNode[] = [];
  function visit(parent: string | null) {
    for (const n of items.filter((x) => x.parent === parent)) {
      ordered.push(n);
      visit(n.id);
    }
  }
  visit(null);
  const rendered = ordered.map((n) =>
    n.id === "job"
      ? {
          ...n,
          title: draft.fields.designation.value || "Job configuration",
          description:
            draft.fields.location.value ||
            "",
        }
      : n,
  );
  const nodeChat = selected && ai ? (
    <CanvasNodeChat key={selected.id} item={selected} prompt={prompt} setPrompt={setPrompt}
      messages={conversations[selected.id] || []} onSend={suggest} onClose={() => setAI(false)}>
                          {formSuggestion && (
                            <div>
                              <p>
                                Suggested form:{" "}
                                {
                                  formSuggestion.standardOrder.filter(
                                    (f) => f.required === "mandatory",
                                  ).length
                                }{" "}
                                required profile fields and{" "}
                                {
                                  formSuggestion.items.filter(
                                    (q) => q.kind === "question",
                                  ).length
                                }{" "}
                                questions.
                              </p>
                              <ul>
                                {formSuggestion.items.map((q) => (
                                  <li key={q.id}>
                                    {q.kind === "question" ? q.prompt : q.title}
                                  </li>
                                ))}
                              </ul>
                              <button
                                className="funnel-primary"
                                onClick={accept}
                              >
                                Accept form changes
                              </button>
                              <button onClick={() => setFormSuggestion(null)}>
                                Dismiss
                              </button>
                            </div>
                          )}
                          {suggestion && (
                            <>
                              <ul>
                                {suggestion
                                  .filter(
                                    (n) =>
                                      !["job", "stage", "application"].includes(
                                        n.kind,
                                      ),
                                  )
                                  .map((n) => (
                                    <li key={n.id}>
                                      <strong>{n.title}</strong>
                                      <p>{n.body || n.description}</p>
                                    </li>
                                  ))}
                              </ul>
                              <div className="funnel-inline">
                                <button
                                  className="funnel-primary"
                                  onClick={accept}
                                >
                                  Accept suggestions
                                </button>
                                <button onClick={() => setSuggestion(null)}>
                                  Dismiss
                                </button>
                              </div>
                            </>
                          )}
    </CanvasNodeChat>
  ) : null;
  const workspaceInfo = (
    <WorkspaceInfo>
        <HiringChrome jobId={jobId} beforeNavigate={save} onTool={select} />
      <DemoToolbar
        jobId={jobId}
        onLoad={loadScenario}
        beforeAction={save}
        onOpen={() => {
          save();
          setStarted(true);
          setDemoOpen(true);
          setPreview(false);
        }}
      />
    </WorkspaceInfo>
  );
  return (
    <div className="funnel-workspace">
      <header className="funnel-header">
        <button
          onClick={() => {
            save();
            navigate("/");
          }}
          aria-label="Back to jobs"
        >
          ←
        </button>
        <div>
          <h1>{draft.fields.designation.value || "Untitled role"}</h1>
        </div>
        <span className="funnel-status">
          {lifecycle || (published ? "Published" : "Draft")}
        </span>
        <div className="funnel-header-actions">
          <small role="status">{saveState}</small>
          <button onClick={save}>Save</button>
          <button
            onClick={() => {
              setAI(false);
              setPreview((v) => !v);
              setActive("application");
              setDemoOpen(false);
              save();
            }}
          >
            Preview
          </button>
          <button className="funnel-primary" onClick={()=>{setReviewPublish(true);setReviewed(false);setFocus(false);setWorkspaceTab("pipeline");setCandidateStage(null);}}>
            {published ? "Publish updates" : "Publish job"} ↗
          </button>
        </div>
      </header>
      {started && <>
        <nav className="pipeline-nav" aria-label="Workflow views">
          {(['pipeline','candidates','trips','communications'] as const).map(tab=><button key={tab} role="tab" aria-selected={workspaceTab===tab || tab==='candidates'&&workspaceTab==='decisions'} onClick={()=>{setDetailOrigin(null);setPendingTrip(null);setWorkspaceTab(tab);setReviewPublish(false);setPreview(false);setDemoOpen(false);setCandidateStage(null);setFocus(tab!=='pipeline');setAttachment(null);}}>{tab[0].toUpperCase()+tab.slice(1)}</button>)}

          <span className="pipeline-mode-label">{published?'Published workflow':'Draft · review before publishing'}</span>
        </nav>
        {(workspaceTab==='candidates'||workspaceTab==='decisions') && <div className="pipeline-stage-strip" role="tablist" onKeyDown={tabKeyboard} aria-label="Candidates by stage">
          <button role="tab" aria-selected={workspaceTab==='candidates'&&!candidateStage} onClick={()=>{setWorkspaceTab('candidates');setCandidateStage(null);}}>All candidates <b>{board.candidates.length}</b></button>
          <button role="tab" aria-selected={workspaceTab==='decisions'} onClick={()=>{setWorkspaceTab('decisions');setCandidateStage(null);}}>Needs decision <b>{decisionCount}</b></button>
          {items.filter(n=>n.kind==='stage').map(stage=>{
            const pending=liveProject?Object.values(liveProject.candidates).filter(c=>candidateStageNode(items,c.stageId)?.id===stage.id&&needsDecision(c,liveProject)).length:0;
            return <button role="tab" aria-selected={candidateStage===stage.id} key={stage.id} aria-label={`View candidates in ${stage.title}`} onClick={()=>{setWorkspaceTab("candidates");setCandidateStage(stage.id);setFocus(true);setReviewPublish(false);}}>{stage.title}<b>{counts[stage.id]||0}</b>{pending>0&&<small>{pending} to review</small>}</button>;
          })}
        </div>}
      </>}
      {started && published && workspaceTab==='pipeline' && <div className="pipeline-review-banner">
        <div><strong>{published?`${board.candidates.length} candidates · ${decisionCount} decisions to review`:'Draft with AI → Review → Publish'}</strong></div>
        {published?<button onClick={()=>{setWorkspaceTab('decisions');setFocus(true);}}>Review decisions →</button>:<button onClick={()=>{setGlobalOpen(true);setAI(false);}}>Draft pipeline with AI</button>}
      </div>}
      {notice && (
        <div className="funnel-notice" role="status">
          {notice}
          <button
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}
      {!started ? (
        <div className="funnel-start">
          <div className="workspace-canvas-controls">{workspaceInfo}</div>
          <span className="funnel-start-icon">⌘</span>
          <h2>New job</h2>
          {!templates ? (
            <div className="funnel-start-options funnel-start-options--entry">
              <button onClick={() => start()}>
                <b>＋</b>
                <strong>Build with AI</strong>
              </button>
              <button onClick={() => setTemplates(true)}>
                <b>▦</b>
                <strong>Start with a Template</strong>
              </button>

            </div>
          ) : (
            <>
              <div className="funnel-start-options">
                {[
                  "Senior Product Designer",
                  "Software Engineer",
                  "Account Executive",
                ].map((role) => (
                  <button key={role} onClick={() => start(role)}>
                    <b>▦</b>
                    <strong>{role}</strong>
                    <span>Application · assessment · 2 interview rounds</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setTemplates(false)}>
                ← All starting options
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="funnel-body">
          <section ref={surface} className="funnel-surface" aria-label="Hiring canvas">
            <div className="pipeline-overview-control"><button aria-pressed={overview} onClick={()=>{setOverview(v=>!v);setGlobalOpen(false);setAI(false);}}>{overview?'Detailed canvas':'Stage overview'}</button>{overview&&<span>Select a stage to focus</span>}</div>
            <FunnelCanvas
              onAddPipeline={build}
              overview={overview}
              onConnection={(link,old)=>{try{setItems(editPipelineConnection(items,link,old));setNotice(link?'Connection updated.':'Connection removed. Nodes retained.');}catch(error){setNotice(error instanceof Error?error.message:'Unable to connect these nodes.');}}}
              onInsert={parent=>{setGlobalOpen(false);setAI(false);setInsertion({parent,version:Date.now()});}}
              items={rendered}
              selected={active}
              counts={counts}
              onSelect={(id) => {
                if(overview){select(id);return;}
                if (active === id && !demoOpen && !preview) {
                  setActive(null);
                  setAI(false);
                } else select(id);
              }}
              resetVersion={resetVersion}
              onDragStart={() => {
                window.clearTimeout(centerTimer.current);
                const currentViewport = flow.current?.getViewport();
                if (currentViewport) void flow.current?.setViewport(currentViewport, { duration: 0 });
              }}
              onPositions={(changes) => setItems((all) => all.map((item) => {
                const change = changes.find((change) => change.id === item.id);
                return change ? { ...item, position: change.position } : item;
              }))}
              onToggle={(id) =>
                patch(id, {
                  collapsed: !items.find((n) => n.id === id)?.collapsed,
                })
              }
              aiOpen={ai}
              chat={nodeChat}
              onCloseAI={() => setAI(false)}
              onAI={() => {
                setGlobalOpen(false);
                setPreview(false);
                setDemoOpen(false);
                setAI(true);
              }}
              onInit={(instance) => {
                flow.current = instance;
              }}
              viewport={saved?.viewport}
              onViewport={(v) => {
                viewport.current = v;
              }}
            />
            <CanvasGlobalAssistant
              toolbar={<CanvasBlockToolbar insertion={insertion} aiOpen={globalOpen} onOpen={()=>setGlobalOpen(false)} items={items} onSpawn={(kind,point)=>{
                const bounds=surface.current?.getBoundingClientRect();if(!bounds||!flow.current)return;
                if(point&&(point.x<bounds.left||point.x>bounds.right||point.y<bounds.top||point.y>bounds.bottom||document.elementFromPoint(point.x,point.y)?.closest('.canvas-global-assistant,.pipeline-overview-control,.workspace-canvas-controls')))return;
                const position=flow.current.screenToFlowPosition(point||{x:bounds.left+bounds.width/2,y:bounds.top+bounds.height*.4});
                const added={...node(kind,kind==='round'?'New activity':kind==='communication'?'New message':`New ${kind}`,null),manual:true,placeholder:kind==='trip'||kind==='communication',active:kind!=='communication',position:{x:position.x-130,y:position.y-45},...(kind==='stage'?{stageKey:crypto.randomUUID()}: {})};
                returningDetail.current=true;window.clearTimeout(centerTimer.current);setItems(all=>[...all,added]);setActive(null);setOverview(false);setFocus(false);setWorkspaceTab('pipeline');setAI(false);setGlobalOpen(false);setAttachment(null);
              }} onAdd={(kind,parent,title,outcome)=>{
                setGlobalOpen(false);setFocus(false);
                if(kind==='stage'){
                  const next=insertPipelineStage(items,parent,title);const added=next.find(n=>!items.some(old=>old.id===n.id));
                  setItems(next);if(added)select(added.id);
                }else if(kind==='round'){
                  const added=node('round',title,parent);setItems(all=>[...all,added]);select(added.id);
                }else{select(parent);setAttachment({parent,kind,outcome});}
              }}/>}
              open={globalOpen}
              onOpen={() => { setAI(false); setGlobalOpen(true); }}
              onClose={() => setGlobalOpen(false)}
              messages={globalMessages}
              prompt={globalPrompt}
              onPromptChange={setGlobalPrompt}
              model={globalModel}
              onModelChange={setGlobalModel}
              isStarting={items.length === 1}
              hasAttachments={draft.attachments.some(a=>a.kind==='document')}
              attachments={<div className="canvas-document-controls">
                <input ref={documentInput} type="file" multiple accept=".pdf,.doc,.docx,.txt,.md" aria-label="Upload assistant documents" hidden onChange={e=>{attachDocuments(Array.from(e.target.files||[]).filter(f=>/\.(pdf|docx?|txt|md)$/i.test(f.name)));setPipelineProposal(null);e.target.value='';}}/>
                <button type="button" onClick={()=>documentInput.current?.click()}>＋ Upload document</button>
                {draft.attachments.filter(a=>a.kind==='document').map(a=><span className="canvas-document-chip" key={a.id}><span title={a.name}>{a.name}</span><button type="button" aria-label={`Remove document ${a.name}`} onClick={()=>{removeDocument(a.id);setPipelineProposal(null);}}>×</button></span>)}
                {documentErrors.map(error=><p role="alert" key={error}>{error}</p>)}
              </div>}

              onSubmit={() => {
                const documents=draft.attachments.filter(a=>a.kind==='document');
                const message = globalPrompt.trim() || (documents.length?'Build a pipeline with the attached documents.':'');
                if (!message) return;
                setGlobalMessages((history) => [...history,
                  { role: "user", text: message + (documents.length?`\nAttached: ${documents.map(a=>a.name).join(", ")}`:"") },
                  { role: "assistant", text: documents.length?"Documents attached. Here’s a demo pipeline to review and tailor to your role.":globalDemoReply(message, items, draft) },
                ]);
                if (/build|create|generate|pipeline|hiring|engineer|designer|manager/i.test(message)) {
                  const role=draft.fields.designation.value || message.match(/(?:senior |junior |lead )?(?:backend |frontend |product |software |full.stack )?(?:engineer|designer|manager|analyst|recruiter)/i)?.[0] || '';
                  const proposedDraft={...draft,fields:{...draft.fields,designation:role?{value:role[0].toUpperCase()+role.slice(1),source:'extracted' as const}:draft.fields.designation}};
                  const nextDraft={...proposedDraft,application:proposedDraft.application||seedApplication(proposedDraft)};
                  const proposedNodes=items.some(n=>n.kind==='stage')?items:withCapabilities(templateFunnel(role));
                  setPipelineProposal(migratePipelineTrips(migratePipeline(proposedNodes,board),nextDraft));
                }
                setGlobalPrompt("");
              }}
            >{pipelineProposal && <div className="pipeline-ai-proposal"><strong>Pipeline draft · review before applying</strong><p>{pipelineProposal.nodes.filter(n=>n.kind==='stage'&&!n.exit).map(n=>n.title).join(' → ')}</p><p>Includes application, trips, experience review and a thank-you path.</p><button className="funnel-primary" onClick={()=>{setItems(pipelineProposal.nodes);setDraft(pipelineProposal.draft);setStarted(true);setPipelineProposal(null);setGlobalOpen(false);setActive('job');setNotice('Draft applied. Review role details, activities and rules before publishing.');}}>Apply pipeline draft</button><button onClick={()=>setPipelineProposal(null)}>Discard draft</button></div>}</CanvasGlobalAssistant>
            <div className="workspace-canvas-controls">
            <button
              className="funnel-fit"
              onClick={() => {
                window.clearTimeout(centerTimer.current);
                setItems((all) => resetFunnelLayout(all));
                setResetVersion((version) => version + 1);
              }}
            >
              Reset canvas layout
            </button>
            {workspaceInfo}
            </div>
          </section>
          {(selected || preview || demoOpen || reviewPublish) && (
            <aside
              style={{ "--inspector-width": inspectorWidth ? `${inspectorWidth}px` : undefined } as CSSProperties}
              data-stage-focus={candidateStage || undefined} className={`funnel-inspector ${focus || workspaceTab!=="pipeline" ? "pipeline-expanded" : ""} ${preview ? "funnel-preview" : ""} ${selected?.kind === "capability" ? "funnel-hiring-panel" : ""}`}
            >
              <InspectorResizeHandle width={inspectorWidth} onWidthChange={setInspectorWidth} />
              <header>
                <div>
                  <h2>
                    {reviewPublish ? "Review & publish" : candidateStage ? `${items.find(n=>n.id===candidateStage)?.title} · Candidates` : demoOpen
                      ? "Demo tools"
                      : preview
                        ? "Application preview"
                        : selected?.title}
                  </h2>
                </div>
                <button aria-label={workspaceTab !== "pipeline" ? "Return to pipeline" : focus ? "Collapse detail view" : "Expand detail view"} onClick={()=>{if(workspaceTab !== "pipeline"){setWorkspaceTab("pipeline");setCandidateStage(null);setFocus(false);}else setFocus(v=>!v);}}>{focus ? "↙" : "↗"}</button>
                <button
                  aria-label="Close detail panel"
                  onClick={() => {
                    setActive(null); setReviewPublish(false); setWorkspaceTab("pipeline"); setFocus(false); setCandidateStage(null);
                    setPreview(false);
                    setDemoOpen(false);
                  }}
                >
                  ×
                </button>
              </header>
              {workspaceTab==='pipeline'&&selected?.kind==='capability'&&!reviewPublish&&!preview&&!demoOpen&&<nav className="pipeline-detail-breadcrumbs" aria-label="Detail navigation">
                <button type="button" aria-label="Back to originating node" title="Back to originating node" onClick={()=>returnToOrigin()}>←</button>
                <button type="button" onClick={()=>returnToOrigin(true)}>Pipeline</button><span aria-hidden="true">/</span>
                <button type="button" onClick={()=>returnToOrigin()}>{items.find(n=>n.id===(detailOrigin?.id||CAPABILITIES.find(c=>`cap-${c.id}`===active)?.parent||selected.parent))?.title||'Job configuration'}</button><span aria-hidden="true">/</span>
                <span aria-current="page">{selected.title}</span>
              </nav>}
              <div className="funnel-inspector-scroll" ref={inspectorScroll}>
                {reviewPublish && <section className="pipeline-publish-review">
                  <h3>{draft.fields.designation.value||'Untitled role'}</h3>
                  <PublishComparison nodes={items} draft={draft} live={liveProject?.liveRevisionId?liveProject.revisions[liveProject.liveRevisionId]:undefined}/>
                  <ol>{items.filter(n=>n.kind==='stage'&&!n.exit).map(n=><li key={n.id}><strong>{n.title}</strong><small>{items.filter(child=>child.parent===n.id&&child.kind!=='capability').map(child=>child.title).join(' · ')||'Stage decisions'}</small></li>)}</ol>
                  <h3>Rules & outcomes</h3>
                  {items.filter(n=>n.rules?.length).map(n=><div key={n.id} className="pipeline-rule"><strong>{n.title}</strong>{n.rules?.filter(r=>r.enabled).map(r=><span key={r.id}>{r.field==='experience'?`At least ${r.value} years of experience`:`Résumé domain includes ${r.value||'— configure domain'}`}</span>)}<small>Requirements met → continue · Rule not met → review and thank-you communication</small></div>)}
                  <p className="pipeline-caption">Trip responses require human review. Draft trips must be published before they can be assigned.</p>
                  {publishErrors(draft).length>0&&<p role="alert">Complete: {publishErrors(draft).join(', ')}. <button onClick={()=>select('job')}>Edit role</button></p>}
                  <label><input type="checkbox" checked={reviewed} onChange={e=>setReviewed(e.target.checked)}/> I’ve reviewed the stages, rules and messages.</label>
                  <button className="funnel-primary" disabled={!reviewed||publishErrors(draft).length>0||!items.some(n=>n.kind==='stage')} onClick={()=>{publish();setReviewPublish(false);}}>Confirm & publish</button>
                </section>}
                {(!reviewPublish && (candidateStage || workspaceTab==='decisions' || workspaceTab==='candidates')) && <PipelineCandidates key={candidateStage||workspaceTab} jobId={jobId} items={items} stageId={candidateStage} onlyDecisions={workspaceTab==='decisions'}/>}
                {selected?.kind==='trip' && !selected.placeholder && !reviewPublish && <details><summary>Transition & outcomes</summary><PipelineNodeTools item={selected} items={items} onPatch={change=>patch(selected.id,change)} onInsert={()=>{}} onReorder={()=>{}} onCandidates={()=>{}} onAttach={(kind,outcome)=>{if(kind!=='round')setAttachment({parent:selected.id,kind,outcome});}}/>{items.filter(n=>n.parent===selected.id).map(n=><button className="funnel-child" key={n.id} onClick={()=>select(n.id)}>{n.title} · {n.outcome||'on this step'}</button>)}<button className="funnel-delete" onClick={()=>remove(selected)}>Detach trip</button></details>}
                {attachment && <section className="pipeline-picker" aria-label="Attachment picker">
                  <header><h3>{attachment.kind==='trip'?'Trip library':'Communication templates'}</h3><button aria-label="Close attachment picker" onClick={()=>setAttachment(null)}>×</button></header>
                  <p className="pipeline-caption">{items.find(n=>n.id===attachment.parent)?.title} · {attachment.outcome==='failure'?'Rule not met':attachment.outcome==='success'?'Requirements met':'On this step'}</p>
                  <LibraryFilters query={libraryQuery} onQuery={setLibraryQuery} status={libraryStatus} onStatus={attachment.kind==='trip'?setLibraryStatus:undefined} types={attachment.kind==='trip'?[...new Set(draft.trips.flatMap(t=>t.stages.map(s=>s.type)))]:[...new Set(messageTemplates.map(t=>t.channel))]} type={libraryType} onType={setLibraryType} label={attachment.kind==='trip'?'trips':'messages'}/>
                  {(attachment.kind==='trip'?!filteredTrips.length:!filteredMessages.length)&&<p>No matching templates. Change the filters or create a new one.</p>}
                  {attachment.kind==='trip' ? filteredTrips.map(t=><button className="funnel-child" key={t.id} onClick={()=>{const next={...(items.find(n=>n.id===attachment.placeholderId)||node('trip',t.title,attachment.parent)),title:t.title,placeholder:false,tripId:t.id,outcome:attachment.outcome,description:t.spine,duration:t.stages.reduce((sum,s)=>sum+s.durationMinutes,0)};setItems(all=>all.some(n=>n.id===next.id)?all.map(n=>n.id===next.id?next:n):[...all,next]);setAttachment(null);select(next.id);}}><strong>{t.title}</strong><small>{t.status} · {t.stages.length} components</small></button>) : filteredMessages.map(t=><button className="funnel-child" key={t.id} onClick={()=>{const next={...(items.find(n=>n.id===attachment.placeholderId)||node('communication',t.name,attachment.parent)),title:t.name,placeholder:false,active:true,subject:t.subject,body:t.body,outcome:attachment.outcome,trigger:attachment.outcome==='failure'?'When a requirement is not met':attachment.outcome==='success'?'When requirements are met':'When round starts'};setItems(all=>all.some(n=>n.id===next.id)?all.map(n=>n.id===next.id?next:n):[...all,next]);setAttachment(null);select(next.id);}}>{t.name}</button>)}
                  <button onClick={()=>{if(attachment.kind==='trip'){setPendingTrip({parent:attachment.parent,outcome:attachment.outcome,placeholderId:attachment.placeholderId});setTripViewId(null);select('cap-assessments');return;}const next={...(items.find(n=>n.id===attachment.placeholderId)||node('communication','New communication',attachment.parent)),placeholder:false,active:true,outcome:attachment.outcome,trigger:attachment.outcome==='failure'?'When a requirement is not met':attachment.outcome==='success'?'When requirements are met':'When round starts'};setItems(all=>all.some(n=>n.id===next.id)?all.map(n=>n.id===next.id?next:n):[...all,next]);setAttachment(null);select(next.id);}}>＋ Create new {attachment.kind}</button>
                </section>}

                {reviewPublish || candidateStage || (workspaceTab==='decisions'||workspaceTab==='candidates') ? null : demoOpen ? (
                  <DemoPanel jobId={jobId} onImport={importRole} />
                ) : preview ? (
                  <DemoApplication projectId={jobId} preview />
                ) : selected?.placeholder ? (<section className="pipeline-placeholder-panel"><h3>{selected.kind==='trip'?'Choose a Trip':'Choose a message'}</h3><button className="funnel-primary" onClick={()=>setAttachment({parent:selected.parent||'job',kind:selected.kind==='trip'?'trip':'communication',outcome:selected.outcome||'always',placeholderId:selected.id})}>Choose existing or create new</button><button className="funnel-delete" onClick={()=>remove(selected)}>Remove placeholder</button></section>) : (selected?.kind==='trip'&&!selected.placeholder || selected?.capability==='assessments') ? (
                  <PipelineTripWorkspace jobId={jobId} draft={draft} setDraft={setDraft}
                    tripId={selected.kind==='trip' ? selected.tripId || null : tripViewId}
                    startCreating={Boolean(pendingTrip)} pipelineStages={board.stages}
                    onSelectTrip={tripId=>{
                      if(!tripId){setWorkspaceTab("trips");setTripViewId(null);return;}
                      if(pendingTrip){const t=current.current.draft.trips.find(t=>t.id===tripId);const next={...(items.find(n=>n.id===pendingTrip.placeholderId)||node('trip',t?.title||'Trip',pendingTrip.parent)),title:t?.title||'Trip',placeholder:false,tripId,outcome:pendingTrip.outcome};setItems(all=>all.some(n=>n.id===next.id)?all.map(n=>n.id===next.id?next:n):[...all,next]);setPendingTrip(null);select(next.id);}
                      else if(selected.kind==='trip'){patch(selected.id,{tripId});}
                      else setTripViewId(tripId);
                    }}/>
                ) : selected?.capability ? (
                  <HiringWorkspace
                    key={selected.id}
                    jobId={jobId}
                    capability={selected.capability}
                    draft={draft}
                    setDraft={setDraft}
                  />
                ) : (
                  selected && (
                    <>
                      {selected.kind === "job" && (
                        <>
                          <details open className="funnel-job-section">
                            <summary>Required to publish</summary>
                            {(
                              [
                                ["designation", "Job title"],
                                ["experienceType", "Role type"],
                                ["location", "Location"],
                                ["mustHaves", "Basic requirements"],
                              ] as const
                            ).map(([key, label]) => (
                              <label className="funnel-field" key={key}>
                                <span>{label} <span aria-hidden="true">*</span></span>
                                {key === "mustHaves" ? (
                                  <textarea aria-label={label} aria-required="true"
                                    value={draft.fields[key].value}
                                    onChange={(e) => field(key, e.target.value)}
                                  />
                                ) : (
                                  <input aria-label={label} aria-required="true"
                                    value={draft.fields[key].value}
                                    onChange={(e) => field(key, e.target.value)}
                                  />
                                )}
                              </label>
                            ))}
                          </details>
                          <details className="funnel-job-section">
                            <summary>More role details</summary>
                            <FieldGrid
                              ids={[
                                "workMode",
                                "salary",
                                "experienceYears",
                                "industryType",
                                "companyType",
                                "redFlags",
                                "searchStrategy",
                              ]}
                              draft={draft}
                              missingIds={[]}
                              onField={field}
                              onCurrency={(v) => setDraft((d) => ({ ...d, salaryCurrency: v }))}
                              onExpectedSkills={(v) =>
                                setDraft((d) => ({ ...d, preview: { ...d.preview, expectedSkills: v } }))
                              }
                            />
                          </details>
                          <details className="funnel-job-section">
                            <summary>Select to apply</summary>
                            <FlagsChoice
                              draft={draft}
                              onFlag={(id, value) =>
                                setDraft((d) => ({ ...d, flags: { ...d.flags, [id]: value } }))
                              }
                            />
                          </details>
                          <details
                            open={importOpen}
                            onToggle={(e) =>
                              setImportOpen(e.currentTarget.open)
                            }
                          >
                            <summary>
                              Describe, dictate, or upload the role
                            </summary>
                            <JobDetailsPanel
                              draft={draft}
                              setDraft={setDraft}
                              startInRecording={false}
                            />
                          </details>
                        </>
                      )}
                      {selected.kind === "job" && (
                        <div className="funnel-inline">
                          <button onClick={() => select("cap-setup")}>
                            Role & hiring settings ↗
                          </button>
                          <button onClick={() => select("cap-brief")}>Brief & sharing ↗</button>
                          <button onClick={() => select("cap-team")}>Hiring team ↗</button>
                          <button onClick={() => select("cap-tasks")}>Tasks ↗</button>
                          <button onClick={() => select("cap-activity")}>Activity history ↗</button>
                        </div>
                      )}
                      {selected.kind === "trip" && (
                        <button onClick={() => select("cap-assessments")}>
                          Open assessment studio ↗
                        </button>
                      )}
                      {selected.kind === "communication" && (
                        <button onClick={() => select("cap-messages")}>
                          Open outreach library ↗
                        </button>
                      )}
                      {selected.kind === "application" && (
                        <ApplicationPanel draft={draft} setDraft={setDraft} />
                      )}
                      {["round", "trip", "communication"].includes(
                        selected.kind,
                      ) && (
                        <>
                          <label className="funnel-field">
                            Name
                            <input
                              value={selected.title}
                              onChange={(e) =>
                                patch(selected.id, { title: e.target.value })
                              }
                            />
                          </label>
                          {selected.kind !== "communication" && (
                            <label className="funnel-field">
                              {selected.kind === "trip"
                                ? "Candidate instructions"
                                : "Round description"}
                              <textarea
                                rows={5}
                                value={selected.description}
                                onChange={(e) =>
                                  patch(selected.id, {
                                    description: e.target.value,
                                  })
                                }
                              />
                            </label>
                          )}
                        </>
                      )}
                      {selected.kind === "trip" && (
                        <div className="funnel-inline">
                          <label className="funnel-field">
                            Trip type
                            <select
                              value={selected.tripType}
                              onChange={(e) =>
                                patch(selected.id, { tripType: e.target.value })
                              }
                            >
                              {[
                                "Assessment",
                                "Coding challenge",
                                "Design task",
                                "Case study",
                                "Conversation",
                              ].map((t) => (
                                <option key={t}>{t}</option>
                              ))}
                            </select>
                          </label>
                          <label className="funnel-field">
                            Duration (minutes)
                            <input
                              type="number"
                              min={1}
                              max={480}
                              value={selected.duration}
                              onChange={(e) =>
                                patch(selected.id, {
                                  duration: Math.max(
                                    1,
                                    Math.min(480, Number(e.target.value)),
                                  ),
                                })
                              }
                            />
                          </label>
                        </div>
                      )}
                      {selected.kind === "communication" && (
                        <>
                          <label className="funnel-field">Outcome<select value={selected.outcome||'always'} onChange={e=>patch(selected.id,{outcome:e.target.value as 'always'|'success'|'failure'})}><option value="always">On this step</option><option value="success">Requirements met</option><option value="failure">Rule not met</option></select></label>
                          <label className="funnel-field">
                            Message template
                            <select
                              defaultValue=""
                              onChange={(e) => {
                                const t = messageTemplates.find(
                                  (t) => t.id === e.target.value,
                                );
                                if (t)
                                  patch(selected.id, {
                                    title: t.name,
                                    subject: t.subject,
                                    body: t.body,
                                  });
                              }}
                            >
                              <option value="">Select template</option>
                              {messageTemplates.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="funnel-field">
                            Trigger
                            <select
                              value={selected.trigger}
                              onChange={(e) =>
                                patch(selected.id, { trigger: e.target.value })
                              }
                            >
                              {[
                                "When round starts",
                                "When interview scheduled",
                                "When trip completed",
                                "After a delay",
                                "When requirements are met",
                                "When a requirement is not met",
                              ].map((t) => (
                                <option key={t}>{t}</option>
                              ))}
                            </select>
                          </label>
                          {selected.trigger === "After a delay" && (
                            <label className="funnel-field">
                              Days after round starts
                              <input
                                type="number"
                                min={1}
                                value={selected.delay}
                                onChange={(e) =>
                                  patch(selected.id, {
                                    delay: Math.max(1, Number(e.target.value)),
                                  })
                                }
                              />
                            </label>
                          )}
                          {selected.trigger ===
                            "When score below threshold" && (
                            <label className="funnel-field">
                              Score below (%)
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={selected.threshold}
                                onChange={(e) =>
                                  patch(selected.id, {
                                    threshold: Math.max(
                                      0,
                                      Math.min(100, Number(e.target.value)),
                                    ),
                                  })
                                }
                              />
                            </label>
                          )}
                          <label className="funnel-field">
                            Recipient
                            <select
                              value={selected.recipient}
                              onChange={(e) =>
                                patch(selected.id, {
                                  recipient: e.target.value,
                                })
                              }
                            >
                              <option>Candidate</option>
                              <option>Hiring team</option>
                            </select>
                          </label>
                          <label className="funnel-field">
                            Subject
                            <input
                              value={selected.subject}
                              onChange={(e) =>
                                patch(selected.id, { subject: e.target.value })
                              }
                            />
                          </label>
                          <label className="funnel-field">
                            Message
                            <textarea
                              rows={8}
                              value={selected.body}
                              onChange={(e) =>
                                patch(selected.id, { body: e.target.value })
                              }
                            />
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={selected.active}
                              onChange={(e) =>
                                patch(selected.id, { active: e.target.checked })
                              }
                            />{" "}
                            Enable this communication
                          </label>
                          <p className="funnel-help">
                            Triggers apply to new candidates after publishing.
                            Demo messages appear in the outbox.
                          </p>
                        </>
                      )}
                      {selected.kind==='stage' && <div className="funnel-inline">
                        {selected.id==='prospects'&&<button onClick={()=>select('cap-prospects')}>Private prospect pool</button>}
                        <button onClick={()=>select('cap-review')}>Candidate review</button>
                        {selected.stageKey==='interviewing'&&<button onClick={()=>select('cap-client')}>Client coordination</button>}
                      </div>}
                      {['stage','round','application','trip'].includes(selected.kind) && <>
                        <PipelineNodeTools key={selected.id} item={selected} items={items} onPatch={change=>patch(selected.id,change)}
                          onInsert={title=>setItems(all=>insertPipelineStage(all,selected.id,title))}
                          onReorder={direction=>{setItems(all=>resetFunnelLayout(reorderPipelineStage(all,selected.id,direction)));setResetVersion(v=>v+1);}}
                          onCandidates={()=>{setWorkspaceTab("candidates");setCandidateStage(selected.id);setFocus(true);}}
                          onAttach={(kind,outcome)=>{
                            if(kind==='round'){add('round',selected.id);return;}
                            setAttachment({parent:selected.id,kind,outcome});
                          }}/>
                        {items.filter(n=>n.parent===selected.id && n.kind!=='capability').map(n=><button className="funnel-child" key={n.id} onClick={()=>select(n.id)}><strong>{n.title}</strong><span>{n.outcome==='failure'?'Rule not met':n.kind} ↗</span></button>)}
                      </>}
                      {["round", "trip", "communication"].includes(
                        selected.kind,
                      ) && (
                        <button
                          className="funnel-delete"
                          onClick={() => remove(selected)}
                        >
                          Remove {selected.kind}
                        </button>
                      )}
                    </>
                  )
                )}
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
