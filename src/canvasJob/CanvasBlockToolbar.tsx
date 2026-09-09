import { FlowIcon } from "./FlowIcon";
import { createPortal } from "react-dom";
import { useEffect, useState, useRef } from 'react';
import type { FunnelNode } from './funnelModel';
export type CanvasBlockKind = 'stage' | 'round' | 'trip' | 'communication';
export function CanvasBlockToolbar({items,onAdd,onOpen,aiOpen,insertion,onSpawn}:{items:FunnelNode[];onSpawn:(kind:CanvasBlockKind,point?:{x:number;y:number})=>void;aiOpen:boolean;insertion?:{parent:string;version:number};onOpen:()=>void;onAdd:(kind:CanvasBlockKind,parent:string,title:string,outcome:'always'|'success'|'failure')=>void}) {
  const drag=useRef<{kind:CanvasBlockKind;x:number;y:number;moved:boolean}|null>(null);
  const suppressClick=useRef(false);
  const [ghost,setGhost]=useState<{kind:CanvasBlockKind;x:number;y:number}|null>(null);
  const [kind,setKind]=useState<CanvasBlockKind|null>(null);
  useEffect(()=>{if(aiOpen)setKind(null);},[aiOpen]);
  const [parent,setParent]=useState('');
  const [title,setTitle]=useState('');
  const [outcome,setOutcome]=useState<'always'|'success'|'failure'>('always');
  const targets=items.filter(n=>kind==='stage' ? n.kind==='job'||n.kind==='stage'&&!n.exit : ['stage','round','application','trip'].includes(n.kind)&&!n.exit);
  useEffect(()=>{if(insertion){setParent(insertion.parent);setKind('stage');setTitle('');setOutcome('always');}},[insertion]);
  const labels={stage:'Stage',round:'Activity',trip:'Trip',communication:'Message'};
  return <div className="canvas-block-tools" onKeyDown={e=>{if(e.key==='Escape'){setKind(null);e.stopPropagation();}}}>
    {kind&&<form className="canvas-block-picker" aria-label="Add pipeline block" onSubmit={e=>{e.preventDefault();onAdd(kind,parent,title.trim()||`New ${labels[kind].toLowerCase()}`,outcome);setKind(null);}}>
      <header><strong>Add {labels[kind].toLowerCase()}</strong><button type="button" aria-label="Close block picker" onClick={()=>setKind(null)}>×</button></header>
      <label>Block type<select aria-label="Block type" value={kind} onChange={e=>{const next=e.target.value as CanvasBlockKind;setKind(next);if(next!=='stage'&&items.find(n=>n.id===parent)?.kind==='job')setParent(items.find(n=>n.kind==='stage'&&!n.exit)?.id||'');}}>{(Object.keys(labels) as CanvasBlockKind[]).map(k=><option key={k} value={k}>{labels[k]}</option>)}</select></label>
      <label>{kind==='stage'?'Insert after':'Attach to'}<select aria-label="Block placement" value={parent} onChange={e=>setParent(e.target.value)}>{targets.map(n=><option value={n.id} key={n.id}>{n.title}</option>)}</select></label>
      {(kind==='stage'||kind==='round')&&<label>Name<input autoFocus aria-label="Block name" placeholder={`New ${labels[kind].toLowerCase()}`} value={title} onChange={e=>setTitle(e.target.value)}/></label>}
      {(kind==='trip'||kind==='communication')&&<label>Path<select aria-label="Block outcome" value={outcome} onChange={e=>setOutcome(e.target.value as typeof outcome)}><option value="always">On this step</option><option value="success">Requirements met</option><option value="failure">Rule not met</option></select></label>}
      {!targets.length&&<p>Add a stage first to attach this block.</p>}
      <button disabled={!parent} type="submit">{kind==='trip'||kind==='communication'?'Browse library or create new':'Add to canvas'} →</button>
    </form>}
    {ghost&&createPortal(<div className="canvas-block-ghost" style={{left:ghost.x,top:ghost.y}}>{labels[ghost.kind]}</div>,document.body)}
    {(Object.keys(labels) as CanvasBlockKind[]).map(k=><button key={k} type="button" aria-label={`Add ${k==='round'?'activity':k}`} title={`Drag ${labels[k].toLowerCase()} onto canvas, or click to add`} style={{touchAction:'none'}}
      onPointerDown={e=>{if(e.button!==0)return;drag.current={kind:k,x:e.clientX,y:e.clientY,moved:false};suppressClick.current=false;e.currentTarget.setPointerCapture(e.pointerId);}}
      onPointerMove={e=>{const d=drag.current;if(!d)return;if(Math.hypot(e.clientX-d.x,e.clientY-d.y)>5)d.moved=true;if(d.moved)setGhost({kind:k,x:e.clientX,y:e.clientY});}}
      onPointerUp={e=>{const d=drag.current;drag.current=null;setGhost(null);if(d?.moved){suppressClick.current=true;setKind(null);onOpen();onSpawn(k,{x:e.clientX,y:e.clientY});}}}
      onPointerCancel={()=>{drag.current=null;setGhost(null);suppressClick.current=true;}}
      onClick={()=>{if(suppressClick.current){suppressClick.current=false;return;}setKind(null);onOpen();onSpawn(k);}}><span aria-hidden="true"><FlowIcon kind={k}/></span><span>{labels[k]}</span></button>)}
  </div>;
}
