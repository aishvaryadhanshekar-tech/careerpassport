export type Capability =
  | "setup"
  | "brief"
  | "prospects"
  | "review"
  | "messages"
  | "assessments"
  | "tasks"
  | "client"
  | "team"
  | "activity";
export type Prospect = {
  id: string;
  name: string;
  headline: string;
  company: string;
  email: string;
  phone: string;
  location: string;
  experience: string;
  skills: string;
  source: string;
  owner: string;
  intent: string;
  compensation: string;
  education: string;
  resume: string;
  createdAt: number;
  outcome: string;
  hotlist: boolean;
  candidateId?: string;
  answers: Record<string, string>;
};
export type Review = {
  status: string;
  owner: string;
  verified: boolean;
  confidence: string;
  source: string;
  company: string;
  experience: string;
  evaluatedAt?: number;
};
export type MessageTemplate = {
  id: string;
  name: string;
  channel: "Email" | "WhatsApp" | "AI call";
  stage: string;
  scope: "Job" | "Organization";
  tone: string;
  subject: string;
  body: string;
  default: boolean;
  approvedId?: string;
  slots: string[];
  provisioned?: boolean;
};
export type Approval = {
  id: string;
  name: string;
  purpose: string;
  language: string;
  category: string;
  header: string;
  body: string;
  samples: string;
  buttons: string;
  status: "Pending" | "Approved" | "Declined";
};
export type Lever = {
  id: string;
  type: "Rapid Fire" | "Pick & Defend" | "Demo";
  title: string;
  seconds: number;
  questions: number;
  difficulty: string;
  prompt: string;
  constraint: string;
  statements: { text: string; answer: "SERIOUS" | "JOKING" }[];
  options: { title: string; rationale: string }[];
  defense: string[];
  preferred: number;
  why: string;
  axis: string;
  resources: string[];
  voice: string;
  screen: boolean;
  audio: boolean;
  face: boolean;
  prep: number;
  upload: boolean;
  uploadLabel: string;
  uploadInstructions: string;
  formats: string[];
  beats: { at: number; text: string }[];
  expected: string;
  rubric: string;
};
export type Assessment = {
  id: string;
  title: string;
  stage: string;
  difficulty: string;
  storyline: string;
  instructions: string;
  domain: string;
  role: string;
  source: string;
  persona: string;
  levers: Lever[];
  publishedAt?: number;
  version: number;
  roster: string[];
  expiresAt: number;
  invites: Record<
    string,
    {
      at: number;
      expiresAt: number;
      completed?: number;
      answers?: Record<string, string>;
    }
  >;
};
export type Task = {
  id: string;
  candidateId: string;
  title: string;
  type: string;
  assignedTo: string;
  createdBy: string;
  due: number;
  done: boolean;
};
export type Activity = {
  id: string;
  at: number;
  actor: string;
  category: "Jobs" | "Candidates" | "Team" | "Settings";
  label: string;
  candidateId?: string;
};
export type HiringOperations = {
  version: 1;
  setup: Record<string, string>;
  setupDraft?: Record<string, string>;
  prospectIds: string[];
  prospects: Record<string, Prospect>;
  reviews: Record<string, Review>;
  templates: Record<string, MessageTemplate>;
  approvals: Record<string, Approval>;
  assessments: Record<string, Assessment>;
  leverTemplates: Record<string, Lever[]>;
  tasks: Record<string, Task>;
  owner: string;
  members: Record<string, string>;
  partners: Record<
    string,
    {
      name: string;
      email: string;
      about: string;
      status: "Pending" | "Approved" | "Declined" | "Revoked";
    }
  >;
  threads: Record<
    string,
    {
      status: string;
      messages: {
        id: string;
        at: number;
        sender: string;
        text: string;
        attachment?: string;
      }[];
    }
  >;
  activity: Activity[];
};
