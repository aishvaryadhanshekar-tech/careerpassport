import { describe, expect, it } from 'vitest';
import { createRepository } from './repository';
import { createDemoService, candidateNodes, DAY } from './service';
import type { DemoProject } from './types';

function fixture() {
  const data = new Map<string, string>();
  const storage: Storage = { get length() { return data.size; }, key: i => [...data.keys()][i] ?? null, getItem: k => data.get(k) ?? null, setItem: (k, v) => { data.set(k, v); }, removeItem: k => { data.delete(k); }, clear: () => data.clear() };
  const repository = createRepository<DemoProject>(storage, 'test.');
  const service = createDemoService(repository);
  service.loadDemo('job-a');
  return { service, repository, storage };
}
function answers(project: DemoProject): Record<string, string> {
  const form = project.revisions[project.liveRevisionId!].draft.application!;
  return Object.fromEntries([...form.standardOrder.map(f => [f.id, 'Provided']), ...form.items.map(q => [q.id, 'Provided'])]);
}
describe('demo hiring workflow', () => {
  it('persists normalized projects and isolates jobs', () => {
    const { service, storage } = fixture();
    service.loadDemo('job-b', 'Account Executive');
    service.move('job-a', 'cand-priya', 'screened');
    const reloaded = createDemoService(createRepository<DemoProject>(storage, 'test.'));
    expect(reloaded.get('job-a')!.candidates['cand-priya'].stageId).toBe('screened');
    expect(reloaded.get('job-b')!.candidates['cand-priya'].stageId).toBe('applied');
  });
  it('assigns round trips and delivers a personalized invitation exactly once per entry', () => {
    const { service } = fixture(); const p = service.get('job-a')!;
    const round = p.configuration.nodes.find(n => n.kind === 'round')!;
    service.move('job-a', 'cand-priya', round.id);
    service.move('job-a', 'cand-priya', round.id);
    const after = service.get('job-a')!;
    expect(Object.values(after.assignments).filter(a => a.candidateId === 'cand-priya')).toHaveLength(1);
    const invitation = Object.values(after.deliveries).filter(d => d.candidateId === 'cand-priya' && d.name === 'Round invitation');
    expect(invitation).toHaveLength(1); expect(invitation[0].body).toContain('Priya Nair'); expect(invitation[0].status).toBe('delivered');
  });
  it('delivers a reminder only when the demo clock reaches its due time', () => {
    const { service } = fixture(); service.move('job-a', 'cand-priya', 'screened');
    const reminder = () => Object.values(service.get('job-a')!.deliveries).find(d => d.candidateId === 'cand-priya' && d.nodeId === 'demo-reminder')!;
    service.advance('job-a', 2); expect(reminder().status).toBe('scheduled');
    service.advance('job-a', 1); expect(reminder().status).toBe('delivered');
    const sentAt = reminder().sentAt;
    service.advance('job-a', 1); expect(reminder().sentAt).toBe(sentAt);
  });
  it('runs score triggers and makes repeated completion idempotent', () => {
    const { service } = fixture(); service.move('job-a', 'cand-priya', 'screened');
    const assignment = Object.values(service.get('job-a')!.assignments).find(a => a.candidateId === 'cand-priya')!;
    service.complete('job-a', assignment.id, 28); service.complete('job-a', assignment.id, 90);
    const p = service.get('job-a')!;
    expect(p.assignments[assignment.id].score).toBe(28);
    expect(Object.values(p.deliveries).filter(d => d.nodeId === 'demo-low-score' && d.candidateId === 'cand-priya')).toHaveLength(1);
  });
  it('pins existing candidates to their published journey after changes', () => {
    const { service } = fixture(); const original = service.get('job-a')!;
    const round = original.configuration.nodes.find(n => n.kind === 'round')!;
    const next = structuredClone(original.configuration); next.nodes = next.nodes.filter(n => n.id !== round.id && n.parent !== round.id);
    service.saveConfiguration('job-a', next); service.publish('job-a');
    const p = service.get('job-a')!;
    expect(candidateNodes(p, p.candidates['cand-priya']).some(n => n.id === round.id)).toBe(true);
    const application = service.submit('job-a', 'New Person', 'new@example.com', answers(p));
    expect(candidateNodes(application.project, application.project.candidates[application.candidateId]).some(n => n.id === round.id)).toBe(false);
    expect(() => service.move('job-a', application.candidateId, round.id)).toThrow(/published journey/);
  });
  it('does not lose applications during configuration autosave', () => {
    const { service } = fixture(); const before = service.get('job-a')!;
    const result = service.submit('job-a', 'Demo Person', 'demo@example.com', answers(before));
    service.saveConfiguration('job-a', before.configuration, { stages: [], candidates: [] });
    expect(service.get('job-a')!.candidates[result.candidateId]).toBeDefined();
    expect(() => service.submit('job-a', 'Duplicate', 'demo@example.com', answers(before))).toThrow(/already exists/);
  });
  it('validates submissions and does not persist failed commands', () => {
    const { service } = fixture(); const before = service.get('job-a')!;
    expect(() => service.submit('job-a', 'Demo', 'not-email', {})).toThrow(/valid email/);
    expect(() => service.submit('job-a', 'Demo', 'demo@example.com', {})).toThrow(/required/);
    expect(Object.keys(service.get('job-a')!.candidates)).toHaveLength(Object.keys(before.candidates).length);
    expect(() => service.schedule('job-a', 'cand-priya', before.clock - DAY)).toThrow(/after the demo clock/);
  });
  it('keeps immutable message content and round configuration after editing', () => {
    const { service } = fixture(); const before = service.get('job-a')!;
    const delivery = Object.values(before.deliveries)[0];
    const config = structuredClone(before.configuration); config.nodes.forEach(n => { if (n.kind === 'communication') n.body = 'Changed'; });
    service.saveConfiguration('job-a', config); service.publish('job-a');
    expect(service.get('job-a')!.deliveries[delivery.id].body).toBe(delivery.body);
  });
  it('reset replaces only the selected demo project', () => {
    const { service } = fixture(); service.loadDemo('job-b'); service.advance('job-b', 3);
    const other = service.get('job-b');
    service.loadDemo('job-a');
    expect(service.get('job-b')).toEqual(other);
    expect(Object.keys(service.get('job-a')!.candidates)).toHaveLength(8);
  });
});
