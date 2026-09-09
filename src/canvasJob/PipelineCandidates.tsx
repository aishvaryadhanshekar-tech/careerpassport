import { useEffect, useState } from "react";
import { candidateNodes, demoService } from "../demo/service";
import type { DemoCandidate, DemoProject } from "../demo/types";
import { reviewFor } from "../hiring/catalog";
import { ReviewPanel } from "../hiring/ReviewPanel";
import { operations } from "../hiring/service";
import type { FunnelNode } from "./funnelModel";
import { candidateStageNode, hardRuleResult, pipelineStages } from "./pipelineModel";
import "../hiring/hiring.css";
import "./PipelineCandidates.css";

export function needsDecision(candidate: DemoCandidate, project: DemoProject): boolean {
  const stage = candidateStageNode(project.configuration.nodes, candidate.stageId);
  if (stage?.exit || ["archive", "offered"].includes(stage?.stageKey ?? candidate.stageId)) return false;
  if (Object.values(project.operations?.tasks ?? {}).some(task => task.candidateId === candidate.id && !task.done)) return true;
  if (candidate.tripStatus === "completed") return true;
  const assigned = Object.values(project.assignments).some(assignment => assignment.candidateId === candidate.id && assignment.status === "assigned");
  const invited = Object.values(project.operations?.assessments ?? {}).some(assessment => {
    const invitation = assessment.invites[candidate.id];
    return invitation && !invitation.completed && invitation.expiresAt > project.clock;
  });
  return candidate.tripStatus !== "sent" && !assigned && !invited;
}

export function candidateNextAction(candidate:DemoCandidate,project:DemoProject):string {
  const stage=candidateStageNode(project.configuration.nodes,candidate.stageId);
  if(stage?.exit||stage?.stageKey==='archive')return 'Archived · view history';
  if(stage?.stageKey==='offered')return 'Follow up on offer';
  const task=Object.values(project.operations?.tasks||{}).filter(t=>t.candidateId===candidate.id&&!t.done).sort((a,b)=>a.due-b.due)[0];
  if(task)return task.title;
  if(candidate.tripStatus==='completed')return 'Review submitted response';
  if(!needsDecision(candidate,project))return 'Await candidate response';
  const snapshot=candidateNodes(project,candidate);
  const snapshotStage=candidateStageNode(snapshot,candidate.stageId);
  const activity=ruleActivity(snapshot,snapshotStage?.id);
  const fields=activity?.rules?.filter(r=>r.enabled).map(r=>r.field)||[];
  if(fields.length)return `Verify ${[...new Set(fields)].map(f=>f==='experience'?'experience':'résumé domain').join(' and ')}`;
  return 'Review application and choose next step';
}

function ruleActivity(items: FunnelNode[], stageId: string | undefined): FunnelNode | undefined {
  return stageId ? items.find(item => item.rules?.some(rule => rule.enabled) && candidateStageNode(items, item.id)?.id === stageId) : undefined;
}

export function PipelineCandidates({ jobId, items, stageId, onlyDecisions = false }: {
  jobId: string;
  items: FunnelNode[];
  stageId: string | null;
  onlyDecisions?: boolean;
}) {
  const [, refresh] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const decisionOnly = onlyDecisions;
  const [filterStage, setFilterStage] = useState(stageId ?? "");
  const [domain, setDomain] = useState("");
  const [experience, setExperience] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState(false);
  useEffect(() => demoService().subscribe(() => refresh(value => value + 1)), []);
  useEffect(() => {
    setFilterStage(stageId ?? "");
    setSelected(null);
    setDomain("");
    setExperience("");
  }, [stageId, jobId]);
  const project = demoService().get(jobId);

  function run(action: () => unknown, message = "") {
    const success = () => { setError(false); setNotice(message); refresh(value => value + 1); };
    const failure = (cause: unknown) => { setError(true); setNotice(cause instanceof Error ? cause.message : "Unable to complete this action."); };
    try {
      const result = action();
      if (result instanceof Promise) void result.then(success, failure);
      else success();
    } catch (cause) { failure(cause); }
  }
  function openCandidate(id: string) {
    setSelected(id);
    setDomain("");
    setExperience("");
    setNotice("");
  }
  if (!project) return <p className="pipeline-candidates-empty">Save this role to view candidates.</p>;
  const ops = operations(project);
  const candidates = Object.values(project.candidates);
  const stages = pipelineStages(items);
  const filtered = candidates.filter(candidate => {
    const currentStage = candidateStageNode(items, candidate.stageId);
    return (!filterStage || currentStage?.id === filterStage) &&
      (!decisionOnly || needsDecision(candidate, project)) &&
      `${candidate.name} ${candidate.email}`.toLowerCase().includes(query.trim().toLowerCase());
  });
  const stage = stages.find(item => item.id === filterStage);
  const current = selected ? project.candidates[selected] : undefined;
  const currentStage = current ? candidateStageNode(items, current.stageId) : undefined;
  const snapshot = current ? candidateNodes(project, current) : [];
  const snapshotStage = current ? candidateStageNode(snapshot, current.stageId) : undefined;
  const snapshotActivity = ruleActivity(snapshot, snapshotStage?.id);
  const latest = project.liveRevisionId ? project.revisions[project.liveRevisionId] : undefined;
  const latestStage = current && latest ? candidateStageNode(latest.nodes, current.stageId) : undefined;
  const latestActivity = latest ? ruleActivity(latest.nodes, latestStage?.id) : undefined;
  const draftActivity = ruleActivity(items, currentStage?.id);
  const activity = snapshotActivity ?? latestActivity ?? draftActivity;
  const evidence = { ...(domain.trim() ? { domain: domain.trim() } : {}), ...(experience.trim() ? { experience: Number(experience) } : {}) };
  const result = activity ? hardRuleResult(activity.rules ?? [], evidence) : undefined;
  const revision = current?.revisionId ? project.revisions[current.revisionId] : undefined;
  const canDecide = !!snapshotActivity && project.configuration.published && !currentStage?.exit && currentStage?.stageKey !== "offered";

  function upgradeWorkflow() {
    if (!current || !latestActivity) return;
    run(() => demoService().transact(jobId, saved => {
      const candidate = saved.candidates[current.id];
      const latestRevision = saved.liveRevisionId ? saved.revisions[saved.liveRevisionId] : undefined;
      if (!candidate || !latestRevision?.nodes.some(item => item.id === latestActivity.id)) throw new Error("Publish this activity before updating the candidate workflow.");
      candidate.revisionId = latestRevision.id;
      candidate.timeline.push({ id: crypto.randomUUID(), actor: "team", at: saved.clock, label: `Updated to published workflow v${latestRevision.number}; previous assignments retained` });
    }), "Candidate now uses the latest published workflow. Previous assignments are retained.");
  }

  return <section className="pipeline-candidates" aria-label="Pipeline candidates">
    {notice && <p className={`pipeline-candidates-notice${error ? " is-error" : ""}`} role={error ? "alert" : "status"}>{notice}</p>}
    {current ? <>
      <div className="pipeline-candidates-heading">
        <button type="button" onClick={() => setSelected(null)}>← Back to {stage?.title ?? "candidates"}</button>
        <span>{currentStage?.title ?? current.stageId} · {revision ? `Workflow v${revision.number}` : "Draft workflow"}</span>
      </div>
      {activity && <section className="pipeline-rule-decision" aria-label="Candidate rule decision">
        <h3>{activity.title}</h3>
        {!snapshotActivity ? <>
          <p>This activity is not in this candidate’s workflow.</p>
          {latestActivity ? <button type="button" onClick={upgradeWorkflow}>Use latest published workflow</button> : <p>Publish this activity before using it for this candidate.</p>}
        </> : <>
          <ul>{activity.rules?.filter(rule => rule.enabled).map(rule => <li key={rule.id}>{rule.field === "experience" ? `Minimum experience: ${rule.value} years` : `Required domain: ${rule.value}`}</li>)}</ul>
          <div className="pipeline-rule-evidence">
            {activity.rules?.some(rule => rule.enabled && rule.field === "domain") && <label>Verified domain<input aria-label="Verified candidate domain" value={domain} onChange={event => setDomain(event.target.value)} placeholder="From candidate evidence" /></label>}
            {activity.rules?.some(rule => rule.enabled && rule.field === "experience") && <label>Verified experience (years)<input aria-label="Verified candidate experience" type="number" min="0" step="0.5" value={experience} onChange={event => setExperience(event.target.value)} placeholder="From candidate evidence" /></label>}
          </div>
          <div className="pipeline-rule-result" role="status">
            <strong>{result?.result === "pass" ? "Requirements met" : result?.result === "fail" ? "Rule not met" : "Evidence needed"}</strong>
            {!!result?.reasons.length && <ul>{result.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>}
          </div>
          <div className="pipeline-candidates-actions">
            <button type="button" className="funnel-primary" disabled={!canDecide || result?.result !== "pass"} onClick={() => run(() => demoService().decide(jobId, current.id, activity.id, evidence, "continue"), "Candidate moved to the next stage.")}>Continue candidate</button>
            <button type="button" disabled={!canDecide || result?.result !== "fail"} onClick={() => run(() => demoService().decide(jobId, current.id, activity.id, evidence, "reject"), "Failure outcome confirmed. Candidate moved to Archive.")}>Confirm rejection</button>
          </div>
          {!project.configuration.published && <p>Publish the workflow before confirming a decision.</p>}
          {snapshot.filter(item => item.parent === activity.id && item.kind === "communication" && item.outcome === "failure" && item.active).map(message => <details key={message.id} className="pipeline-outcome-preview"><summary>Failure message · {message.title}</summary><strong>{message.subject}</strong><p>{message.body}</p></details>)}
        </>}
      </section>}
      <div className="pipeline-candidate-review hiring-workspace">
        <ReviewPanel key={current.id} jobId={jobId} project={project} ops={ops} run={run} initialCandidate={current.id} detailOnly />
      </div>
      {Object.values(project.assignments).filter(assignment => assignment.candidateId === current.id && assignment.answers).map(assignment => <details className="pipeline-trip-responses" key={assignment.id}>
        <summary>{assignment.title} · responses</summary>
        <dl>{Object.entries(assignment.answers ?? {}).map(([id, answer]) => {
          const question = assignment.tripSnapshot?.stages.flatMap(item => item.items).find(item => item.id === id);
          return <div key={id}><dt>{question?.prompt ?? id}</dt><dd>{answer}</dd></div>;
        })}</dl>
      </details>)}
    </> : <>
      <div className="pipeline-candidates-heading"><span>{filtered.length} candidates · {filtered.filter(candidate => needsDecision(candidate, project)).length} need a decision</span></div>
      <div className="pipeline-candidates-filters">
        <input aria-label="Search pipeline candidates" placeholder="Search name or email" value={query} onChange={event => setQuery(event.target.value)} />
      </div>
      <ul className="pipeline-candidate-list">{filtered.map(candidate => <li key={candidate.id}><button type="button" className="pipeline-candidate-row" aria-label={`Open candidate ${candidate.name}`} onClick={() => openCandidate(candidate.id)}>
        <span><strong>{candidate.name}</strong><span>{candidate.email}</span></span>
        <span>{candidateStageNode(items, candidate.stageId)?.title ?? candidate.stageId}<span>{reviewFor(candidate, ops).status}</span></span>
        <span>{candidate.tripStatus === "completed" ? "Trip completed" : candidate.tripStatus === "sent" ? "Trip in progress" : "No active trip"}<span className={needsDecision(candidate,project)?"pipeline-decision-badge":"pipeline-next-action"}>{candidateNextAction(candidate,project)}</span></span>
      </button></li>)}</ul>
      {!filtered.length && <p className="pipeline-candidates-empty">{candidates.length ? "No candidates match this view." : "No applications yet."}</p>}
    </>}
  </section>;
}
