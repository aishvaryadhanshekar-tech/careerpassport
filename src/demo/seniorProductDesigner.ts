import { defaultStandardFields } from "../applicationCatalog";
import { node, type FunnelNode } from "../canvasJob/funnelModel";
import { joinPoints, joinTags } from "../formControlUtils";
import {
  createDraft,
  type ApplicationConfig,
  type ApplicationItem,
  type CoverageId,
  type EvaluationCriterion,
  type JobDraft,
  type StandardField,
} from "../types";
import { demoDraft, demoNodes } from "./fixtures";

/**
 * Deep, realistic data for new Senior Product Designer jobs (Build with AI and the template).
 * One consistent story everywhere: a Bengaluru B2B SaaS product company, hybrid three days a
 * week, 6–9 years, ₹38–55L. The demo scenario keeps using `demoDraft` / `demoNodes` directly
 * and is unaffected.
 */
export const SPD_ROLE = "Senior Product Designer";

/** Any product, UX or UI designer title gets the deep dataset. */
export function isSeniorProductDesigner(role: string): boolean {
  return /\b(?:product|ux|ui(?:\s*\/\s*ux)?|interaction)\s+designer\b/i.test(role);
}

// ---------------------------------------------------------------------------------------------
// Role fields
// ---------------------------------------------------------------------------------------------

const TRANSCRIPT =
  "We're hiring a Senior Product Designer for our Bengaluru team — hybrid, three days a week in " +
  "the Indiranagar office. Six to nine years of product design, and at least three of those on " +
  "complex B2B or SaaS workflows: approvals, permissions, dense data tables, the unglamorous stuff. " +
  "Budget is thirty-eight to fifty-five lakhs fixed, plus ESOPs. This is a new position — they'll own " +
  "our invoicing and approvals surface end to end and help us grow the design system. I want to see " +
  "shipped case studies that go from problem framing to measurable outcomes, not Dribbble shots. " +
  "They have to be strong in Figma, comfortable prototyping, and able to hold their own with PMs and " +
  "engineers on trade-offs. Heavy AI-tool users are a plus.";

/** Also the mock JD's "What we're looking for" list, so a pasted JD and the dataset agree word for word. */
export const SPD_MUST_HAVES: readonly string[] = [
  "6+ years of product design, with at least 3 years designing complex B2B / SaaS workflows (approvals, permissions, data-dense tables, multi-step setup)",
  "A portfolio with 2+ end-to-end shipped case studies that show problem framing, their own decisions and trade-offs, and measurable outcomes",
  "Systems thinking: has built or meaningfully evolved a design system — components, tokens, documentation and adoption",
  "Strong interaction and visual craft in Figma, including auto layout, variants, variables and high-fidelity interactive prototypes",
  "Research-informed decisions: plans and runs usability tests and interviews, and uses product analytics to validate outcomes",
  "Partners closely with PM and Engineering on scope and trade-offs, with clean, annotated dev handoff and QA of what ships",
  "Clear written and verbal communication — frames design rationale crisply and gives and receives critique well",
];

const DISQUALIFIER =
  "No shipped product work — only concepts, agency pitches or redesign exercises; or no hands-on " +
  "craft in the last two years (purely managing designers or only running research).";

const RED_FLAGS = [
  "Portfolio shows final screens only, with no problem statement, constraints, trade-offs or outcome",
  "Cannot separate their own contribution from the team's in a case study, even when asked directly",
  "Treats accessibility, edge cases, empty and error states as something engineering will figure out",
  "Talks about stakeholders as obstacles; no example of changing a PM's or engineer's mind with evidence",
  "Four or more moves in five years with nothing shipped at any of them",
];

const SEARCH_STRATEGY =
  "Start with design teams at Bengaluru B2B SaaS, fintech and developer-tool companies that ship " +
  "workflow-heavy products — Razorpay, Freshworks, Postman, Atlassian, Chargebee, BrowserStack and Zeta. " +
  "Look for designers 2–4 years into their current role who own a surface end to end and have " +
  "contributed to a design system. Expand to consumer fintech (CRED, Groww) and commerce platforms " +
  "(Swiggy, Meesho) for craft, and to Pune, Hyderabad and Chennai for candidates open to relocating. " +
  "Signals that matter more than logos: shipped case studies with outcomes, design-system contributions, " +
  "and talks or writing on complex workflows. Avoid agency-only profiles.";

const EVALUATION_TEXT =
  "Weight problem framing and craft most heavily: can they turn an ambiguous B2B workflow into a clear, " +
  "shippable design, and is the interaction and visual quality senior? Then design-systems depth, " +
  "research and data use, and how they influence PM and Engineering on trade-offs. Communication and " +
  "critique are assessed in every round.";

const FIELD_VALUES: Record<CoverageId, string> = {
  designation: SPD_ROLE,
  experienceYears: "6–9",
  location: "Bengaluru",
  workMode: "Hybrid",
  salary: "38–55L",
  industryType: "B2B SaaS",
  companyType: "Product",
  experienceType: "Full-time",
  mustHaves: joinPoints([...SPD_MUST_HAVES]),
  disqualifier: DISQUALIFIER,
  redFlags: joinPoints(RED_FLAGS),
  searchStrategy: SEARCH_STRATEGY,
  evaluationCriteria: EVALUATION_TEXT,
};

// ---------------------------------------------------------------------------------------------
// Job preview and role profile
// ---------------------------------------------------------------------------------------------

const IDEAL_CANDIDATE =
  "A senior individual contributor with six to nine years of product design, most recently owning a " +
  "complex B2B surface end to end — the kind with approval chains, role-based permissions and tables " +
  "that hold thousands of rows. They frame the problem before opening Figma, bring research and product " +
  "data into every decision, and can show two or three shipped case studies where the outcome moved a " +
  "metric. Their craft is sharp at both the interaction and visual level, they think in systems and " +
  "have contributed components and tokens back to a design system, and PMs and engineers seek them out " +
  "because they make trade-off conversations faster, not slower.";

const EXPECTED_SKILLS = [
  "Figma (advanced: auto layout, variants, variables)",
  "Design systems and design tokens",
  "Interaction design",
  "High-fidelity prototyping",
  "Usability testing",
  "User interviews and synthesis",
  "Information architecture",
  "Data-informed design (Mixpanel / Amplitude)",
  "Accessibility (WCAG 2.1 AA)",
  "B2B workflow and data-dense UI design",
  "Stakeholder workshops and facilitation",
  "Design critique",
  "Dev handoff and design QA",
  "UX writing and content design",
  "AI-assisted design workflows",
];

const TARGET_COMPANIES = [
  "Razorpay",
  "Freshworks",
  "Postman",
  "Atlassian",
  "CRED",
  "Swiggy",
  "Zeta",
  "BrowserStack",
  "Chargebee",
  "Groww",
  "Meesho",
  "Zoho",
];

const INDUSTRY_SECTORS = [
  "B2B SaaS",
  "Fintech",
  "Developer tools",
  "Commerce enablement",
  "Payments infrastructure",
  "Enterprise productivity",
];

const PORTRAIT =
  "Six to nine years designing digital products, with at least three on complex B2B or SaaS workflows. " +
  "Has owned a product area from discovery through release — scoping with PM, testing with real users, " +
  "sweating the empty, error and permission states, and following the work into production to measure " +
  "whether it landed. Works fluently in Figma with components, variables and prototypes, and has helped " +
  "build or evolve a design system that other designers actually adopt. Comfortable presenting to " +
  "leadership, running critique and mentoring mid-level designers, while staying hands-on every day.";

const AVOID_LOOKALIKES = [
  "Visual or graphic designers with strong aesthetics but no ownership of product problems or outcomes",
  "Agency-only UI designers who hand off screens and never see what ships or how it performs",
  "UX researchers who run studies but lack interaction and visual craft in Figma",
  "Consumer-app designers whose work is marketing flows and landing pages, never dense B2B workflows",
  "Design managers who have not designed hands-on in the last two years",
  "Front-end developers who design on the side, without research or product framing",
];

const GRADES = ["Weak", "Adequate", "Strong"];

const EVALUATION_FRAMEWORK: EvaluationCriterion[] = [
  {
    id: "eval-spd-portfolio",
    label: "Portfolio with 2+ shipped, end-to-end B2B case studies (problem → decisions → outcome)",
    type: "must_have",
    importance: "critical",
  },
  {
    id: "eval-spd-years",
    label: "Years of product design experience",
    type: "number_threshold",
    importance: "critical",
    comparator: "≥",
    target: "6",
    unit: "years",
  },
  {
    id: "eval-spd-craft",
    label: "Interaction and visual craft",
    type: "rating_scale",
    importance: "critical",
    scaleMax: "5",
  },
  {
    id: "eval-spd-problem-framing",
    label: "Problem framing and product thinking",
    type: "qualitative",
    importance: "critical",
    grades: [...GRADES],
  },
  {
    id: "eval-spd-systems",
    label: "Design systems depth — components, tokens and adoption",
    type: "rating_scale",
    importance: "important",
    scaleMax: "5",
  },
  {
    id: "eval-spd-influence",
    label: "Cross-functional influence with PM and Engineering",
    type: "qualitative",
    importance: "important",
    grades: [...GRADES],
  },
  {
    id: "eval-spd-research",
    label: "Research and data-informed decisions",
    type: "qualitative",
    importance: "important",
    grades: [...GRADES],
  },
  {
    id: "eval-spd-critique",
    label: "Communication, critique and mentoring",
    type: "qualitative",
    importance: "nice_to_have",
    grades: [...GRADES],
  },
];

// ---------------------------------------------------------------------------------------------
// Application form
// ---------------------------------------------------------------------------------------------

function field(draft: JobDraft, id: CoverageId): string {
  return draft.fields[id].value.trim();
}

/** "hybrid — 3 days a week in our Bengaluru office", read from the live fields. */
export function workArrangement(draft: JobDraft): string {
  const location = field(draft, "location");
  const mode = field(draft, "workMode");
  if (/hybrid/i.test(mode)) {
    return location ? `hybrid — 3 days a week in our ${location} office` : "hybrid — 3 days a week in office";
  }
  if (/remote|wfh/i.test(mode)) return location ? `remote, based in ${location}` : "fully remote";
  if (/on[- ]?site|wfo|office/i.test(mode)) return location ? `on-site in ${location}, 5 days a week` : "on-site, 5 days a week";
  return location ? `based in ${location}` : "";
}

/** "₹38–55L per year" for INR lakh ranges, otherwise the value with its currency and period. */
export function compensationText(draft: JobDraft): string {
  const salary = field(draft, "salary");
  if (!salary) return "";
  const period = draft.salaryPeriod.toLowerCase();
  if (draft.salaryCurrency === "INR" || /L$|lakh|LPA/i.test(salary)) {
    return `${salary.startsWith("₹") ? salary : `₹${salary}`} ${period}`;
  }
  return [salary, draft.salaryCurrency, period].filter(Boolean).join(" ");
}

function companyContext(draft: JobDraft): string {
  const industry = field(draft, "industryType") || "B2B SaaS";
  return (
    `We're a ${industry} product company building finance-operations software — invoicing, approvals and ` +
    "spend controls — used by more than 2,000 businesses across India and Southeast Asia. The design team " +
    "is 14 people across four product pods, with a shared design system, an embedded research practice " +
    "and weekly cross-pod critique. We are Series C, profitable at the unit level, and still small enough " +
    "that one designer's work visibly changes the product."
  );
}

function roleContext(draft: JobDraft): string {
  const title = field(draft, "designation") || SPD_ROLE;
  const years = field(draft, "experienceYears");
  const arrangement = workArrangement(draft);
  const compensation = compensationText(draft);
  return [
    `As our ${title}${years ? ` (${years} years)` : ""}, you'll own end-to-end design for the invoicing and ` +
      "approvals surface — from problem framing and research through shipped release — and help evolve " +
      "our design system alongside two other senior designers.",
    "You'll work in a pod with a product manager, an engineering manager and six engineers, reporting to the Head of Design.",
    arrangement && `The role is ${field(draft, "experienceType").toLowerCase() || "full-time"}, ${arrangement}.`,
    compensation && `Compensation is ${compensation} fixed, plus ESOPs.`,
  ]
    .filter(Boolean)
    .join(" ");
}

function arrangementQuestion(draft: JobDraft): string {
  const arrangement = workArrangement(draft);
  return arrangement
    ? `This role is ${arrangement}. Does that work for you?`
    : "Does the working arrangement for this role work for you?";
}

function ctcQuestion(draft: JobDraft): string {
  if (draft.salaryCurrency === "INR" || !draft.salaryCurrency) {
    return "What is your expected annual CTC (fixed, in ₹ lakhs)?";
  }
  return `What is your expected annual compensation (${draft.salaryCurrency})?`;
}

const STANDARD_OVERRIDES: Partial<Record<StandardField["id"], StandardField["required"]>> = {
  portfolioUrl: "mandatory",
  linkedinUrl: "mandatory",
  yearsOfExperience: "mandatory",
  currentLocation: "mandatory",
  // Asked as role-specific questions below instead.
  coverLetter: "skipped",
  expectedCtc: "skipped",
  noticePeriod: "skipped",
};

/** A complete, designer-specific application whose context matches the draft's live fields. */
export function designerApplication(draft: JobDraft): ApplicationConfig {
  const items: ApplicationItem[] = [
    {
      id: "s-your-work",
      kind: "section",
      title: "Your work",
      description: "We read every portfolio. Tell us where to look and what you're proudest of.",
    },
    {
      id: "q-portfolio-access",
      kind: "question",
      prompt: "If your portfolio or any case study is password-protected, share the password or access note here.",
      type: "short_answer",
      required: "optional",
      options: [],
    },
    {
      id: "q-case-study",
      kind: "question",
      prompt:
        "Walk us through one case study you're proudest of: the problem, your role, the key decisions you made and the measurable outcome.",
      type: "paragraph",
      required: "mandatory",
      options: [],
    },
    {
      id: "q-complex-workflow",
      kind: "question",
      prompt:
        "Describe the most complex B2B workflow you have designed — who used it, what made it hard, and one trade-off you negotiated with engineering.",
      type: "paragraph",
      required: "mandatory",
      options: [],
    },
    {
      id: "s-craft",
      kind: "section",
      title: "Craft and tools",
      description: "Helps us tailor the design exercise and the craft review to how you work.",
    },
    {
      id: "q-design-systems",
      kind: "question",
      prompt: "What best describes your design systems experience?",
      type: "multiple_choice",
      required: "mandatory",
      options: [
        "Built a design system from scratch and drove its adoption",
        "Evolved or governed an existing system (tokens, components, documentation)",
        "Regularly contributed components or patterns to a system",
        "Used a design system but have not contributed to one",
        "No design system experience yet",
      ],
    },
    {
      id: "q-tools",
      kind: "question",
      prompt: "Which tools do you use regularly? (Select all that apply)",
      type: "checkboxes",
      required: "mandatory",
      options: [
        "Figma",
        "FigJam or Miro",
        "ProtoPie or Framer",
        "Maze or Useberry",
        "Dovetail",
        "Mixpanel or Amplitude",
        "Storybook",
        "Jira or Linear",
        "HTML / CSS / React for prototyping",
        "AI design tools (Figma AI, v0, Galileo, Claude)",
      ],
    },
    {
      id: "q-research-comfort",
      kind: "question",
      prompt: "How comfortable are you planning and running your own usability studies?",
      type: "linear_scale",
      required: "optional",
      options: [],
      scaleMin: 1,
      scaleMax: 5,
      scaleMinLabel: "I rely on a researcher",
      scaleMaxLabel: "I run them end to end",
    },
    {
      id: "s-logistics",
      kind: "section",
      title: "Logistics",
      description: "So we can plan the process around your timelines.",
    },
    {
      id: "q-notice-period",
      kind: "question",
      prompt: "What is your notice period?",
      type: "multiple_choice",
      required: "mandatory",
      options: [
        "Immediately available",
        "15 days or less",
        "30 days",
        "60 days",
        "90 days",
        "More than 90 days",
      ],
    },
    {
      id: "q-work-arrangement",
      kind: "question",
      prompt: arrangementQuestion(draft),
      type: "multiple_choice",
      required: "mandatory",
      options: ["Yes", "No", "Yes, but I would need to relocate"],
    },
    {
      id: "q-expected-ctc",
      kind: "question",
      prompt: ctcQuestion(draft),
      type: "short_answer",
      required: "mandatory",
      options: [],
    },
  ];

  return {
    standardOrder: defaultStandardFields().map((standard) => ({
      ...standard,
      required: STANDARD_OVERRIDES[standard.id] ?? standard.required,
    })),
    context: {
      company: { shown: true, text: companyContext(draft), source: "extracted" },
      role: { shown: true, text: roleContext(draft), source: "extracted" },
    },
    items,
  };
}

// ---------------------------------------------------------------------------------------------
// Draft
// ---------------------------------------------------------------------------------------------

function designerDraft(role: string): JobDraft {
  const draft = createDraft();
  draft.transcript = TRANSCRIPT;
  draft.analysedOnce = true;
  draft.flagsPromptShown = true;
  for (const [id, value] of Object.entries(FIELD_VALUES) as [CoverageId, string][]) {
    draft.fields[id] = { value, source: "extracted" };
  }
  draft.fields.designation = { value: role.trim() || SPD_ROLE, source: "extracted" };
  draft.salaryCurrency = "INR";
  draft.salaryPeriod = "Per year";
  draft.flags.newPosition = true;
  draft.flags.aiToolPowerUser = true;
  draft.flags.firstPrinciplesThinker = true;

  draft.preview = {
    idealCandidate: IDEAL_CANDIDATE,
    expectedSkills: joinTags(EXPECTED_SKILLS),
    targetCompanies: joinTags(TARGET_COMPANIES),
    industrySectors: joinTags(INDUSTRY_SECTORS),
  };
  draft.previewGenerated = true;

  draft.roleProfile = {
    headline: { value: "Senior Product Designer — Design systems & complex workflows", source: "extracted" },
    portrait: { value: PORTRAIT, source: "extracted" },
    department: { value: "Design", source: "extracted" },
    avoidLookalikes: joinPoints(AVOID_LOOKALIKES),
    evaluationFramework: EVALUATION_FRAMEWORK.map((criterion) => ({
      ...criterion,
      grades: criterion.grades ? [...criterion.grades] : undefined,
    })),
  };
  draft.roleProfileGenerated = true;

  draft.application = designerApplication(draft);
  draft.publishDestinations = { internal: true, marketplace: false };
  return draft;
}

/** The draft a new job starts from: the deep dataset for designer roles, the demo fixture otherwise. */
export function newJobDraft(role: string): JobDraft {
  return isSeniorProductDesigner(role) ? designerDraft(role) : demoDraft(role);
}

// ---------------------------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------------------------

function message(title: string, parent: string, id: string, subject: string, body: string, trigger = "When round starts"): FunnelNode {
  return { ...node("communication", title, parent, id), subject, body, trigger };
}

function trip(title: string, parent: string, id: string, tripType: string, duration: number, description: string): FunnelNode {
  return { ...node("trip", title, parent, id), tripType, duration, description };
}

function round(title: string, id: string, duration: number, description: string): FunnelNode {
  return { ...node("round", title, "interview", id), duration, description };
}

const SIGN_OFF = "\n\nWarm regards,\nThe Design hiring team";

export type DesignerRound = { id: string; title: string; detail: string; nodes: FunnelNode[] };

export type DesignerPipeline = {
  /** The Prospects stage first, then its acknowledgement email. */
  prospects: FunnelNode[];
  application: FunnelNode;
  /** The Pipeline (screening) stage first, then the portfolio screen and its emails. */
  pipeline: FunnelNode[];
  interview: FunnelNode;
  /** Interview rounds in order, each with its round node first. */
  rounds: DesignerRound[];
};

/**
 * The designer hiring loop, shared by the template and the AI build. Stage ids stay the standard
 * `prospects` / `application` / `pipeline` / `interview`; round ids come from `roundId(n)` (1-based)
 * and every child id derives from its parent, so re-running never duplicates a node.
 */
export function designerPipeline(roundId: (index: number) => string, prefix: string): DesignerPipeline {
  const prospects = node("stage", "Prospects", "job", "prospects");
  prospects.description = "Sourced and inbound designers land here, screened against the must-haves.";
  const acknowledgement = message(
    "Application received",
    "prospects",
    `${prefix}-acknowledgement`,
    "We've received your application for {{job_title}}",
    "Hi {{candidate_name}},\n\nThank you for applying for the {{job_title}} role. A designer on our team — not just a recruiter — reviews every portfolio, so please give us up to five working days.\n\nIf your portfolio is password-protected and you haven't shared access yet, just reply to this email with the details." +
      SIGN_OFF,
  );

  const application = node("application", "Application form", "prospects", "application");
  application.description = "Portfolio, one in-depth case study, design systems experience, tools and logistics.";

  const pipeline = node("stage", "Pipeline", "job", "pipeline");
  pipeline.description = "Portfolio screen by a senior designer within five working days of applying.";
  const portfolioScreen = trip(
    "Portfolio screen",
    "pipeline",
    `${prefix}-portfolio-screen`,
    "Design task",
    20,
    "Share the two case studies you'd most like us to review in depth — ideally at least one complex B2B workflow. " +
      "For each, add a short note (150 words max): the problem, your specific role, one decision you'd defend and the outcome. " +
      "A senior designer reviews your submission against our portfolio rubric within five working days.",
  );
  const screenInvite = message(
    "Portfolio screen invitation",
    "pipeline",
    `${prefix}-portfolio-invite`,
    "Next step for {{job_title}}: share your case studies",
    "Hi {{candidate_name}},\n\nThanks for your interest in the {{job_title}} role — we enjoyed your application.\n\nAs a first step, we'd like you to point us to the two case studies you're proudest of and add a short note on each: the problem, your role, one decision you'd defend and the outcome. It should take about 20 minutes. There's no need to create anything new." +
      SIGN_OFF,
  );
  const screenReminder = message(
    "Portfolio screen reminder",
    "pipeline",
    `${prefix}-portfolio-reminder`,
    "A quick reminder about your case studies for {{job_title}}",
    "Hi {{candidate_name}},\n\nJust a gentle reminder to share your two case studies for the {{job_title}} role. If you need a few more days, or your work is under NDA and you'd prefer to walk us through it live, reply and we'll work around it." +
      SIGN_OFF,
    "After a delay",
  );
  screenReminder.delay = 3;

  const interview = node("stage", "Interview process", "job", "interview");
  interview.description = "Five rounds over roughly two weeks; every panel uses the same scorecard.";

  const loop: { title: string; detail: string; roundDuration: number; roundDescription: string; trip: [string, string, number, string]; invite: [string, string]; extra?: (id: string) => FunnelNode[] }[] = [
    {
      title: "Recruiter conversation",
      detail: "30 min · motivation, notice period, CTC expectations and hybrid fit.",
      roundDuration: 30,
      roundDescription: "Video call with the design recruiter. Covers motivation, current scope, notice period, expected CTC and the working arrangement.",
      trip: [
        "Recruiter conversation",
        "Conversation",
        30,
        "A relaxed 30-minute video call. Come ready to talk about what you're working on now, why this role interests you, your notice period and CTC expectations, and any questions about the team or the process.",
      ],
      invite: [
        "Let's talk about the {{job_title}} role",
        "Hi {{candidate_name}},\n\nThanks for sharing your case studies — the team would love to move forward. The next step is a 30-minute conversation with our design recruiter about the role, the team and your expectations.\n\nPlease pick a slot that suits you from the scheduling link. No preparation is needed.",
      ],
    },
    {
      title: "Design exercise",
      detail: "Take-home, 3-hour timebox (or 90 min live) on a B2B approvals workflow.",
      roundDuration: 180,
      roundDescription: "A realistic, scoped problem from our product. Take-home with a 3-hour timebox, or a 90-minute live session with a designer if the candidate prefers. Assessed on problem framing, interaction design and rationale, not polish.",
      trip: [
        "Design exercise: invoice approval workflow",
        "Design task",
        180,
        "Finance teams at mid-sized companies approve 200+ vendor invoices a month, and approvals stall when the approver is travelling or the amount crosses a threshold. " +
          "Design how an approver reviews, questions and approves invoices — including multi-level approval rules and the mobile moment. " +
          "Timebox yourself to 3 hours; we care about framing, key flows and your reasoning, not pixel polish. " +
          "Submit a Figma link or PDF with: your framing and assumptions, 2–3 key screens or flows, the edge cases you'd handle next, and how you'd measure success. " +
          "Prefer not to do a take-home? Ask for the 90-minute live version with one of our designers instead.",
      ],
      invite: [
        "Your design exercise for {{job_title}}",
        "Hi {{candidate_name}},\n\nThanks for a great conversation. The next step is a short design exercise based on a real problem from our product.\n\nIt is timeboxed to 3 hours and you can complete it any time in the next 5 days. If a take-home doesn't suit you, reply and we'll set up a 90-minute live session with a designer instead. The brief is attached, and you can reach us with any questions while you work.",
      ],
      extra: (id) => {
        const reminder = message(
          "Design exercise reminder",
          id,
          `${id}-reminder`,
          "Checking in on your design exercise for {{job_title}}",
          "Hi {{candidate_name}},\n\nJust checking in on the design exercise for the {{job_title}} role — it's due in two days. If anything in the brief is unclear, or you'd like to switch to the live 90-minute version, just reply." +
            SIGN_OFF,
          "After a delay",
        );
        reminder.delay = 3;
        const received = message(
          "Exercise received",
          id,
          `${id}-received`,
          "Thanks — we've received your design exercise",
          "Hi {{candidate_name}},\n\nThank you for the time you put into the exercise for {{job_title}}. Two designers will review it independently and we'll come back to you within three working days." +
            SIGN_OFF,
          "When trip completed",
        );
        return [reminder, received];
      },
    },
    {
      title: "Portfolio presentation & craft review",
      detail: "60 min · present two case studies, then a hands-on craft deep dive.",
      roundDuration: 60,
      roundDescription: "Panel: Head of Design and two senior designers. 30 minutes presenting two case studies, 20 minutes of craft deep dive into interaction details and system decisions, 10 minutes for the candidate's questions.",
      trip: [
        "Portfolio presentation",
        "Conversation",
        60,
        "Present two case studies in about 30 minutes — at least one should be a complex B2B workflow. For each, cover the problem and constraints, your role, the options you explored, the decision you made and why, and the measurable outcome. " +
          "We'll then spend 20 minutes going deep on craft: interaction details, edge and error states, and how the work used or extended a design system. Share your screen from Figma or slides.",
      ],
      invite: [
        "Portfolio presentation for {{job_title}}",
        "Hi {{candidate_name}},\n\nThe team really liked your design exercise. We'd like to invite you to a 60-minute portfolio presentation with our Head of Design and two senior designers.\n\nPlease prepare two case studies (around 15 minutes each), including at least one B2B workflow. We'll leave time for a craft deep dive and for your questions.",
      ],
    },
    {
      title: "Cross-functional round with PM + Engineering",
      detail: "45 min · trade-off scenario with a product manager and a staff engineer.",
      roundDuration: 45,
      roundDescription: "With the pod's product manager and a staff engineer. A working session on a scope-versus-quality trade-off, assessing collaboration, influence and handoff habits.",
      trip: [
        "Trade-off scenario with PM and Engineering",
        "Case study",
        45,
        "We'll share a real scenario: a feature you've designed has to ship in half the planned time and engineering has flagged two interactions as expensive. " +
          "Work through it with our PM and staff engineer — what you'd cut, what you'd protect and why, how you'd phase the rest, and what you'd hand off. " +
          "There's no preparation; we're interested in how you think and collaborate out loud.",
      ],
      invite: [
        "Meet the product and engineering team for {{job_title}}",
        "Hi {{candidate_name}},\n\nNext up is a 45-minute working session with the product manager and staff engineer you'd partner with every day. We'll talk through a real trade-off together — no preparation needed.\n\nPlease choose a slot from the scheduling link.",
      ],
    },
    {
      title: "Hiring manager conversation",
      detail: "45 min with the Head of Design · ownership, growth and team fit.",
      roundDuration: 45,
      roundDescription: "Closing conversation with the Head of Design on ownership, how the candidate raises the design bar, career goals and any open questions before an offer.",
      trip: [
        "Hiring manager conversation",
        "Conversation",
        45,
        "A 45-minute conversation with our Head of Design. We'll talk about how you like to own problems, a time you raised the quality bar for a team, how you give and take critique, and what you want from your next two years. Bring your questions about the role, the team and how we work.",
      ],
      invite: [
        "Final conversation for {{job_title}}",
        "Hi {{candidate_name}},\n\nThank you for your time through the process so far — the panel was impressed. The final step is a 45-minute conversation with our Head of Design about ownership, growth and how you'd like to work.\n\nPlease pick a time that suits you; we aim to share a decision within two working days of this conversation.",
      ],
    },
  ];

  const rounds = loop.map((step, index): DesignerRound => {
    const id = roundId(index + 1);
    const [tripTitle, tripType, duration, description] = step.trip;
    const [subject, body] = step.invite;
    return {
      id,
      title: step.title,
      detail: step.detail,
      nodes: [
        round(step.title, id, step.roundDuration, step.roundDescription),
        trip(tripTitle, id, `${id}-trip`, tripType, duration, description),
        message("Round invitation", id, `${id}-invite`, subject, body + SIGN_OFF),
        ...(step.extra?.(id) ?? []),
      ],
    };
  });

  return {
    prospects: [prospects, acknowledgement],
    application,
    pipeline: [pipeline, portfolioScreen, screenInvite, screenReminder],
    interview,
    rounds,
  };
}

/** Template-only: a senior-appropriate eligibility rule, so migration does not add its 3-year default. */
function eligibility(): FunnelNode[] {
  const applied = node("stage", "Applied", "job", "applied");
  const check = node("round", "Eligibility review", "applied", "eligibility-check");
  check.description = "Auto-review: product design experience below 5 years is declined politely; everyone else goes to the portfolio screen.";
  check.rules = [{ id: "minimum-experience", field: "experience", operator: "less_than", value: "5", enabled: true }];
  check.outcome = "success";
  const thanks = message(
    "Thank-you message",
    "eligibility-check",
    "eligibility-thank-you",
    "An update on your application for {{job_title}}",
    "Hi {{candidate_name}},\n\nThank you for your interest in the {{job_title}} role and for the time you spent applying. This role needs at least six years of product design experience, so we won't be moving forward right now — but we'd love to stay in touch as the team grows." +
      SIGN_OFF,
    "After hard-rule decision",
  );
  thanks.outcome = "failure";
  thanks.destinationId = "archive";
  thanks.description = "Review this message before confirming a failure outcome.";
  return [applied, check, thanks];
}

function designerNodes(): FunnelNode[] {
  const loop = designerPipeline((index) => `spd-round-${index}`, "spd");
  return [
    node("job", "Job configuration", null, "job"),
    ...loop.prospects,
    loop.application,
    ...eligibility(),
    ...loop.pipeline,
    loop.interview,
    ...loop.rounds.flatMap((item) => item.nodes),
  ];
}

/** The pipeline a new job's template starts from: deep nodes for designer roles, the demo fixture otherwise. */
export function newJobNodes(role: string): FunnelNode[] {
  return isSeniorProductDesigner(role) ? designerNodes() : demoNodes(role);
}
