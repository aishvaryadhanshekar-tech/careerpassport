import { demoDraft, DEMO_ROLES } from "../../demo/fixtures";
import { splitPoints } from "../../formControlUtils";
import { withPreview, withRoleProfile } from "../../roleProfile/hydrate";
import type { EvaluationCriterion, JobDraft } from "../../types";
import { node, templateFunnel, type FunnelNode, type InsightKey } from "../funnelModel";
import {
  BRIEF_HUB_ID,
  BRIEF_SECTIONS,
  type PipelineScope,
  type ProfileProposal,
  type StageProposal,
} from "./buildPhase";

const DEFAULT_ROLE = DEMO_ROLES[0];

const ROLE_PATTERN =
  /\b(senior|junior|lead|staff|principal)?\s*(product|software|backend|front[- ]?end|full[- ]?stack|data|design)?\s*(designer|engineer|developer|manager|analyst|recruiter)\b/i;

function titleCase(text: string): string {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function inferRole(prompt: string, draft: JobDraft): string {
  const existing = draft.fields.designation.value.trim();
  if (existing) return existing;
  const match = ROLE_PATTERN.exec(prompt);
  if (!match) return DEFAULT_ROLE;
  const words = [match[1], match[2], match[3]].filter(Boolean).join(" ");
  return titleCase(words.replace(/front\s?end/i, "Frontend").replace(/full\s?stack/i, "Full-stack"));
}

/** The person's own typed input always beats fixture data. */
function mergeDraft(role: string, draft: JobDraft): JobDraft {
  const basis = demoDraft(role);
  const fields = { ...basis.fields };
  for (const key of Object.keys(draft.fields) as (keyof JobDraft["fields"])[]) {
    const own = draft.fields[key];
    if (own.value.trim()) fields[key] = own;
  }
  return {
    ...basis,
    ...draft,
    fields,
    transcript: draft.transcript.trim() || basis.transcript,
    application: draft.application ?? basis.application,
    analysedOnce: true,
  };
}

function criteriaSummary(criteria: EvaluationCriterion[]): string {
  const labels = criteria.slice(0, 3).map((criterion) => criterion.label);
  const rest = criteria.length - labels.length;
  return rest > 0 ? `${labels.join(" · ")} +${rest} more` : labels.join(" · ");
}

function firstPoints(value: string, count: number): string {
  return splitPoints(value).slice(0, count).join(", ");
}

/** One-line card copy for a Role brief node, read from the live draft so edits show on the canvas. */
export function insightSummary(key: InsightKey, draft: JobDraft): string {
  switch (key) {
    case "hub":
      return "Drafted from your brief. Review each section, then generate the pipeline.";
    case "summary": {
      const years = draft.fields.experienceYears.value;
      return (
        [
          draft.roleProfile.headline.value,
          draft.fields.location.value,
          draft.fields.workMode.value,
          years ? `${years} yrs` : "",
        ]
          .filter(Boolean)
          .join(" · ") || "Headline, location and work mode"
      );
    }
    case "requirements": {
      const musts = splitPoints(draft.fields.mustHaves.value).length;
      return (
        [musts ? `${musts} must-haves` : "", firstPoints(draft.preview.expectedSkills, 2)]
          .filter(Boolean)
          .join(" · ") || "Must-haves and expected skills"
      );
    }
    case "sourcing": {
      const companies = firstPoints(draft.preview.targetCompanies, 2);
      return (
        [companies ? `Target: ${companies}` : "", firstPoints(draft.preview.industrySectors, 2)]
          .filter(Boolean)
          .join(" · ") || "Target companies and sectors"
      );
    }
    case "evaluation": {
      const criteria = draft.roleProfile.evaluationFramework;
      return criteria.length ? `${criteria.length} criteria — ${criteriaSummary(criteria)}` : "No criteria yet";
    }
  }
}

/** Not "stage": a stage on the canvas makes migratePipeline expand the whole default pipeline. */
export function briefHub(): FunnelNode {
  return { ...node("insight", "Role brief", "job", BRIEF_HUB_ID), insightKey: "hub" };
}

export function buildProfileProposal(prompt: string, draft: JobDraft): ProfileProposal {
  const role = inferRole(prompt, draft);
  // The same derivation the Role Profile step runs, so the brief matches what step 2 would show.
  const next = withRoleProfile(withPreview(mergeDraft(role, draft)));
  const hub = { ...briefHub(), description: insightSummary("hub", next) };
  const sections = BRIEF_SECTIONS.map((section) => ({
    ...node("insight", section.title, BRIEF_HUB_ID, section.id),
    insightKey: section.key,
    description: insightSummary(section.key, next),
  }));
  return { role, criteria: next.roleProfile.evaluationFramework, hub, sections, draft: next };
}

type StageSource = {
  proposal: StageProposal;
  /** The stage node itself first, then everything that hangs beneath it. */
  nodes: FunnelNode[];
};

/** Stage ids stay stable across runs so re-proposing never duplicates a stage. */
function stageSources(role: string): StageSource[] {
  const template = templateFunnel(role);
  const rounds = template.filter((item) => item.kind === "round");
  const roundIds = new Map(rounds.map((round, index) => [round.id, `ai-round-${index + 1}`]));
  const retitled = template.map((item) => ({
    ...item,
    id: roundIds.get(item.id) ?? item.id,
    parent: item.parent && roundIds.has(item.parent) ? roundIds.get(item.parent)! : item.parent,
  }));
  const find = (id: string) => retitled.find((item) => item.id === id)!;
  const childrenOf = (id: string) => retitled.filter((item) => item.parent === id);

  const sources: StageSource[] = [
    {
      proposal: {
        id: "prospects",
        title: "Prospects",
        detail: "Where sourced and applied candidates land before screening.",
        included: true,
      },
      nodes: [find("prospects")],
    },
    {
      proposal: {
        id: "application",
        title: "Application form",
        detail: "The questions every applicant answers, tailored to the role.",
        included: true,
        required: true,
      },
      nodes: [find("application")],
    },
    {
      proposal: {
        id: "pipeline",
        title: "Pipeline",
        detail: "Screening and the first work sample, with reminders.",
        included: true,
      },
      nodes: [find("pipeline"), ...childrenOf("pipeline")],
    },
    {
      proposal: {
        id: "interview",
        title: "Interview process",
        detail: "The container for every interview round.",
        included: true,
      },
      nodes: [find("interview")],
    },
  ];

  for (const round of rounds) {
    const id = roundIds.get(round.id)!;
    sources.push({
      proposal: {
        id,
        title: round.title,
        detail: "Interview round with its work sample and invitation email.",
        included: true,
      },
      nodes: [find(id), ...childrenOf(id)],
    });
  }
  return sources;
}

export function proposeStages(role: string, scope: PipelineScope): StageProposal[] {
  const sources = stageSources(role);
  const upToApplication = scope === "application";
  return sources
    .filter((source) => !upToApplication || source.proposal.id === "prospects" || source.proposal.id === "application")
    .map((source) => ({ ...source.proposal }));
}

export function stageNodesFor(
  proposals: StageProposal[],
  role: string,
  draft: JobDraft,
): FunnelNode[] {
  const sources = stageSources(role);
  const byId = new Map(sources.map((source) => [source.proposal.id, source]));
  const included = proposals.filter((proposal) => proposal.included);
  const keep = new Map<string, StageSource>();

  for (const proposal of included) {
    const source = byId.get(proposal.id);
    if (!source) continue;
    keep.set(proposal.id, {
      proposal,
      nodes: source.nodes.map((item, index) =>
        index === 0 ? { ...item, title: proposal.title.trim() || item.title } : { ...item },
      ),
    });
  }

  // A round without its "Interview process" parent would orphan the branch.
  for (const proposal of included) {
    let parent = byId.get(proposal.id)?.nodes[0]?.parent;
    while (parent && parent !== "job" && !keep.has(parent)) {
      const ancestor = byId.get(parent);
      if (!ancestor) break;
      keep.set(parent, { proposal: ancestor.proposal, nodes: ancestor.nodes.map((item) => ({ ...item })) });
      parent = ancestor.nodes[0].parent;
    }
  }

  const ordered = sources.filter((source) => keep.has(source.proposal.id));
  const nodes = ordered.flatMap((source) => keep.get(source.proposal.id)!.nodes);

  const application = nodes.find((item) => item.kind === "application");
  if (application) {
    const questions = draft.application?.items.length ?? 0;
    application.description = questions
      ? `${questions} questions drafted from the role brief.`
      : "Applicant questions drafted from the role brief.";
  }
  const requirements = splitPoints(draft.fields.mustHaves.value).length;
  const prospects = nodes.find((item) => item.id === "prospects");
  if (prospects && requirements) {
    prospects.description = `Screened against ${requirements} must-haves.`;
  }
  return nodes;
}
