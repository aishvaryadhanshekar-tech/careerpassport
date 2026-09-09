import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from '@xyflow/react';
export function PipelineTransition(props:EdgeProps) {
  const [path,x,y]=getSmoothStepPath(props);
  const data=props.data as {onInsert?:()=>void;title?:string}|undefined;
  return <><BaseEdge id={props.id} path={path} style={props.style} markerEnd={props.markerEnd} markerStart={props.markerStart} interactionWidth={props.interactionWidth} label={props.label} labelStyle={props.labelStyle} labelBgStyle={props.labelBgStyle} labelX={x} labelY={y}/>{data?.onInsert&&<EdgeLabelRenderer><button type="button" className="pipeline-edge-add nodrag nopan" style={{transform:`translate(-50%, -50%) translate(${x+26}px,${y}px)`}} aria-label={`Add block after ${data.title}`} title={`Add block after ${data.title}`} onClick={e=>{e.stopPropagation();data.onInsert?.();}}>+</button></EdgeLabelRenderer>}</>;
}
