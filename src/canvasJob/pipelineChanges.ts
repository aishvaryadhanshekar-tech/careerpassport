import type { JobDraft } from '../types';
import type { Revision } from '../demo/types';
import type { FunnelNode } from './funnelModel';
export type PipelineChange={title:string;kind:'Added'|'Removed'|'Changed';details:{label:string;before:string;after:string}[]};
function stable(value:unknown):string {
  if(Array.isArray(value))return JSON.stringify(value.map(v=>JSON.parse(stable(v))));
  if(value&&typeof value==='object')return JSON.stringify(Object.fromEntries(Object.entries(value).filter(([,v])=>v!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,JSON.parse(stable(v))])));
  return JSON.stringify(value??null);
}
function ruleText(rules:FunnelNode['rules']) {return (rules||[]).map(r=>`${r.enabled?'Enabled':'Disabled'}: ${r.field==='experience'?'Minimum experience':'Required domain'} ${r.value}${r.field==='experience'?' years':''}`).join('; ')||'No rules';}
export function pipelineChanges(nodes:FunnelNode[],draft:JobDraft,live:Revision):PipelineChange[] {
  const changes:PipelineChange[]=[];
  const fields=['title','parent','description','rules','destinationId','outcome','tripId','active','trigger','delay','recipient','subject','body','duration','tripType','threshold','stageKey','exit'] as const;
  const labels:Partial<Record<typeof fields[number],string>>={parent:'Attached to',rules:'Rules',destinationId:'Next step',tripId:'Trip',body:'Message',subject:'Subject',delay:'Delay',outcome:'Path',active:'Enabled'};
  const format=(key:typeof fields[number],value:unknown,source:FunnelNode[],sourceDraft:JobDraft)=>key==='rules'?ruleText(value as FunnelNode['rules']):key==='parent'||key==='destinationId'?source.find(n=>n.id===value||n.stageKey===value)?.title||String(value||'Default next stage'):key==='tripId'?sourceDraft.trips.find(t=>t.id===value)?.title||String(value||'None'):String(value??'None');
  for(const current of nodes){
    const old=live.nodes.find(n=>n.id===current.id);
    if(!old){changes.push({title:current.title,kind:'Added',details:[{label:'Type',before:'',after:current.kind}]});continue;}
    const details=fields.filter(k=>stable(old[k])!==stable(current[k])).map(k=>({label:labels[k]||k[0].toUpperCase()+k.slice(1),before:format(k,old[k],live.nodes,live.draft),after:format(k,current[k],nodes,draft)}));
    if(details.length)changes.push({title:current.title,kind:'Changed',details});
  }
  for(const old of live.nodes)if(!nodes.some(n=>n.id===old.id))changes.push({title:old.title,kind:'Removed',details:[]});
  const order=(source:FunnelNode[])=>source.filter(n=>n.kind==='stage'&&!n.exit).map(n=>n.id);
  if(stable(order(live.nodes))!==stable(order(nodes)))changes.push({title:'Stage order',kind:'Changed',details:[{label:'Journey',before:order(live.nodes).map(id=>live.nodes.find(n=>n.id===id)!.title).join(' → '),after:order(nodes).map(id=>nodes.find(n=>n.id===id)!.title).join(' → ')}]});
  const connections=(source:FunnelNode[])=>{const root=source.find(n=>n.kind==='job');return {links:root?.canvasConnections||[],hidden:root?.hiddenConnections||[]};};
  if(stable(connections(nodes))!==stable(connections(live.nodes)))changes.push({title:'Canvas connections',kind:'Changed',details:[{label:'Connections',before:`${connections(live.nodes).links.length} edited links`,after:`${connections(nodes).links.length} edited links · ${connections(nodes).hidden.length} removed default links`}]});
  const role=Object.keys(draft.fields) as (keyof JobDraft['fields'])[];
  const roleDetails=role.filter(k=>draft.fields[k].value!==live.draft.fields[k].value).map(k=>({label:k,before:live.draft.fields[k].value||'Empty',after:draft.fields[k].value||'Empty'}));
  if(roleDetails.length)changes.push({title:'Role details',kind:'Changed',details:roleDetails});
  for(const key of ['application','salaryCurrency','salaryPeriod','flags','preview','roleProfile','publishDestinations'] as const)if(stable(draft[key])!==stable(live.draft[key]))changes.push({title:({application:'Application form',salaryCurrency:'Salary currency',salaryPeriod:'Salary period',flags:'Role preferences',preview:'Job brief',roleProfile:'Role profile',publishDestinations:'Publishing destinations'})[key],kind:'Changed',details:[]});
  for(const trip of draft.trips){const old=live.draft.trips.find(t=>t.id===trip.id);const content=(t:typeof trip)=>({...t,updatedAt:0,createdAt:0});if(!old||stable(content(old))!==stable(content(trip)))changes.push({title:`Trip: ${trip.title}`,kind:old?'Changed':'Added',details:[{label:'Status',before:old?.status||'None',after:trip.status},{label:'Components',before:String(old?.stages.length||0),after:String(trip.stages.length)}]});}
  for(const trip of live.draft.trips)if(!draft.trips.some(t=>t.id===trip.id))changes.push({title:`Trip: ${trip.title}`,kind:'Removed',details:[]});
  return changes;
}
