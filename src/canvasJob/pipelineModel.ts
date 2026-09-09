import { DEFAULT_PIPELINE_STAGES, type PipelineBoard } from "../types";
import { node, visibleNodes, type FunnelNode } from "./funnelModel";

export type PipelineEdge = { id: string; source: string; target: string; label?: string; outcome?: FunnelNode["outcome"] };
export type HardRule = NonNullable<FunnelNode["rules"]>[number];
export type PipelineRule = HardRule;

function availableId(items: FunnelNode[], preferred: string): string {
  let id = preferred;
  let suffix = 2;
  while (items.some(item => item.id === id)) id = `${preferred}-${suffix++}`;
  return id;
}

/** Upgrade a draft only; callers keep published revisions as separate snapshots. */
export function migratePipeline(nodes: FunnelNode[], board: PipelineBoard): FunnelNode[] {
  const root = nodes.find(item => item.kind === "job");
  if (!root) return nodes;
  const existingStages = nodes.filter(item => item.kind === "stage");
  const migrated = nodes.map(item => {
    let next = { ...item };
    if (item.id === root.id) next.pipelineVersion = 2;
    if (item.capability === "assessments" && /^(?:Assessment studio|Assessments|Trips library)$/i.test(item.title)) next.title = "Trips library";
    if (item.kind === "communication" && /score.*threshold|threshold.*score/i.test(item.trigger)) {
      next.active = false;
      const note = "Legacy score trigger disabled; review explicit hard rules before enabling.";
      if (!next.description.includes(note)) next.description = [next.description, note].filter(Boolean).join("\n");
    }
    return next;
  });
  // A new scratch canvas remains just its existing role/tools until expansion is requested.
  if (!existingStages.length) return migrated;
  if (root.pipelineVersion === 2 && existingStages.some(item => item.stageKey)) return migrated;

  const prospects = migrated.find(item => item.kind === "stage" && item.id === "prospects");
  if (prospects) delete prospects.stageKey;
  const ordered: FunnelNode[] = prospects ? [prospects] : [];
  const definitions = [...DEFAULT_PIPELINE_STAGES];
  // Retain board-defined custom stages and their candidate keys.
  for (const stage of board.stages) {
    const existingNode = nodes.find(item => item.id === stage.id);
    if (existingNode && existingNode.kind !== "stage") continue;
    if (!definitions.some(value => value.id === stage.id)) definitions.splice(definitions.length - 1, 0, stage);
  }
  const used = new Set(ordered.map(item => item.id));
  for (const definition of definitions) {
    const label = board.stages.find(stage => stage.id === definition.id)?.label ?? definition.label;
    const legacyId = definition.id === "screened" ? "pipeline" : definition.id === "interviewing" ? "interview" : definition.id;
    let stage = migrated.find(item => item.kind === "stage" && !used.has(item.id) && (item.stageKey === definition.id || item.id === legacyId));
    if (!stage) {
      stage = node("stage", label, root.id, availableId(migrated, definition.id));
      migrated.push(stage);
    }
    stage.stageKey = definition.id;
    if (stage.id === "pipeline" && stage.title === "Pipeline") stage.title = label;
    if (stage.id === "interview" && stage.title === "Interview process") stage.title = label;
    if (definition.id === "archive") stage.exit = true;
    used.add(stage.id);
    ordered.push(stage);
  }
  const extraStages = migrated.filter(item => item.kind === "stage" && !used.has(item.id));
  const exitIndex = ordered.findIndex(item => item.exit);
  ordered.splice(exitIndex < 0 ? ordered.length : exitIndex, 0, ...extraStages);
  const applied = ordered.find(item => item.stageKey === "applied");
  const archive = ordered.find(item => item.exit);
  if (applied && archive && !migrated.some(item => item.parent === applied.id && item.rules?.length)) {
    const eligibility = node("round", "Eligibility review", applied.id, availableId(migrated, "eligibility-check"));
    eligibility.description = "Review candidate experience before deciding the outcome.";
    eligibility.rules = [{ id: "minimum-experience", field: "experience", operator: "less_than", value: "3", enabled: true }];
    eligibility.outcome = "success";
    migrated.push(eligibility);
    const message = node("communication", "Thank-you message", eligibility.id, availableId(migrated, "eligibility-thank-you"));
    message.outcome = "failure";
    message.destinationId = archive.id;
    message.trigger = "After hard-rule decision";
    message.subject = "An update on your application for {{job_title}}";
    message.body = "Hi {{candidate_name}},\n\nThank you for your interest and the time you spent applying. We will not be moving forward with your application for this role.\n\nThank you again.";
    message.description = "Review this message before confirming a failure outcome.";
    migrated.push(message);
  }
  // Stage order is represented by array order. Every original non-stage node stays intact.
  return [migrated.find(item => item.id === root.id)!, ...ordered, ...migrated.filter(item => item.id !== root.id && item.kind !== "stage")];
}

export function pipelineStages(nodes: FunnelNode[]): FunnelNode[] {
  return nodes.filter(item => item.kind === "stage");
}

export function pipelineVisibleNodes(nodes: FunnelNode[]): FunnelNode[] {
  return visibleNodes(nodes).filter(item => item.kind !== "capability");
}

export function insertPipelineStage(nodes: FunnelNode[], afterId: string, title: string): FunnelNode[] {
  const after = nodes.find(item => item.id === afterId);
  const root = nodes.find(item => item.kind === "job");
  if (!root || !after || !title.trim() || after.exit) return nodes;
  const stage = node("stage", title.trim(), root.id);
  stage.stageKey = stage.id;
  const index = nodes.findIndex(item => item.id === afterId);
  const ordered = pipelineStages(nodes).filter(n=>!n.exit);
  const nextStage = ordered[ordered.findIndex(n=>n.id===afterId)+1];
  const rewired=nodes.map(n=>nextStage && (n.destinationId===nextStage.id || n.destinationId===nextStage.stageKey) && candidateStageNode(nodes,n.id)?.id===afterId ? {...n,destinationId:stage.id}:n);
  return [...rewired.slice(0, index + 1), stage, ...rewired.slice(index + 1)];
}

export function reorderPipelineStage(nodes: FunnelNode[], id: string, direction: -1 | 1): FunnelNode[] {
  const stages = pipelineStages(nodes).filter(item => !item.exit);
  const index = stages.findIndex(item => item.id === id);
  const target = stages[index + direction];
  if (index < 0 || !target) return nodes;
  const from = nodes.findIndex(item => item.id === id);
  const to = nodes.findIndex(item => item.id === target.id);
  const reordered = [...nodes];
  [reordered[from], reordered[to]] = [reordered[to], reordered[from]];
  return reordered;
}

export function candidateStageNode(nodes: FunnelNode[], candidateStageId: string): FunnelNode | undefined {
  const explicit = nodes.find(item => item.kind === "stage" && item.stageKey === candidateStageId);
  if (explicit) return explicit;
  const byId = new Map(nodes.map(item => [item.id, item]));
  let current = byId.get(candidateStageId);
  const seen = new Set<string>();
  while (current && !seen.has(current.id)) {
    if (current.kind === "stage") return current;
    seen.add(current.id);
    current = current.parent ? byId.get(current.parent) : undefined;
  }
  const legacy = candidateStageId === "screened" ? "pipeline" : candidateStageId === "interviewing" ? "interview" : candidateStageId;
  return nodes.find(item => item.kind === "stage" && item.id === legacy);
}

export function layoutPipeline(nodes: FunnelNode[]) {
  const positions = new Map<string, { x: number; y: number }>();
  const root = nodes.find(item => item.kind === "job");
  if (root) positions.set(root.id, { x: 0, y: 0 });
  let y = root ? 300 : 0;
  const placed = new Set<string>();
  function activities(parent: FunnelNode, depth: number) {
    const children = nodes.filter(item => item.parent === parent.id && item.kind !== "stage" && item.kind !== "capability");
    let messageRow = positions.get(parent.id)?.y ?? y;
    for (const child of children.filter(item => item.kind !== "communication")) {
      if (placed.has(child.id)) continue;
      placed.add(child.id);
      positions.set(child.id, { x: 0, y });
      y += 230;
      activities(child, depth + 1);
    }
    for (const child of children.filter(item => item.kind === "communication")) {
      if (placed.has(child.id)) continue;
      placed.add(child.id);
      positions.set(child.id, { x: 370, y: messageRow });
      messageRow += 230;
      activities(child, depth + 1);
    }
    y = Math.max(y, messageRow);
  }
  if (root) activities(root, 0);
  for (const stage of pipelineStages(nodes).filter(item => !item.exit)) {
    placed.add(stage.id);
    positions.set(stage.id, { x: 0, y });
    y += 230;
    activities(stage, 0);
  }
  let exitY = 230;
  for (const stage of pipelineStages(nodes).filter(item => item.exit)) {
    positions.set(stage.id, { x: 650, y: exitY });
    exitY += 230;
    activities(stage, 0);
  }
  // Explicit drag coordinates win, with unpositioned descendants following parent movement.
  const resolved = new Map<string, { x: number; y: number }>();
  const resolving = new Set<string>();
  function resolve(item: FunnelNode): { x: number; y: number } {
    const fallback = positions.get(item.id) ?? { x: 50, y };
    if (resolved.has(item.id)) return resolved.get(item.id)!;
    if (resolving.has(item.id)) return fallback;
    resolving.add(item.id);
    let position = fallback;
    if (item.position && Number.isFinite(item.position.x) && Number.isFinite(item.position.y)) position = { ...item.position };
    else {
      const parent = nodes.find(value => value.id === item.parent);
      if (parent) {
        const parentPosition = resolve(parent);
        const parentDefault = positions.get(parent.id) ?? { x: 0, y: 0 };
        position = { x: fallback.x + parentPosition.x - parentDefault.x, y: fallback.y + parentPosition.y - parentDefault.y };
      }
    }
    resolving.delete(item.id);
    resolved.set(item.id, position);
    return position;
  }
  return pipelineVisibleNodes(nodes).map(item => ({ ...item, position: resolve(item) }));
}

export function buildPipelineEdges(nodes: FunnelNode[]): PipelineEdge[] {
  const allVisible = pipelineVisibleNodes(nodes);
  const visible = allVisible.filter(n=>!n.manual);
  const visibleIds = new Set(allVisible.map(item => item.id));
  const stages = pipelineStages(visible).filter(item => !item.exit);
  const archive = pipelineStages(visible).find(item => item.exit);
  const edges: PipelineEdge[] = [];
  function connect(source: string, target: string | undefined, outcome?: FunnelNode["outcome"]) {
    if (!target || source === target || !visibleIds.has(source) || !visibleIds.has(target)) return;
    const id = `${source}->${target}`;
    if (!edges.some(edge => edge.id === id)) edges.push({ id, source, target, ...(outcome ? { outcome, label: outcome === "success" ? "Requirements met" : outcome === "failure" ? "Rule not met" : "On this step" } : {}) });
  }
  function descendants(parent: string, seen = new Set<string>()): FunnelNode[] {
    if (seen.has(parent)) return [];
    seen.add(parent);
    return visible.filter(item => item.parent === parent && item.kind !== "stage" && item.kind !== "communication" && item.outcome !== "failure")
      .flatMap(item => [item, ...descendants(item.id, seen)]);
  }
  const root = visible.find(item => item.kind === "job");
  if (root) connect(root.id, stages[0]?.id);
  stages.forEach((stage, index) => {
    const path = [stage, ...descendants(stage.id)];
    path.forEach((item, step) => connect(item.id, item.destinationId ?? path[step + 1]?.id ?? stages[index + 1]?.id, item.outcome ?? (item.rules?.some(rule => rule.enabled) ? "success" : undefined)));
  });
  for (const activity of visible.filter(item => item.kind === "communication" || item.outcome === "failure")) {
    if (activity.parent) connect(activity.parent, activity.id, activity.outcome ?? "always");
    connect(activity.id, activity.destinationId ?? (activity.outcome === "failure" ? archive?.id : undefined), activity.outcome);
  }
  const hidden=new Set(root?.hiddenConnections||[]);
  const result=edges.filter(e=>!hidden.has(e.id));
  for(const link of root?.canvasConnections||[]){if(visibleIds.has(link.source)&&visibleIds.has(link.target)&&!result.some(e=>e.source===link.source&&e.target===link.target))result.push({id:`${link.source}->${link.target}`,source:link.source,target:link.target});}
  return result;
}

export function hardRuleResult(rules: HardRule[], evidence: { domain?: string; experience?: number | string }): { result: "pass" | "fail" | "review"; reasons: string[] } {
  const reasons: string[] = [];
  let failed = false;
  let review = false;
  for (const rule of rules.filter(item => item.enabled)) {
    if (rule.field === "domain" && rule.operator === "not_contains" && rule.value.trim()) {
      if (!evidence.domain?.trim() || /^(?:unknown|unclear|unspecified|n\/a|not provided)$/i.test(evidence.domain.trim())) { review = true; reasons.push("Domain evidence is missing or ambiguous; review required."); }
      else if (!evidence.domain.toLowerCase().includes(rule.value.trim().toLowerCase())) { failed = true; reasons.push(`Domain does not include ${rule.value.trim()}.`); }
    } else if (rule.field === "experience" && rule.operator === "less_than" && rule.value.trim() && Number.isFinite(Number(rule.value)) && Number(rule.value) >= 0) {
      const raw = evidence.experience;
      const years = raw === undefined || (typeof raw === "string" && !raw.trim()) ? NaN : Number(raw);
      if (!Number.isFinite(years) || years < 0) { review = true; reasons.push("Experience evidence is missing or ambiguous; review required."); }
      else if (years < Number(rule.value)) { failed = true; reasons.push(`Experience is below ${rule.value} years.`); }
    } else { review = true; reasons.push("Rule configuration needs review."); }
  }
  return { result: failed ? "fail" : review ? "review" : "pass", reasons };
}
