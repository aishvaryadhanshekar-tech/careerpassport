import { defaultStandardFields } from "./applicationCatalog";
import type {
  ApplicationConfig,
  ApplicationItem,
  CoverageId,
  JobDraft,
} from "./types";

const WORK_STYLE_OPTIONS = [
  "Independently with minimal check-ins",
  "Collaborative with frequent team input",
  "Structured with clear processes",
  "Flexible, adapting as needed",
  "Mentoring others",
  "Being mentored",
];

const LOCATION_OPTIONS = [
  "Yes, I am based there or can relocate",
  "Yes, I can commute regularly",
  "No",
];

const WORK_MODE_OPTIONS = [
  "Fully on-site",
  "Hybrid (2-3 days on-site)",
  "Fully remote",
  "Flexible – open to any arrangement",
];

function fieldValue(draft: JobDraft, id: CoverageId): string {
  return draft.fields[id].value.trim();
}

function seedCompanyText(draft: JobDraft): string {
  const company = fieldValue(draft, "companyType");
  const industry = fieldValue(draft, "industryType");
  if (company && industry) {
    return `Career Passport is hiring for a ${company} in ${industry}. The company is currently looking for qualified candidates to join the team.`;
  }
  if (company) {
    return `Career Passport is hiring for a ${company}. The company is currently looking for qualified candidates to join the team.`;
  }
  return "Career Passport is the hiring organisation for this position. The company is currently looking for qualified candidates to join the team.";
}

function seedRoleText(draft: JobDraft): string {
  const designation = fieldValue(draft, "designation");
  const years = fieldValue(draft, "experienceYears");
  const location = fieldValue(draft, "location");
  const mode = fieldValue(draft, "workMode");
  const salary = fieldValue(draft, "salary");
  const parts: string[] = [];
  if (designation) {
    let sentence = `This position is for a ${designation}`;
    if (years) sentence += ` with ${years} years of experience`;
    parts.push(`${sentence}.`);
  } else {
    parts.push(
      "This position requires someone who can contribute to the core work of the team.",
    );
  }
  const place: string[] = [];
  if (mode) place.push(mode);
  if (location) place.push(`in ${location}`);
  if (place.length) parts.push(`The role is ${place.join(" ")}.`);
  if (salary) {
    let bit = salary;
    if (draft.salaryCurrency) bit += ` ${draft.salaryCurrency}`;
    if (draft.salaryPeriod) bit += ` ${draft.salaryPeriod.toLowerCase()}`;
    parts.push(`Compensation is ${bit}.`);
  }
  return parts.join(" ");
}

// Shared by the initial seed and by ApplicationPage's resync-on-load logic,
// so both stay in sync with whatever Job Details / Role Profile currently
// hold rather than drifting apart.
export function deriveContextText(draft: JobDraft): {
  company: string;
  role: string;
} {
  return {
    company: seedCompanyText(draft),
    role: seedRoleText(draft),
  };
}

export function seedApplication(draft: JobDraft): ApplicationConfig {
  const items: ApplicationItem[] = [
    {
      id: "q-interest",
      kind: "question",
      prompt: "Why are you interested in this role?",
      type: "paragraph",
      required: "mandatory",
      options: [],
    },
    {
      id: "q-achievements",
      kind: "question",
      prompt: "Describe 1–2 key achievements most relevant to this role.",
      type: "paragraph",
      required: "mandatory",
      options: [],
    },
    {
      id: "q-work-style",
      kind: "question",
      prompt: "How do you prefer to work? (Select all that apply)",
      type: "checkboxes",
      required: "optional",
      options: [...WORK_STYLE_OPTIONS],
    },
    {
      id: "q-concerns",
      kind: "question",
      prompt: "Are there any concerns or gaps you'd like us to know about?",
      type: "paragraph",
      required: "optional",
      options: [],
    },
  ];

  const location = fieldValue(draft, "location");
  if (location) {
    items.push({
      id: "q-location",
      kind: "question",
      prompt: `Are you able to work at the specified location (${location})?`,
      type: "multiple_choice",
      required: "mandatory",
      options: [...LOCATION_OPTIONS],
    });
  }

  const workMode = fieldValue(draft, "workMode");
  if (workMode) {
    items.push({
      id: "q-work-mode",
      kind: "question",
      prompt: "What work mode do you prefer?",
      type: "multiple_choice",
      required: "optional",
      options: [...WORK_MODE_OPTIONS],
    });
  }

  const salary = fieldValue(draft, "salary");
  if (salary) {
    items.push({
      id: "q-salary",
      kind: "question",
      prompt: "What is your salary expectation (annual)?",
      type: "short_answer",
      required: "mandatory",
      options: [],
    });
  }

  return {
    standardOrder: defaultStandardFields(),
    context: {
      company: { shown: true, text: seedCompanyText(draft), source: "extracted" },
      role: { shown: true, text: seedRoleText(draft), source: "extracted" },
    },
    items,
  };
}
