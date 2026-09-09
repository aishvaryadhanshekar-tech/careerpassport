import { useState } from 'react';
import type { FunnelNode } from './funnelModel';
import { pipelineStages } from './pipelineModel';

export function PipelineNodeTools({item,items,onPatch,onInsert,onReorder,onAttach,onCandidates}: {
  item:FunnelNode; items:FunnelNode[]; onPatch:(patch:Partial<FunnelNode>)=>void;
  onInsert:(title:string)=>void; onReorder:(direction:-1|1)=>void;
  onAttach:(kind:'trip'|'communication'|'round',outcome:'always'|'success'|'failure')=>void;
  onCandidates:()=>void;
}) {
  const [name,setName]=useState('');
  const [outcome,setOutcome]=useState<'always'|'success'|'failure'>('always');
  const stages=pipelineStages(items).filter(n=>!n.exit);
  const stage=item.kind==='stage';
  return <section className="pipeline-node-tools">
    {stage && <>
      <button className="funnel-primary" onClick={onCandidates}>View candidates →</button>
      <label className="funnel-field">Stage name<input value={item.title} onChange={e=>onPatch({title:e.target.value})}/></label>
      {!item.exit && <>
        <div className="funnel-inline"><button onClick={()=>onReorder(-1)} disabled={stages[0]?.id===item.id}>↑ Move earlier</button><button onClick={()=>onReorder(1)} disabled={stages.at(-1)?.id===item.id}>↓ Move later</button></div>
        <form className="pipeline-insert" onSubmit={e=>{e.preventDefault();if(name.trim()){onInsert(name);setName('');}}}><input aria-label="New stage name" placeholder="Stage after this one" value={name} onChange={e=>setName(e.target.value)}/><button disabled={!name.trim()}>Insert stage</button></form>
      </>}
    </>}
    {item.kind==='round' && <>
      <h3>Progression rules</h3>
      <p className="pipeline-caption">Explicit requirements only. Trip results stay with the reviewer.</p>
      {(item.rules||[]).map(rule=><div className="pipeline-rule" key={rule.id}>
        <label><input type="checkbox" checked={rule.enabled} onChange={e=>onPatch({rules:item.rules?.map(r=>r.id===rule.id?{...r,enabled:e.target.checked}:r)})}/> {rule.field==='experience'?'Minimum experience (years)':'Required résumé domain'}</label>
        <input aria-label={rule.field==='experience'?'Minimum experience':'Required domain'} type={rule.field==='experience'?'number':'text'} min="0" value={rule.value} onChange={e=>onPatch({rules:item.rules?.map(r=>r.id===rule.id?{...r,value:e.target.value}:r)})}/>
      </div>)}
      <div className="funnel-inline">
        {(['experience','domain'] as const).filter(field=>!item.rules?.some(r=>r.field===field)).map(field=><button key={field} onClick={()=>onPatch({rules:[...(item.rules||[]),{id:crypto.randomUUID(),field,operator:field==='experience'?'less_than':'not_contains',value:'',enabled:true}]})}>+ {field==='experience'?'Experience rule':'Domain rule'}</button>)}
      </div>
      <label className="funnel-field">When requirements are met<select value={item.destinationId||''} onChange={e=>onPatch({destinationId:e.target.value||undefined})}><option value="">Continue to next stage</option>{stages.map(n=><option key={n.id} value={n.id}>{n.title}</option>)}</select></label>
    </>}
    {item.kind==='application' && <p className="pipeline-caption">Candidates complete this form before entering Applied.</p>}
    {!item.exit && <>
      <h3>{stage?'Before the next stage':'Attached activities & messages'}</h3>
      <label className="funnel-field">Path<select aria-label="Attachment path" value={outcome} onChange={e=>setOutcome(e.target.value as typeof outcome)}><option value="always">On this step</option><option value="success">Requirements met</option><option value="failure">Rule not met</option></select></label>
      <div className="funnel-inline"><button onClick={()=>onAttach('trip',outcome)}>＋ Add trip</button><button onClick={()=>onAttach('communication',outcome)}>＋ Add communication</button>{stage&&<button onClick={()=>onAttach('round','always')}>＋ Add activity</button>}</div>
    </>}
  </section>;
}
