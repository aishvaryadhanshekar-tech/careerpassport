import { pipelineChanges } from './pipelineChanges';
import type { FunnelNode } from './funnelModel';
import type { JobDraft } from '../types';
import type { Revision } from '../demo/types';
export function PublishComparison({nodes,draft,live}:{nodes:FunnelNode[];draft:JobDraft;live?:Revision}){
  if(!live)return <p className="pipeline-caption">First publication · all stages, rules and messages will go live.</p>;
  const changes=pipelineChanges(nodes,draft,live);
  return <section className="pipeline-comparison" aria-label="Changes since publication"><h3>Changes since version {live.number}</h3><p>{changes.length?`${changes.length} changes to review`:'No content changes since publication.'}</p>{changes.map((change,i)=><details key={i} open={change.details.some(d=>['Rules','Message','Subject','Path','Next step'].includes(d.label))}><summary><span className={`pipeline-change-${change.kind.toLowerCase()}`}>{change.kind}</span> {change.title}</summary>{change.details.map((d,j)=><div className="pipeline-diff-row" key={j}><strong>{d.label}</strong><div><small>Live</small><p>{d.before||'—'}</p></div><div><small>Draft</small><p>{d.after||'—'}</p></div></div>)}</details>)}</section>;
}
