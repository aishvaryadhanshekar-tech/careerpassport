import type { JobDraft } from "../types";
import { publishErrors, type FunnelNode } from "./funnelModel";

/** Scripted whole-canvas demo only: never creates nodes or changes role fields. */
export function globalDemoReply(prompt: string, items: FunnelNode[], draft: JobDraft): string {
  const role = draft.fields.designation.value.trim();
  const stages = items.filter(n => n.kind === "stage");
  const rounds = items.filter(n => n.kind === "round");
  const context = `${role ? `For ${role}, the` : "The"} whole canvas has ${items.length} ${items.length === 1 ? "node" : "nodes"}, ${stages.length} hiring ${stages.length === 1 ? "stage" : "stages"} and ${rounds.length} interview ${rounds.length === 1 ? "round" : "rounds"}.`;
  if (/\b(?:build|create|generate|add|set up|setup|plan)\b[\s\S]*\b(?:pipeline|journey|funnel|stages|process)\b/i.test(prompt)) {
    const design = /design/i.test(`${role} ${prompt}`);
    return `Suggested pipeline:\n1. Prospects and an application form\n2. ${design ? "Portfolio walkthrough" : "Skills assessment"}\n3. ${design ? "Design review" : "Technical conversation"}\n4. Team conversation`;
  }
  if (/\b(?:review|audit|check|evaluate)\b|what(?:'s| is) missing|ready to publish/i.test(prompt)) {
    const missing = publishErrors(draft);
    return `${context}\n\n${missing.length ? `The required role fields still missing are: ${missing.join(", ")}.` : "The required role fields are filled in."} ${stages.length ? `Existing stages: ${stages.map(n => n.title).join(", ")}.` : "There are no hiring stages on the canvas yet."}`;
  }
  if (/\b(?:role|hiring|hire|engineer|manager|designer|recruiter|analyst|founder|scientist|consultant|director)\b/i.test(prompt)) {
    return `To outline ${role || "the role"}, share the location, experience level and must-have skills.`;
  }
  return `Choose Describe role, Build pipeline or Review workflow.`;
}
