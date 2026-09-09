import { describe,it,expect } from 'vitest';
import { createDraft } from '../types';
import { templateFunnel } from './funnelModel';
import { pipelineChanges } from './pipelineChanges';
function fixture(){const nodes=templateFunnel('Engineer');const draft=createDraft();return {nodes,draft,live:{id:'v1',number:1,at:1,nodes:structuredClone(nodes),draft:structuredClone(draft)}};}
describe('publication comparison',()=>{
  it('ignores view-only changes without mutating live content',()=>{const {nodes,draft,live}=fixture();const snapshot=structuredClone(live);nodes[0].position={x:100,y:90};nodes[0].collapsed=true;expect(pipelineChanges(nodes,draft,live)).toEqual([]);expect(live).toEqual(snapshot);});
  it('shows previous and proposed rule and message values',()=>{const {nodes,draft,live}=fixture();const round=nodes.find(n=>n.kind==='round')!;round.rules=[{id:'min',enabled:true,field:'experience',operator:'less_than',value:'5'}];const message=nodes.find(n=>n.kind==='communication')!;message.body='Thank you for your time.';const result=pipelineChanges(nodes,draft,live);expect(result.find(c=>c.title===round.title)?.details).toContainEqual({label:'Rules',before:'No rules',after:'Enabled: Minimum experience 5 years'});expect(result.find(c=>c.title===message.title)?.details).toContainEqual(expect.objectContaining({label:'Message',after:message.body}));});
  it('reports removals, stage reordering and application edits',()=>{const {nodes,draft,live}=fixture();const stageIndices=nodes.flatMap((n,i)=>n.kind==='stage'?[i]:[]);[nodes[stageIndices[0]],nodes[stageIndices[1]]]=[nodes[stageIndices[1]],nodes[stageIndices[0]]];const removed=nodes.pop()!;draft.fields.designation.value='New role';const result=pipelineChanges(nodes,draft,live);expect(result).toContainEqual({title:removed.title,kind:'Removed',details:[]});expect(result.some(c=>c.title==='Stage order')).toBe(true);expect(result.find(c=>c.title==='Role details')?.details[0].after).toBe('New role');});
});
