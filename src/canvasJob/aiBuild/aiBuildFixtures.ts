import { DEMO_ROLES } from "../../demo/fixtures";
import {
  designerApplication,
  designerPipeline,
  isSeniorProductDesigner,
  newJobDraft,
} from "../../demo/seniorProductDesigner";
import { splitPoints, joinPoints } from "../../formControlUtils";
import { withPreview, withRoleProfile } from "../../roleProfile/hydrate";
import { seedApplication } from "../../seedApplication";
import type { CoverageId, Currency, EvaluationCriterion, JobDraft } from "../../types";
import { node, templateFunnel, type FunnelNode, type InsightKey } from "../funnelModel";
import {
  BRIEF_HUB_ID,
  type PipelineScope,
  type ProfileProposal,
  type StageProposal,
} from "./buildPhase";
import { readWhere } from "./intake";

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

// ---------------------------------------------------------------------------------------------
// Reading facts out of the prompt or a pasted JD
// ---------------------------------------------------------------------------------------------

const CITIES = [
  "Bengaluru", "Bangalore", "Mumbai", "Delhi NCR", "New Delhi", "Delhi", "Gurugram", "Gurgaon", "Noida",
  "Hyderabad", "Pune", "Chennai", "Kolkata", "Ahmedabad", "Jaipur", "Kochi", "Chandigarh", "Indore",
  "London", "Berlin", "Amsterdam", "Dublin", "Paris", "Lisbon", "Singapore", "Dubai", "New York",
  "San Francisco", "Seattle", "Austin", "Toronto", "Sydney", "Melbourne", "Tokyo",
];
const CITY_PATTERN = new RegExp(`\\b(${CITIES.map((city) => city.replace(/ /g, "\\s+")).join("|")})\\b`, "i");
const YEARS_PATTERN = /(\d{1,2})\s*(?:(?:[-–—]|to)\s*(\d{1,2}))?\s*(\+)?\s*(?:years?|yrs?)\b/i;
const LAKH_PATTERN = /₹?\s*(\d{1,3})\s*(?:[-–—]|to)\s*(\d{1,3})\s*(?:L\b|LPA\b|lakhs?\b)/i;
const MUST_HEADINGS = /looking for|requirements|must[- ]haves?|qualifications|what you(?:'|’)ll need|you have/i;

export type PromptFacts = {
  fields: Partial<Record<CoverageId, string>>;
  salaryCurrency?: Currency;
};

/** `**Location:** Bengaluru · Hybrid` → "Bengaluru · Hybrid". */
function labelledLine(text: string, label: RegExp): string | undefined {
  for (const line of text.split("\n")) {
    const plain = line.replace(/\*/g, "").replace(/^[\s>#-]+/, "").trim();
    const match = /^([A-Za-z ]+):\s*(.+)$/.exec(plain);
    if (match && label.test(match[1])) return match[2].trim();
  }
  return undefined;
}

function readYears(text: string): string | undefined {
  const match = YEARS_PATTERN.exec(text);
  if (!match) return undefined;
  if (match[2]) return `${match[1]}–${match[2]}`;
  return match[3] ? `${match[1]}+` : match[1];
}

function readCity(text: string): string | undefined {
  const match = CITY_PATTERN.exec(text);
  return match ? titleCase(match[1].replace(/\s+/g, " ")).replace("Ncr", "NCR") : undefined;
}

/** Bullets under a "What we're looking for"-style heading of a markdown JD. */
function readMustHaves(text: string): string | undefined {
  const lines = text.split("\n");
  const points: string[] = [];
  let inside = false;
  for (const line of lines) {
    const heading = /^#{1,6}\s+(.*)$/.exec(line.trim());
    if (heading) {
      if (inside) break;
      inside = MUST_HEADINGS.test(heading[1]) && !/nice/i.test(heading[1]);
      continue;
    }
    const bullet = inside && /^[-*•]\s+(.*)$/.exec(line.trim());
    if (bullet) points.push(bullet[1].trim());
  }
  return points.length ? joinPoints(points) : undefined;
}

/** What the person typed or pasted: location, work mode, experience, CTC and a JD's must-haves. */
export function readPromptFacts(prompt: string): PromptFacts {
  const text = prompt.trim();
  const facts: PromptFacts = { fields: {} };
  if (!text) return facts;

  // A JD's labelled lines are the most reliable; the free text is the fallback.
  const locationLine = labelledLine(text, /^(?:location|based|office|work ?mode)$/i);
  const where = readWhere((locationLine ?? text).replace(/\([^)]*\)/g, " "));
  const location = locationLine ? (where.location ? readCity(where.location) ?? where.location : undefined) : readCity(text);
  if (location) facts.fields.location = location;
  if (where.workMode) facts.fields.workMode = where.workMode;

  const years = readYears(labelledLine(text, /^(?:experience|years)$/i) ?? text);
  if (years) facts.fields.experienceYears = years;

  const salary = LAKH_PATTERN.exec(labelledLine(text, /^(?:compensation|ctc|salary|budget)$/i) ?? text);
  if (salary) {
    facts.fields.salary = `${salary[1]}–${salary[2]}L`;
    facts.salaryCurrency = "INR";
  }

  const musts = readMustHaves(text);
  if (musts) facts.fields.mustHaves = musts;
  return facts;
}

// ---------------------------------------------------------------------------------------------
// Merging
// ---------------------------------------------------------------------------------------------

function filled(value: string): boolean {
  return value.trim() !== "";
}

/**
 * Fixture basis < the draft's own values < facts typed in the prompt < anything the person
 * already owns in the draft. The application is re-seeded from the merged fields.
 */
function mergeDraft(role: string, draft: JobDraft, prompt: string): JobDraft {
  const basis = newJobDraft(role);
  const facts = readPromptFacts(prompt);

  const fields = { ...basis.fields };
  for (const key of Object.keys(draft.fields) as CoverageId[]) {
    if (filled(draft.fields[key].value)) fields[key] = draft.fields[key];
  }
  for (const [key, value] of Object.entries(facts.fields) as [CoverageId, string][]) {
    const own = draft.fields[key];
    if (own.source === "user" && filled(own.value)) continue;
    fields[key] = { value, source: "user" };
  }

  const flags = { ...basis.flags };
  for (const key of Object.keys(flags) as (keyof typeof flags)[]) flags[key] = draft.flags[key] || basis.flags[key];

  const preview = { ...basis.preview };
  for (const key of Object.keys(preview) as (keyof typeof preview)[]) {
    if (filled(draft.preview[key])) preview[key] = draft.preview[key];
  }

  const own = draft.roleProfile;
  const roleProfile = {
    headline: filled(own.headline.value) ? own.headline : basis.roleProfile.headline,
    portrait: filled(own.portrait.value) ? own.portrait : basis.roleProfile.portrait,
    department: filled(own.department.value) ? own.department : basis.roleProfile.department,
    avoidLookalikes: filled(own.avoidLookalikes) ? own.avoidLookalikes : basis.roleProfile.avoidLookalikes,
    evaluationFramework: own.evaluationFramework.length ? own.evaluationFramework : basis.roleProfile.evaluationFramework,
  };

  const merged: JobDraft = {
    ...basis,
    ...draft,
    fields,
    flags,
    preview,
    roleProfile,
    salaryCurrency: facts.salaryCurrency ?? draft.salaryCurrency ?? basis.salaryCurrency,
    salaryPeriod: draft.salaryCurrency ? draft.salaryPeriod : basis.salaryPeriod,
    flagsPromptShown: draft.flagsPromptShown || basis.flagsPromptShown,
    transcript: prompt.trim() || draft.transcript.trim() || basis.transcript,
    trips: draft.trips.length ? draft.trips : basis.trips,
    analysedOnce: true,
  };

  const ownsApplication =
    draft.application &&
    (draft.application.context.company.source === "user" || draft.application.context.role.source === "user");
  merged.application = ownsApplication
    ? draft.application
    : isSeniorProductDesigner(role)
      ? designerApplication(merged)
      : seedApplication(merged);
  return merged;
}

// ---------------------------------------------------------------------------------------------
// Role brief
// ---------------------------------------------------------------------------------------------

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
  const years = draft.fields.experienceYears.value.trim();
  switch (key) {
    case "hub":
      return (
        [
          draft.fields.designation.value.trim(),
          draft.fields.location.value.trim(),
          draft.fields.workMode.value.trim(),
          years ? `${years} yrs` : "",
        ]
          .filter(Boolean)
          .join(" · ") || "Drafted from your brief. Review each section, then generate the pipeline."
      );
    case "summary":
      return (
        [draft.roleProfile.headline.value, draft.fields.location.value, draft.fields.workMode.value, years ? `${years} yrs` : ""]
          .filter(Boolean)
          .join(" · ") || "Headline, location and work mode"
      );
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
  return {
    ...node("insight", "Role brief", "job", BRIEF_HUB_ID),
    insightKey: "hub",
    description: "Summary, requirements, sourcing and evaluation — drafted from what you shared.",
  };
}

/** The Role brief is one card: the hub plus the draft behind its four sections. */
export function buildProfileProposal(prompt: string, draft: JobDraft): ProfileProposal {
  const role = inferRole(prompt, draft);
  // The same derivation the Role Profile step runs, so the brief matches what step 2 would show.
  const next = withRoleProfile(withPreview(mergeDraft(role, draft, prompt)));
  const hub = { ...briefHub(), description: insightSummary("hub", next) };
  return { role, criteria: next.roleProfile.evaluationFramework, hub, draft: next };
}

// ---------------------------------------------------------------------------------------------
// Pipeline proposals
// ---------------------------------------------------------------------------------------------

type StageSource = {
  proposal: StageProposal;
  /** The stage node itself first, then everything that hangs beneath it. */
  nodes: FunnelNode[];
};

/** Designer roles: the realistic loop, with the same stable stage and `ai-round-N` ids. */
function designerSources(): StageSource[] {
  const loop = designerPipeline((index) => `ai-round-${index}`, "ai");
  return [
    {
      proposal: {
        id: "prospects",
        title: "Prospects",
        detail: "Sourced and inbound designers, with an application-received email.",
        included: true,
      },
      nodes: loop.prospects,
    },
    {
      proposal: {
        id: "application",
        title: "Application form",
        detail: "Portfolio, an in-depth case study, design systems experience, tools and logistics.",
        included: true,
        required: true,
      },
      nodes: [loop.application],
    },
    {
      proposal: {
        id: "pipeline",
        title: "Portfolio screen",
        detail: "Two case studies with short notes, reviewed by a senior designer within 5 days, with a reminder.",
        included: true,
      },
      nodes: loop.pipeline,
    },
    {
      proposal: {
        id: "interview",
        title: "Interview process",
        detail: "Five rounds over about two weeks, scored on one shared rubric.",
        included: true,
      },
      nodes: [loop.interview],
    },
    ...loop.rounds.map((round) => ({
      proposal: { id: round.id, title: round.title, detail: round.detail, included: true },
      nodes: round.nodes,
    })),
  ];
}

function templateSources(role: string): StageSource[] {
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

/** Stage ids stay stable across runs so re-proposing never duplicates a stage. */
function stageSources(role: string): StageSource[] {
  return isSeniorProductDesigner(role) ? designerSources() : templateSources(role);
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
    const questions = draft.application?.items.filter((item) => item.kind === "question").length ?? 0;
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
