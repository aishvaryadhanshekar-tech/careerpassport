import { tabKeyboard } from "../shared/tabKeyboard";
import { useState } from 'react';
import { candidateNodes, DAY, demoService, stageBucket } from './service';
import { useDemoProject } from './useDemoProject';
import { MOCK_SOURCES } from './fixtures';
import type { DemoProject } from './types';
import './demo.css';

export function DemoPanel({ jobId, stage, onImport, initialTab = 'candidates' }: {
  jobId: string; stage?: string; onImport: (role: string) => void; initialTab?: 'candidates' | 'outbox' | 'connections';
}) {
  const project = useDemoProject(jobId);
  const [tab, setTab] = useState(initialTab);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState('all');
  const [error, setError] = useState('');
  function act(action: () => unknown) { try { action(); setError(''); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to complete action.'); } }
  if (!project) return <p className="funnel-help">Preparing demo workspace…</p>;
  const candidates = Object.values(project.candidates);
  const filtered = candidates.filter(c => (!stage || stageBucket(c.stageId) === stage || c.stageId === stage) && (status === 'all' || c.tripStatus === status) && `${c.name} ${c.email}`.toLowerCase().includes(query.toLowerCase()));
  const deliveries = Object.values(project.deliveries).sort((a, b) => b.dueAt - a.dueAt);
  const candidate = project.candidates[selected ?? ''];
  const revision = project.revisions[candidate?.revisionId ?? ''];
  const nodes = candidate ? candidateNodes(project, candidate) : [];
  return <div className="demo-panel">
    <div className="demo-tabs" role="tablist" onKeyDown={tabKeyboard} aria-label="Demo tools">{(['candidates', 'outbox', 'connections'] as const).map(t => <button role="tab" aria-selected={tab === t} key={t} onClick={() => setTab(t)}>{t === 'outbox' ? `Outbox (${deliveries.length})` : t === 'connections' ? 'Integrations' : `Candidates (${filtered.length})`}</button>)}</div>
    <div className="demo-clock"><span><small>DEMO CLOCK</small>{new Date(project.clock).toLocaleString()}</span><button onClick={() => act(() => demoService().advance(jobId))}>+1 day</button></div>
    {error && <p role="alert" className="demo-error">{error}</p>}
    {tab === 'candidates' && <>
      <div className="demo-metrics"><div><b>{candidates.length}</b><small>Applicants</small></div><div><b>{candidates.filter(c => stageBucket(c.stageId) === 'interview').length}</b><small>Interviewing</small></div><div><b>{Object.values(project.assignments).filter(a => a.status === 'completed').length}</b><small>Trips completed</small></div></div>
      <div className="funnel-inline"><input aria-label="Search demo candidates" placeholder="Search candidates" value={query} onChange={e => setQuery(e.target.value)}/><select aria-label="Filter assessment status" value={status} onChange={e => setStatus(e.target.value)}><option value="all">All statuses</option><option value="none">Not assigned</option><option value="sent">In progress</option><option value="completed">Completed</option></select></div>
      <div className="demo-table-wrap"><table className="demo-table"><thead><tr><th>Candidate</th><th>Progress</th><th>Last activity</th></tr></thead><tbody>{filtered.map(c => <tr key={c.id}><td><button className="demo-name" onClick={() => setSelected(c.id)}>{c.name}</button><small>{c.email}</small></td><td>{c.tripStatus === 'completed' ? `${c.tripScore}%` : c.tripStatus === 'sent' ? 'In progress' : 'Applied'}</td><td>{new Date(c.timeline.at(-1)?.at ?? c.appliedAt).toLocaleDateString()}</td></tr>)}</tbody></table></div>
      {!filtered.length && <p className="funnel-help">No candidates match. Add an application or load the sample demo.</p>}
      {candidate && <section className="demo-candidate"><div className="demo-section-head"><h3>{candidate.name}</h3><button aria-label="Close candidate details" onClick={() => setSelected(null)}>×</button></div><p>{candidate.email}</p><span className="demo-badge">Journey v{revision?.number ?? 'draft'}</span>
        <label className="funnel-field">Move candidate<select aria-label="Move candidate" value={candidate.stageId} onChange={e => act(() => demoService().move(jobId, candidate.id, e.target.value))}><option value="applied">Prospects</option><option value="screened">Pipeline</option><option value="submitted">Submitted</option><option value="interviewing">Interview</option>{nodes.filter(n => n.kind === 'round').map(n => <option key={n.id} value={n.id}>{n.title}</option>)}<option value="offered">Offered</option><option value="archive">Rejected / archived</option></select></label>
        <h3>Assessments</h3>
        {Object.values(project.assignments).filter(a => a.candidateId === candidate.id).map(a => <div className="demo-assignment" key={a.id}><strong>{a.title}</strong><small>{a.duration} min · {a.status}</small><p>{a.instructions}</p>{a.status === 'completed' ? <b>{a.score}%</b> : <div className="funnel-inline"><button onClick={() => act(() => demoService().complete(jobId, a.id, 86))}>Complete · 86%</button><button onClick={() => act(() => demoService().complete(jobId, a.id, 28))}>Complete · 28%</button></div>}</div>)}
        <label className="funnel-field">Assign a trip<select value="" onChange={e => act(() => demoService().assign(jobId, candidate.id, e.target.value))}><option value="">Choose assessment</option>{nodes.filter(n => n.kind === 'trip').map(n => <option key={n.id} value={n.id}>{n.title}</option>)}</select></label>
        <h3>Interview</h3>{candidate.interviewAt && <p>{new Date(candidate.interviewAt).toLocaleString()}</p>}<button onClick={() => act(() => demoService().schedule(jobId, candidate.id, project.clock + DAY))}>Schedule for tomorrow</button>
        <h3>Send a message</h3>{nodes.filter(n => n.kind === 'communication').map(n => <div className="demo-send" key={n.id}><span>{n.title}</span><button onClick={() => act(() => demoService().send(jobId, candidate.id, n.id))}>Send now</button><button onClick={() => act(() => demoService().send(jobId, candidate.id, n.id, 1))}>Tomorrow</button></div>)}
        <details><summary>Application answers</summary>{Object.entries(candidate.answers).map(([key, answer]) => <div key={key}><strong>{revision?.draft.application?.items.find(q => q.id === key)?.kind === 'question' ? (revision.draft.application.items.find(q => q.id === key) as { prompt: string }).prompt : key}</strong><p>{answer}</p></div>)}</details>
        <details open><summary>Activity timeline</summary><ol className="demo-timeline">{[...candidate.timeline].reverse().map(e => <li key={e.id}><strong>{e.label}</strong><small>{new Date(e.at).toLocaleString()}</small></li>)}</ol></details>
      </section>}
    </>}
    {tab === 'outbox' && <><p className="funnel-help">Demo messages · no email or SMS is sent.</p>{deliveries.map(d => <details className="demo-message" key={d.id}><summary><span>{d.name}</span><span className={`demo-badge ${d.status}`}>{d.status}</span></summary><small>To: {d.recipient}</small><small>{d.status === 'delivered' ? 'Delivered' : 'Due'} {new Date(d.sentAt ?? d.dueAt).toLocaleString()}</small><h4>{d.subject}</h4><p>{d.body}</p></details>)}{!deliveries.length && <p className="funnel-help">Move a candidate into a round to trigger its invitation, or send a message from candidate details.</p>}</>}
    {tab === 'connections' && <><p className="funnel-help">Demo connections · no account required.</p>{['Google Drive', 'Slack'].map(provider => <section key={provider}><div className="demo-section-head"><h3>{provider}</h3><button onClick={() => act(() => demoService().connect(jobId, provider, !project.connections[provider]))}>{project.connections[provider] ? 'Disconnect' : 'Connect demo'}</button></div>{project.connections[provider] && MOCK_SOURCES.filter(s => s.provider === provider).map(s => <div className="demo-source" key={s.id}><strong>{s.title}</strong><small>{s.detail}</small><button onClick={() => onImport(s.role)}>Import role details</button></div>)}</section>)}</>}
  </div>;
}

export function DemoToolbar({ jobId, onLoad, onOpen, beforeAction }: {
  jobId: string; onLoad: (project: DemoProject) => void; onOpen: () => void; beforeAction: () => void;
}) {
  const project = useDemoProject(jobId);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  function load() { if (project && !window.confirm('Replace this job’s demo configuration and candidates with the sample scenario? Other jobs are unchanged.')) return; const next = demoService().loadDemo(jobId); onLoad(next); }
  async function copy() { beforeAction(); try { await navigator.clipboard.writeText(`${window.location.origin}/demo/apply/${jobId}`); setCopied(true); } catch { setError(`Application link: ${window.location.origin}/demo/apply/${jobId}`); } }
  return <div className="demo-toolbar"><span className="demo-badge">DEMO</span><button onClick={load}>{project && Object.keys(project.candidates).length ? 'Reset sample demo' : 'Load sample demo'}</button><button onClick={onOpen}>Candidates & outbox</button><button disabled={!project?.liveRevisionId} onClick={() => { beforeAction(); window.open(`/demo/apply/${jobId}`, '_blank', 'noopener'); }}>Open candidate view ↗</button><button disabled={!project?.liveRevisionId} onClick={() => void copy()}>{copied ? 'Link copied' : 'Copy application link'}</button>{error && <span role="status">{error}</span>}</div>;
}
