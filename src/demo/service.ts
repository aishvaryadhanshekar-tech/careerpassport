import { connectedNextStage } from "../canvasJob/pipelineConnections";
import { DEFAULT_PIPELINE_STAGES, flagForScore, renderTemplate, type PipelineBoard, type Trip } from '../types';
import { emptyOperations, reviewFor, STAGES } from '../hiring/catalog';
import { candidateStageNode, hardRuleResult } from '../canvasJob/pipelineModel';
import { seedBoard } from '../seedCandidates';
import { publishErrors, type FunnelNode } from '../canvasJob/funnelModel';
import { STANDARD_FIELD_META } from '../applicationCatalog';
import { createRepository, type Repository } from './repository';
import { demoDraft, demoNodes } from './fixtures';
import type { Assignment, Configuration, DemoCandidate, DemoProject } from './types';

export const DAY = 86_400_000;
export const stageBucket = (stage: string) => stage === 'applied' ? 'prospects' : ['screened', 'submitted'].includes(stage) ? 'pipeline' : stage === 'archive' ? 'archive' : 'interview';
export function candidateNodes(project: DemoProject, candidate: DemoCandidate): FunnelNode[] {
  return project.revisions[candidate.revisionId ?? '']?.nodes ?? project.configuration.nodes;
}
export function toBoard(project: DemoProject): PipelineBoard {
  const rounds = Object.values(project.revisions).flatMap(r => r.nodes).concat(project.configuration.nodes).filter(n => n.kind === 'round' && (!project.configuration.nodes.some(root=>root.pipelineVersion===2) || Object.values(project.candidates).some(c=>c.stageId===n.id)));
  const configured = project.configuration.nodes.filter(n => n.kind === 'stage' && n.stageKey).map(n => ({ id: n.stageKey!, label: n.title, removable: !DEFAULT_PIPELINE_STAGES.some(s => s.id === n.stageKey) }));
  const base = [...configured, ...DEFAULT_PIPELINE_STAGES.filter(s => !configured.some(n => n.id === s.id))];
  return { stages: [...base, ...Array.from(new Map(rounds.map(n => [n.id, { id: n.id, label: n.title, removable: true }])).values())], candidates: Object.values(project.candidates) };
}
function stageParent(candidate: DemoCandidate, project: DemoProject) { const nodes = candidateNodes(project, candidate); if (nodes.some(n => n.pipelineVersion === 2)) return candidateStageNode(nodes, candidate.stageId)?.id ?? candidate.stageId; return ({ applied: 'prospects', screened: 'pipeline', submitted: 'pipeline', interviewing: 'interview' } as Record<string, string>)[candidate.stageId] ?? candidate.stageId; }
function record(candidate: DemoCandidate, label: string, at: number) { candidate.timeline.push({ id: crypto.randomUUID(), label, at, actor: 'team' }); }
function assign(project: DemoProject, candidate: DemoCandidate, trip: FunnelNode) {
  if(trip.placeholder)return;
  const tripDraft=project.revisions[candidate.revisionId ?? '']?.draft ?? project.configuration.draft;
  const fullTrip=trip.tripId?tripDraft.trips.find(t=>t.id===trip.tripId):undefined;
  if(trip.tripId && fullTrip?.status!=='published') return;
  const id = `${candidate.id}:${trip.id}:${candidate.visit}`;
  if (project.assignments[id]) return;
  project.assignments[id] = { id, candidateId: candidate.id, nodeId: trip.id, title: trip.title, instructions: trip.description, duration: trip.duration, status: 'assigned', ...(fullTrip?{tripId:fullTrip.id,tripSnapshot:structuredClone(fullTrip)}:{}) };
  candidate.tripStatus = 'sent'; candidate.tripSentAt = project.clock;
  record(candidate, `Assigned ${trip.title}`, project.clock);
}
function deliver(project: DemoProject, candidate: DemoCandidate, message: FunnelNode, eventKey: string, dueAt = project.clock) {
  const id = `${candidate.id}:${message.id}:${eventKey}`;
  if (project.deliveries[id]) return;
  const draft = project.revisions[candidate.revisionId ?? '']?.draft ?? project.configuration.draft;
  const values = { candidate_name: candidate.name, job_title: draft.fields.designation.value, company: 'Career Passport', sender_name: 'Hiring team', stage: candidateNodes(project, candidate).find(n => n.id === candidate.stageId)?.title ?? candidate.stageId };
  const sent = dueAt <= project.clock;
  project.deliveries[id] = { id, candidateId: candidate.id, nodeId: message.id, name: message.title, recipient: message.recipient === 'Hiring team' ? 'hiring-team@demo.example' : candidate.email, subject: renderTemplate(message.subject, values), body: renderTemplate(message.body, values), dueAt, sentAt: sent ? project.clock : undefined, status: sent ? 'delivered' : 'scheduled', eventKey };
  record(candidate, `${sent ? 'Delivered' : 'Scheduled'}: ${message.title}`, project.clock);
}
function trigger(project: DemoProject, candidate: DemoCandidate, event: string, key: string, score?: number, activityId?: string) {
  for (const message of candidateNodes(project, candidate).filter(n => n.kind === 'communication' && (n.parent === stageParent(candidate, project) || (activityId && n.parent===activityId) || (candidate.stageId==='applied' && candidateNodes(project,candidate).some(app=>app.kind==='application'&&(n.parent===app.id||n.parent===app.parent)))) && n.active && n.outcome !== 'failure')) {
    if (message.trigger === event || (event === 'When trip completed' && message.trigger === 'When score below threshold' && score !== undefined && score < message.threshold)) deliver(project, candidate, message, key);
    if (event === 'When round starts' && message.trigger === 'After a delay') deliver(project, candidate, message, key, project.clock + message.delay * DAY);
  }
}
function enter(project: DemoProject, candidate: DemoCandidate) {
  candidate.stageEnteredAt = project.clock;
  candidateNodes(project, candidate).filter(n => n.kind === 'trip' && n.outcome !== 'failure' && n.outcome !== 'success' && (n.parent === stageParent(candidate, project) || candidateStageNode(candidateNodes(project,candidate),n.id)?.id===stageParent(candidate,project))).forEach(trip => assign(project, candidate, trip));
  trigger(project, candidate, 'When round starts', `entry:${candidate.visit}`);
}
function publish(project: DemoProject) {
  const setup = project.operations?.setup;
  if (setup) for (const [low, high] of [['ctcMin', 'ctcMax'], ['yoeMin', 'yoeMax']]) {
    if ([low, high].some(key => setup[key] && (!Number.isFinite(Number(setup[key])) || Number(setup[key]) < 0))) throw new Error('Compensation and experience must be non-negative numbers.');
    if (setup[low] && setup[high] && Number(setup[low]) > Number(setup[high])) throw new Error('Minimum compensation or experience must not exceed its maximum.');
  }
  for(const activity of project.configuration.nodes) for(const rule of activity.rules||[]) {
    if(rule.enabled && (!rule.value.trim() || (rule.field==='experience' && (!Number.isFinite(Number(rule.value)) || Number(rule.value)<0)))) throw new Error(`Configure the ${rule.field} rule in ${activity.title}.`);
  }
  const missing = publishErrors(project.configuration.draft);
  if (missing.length) throw new Error(`Complete before publishing: ${missing.join(', ')}.`);
  if (!project.configuration.draft.application) throw new Error('Add an application form before publishing.');
  const id = crypto.randomUUID();
  project.revisions[id] = { id, number: Object.keys(project.revisions).length + 1, at: project.clock, nodes: structuredClone(project.configuration.nodes), draft: structuredClone(project.configuration.draft) };
  // Legacy/unpublished demo candidates join the first published version once.
  Object.values(project.candidates).forEach(candidate => { if (!candidate.revisionId) candidate.revisionId = id; });
  project.liveRevisionId = id; project.configuration.published = true;
}

export function createDemoService(repository: Repository<DemoProject>) {
  const get = (id: string) => repository.get(id);
  const update = (id: string, action: (project: DemoProject) => void) => {
    const project = get(id); if (!project) throw new Error('Save or load a demo role first.');
    action(project); project.updatedAt = Date.now(); repository.put(project); return project;
  };
  return {
    get, list: repository.list, subscribe: repository.subscribe, transact: update,
    saveConfiguration(id: string, configuration: Configuration, board?: PipelineBoard) {
      const existing = get(id);
      const project: DemoProject = existing ?? { schemaVersion: 1, id, updatedAt: Date.now(), clock: Date.now(), configuration, candidates: {}, assignments: {}, deliveries: {}, revisions: {}, liveRevisionId: null, connections: {} };
      const { nodes, draft, started, published, viewport } = configuration;
      project.configuration = structuredClone({ nodes, draft, started, published, viewport }); project.updatedAt = Date.now();
      // Older funnel drafts migrate once. Configuration autosaves never overwrite runtime data.
      if (!existing && board) for (const c of board.candidates) project.candidates[c.id] = { ...c, revisionId: null, answers: {}, stageEnteredAt: project.clock, visit: 0 };
      repository.put(project); return project;
    },
    publish: (id: string) => update(id, publish),
    loadDemo(id: string, role?: string) {
      const draft = demoDraft(role);
      const project: DemoProject = { schemaVersion: 1, id, updatedAt: Date.now(), clock: Date.now(), configuration: { draft, nodes: demoNodes(draft.fields.designation.value), started: true, published: true }, candidates: {}, assignments: {}, deliveries: {}, revisions: {}, liveRevisionId: null, connections: {} };
      publish(project);
      const rounds = project.configuration.nodes.filter(n => n.kind === 'round');
      seedBoard().candidates.forEach((c, i) => {
        const candidate: DemoCandidate = { ...c, stageId: i < 3 ? 'applied' : i < 5 ? 'screened' : i < 7 ? rounds[0].id : rounds[1].id, tripStatus: 'none', tripScore: undefined, revisionId: project.liveRevisionId, answers: { 'Why are you interested in this role?': 'I want to work on meaningful customer problems with an ambitious team.', 'Relevant achievement': 'Led a cross-functional project that improved activation by 24%.', Portfolio: 'https://portfolio.example/work' }, stageEnteredAt: project.clock, visit: 0, appliedAt: project.clock - (i + 1) * DAY, timeline: [{ id: crypto.randomUUID(), at: project.clock - (i + 1) * DAY, actor: 'candidate', label: 'Application submitted' }] };
        project.candidates[candidate.id] = candidate; enter(project, candidate);
      });
      repository.put(project); return project;
    },
    move(id: string, candidateId: string, stageId: string) { return update(id, project => {
      const candidate = project.candidates[candidateId]; if (!candidate) throw new Error('Candidate not found.');
      const nodes = candidateNodes(project, candidate);
      if (!DEFAULT_PIPELINE_STAGES.some(s => s.id === stageId) && !nodes.some(n => (n.id === stageId || n.stageKey === stageId) && (n.kind === 'round' || n.kind === 'stage'))) throw new Error('That round is not part of this candidate’s published journey.');
      if (candidate.stageId === stageId) return;
      candidate.stageId = stageId; candidate.visit++; record(candidate, `Moved to ${nodes.find(n => n.id === stageId)?.title ?? DEFAULT_PIPELINE_STAGES.find(s => s.id === stageId)?.label}`, project.clock); enter(project, candidate);
    }); },
    assignFullTrip(id: string, candidateId: string, tripId: string, currentTrip?: Trip) { return update(id, project => {
      const candidate = project.candidates[candidateId];
      if (!candidate) throw new Error('Candidate not found.');
      const trip = currentTrip ?? project.configuration.draft.trips.find(t=>t.id===tripId);
      if (!trip || trip.id !== tripId || trip.status !== 'published') throw new Error('Publish the trip before assigning it.');
      const assignmentId = `${candidateId}:full-trip:${tripId}`;
      if (project.assignments[assignmentId]) return;
      project.assignments[assignmentId] = { id:assignmentId,candidateId,nodeId:project.configuration.nodes.find(n=>n.tripId===tripId)?.id || tripId,
        tripId,tripSnapshot:structuredClone(trip), title:trip.title,instructions:trip.spine,duration:trip.stages.reduce((sum,s)=>sum+s.durationMinutes,0),status:'assigned',expiresAt:project.clock+7*DAY };
      const deliveryId=`${assignmentId}:invitation`;
      project.deliveries[deliveryId]={id:deliveryId,candidateId,nodeId:tripId,name:'Trip invitation',recipient:candidate.email,subject:`Your next step: ${trip.title}`,body:`Hi ${candidate.name},\n\nYour trip is ready: /demo/trip/${id}/${encodeURIComponent(assignmentId)}\n\nPlease complete it within 7 days.`,dueAt:project.clock,sentAt:project.clock,status:'delivered',eventKey:assignmentId};
      candidate.tripStatus='sent'; candidate.tripSentAt=project.clock; record(candidate, `Invited to ${trip.title}`, project.clock);
    }); },
    respondFullTrip(id: string, assignmentId: string, answers: Record<string,string>) { return update(id, project=>{
      const a=project.assignments[assignmentId];
      if(!a?.tripSnapshot) throw new Error('Trip invitation not found.');
      if(a.status==='completed') return;
      if(a.expiresAt && a.expiresAt<=project.clock) throw new Error('This invitation has expired.');
      const required=a.tripSnapshot.stages.flatMap(s=>s.items).filter(q=>q.required==='mandatory');
      if(required.some(q=>!answers[q.id]?.trim())) throw new Error('Complete the required questions.');
      a.answers={...answers};a.status='completed';
      const c=project.candidates[a.candidateId];c.tripStatus=Object.values(project.assignments).some(other=>other.candidateId===c.id&&other.status==='assigned')?'sent':'completed';
      record(c, `${a.title} submitted · awaiting human review`, project.clock);
      trigger(project,c,'When trip completed',`response:${assignmentId}`,undefined,a.nodeId);
    }); },
    decide(id: string, candidateId: string, activityId: string, evidence: { domain?: string; experience?: number }, decision: 'continue' | 'reject') { return update(id, project => {
      const candidate = project.candidates[candidateId];
      if (!candidate) throw new Error('Candidate not found.');
      if (!project.configuration.published) throw new Error('Publish the workflow before making a stage decision.');
      const nodes = candidateNodes(project, candidate);
      const activity = nodes.find(n => n.id === activityId);
      if (!activity) throw new Error('Publish this activity before using it for this candidate.');
      const result = hardRuleResult(activity.rules || [], evidence);
      if (result.result === 'review') throw new Error('Add the missing evidence before deciding.');
      if (decision === 'reject' && result.result !== 'fail') throw new Error('Rejection requires a failed hard rule. Trip scores are not rejection criteria.');
      if (decision === 'continue' && result.result === 'fail') throw new Error('Resolve the failed rule before progressing.');
      const source = candidateStageNode(nodes, candidate.stageId);
      if(candidateStageNode(nodes, activity.id)?.id !== source?.id) throw new Error('This activity does not belong to the candidate’s current stage.');
      const next = connectedNextStage(nodes,activity.id);
      const outcome = decision === 'reject' ? 'failure' : 'success';
      const messages = nodes.filter(n => n.parent === activity.id && n.outcome === outcome && n.kind === 'communication' && n.active);
      const destination = decision === 'reject' ? 'archive' : (next?.stageKey || next?.id);
      if (!destination) throw new Error('Choose a destination stage first.');
      const destinationNode = nodes.find(n => (n.id === destination || n.stageKey === destination) && n.kind === 'stage');
      if(!destinationNode) throw new Error('Choose a published destination stage.');
      for (const message of messages) deliver(project, candidate, message, `decision:${candidate.visit}:${outcome}`);
      nodes.filter(n=>n.kind==='trip'&&n.parent===activity.id&&n.outcome===outcome).forEach(trip=>assign(project,candidate,trip));
      record(candidate, `${decision === 'reject' ? 'Rule not met' : 'Requirements met'}: ${result.reasons.join('; ') || 'Reviewed by recruiter'}`, project.clock);
      candidate.stageId = destinationNode?.stageKey || destination; candidate.visit++;
      project.operations ??= emptyOperations();
      project.operations.reviews[candidate.id]={...reviewFor(candidate,project.operations),status:decision==='reject'?'Underqualified':(STAGES[candidate.stageId]||STAGES.interviewing)[0],...(evidence.experience!==undefined?{experience:String(evidence.experience)}:{})};
      record(candidate, `Moved to ${destinationNode?.title || destination}`, project.clock); enter(project, candidate);
    }); },
    assign(id: string, candidateId: string, nodeId: string) { return update(id, project => {
      const candidate = project.candidates[candidateId]; if (!candidate) throw new Error('Candidate not found.');
      const trip = candidateNodes(project, candidate).find(n => n.id === nodeId && n.kind === 'trip');
      if (!trip) throw new Error('Trip not found in this candidate’s journey.'); assign(project, candidate, trip);
    }); },
    complete(id: string, assignmentId: string, score: number) { return update(id, project => {
      const assignment: Assignment | undefined = project.assignments[assignmentId]; if (!assignment) throw new Error('Assignment not found.');
      if (assignment.status === 'completed') return;
      if (!Number.isFinite(score) || score < 0 || score > 100) throw new Error('Score must be between 0 and 100.');
      assignment.status = 'completed'; assignment.score = score;
      const candidate = project.candidates[assignment.candidateId]; candidate.tripScore = score; candidate.aiFlag = flagForScore(score);
      candidate.tripStatus = Object.values(project.assignments).some(a => a.candidateId === candidate.id && a.status === 'assigned') ? 'sent' : 'completed';
      record(candidate, `${assignment.title} completed · ${score}%`, project.clock); trigger(project, candidate, 'When trip completed', `complete:${assignmentId}`, score, assignment.nodeId);
    }); },
    schedule(id: string, candidateId: string, at: number) { return update(id, project => {
      const candidate = project.candidates[candidateId]; if (!candidate) throw new Error('Candidate not found.');
      if (!Number.isFinite(at) || at <= project.clock) throw new Error('Choose a time after the demo clock.');
      candidate.interviewAt = at; record(candidate, `Interview scheduled for ${new Date(at).toLocaleString()}`, project.clock); trigger(project, candidate, 'When interview scheduled', `schedule:${at}`);
    }); },
    send(id: string, candidateId: string, messageId: string, delayDays = 0) { return update(id, project => {
      const candidate = project.candidates[candidateId]; if (!candidate) throw new Error('Candidate not found.');
      const message = candidateNodes(project, candidate).find(n => n.id === messageId && n.kind === 'communication');
      if (!message || !message.body.trim()) throw new Error('Choose a message with content.');
      deliver(project, candidate, message, `manual:${crypto.randomUUID()}`, project.clock + delayDays * DAY);
    }); },
    advance(id: string, days = 1) { return update(id, project => {
      if (days <= 0 || !Number.isFinite(days)) throw new Error('Advance by a positive number of days.');
      project.clock += days * DAY;
      Object.values(project.deliveries).filter(d => d.status === 'scheduled' && d.dueAt <= project.clock).forEach(d => { d.status = 'delivered'; d.sentAt = project.clock; const c = project.candidates[d.candidateId]; if (c) record(c, `Delivered: ${d.name}`, project.clock); });
    }); },
    connect(id: string, provider: string, connected: boolean) { return update(id, p => { p.connections[provider] = connected; }); },
    submit(id: string, name: string, email: string, answers: Record<string, string>) {
      let candidateId = '';
      const project = update(id, p => {
        if (['paused', 'closed'].includes(p.operations?.setup.status ?? '')) throw new Error('This role is not accepting applications while paused or closed.');
        const revision = p.revisions[p.liveRevisionId ?? '']; if (!revision) throw new Error('This role is not published yet.');
        if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter your name and a valid email address.');
        if (Object.values(p.candidates).some(c => c.email.toLowerCase() === email.trim().toLowerCase())) throw new Error('An application with this email already exists.');
        const form = revision.draft.application!;
        const missing = [...form.standardOrder.filter(f => f.required === 'mandatory').map(f => ({ id: f.id, label: STANDARD_FIELD_META[f.id].label })), ...form.items.filter(q => q.kind === 'question' && q.required === 'mandatory').map(q => ({ id: q.id, label: q.kind === 'question' ? q.prompt : '' }))].filter(q => !answers[q.id]?.trim());
        if (missing.length) throw new Error(`Complete required fields: ${missing.map(q => q.label).join(', ')}.`);
        candidateId = crypto.randomUUID();
        const candidate: DemoCandidate = { id: candidateId, name: name.trim(), email: email.trim(), stageId: 'applied', phone: '', location: answers.currentLocation ?? '', origin: { kind: 'applied' }, appliedAt: p.clock, resumeFileName: answers.resume ?? '', tripStatus: 'none', tags: [], ratings: [], notes: [], timeline: [], revisionId: revision.id, answers, stageEnteredAt: p.clock, visit: 0 };
        record(candidate, 'Application submitted', p.clock); p.candidates[candidateId] = candidate; enter(p, candidate);
      }); return { project, candidateId };
    },
  };
}

let singleton: ReturnType<typeof createDemoService> | undefined;
export function demoService() {
  if (!singleton) singleton = createDemoService(createRepository<DemoProject>(window.localStorage, 'cp.demo.v1.project.'));
  return singleton;
}
