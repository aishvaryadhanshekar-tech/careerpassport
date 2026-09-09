import type { FunnelNode } from './funnelModel';
import { buildPipelineEdges, layoutPipeline } from './pipelineModel';
export type CanvasConnection={source:string;target:string;sourceHandle?:string|null;targetHandle?:string|null};
export function connectionError(nodes:FunnelNode[],link:CanvasConnection,old?:{source:string;target:string}):string|null{
 const source=nodes.find(n=>n.id===link.source),target=nodes.find(n=>n.id===link.target);
 if(!source||!target||source.id===target.id)return 'Choose two different nodes.';
 if(source.kind==='communication'&&target.kind!=='communication'&&!target.exit){let ancestor:FunnelNode|undefined=target;const visited=new Set<string>();while(ancestor&&!visited.has(ancestor.id)){if(ancestor.id===source.id)return 'This attachment would create a loop.';visited.add(ancestor.id);ancestor=nodes.find(n=>n.id===ancestor!.parent);}return null;}
 if(target.kind==='job'||source.exit)return 'Connect forward from the workflow or a stage.';
 if(source.kind==='communication'&&target.kind!=='communication'&&!target.exit)return 'Attach messages from the side of their stage or activity.';
 const edges=buildPipelineEdges(nodes).filter(e=>!old||e.source!==old.source||e.target!==old.target);
 const pending=[target.id],seen=new Set<string>();
 while(pending.length){const id=pending.pop()!;if(id===source.id)return 'This connection would create a loop.';if(seen.has(id))continue;seen.add(id);pending.push(...edges.filter(e=>e.source===id).map(e=>e.target));}
 // Ownership is independent of visible/collapsed connections.
 if(target.kind!=='stage'){let parent:FunnelNode|undefined=source;const visited=new Set<string>();while(parent&&!visited.has(parent.id)){if(parent.id===target.id)return 'This attachment would create a loop.';visited.add(parent.id);parent=nodes.find(n=>n.id===parent!.parent);}}
 return null;
}
export function editPipelineConnection(nodes:FunnelNode[],link:CanvasConnection|null,old?:{source:string;target:string}):FunnelNode[]{
 if(link){const error=connectionError(nodes,link,old);if(error)throw new Error(error);}
 const positions=layoutPipeline(nodes);
 let next=nodes.map(n=>({...n}));
 if(link&&next.find(n=>n.id===link.source)?.kind==='communication'&&next.find(n=>n.id===link.target)?.kind!=='communication'&&!next.find(n=>n.id===link.target)?.exit){
   const message=next.find(n=>n.id===link.source)!;message.parent=link.target;message.position=positions.find(n=>n.id===message.id)?.position;
   const root=next.find(n=>n.kind==='job')!;
   root.hiddenConnections=[...new Set([...(root.hiddenConnections||[]),`${link.target}->${link.source}`,...(old?[`${old.source}->${old.target}`]:[])])].filter(id=>id!==`${link.source}->${link.target}`);
   root.canvasConnections=(root.canvasConnections||[]).filter(c=>c.target!==message.id&&!(c.source===message.id&&!next.find(n=>n.id===c.target)?.exit));
   root.canvasConnections.push({source:link.source,target:link.target,sourceHandle:link.sourceHandle||'out-left',targetHandle:link.targetHandle||'in-right'});return next;
 }
 if(old){const target=next.find(n=>n.id===old.target);if(target&&target.parent===old.source&&target.kind!=='stage'){target.parent=null;target.position=positions.find(n=>n.id===target.id)?.position;}const source=next.find(n=>n.id===old.source);if(source?.kind==='communication'&&source.parent===old.target){source.parent=null;source.position=positions.find(n=>n.id===source.id)?.position;}if(source&&source.kind!=='communication'&&target?.kind!=='communication')source.destinationId='__disconnected__';}
 if(link){const source=next.find(n=>n.id===link.source)!;const target=next.find(n=>n.id===link.target)!;
   if(target.kind!=='stage'){target.parent=source.id;target.position=positions.find(n=>n.id===target.id)?.position;}
   else source.destinationId=target.id;
   if(target.kind!=='communication')source.destinationId=target.id;
 }
 const root=next.find(n=>n.kind==='job');if(!root)return nodes;
 const hidden=new Set(root.hiddenConnections||[]);if(old)hidden.add(`${old.source}->${old.target}`);if(link)hidden.delete(`${link.source}->${link.target}`);
 root.hiddenConnections=[...hidden];root.canvasConnections=(root.canvasConnections||[]).filter(c=>(!old||c.source!==old.source||c.target!==old.target)&&(!link||(next.find(n=>n.id===link.target)?.kind==='stage'?c.source!==link.source||c.target!==link.target:c.target!==link.target)));
 if(link){const message=next.find(n=>n.id===link.target)?.kind==='communication';root.canvasConnections.push({source:link.source,target:link.target,sourceHandle:link.sourceHandle|| (message?'out-right':'out-bottom'),targetHandle:link.targetHandle||(message?'in-left':'in-top')});}
 return next;
}

/** Follow authored progression through activities, independently of collapsed UI state. */
export function connectedNextStage(nodes:FunnelNode[],from:string):FunnelNode|undefined{
 const graph=buildPipelineEdges(nodes.map(n=>({...n,collapsed:false})));
 let current=from;const seen=new Set<string>();
 while(!seen.has(current)){seen.add(current);const edge=graph.find(e=>e.source===current&&e.outcome!=='failure'&&nodes.find(n=>n.id===e.target)?.kind!=='communication');if(!edge)return;const target=nodes.find(n=>n.id===edge.target);if(!target)return;if(target.kind==='stage')return target;current=target.id;}
}
