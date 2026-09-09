import { expect, it } from 'vitest';
import { createDemoService, toBoard } from './service';
import { createRepository } from './repository';
import type { DemoProject } from './types';
import { migratePipeline } from '../canvasJob/pipelineModel';
import { node } from '../canvasJob/funnelModel';

it('routes explicit hard-rule decisions and delivers the failure communication, without using scores', () => {
  const data = new Map<string,string>();
  const storage = { getItem:(k:string)=>data.get(k)??null, setItem:(k:string,v:string)=>data.set(k,v), removeItem:(k:string)=>data.delete(k), clear:()=>data.clear(), key:(i:number)=>[...data.keys()][i], get length(){return data.size;} } as Storage;
  const service = createDemoService(createRepository<DemoProject>(storage,'rules.'));
  const p = service.loadDemo('role');
  const nodes = migratePipeline(p.configuration.nodes,toBoard(p));
  const check = { ...node('round','Experience check','applied','experience-check'), rules:[{id:'years',field:'experience' as const, operator:'less_than' as const,value:'3',enabled:true}] };
  const mail = { ...node('communication','Thank you for applying',check.id,'failure-mail'),outcome:'failure' as const,subject:'Your application',body:'Thank you {{candidate_name}}.' };
  service.saveConfiguration('role',{...p.configuration,nodes:[...nodes,check,mail]});
  const published = service.publish('role');
  service.transact('role',p=>{p.candidates['cand-priya'].revisionId=published.liveRevisionId;p.candidates['cand-priya'].tripScore=99;});
  expect(()=>service.decide('role','cand-priya',check.id,{},'reject')).toThrow(/missing evidence/);
  expect(()=>service.decide('role','cand-priya',check.id,{experience:8},'reject')).toThrow(/failed hard rule/);
  const result=service.decide('role','cand-priya',check.id,{experience:1},'reject');
  expect(result.candidates['cand-priya'].stageId).toBe('archive');
  expect(Object.values(result.deliveries).some(d=>d.nodeId===mail.id&&d.body.includes('Priya'))).toBe(true);
});

it('freezes full trip assignments and records responses without an automated score', () => {
  const data = new Map<string,string>();
  const storage = { getItem:(k:string)=>data.get(k)??null, setItem:(k:string,v:string)=>data.set(k,v), removeItem:(k:string)=>data.delete(k), clear:()=>data.clear(), key:(i:number)=>[...data.keys()][i], get length(){return data.size;} } as Storage;
  const service = createDemoService(createRepository<DemoProject>(storage,'trips.'));
  service.loadDemo('role');
  const trip = {id:'full',title:'Work sample',status:'published' as const,createdAt:1,updatedAt:1,inferenceCards:[],inferenceCardsLocked:false,spine:'A real scenario',spineGenerated:false,aiPrefilled:false,difficulty:'medium' as const,pipelineStageId:'applied',stages:[{id:'round',type:'case_study' as const,spokenInstructions:'Explain it',durationMinutes:15,items:[{id:'answer',kind:'question' as const,prompt:'Your approach?',type:'paragraph' as const,required:'mandatory' as const,options:[]}]}]};
  const p=service.assignFullTrip('role','cand-priya',trip.id,trip);
  const a=Object.values(p.assignments).find(a=>a.tripId===trip.id)!;
  trip.spine='Changed later';
  expect(a.tripSnapshot?.spine).toBe('A real scenario');
  expect(()=>service.respondFullTrip('role',a.id,{})).toThrow(/required/);
  const done=service.respondFullTrip('role',a.id,{answer:'Test the assumptions'});
  expect(done.assignments[a.id].status).toBe('completed');
  expect(done.assignments[a.id].score).toBeUndefined();
  expect(done.candidates['cand-priya'].stageId).toBe('applied');
});
