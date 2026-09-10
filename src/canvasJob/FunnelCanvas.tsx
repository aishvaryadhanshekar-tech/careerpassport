import { FlowIcon } from "./FlowIcon";
import { connectionError, type CanvasConnection } from "./pipelineConnections";
import { PipelineTransition } from "./PipelineTransition";
import { AddPipelineButton, CanvasNodeAssistant } from "./CanvasNodeAssistant";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  applyNodeChanges,
  Background,
  Controls,
  ReactFlow,
  Handle,
  Position,
  MarkerType,
  PanOnScrollMode,
  type Node,
  type Edge,
  type NodeProps,
  type ReactFlowInstance,
  type Viewport,
  type XYPosition,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./node-cards.css";
import { layoutPipeline, buildPipelineEdges, candidateStageNode, pipelineStages } from "./pipelineModel";
import { type FunnelNode } from "./funnelModel";
import { BRIEF_HUB_ID, STAGGER_MS, type BriefHandoff } from "./aiBuild/buildPhase";

/** Synthetic backdrop grouping the Role brief's sections; never part of the saved model. */
const BRIEF_FRAME_ID = "brief-frame";
/** Unmeasured brief card footprint, used to size the frame from layout positions. */
const BRIEF_CARD = { width: 260, height: 128 };

function BriefFooter({ brief }: { brief: BriefHandoff }) {
  const ready = brief.reviewed === brief.total;
  return (
    <div className="fn-brief nodrag">
      <div className="fn-brief-meter" role="progressbar" aria-label="Sections reviewed" aria-valuemin={0} aria-valuemax={brief.total} aria-valuenow={brief.reviewed}>
        <span style={{ width: `${(brief.reviewed / brief.total) * 100}%` }} />
      </div>
      <small>{brief.drafting ? "Drafting sections…" : ready ? "All sections reviewed" : `${brief.reviewed} of ${brief.total} reviewed`}</small>
      {brief.canGenerate && (
        <div className="fn-brief-actions">
          <button type="button" className={`fn-brief-generate ${ready ? "fn-brief-ready" : ""}`} disabled={!ready} onClick={(event) => { event.stopPropagation(); brief.onGenerate(); }}>
            Generate pipeline →
          </button>
          {!ready && (
            <button type="button" className="fn-brief-skip" onClick={(event) => { event.stopPropagation(); brief.onGenerate(); }}>
              Skip review
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function FunnelCard({ data }: NodeProps) {
  const d = data as {
    item: FunnelNode;
    selected: boolean;
    compact: boolean;
    count?: number;
    children: number;
    onSelect: () => void;
    onToggle: () => void;
    onConfigure: (id:string)=>void;
    toolsUnlocked?: boolean;
    enterIndex?: number;
    /** Brief node still drafting: render a skeleton instead of content. */
    pending?: boolean;
    brief?: BriefHandoff;
  };
  const n = d.item;
  const hub = n.insightKey === "hub";
  return (
    <div
      title={n.description || undefined}
      className={`funnel-node ${d.compact?"fn-compact":""} fn-${n.kind} ${hub?"fn-insight-hub":""} ${d.pending?"fn-pending":""} ${n.reviewed?"fn-reviewed":""} ${d.selected ? "fn-selected" : ""} ${d.enterIndex!==undefined?"fn-enter":""}`}
      style={d.enterIndex!==undefined?{animationDelay:`${d.enterIndex*STAGGER_MS}ms`}:undefined}
    >
      {!d.compact&&[Position.Top,Position.Right,Position.Bottom,Position.Left].map(side=><Handle key={`in-${side}`} id={`in-${side}`} type="target" position={side} className={`pipeline-port pipeline-port-in port-${side}`} title="Connect here"/>)}
      {d.compact&&<Handle id="in-top" type="target" position={Position.Top}/> }
      <div className="fn-top">
        <span className="fn-kind-icon" aria-hidden="true"><FlowIcon kind={n.kind}/></span>
        <span className="fn-kind">
          {
            {
              job: "WORKFLOW",
              stage: "STAGE",
              insight: hub ? "ROLE BRIEF" : "AI DRAFT",
              round: n.rules?.length ? "RULE CHECK" : "CANDIDATE ACTIVITY",
              application: "APPLICATION",
              trip: "TRIP",
              communication: "COMMUNICATION",
              capability: "CONFIGURATION",
            }[n.kind]
          }
        </span>
        {n.reviewed && <span className="fn-reviewed-badge">✓ Reviewed</span>}
        <span className="fn-drag-hint" title="Drag to move" aria-hidden="true">⠿</span>
      </div>
      <div className="fn-main" role="button" tabIndex={0} aria-label={n.title} aria-expanded={d.selected}
        onKeyDown={(event) => {
          if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault(); event.stopPropagation(); d.onSelect();
          }
        }}>
        <strong>{n.title}</strong>
        {n.outcome && <em className={`fn-outcome fn-outcome-${n.outcome}`}>{n.outcome === "failure" ? "Rule not met" : n.outcome === "success" ? "Requirements met" : "On this step"}</em>}
        {d.pending ? (
          <div className="fn-skeleton" role="status"><em>{hub ? "Reading your brief…" : "Drafting…"}</em><i /><i /></div>
        ) : (
          <span>
            {n.placeholder ? "Choose or create to configure" : n.kind === "stage"
              ? `${d.count ?? 0} candidates`
              : n.kind === "trip"
                ? `${n.tripType} · ${n.duration} min`
                : n.kind === "communication"
                  ? `${n.active ? n.trigger : "Inactive"}`
                  : n.kind === "capability" ? null : n.description || null}
          </span>
        )}
      </div>
      {n.kind==='job' && !d.compact && d.toolsUnlocked && <div className="fn-workflow-tools fn-tools-in nodrag">{[['cap-setup','Settings'],['cap-brief','Brief & sharing'],['cap-team','Team'],['cap-activity','History']].map(([id,title])=><button key={id} onClick={e=>{e.stopPropagation();d.onConfigure(id);}}>{title}</button>)}</div>}
      {n.kind==='application' && <button className="fn-configure nodrag" onClick={e=>{e.stopPropagation();d.onConfigure(n.id);}}>⚙ Configure form</button>}
      {hub && d.brief && !d.pending && <BriefFooter brief={d.brief} />}
      {d.children > 0 && (
        <button
          className="nodrag fn-collapse"
          onClick={(event) => { event.stopPropagation(); d.onToggle(); }}
          aria-expanded={!n.collapsed}
        >
          {n.collapsed ? "▸ Expand" : "▾ Collapse"} · {d.children} items
        </button>
      )}
      {!d.compact&&[Position.Top,Position.Right,Position.Bottom,Position.Left].map(side=><Handle key={`out-${side}`} id={`out-${side}`} type="source" position={side} className={`pipeline-port pipeline-port-out port-${side}`} title="Drag to connect"/>)}
      {d.compact&&<Handle id="out-bottom" type="source" position={Position.Bottom}/> }
    </div>
  );
}
function BriefFrame({ data }: NodeProps) {
  const d = data as { drafting: boolean };
  return (
    <div className={`fn-brief-frame ${d.drafting ? "fn-brief-frame-drafting" : ""}`}>
      <span>{d.drafting ? "Drafting role brief…" : "Role brief sections"}</span>
      <Handle id="in-left" type="target" position={Position.Left} isConnectable={false} />
    </div>
  );
}
/** Sized from layout (not live drag) positions so the node object stays stable between renders. */
function briefFrameNode(laidOut: ReturnType<typeof layoutPipeline>, drafting: boolean): Node | null {
  const sections = laidOut.filter((item) => item.parent === BRIEF_HUB_ID);
  if (!sections.length) return null;
  const left = Math.min(...sections.map((item) => item.position.x)) - 18;
  const top = Math.min(...sections.map((item) => item.position.y)) - 34;
  const right = Math.max(...sections.map((item) => item.position.x)) + BRIEF_CARD.width + 18;
  const bottom = Math.max(...sections.map((item) => item.position.y)) + BRIEF_CARD.height + 18;
  return {
    id: BRIEF_FRAME_ID,
    type: "briefFrame",
    position: { x: left, y: top },
    style: { width: right - left, height: bottom - top, pointerEvents: "none" },
    data: { drafting },
    draggable: false,
    selectable: false,
    connectable: false,
    focusable: false,
    zIndex: -1,
  };
}
const edgeTypes = { insertion: PipelineTransition };
const nodeTypes = { funnel: FunnelCard, briefFrame: BriefFrame };
export function FunnelCanvas({
  items,
  selected,
  counts,
  onSelect,
  onInsert,
  onConnection,
  overview,
  onToggle,
  onPositions,
  onDragStart,
  resetVersion,
  onAI,
  aiOpen,
  onCloseAI,
  onInit,
  viewport,
  onViewport,
  onAddPipeline,
  toolsUnlocked,
  enteringIds,
  pendingIds,
  brief,
}: {
  items: FunnelNode[];
  selected: string | null;
  counts: Record<string, number>;
  onSelect: (id: string) => void;
  onInsert: (id:string)=>void;
  overview:boolean;
  onConnection:(link:CanvasConnection|null,old?:{source:string;target:string})=>void;
  onToggle: (id: string) => void;
  onPositions: (changes: { id: string; position: XYPosition }[]) => void;
  onDragStart: () => void;
  resetVersion: number;
  onAI: (id: string) => void;
  aiOpen: boolean;
  onCloseAI: () => void;
  onInit: (instance: ReactFlowInstance) => void;
  viewport?: Viewport;
  onViewport: (viewport: Viewport) => void;
  onAddPipeline: () => void;
  toolsUnlocked?: boolean;
  enteringIds?: Record<string, number>;
  pendingIds?: string[];
  brief?: BriefHandoff;
}) {
  const displayItems=useMemo(()=>overview?items.filter(n=>n.kind==='job'||n.kind==='stage').map((n,i)=>({...n,collapsed:false,position:{x:n.exit?340:0,y:n.exit?220:i*180}})):items,[items,overview]);
  const laidOut = useMemo(() => overview ? displayItems.map(n=>({...n,position:n.position!})) : layoutPipeline(items), [items,displayItems,overview]);
  const modelNodes = useMemo<Node[]>(() => {
    const cards: Node[] = laidOut.map((item) => ({
      id: item.id,
      type: "funnel",
      position: item.position,
      selected: selected === item.id || overview&&candidateStageNode(items,selected||'')?.id===item.id,
      focusable: false,
      data: {
        item,
        compact:overview,
        selected: selected === item.id || overview&&candidateStageNode(items,selected||'')?.id===item.id,
        count: counts[item.id],
        children: overview ? 0 : items.filter((n) => n.parent === item.id && n.kind !== "capability").length,
        onSelect: () => onSelect(item.id),
        onConfigure: onSelect,
        onToggle: () => onToggle(item.id),
        toolsUnlocked,
        enterIndex: enteringIds?.[item.id],
        pending: pendingIds?.includes(item.id),
        brief: item.insightKey === "hub" ? brief : undefined,
      },
    }));
    const frame = briefFrameNode(laidOut, Boolean(brief?.drafting));
    return frame ? [frame, ...cards] : cards;
  }, [laidOut, selected, counts, items, onSelect, onToggle,overview,toolsUnlocked,enteringIds,pendingIds,brief]);
  const [selectedEdge,setSelectedEdge]=useState<Edge|null>(null);
  const [nodes, setNodes] = useState<Node[]>(modelNodes);
  const dragging = useRef(false);
  const instance = useRef<ReactFlowInstance | null>(null);
  const previousReset = useRef(resetVersion);
  const canvas = useRef<HTMLDivElement>(null);
  function showStart(flow: ReactFlowInstance) {
    const root = laidOut.find((item) => !item.parent);
    const width = canvas.current?.clientWidth ?? 800;
    void flow.setViewport({ x: width / 2 - ((root?.position.x ?? 0) + 130) * 0.9, y: 40 - (root?.position.y ?? 0) * 0.9, zoom: 0.9 }, { duration: 0 });
  }
  useEffect(() => {
    if (!dragging.current) setNodes(modelNodes);
  }, [modelNodes]);
  useEffect(() => {
    if (previousReset.current === resetVersion) return;
    previousReset.current = resetVersion;
    const frame = requestAnimationFrame(() => {
      if (instance.current) showStart(instance.current);
    });
    return () => cancelAnimationFrame(frame);
  }, [resetVersion]);
  const detailedViewport=useRef<Viewport|null>(null);
  const wasOverview=useRef(false);
  useEffect(()=>{
    const flow=instance.current;if(!flow||wasOverview.current===overview)return;
    wasOverview.current=overview;
    if(overview){detailedViewport.current=flow.getViewport();const timer=window.setTimeout(()=>void flow.fitView({padding:{top:"60px",bottom:"150px",left:"40px",right:"40px"},duration:200}),80);return()=>clearTimeout(timer);}
    if(detailedViewport.current)void flow.setViewport(detailedViewport.current,{duration:200});
  },[overview]);
  const anchor = laidOut.find((item) => item.id === selected);
  const anchorPosition = nodes.find((node) => node.id === selected)?.position;
  const displayEdges=buildPipelineEdges(displayItems);
  if(overview){for(const edge of buildPipelineEdges(items).filter(e=>e.outcome==='failure')){const source=candidateStageNode(items,edge.source);const target=items.find(n=>n.id===edge.target&&n.exit);if(source&&target&&!displayEdges.some(e=>e.source===source.id&&e.target===target.id))displayEdges.push({...edge,id:`overview-${source.id}-${target.id}`,source:source.id,target:target.id});}}
  const edges: Edge[] = displayEdges.map(edge => ({
    ...edge, sourceHandle:overview?'out-bottom':items.find(n=>n.kind==='job')?.canvasConnections?.find(c=>c.source===edge.source&&c.target===edge.target)?.sourceHandle||(items.some(n=>(n.id===edge.target||n.id===edge.source)&&n.kind==='communication')?'out-right':'out-bottom'), targetHandle:overview?'in-top':items.find(n=>n.kind==='job')?.canvasConnections?.find(c=>c.source===edge.source&&c.target===edge.target)?.targetHandle||(items.some(n=>(n.id===edge.target||n.id===edge.source)&&n.kind==='communication')?'in-left':'in-top'), markerEnd:{type:MarkerType.ArrowClosed,width:16,height:16,color:items.some(n=>(n.id===edge.source||n.id===edge.target)&&n.kind==='communication')?'#b58235':'#78938a'}, reconnectable:!overview, type: 'insertion', data: !overview && edge.outcome!=='failure' && pipelineStages(items).some(n=>n.id===edge.target&&!n.exit) ? {title:candidateStageNode(items,edge.source)?.title||items.find(n=>n.id===edge.source)?.title,onInsert:()=>onInsert(candidateStageNode(items,edge.source)?.id||edge.source)} : undefined, style: { stroke: items.some(n=>(n.id===edge.source||n.id===edge.target)&&n.kind==='communication') ? '#b58235' : '#78938a', strokeWidth: 1.6 },
    labelStyle: { fill: '#607368', fontSize: 10 }, labelBgStyle: { fill: '#f5f7f5' },
    animated: false,
  }));
  // The hub → sections link is visual only: it targets the frame, so it never enters the pipeline model.
  if (nodes.some((node) => node.id === BRIEF_FRAME_ID)) {
    edges.push({ id: `${BRIEF_HUB_ID}->${BRIEF_FRAME_ID}`, source: BRIEF_HUB_ID, target: BRIEF_FRAME_ID, sourceHandle: "out-right", targetHandle: "in-left", animated: Boolean(brief?.drafting), selectable: false, focusable: false, reconnectable: false, style: { stroke: "#8fb5a4", strokeWidth: 1.4, strokeDasharray: "5 4" } });
  }
  return (
    <ReactFlow
      ref={canvas}
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      nodesDraggable={!overview}
      selectNodesOnDrag={false}
      nodeDragThreshold={5}
      nodeClickDistance={5}
      deleteKeyCode={null}
      onNodesChange={(changes) => setNodes((current) => applyNodeChanges(changes, current))}
      onNodeDragStart={() => { dragging.current = true; onDragStart(); }}
      onNodeDragStop={(_, node, draggedNodes) => {
        dragging.current = false;
        onPositions((draggedNodes.length ? draggedNodes : [node]).map((item) => ({ id: item.id, position: item.position })));
      }}
      multiSelectionKeyCode={null}
      nodesConnectable={!overview}
      edgesReconnectable={!overview}
      reconnectRadius={14}
      onConnect={link=>onConnection(link)}
      onReconnect={(old,link)=>onConnection(link,old)}
      isValidConnection={link=>!connectionError(items,link)}
      onEdgeClick={(_,edge)=>{if(edge.target!==BRIEF_FRAME_ID)setSelectedEdge(edge);}}
      minZoom={0.1}
      maxZoom={1.5}
      panOnScroll
      panOnScrollMode={PanOnScrollMode.Vertical}
      zoomOnScroll={false}
      zoomOnPinch
      zoomOnDoubleClick={false}
      defaultViewport={viewport}
      fitViewOptions={{ padding: 0.2 }}
      onNodeClick={(_, node) => { if (node.id !== BRIEF_FRAME_ID) onSelect(node.id); }}
      onInit={(flow) => { instance.current = flow; onInit(flow); if (!viewport) showStart(flow); }}
      onMoveEnd={(_, v) => {if(!overview)onViewport(v);}}
      proOptions={{ hideAttribution: true }}
    >
      {selectedEdge&&!overview&&<div className="pipeline-connection-actions nodrag nopan"><span>Connection</span><button onClick={()=>{onConnection(null,selectedEdge);setSelectedEdge(null);}}>Remove link</button><button aria-label="Close connection actions" onClick={()=>setSelectedEdge(null)}>×</button></div>}
      {anchor && <CanvasNodeAssistant item={anchor} position={anchorPosition || anchor.position} open={aiOpen}
        onOpen={() => onAI(anchor.id)} onClose={onCloseAI} />}
      {anchor && anchor.kind === "job" && pipelineStages(items).length === 0 && (
        <AddPipelineButton item={anchor} position={anchorPosition || anchor.position} onClick={onAddPipeline} />
      )}
      <Background gap={22} size={1} color="#cbd2d2" />
      <Controls showInteractive={false} fitViewOptions={{ padding: { top: "24px", bottom: "150px", left: "60px", right: "40px" } }} />
    </ReactFlow>
  );
}
