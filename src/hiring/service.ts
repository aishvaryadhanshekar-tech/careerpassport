import { demoService } from "../demo/service";
import { createRepository } from "../demo/repository";
import type { DemoCandidate, DemoProject } from "../demo/types";
import type {
  Assessment,
  HiringOperations,
  MessageTemplate,
  Prospect,
} from "./types";
import { APPROVED_WA, emptyOperations, reviewFor, STAGES } from "./catalog";

export const operations = (p: DemoProject): HiringOperations =>
  p.operations ?? emptyOperations();
export function change(
  jobId: string,
  label: string,
  action: (o: HiringOperations, p: DemoProject) => void,
  category: "Jobs" | "Candidates" | "Team" | "Settings" = "Jobs",
  candidateId?: string,
) {
  return demoService().transact(jobId, (p) => {
    p.operations ??= emptyOperations();
    action(p.operations, p);
    p.operations.activity.push({
      id: crypto.randomUUID(),
      at: p.clock,
      actor: "Demo Recruiter",
      category,
      label,
      candidateId,
    });
  });
}
export function moveCandidate(
  jobId: string,
  candidateId: string,
  stage: string,
  status: string,
) {
  if (!(STAGES[stage] ?? STAGES.interviewing).includes(status))
    throw new Error("Choose a status belonging to the selected stage.");
  demoService().move(jobId, candidateId, stage);
  return change(
    jobId,
    `Moved candidate to ${stage} · ${status}`,
    (o, p) => {
      o.reviews[candidateId] = {
        ...reviewFor(p.candidates[candidateId], o),
        status,
      };
    },
    "Candidates",
    candidateId,
  );
}
type PeoplePool = { id: string; people: Record<string, Prospect> };
const poolRepo = () =>
  createRepository<PeoplePool>(localStorage, "cp.hiring.v1.people.");
export function pool(): PeoplePool {
  return poolRepo().get("private") ?? { id: "private", people: {} };
}
export function savePerson(person: Prospect) {
  const current = pool();
  current.people[person.id] = person;
  poolRepo().put(current);
}
export function removePerson(id: string) {
  const current = pool();
  delete current.people[id];
  poolRepo().put(current);
}
export function newProspect(values: Partial<Prospect> = {}): Prospect {
  return {
    id: crypto.randomUUID(),
    name: "",
    headline: "",
    company: "",
    email: "",
    phone: "",
    location: "",
    experience: "",
    skills: "",
    source: "Referral",
    owner: "Demo Recruiter",
    intent: "Open",
    compensation: "",
    education: "",
    resume: "",
    createdAt: Date.now(),
    outcome: "Pending review",
    hotlist: false,
    answers: {},
    ...values,
  };
}
export function attachPeople(jobId: string, people: Prospect[]) {
  if (people.some((p) => !p.name.trim() || !p.headline.trim()))
    throw new Error("Full name and headline are required.");
  const updated = change(
    jobId,
    `Attached ${people.length} private prospects`,
    (o) => {
      people.forEach((p) => {
        o.prospects[p.id] ??= p;
        if (!o.prospectIds.includes(p.id)) o.prospectIds.push(p.id);
      });
    },
    "Candidates",
  );
  people.forEach(savePerson);
  return updated;
}
export function promote(
  jobId: string,
  id: string,
  answers: Record<string, string>,
) {
  const p = demoService().get(jobId)!;
  const person = operations(p).prospects[id];
  if (!person || person.candidateId)
    throw new Error("This prospect has already applied or is unavailable.");
  const result = demoService().submit(
    jobId,
    person.name,
    person.email,
    answers,
  );
  return change(
    jobId,
    `Promoted ${person.name} after completing the application`,
    (o, project) => {
      o.prospects[id].candidateId = result.candidateId;
      o.prospects[id].answers = answers;
      const c = project.candidates[result.candidateId];
      c.phone = person.phone;
      c.origin = { kind: "submitted_by", by: person.owner };
      o.reviews[c.id] = {
        ...reviewFor(c, o),
        source: person.source,
        owner: person.owner,
        company: person.company,
        experience: person.experience,
      };
    },
    "Candidates",
    result.candidateId,
  );
}
export function renderMessage(
  template: MessageTemplate,
  project: DemoProject,
  name: string,
  location = "",
) {
  const s = operations(project).setup;
  const tokens: Record<string, string> = {
    first_name: name.split(" ")[0],
    candidate_name: name,
    job_title: project.configuration.draft.fields.designation.value,
    company_name: s.client || "Career Passport",
    company: s.client || "Career Passport",
    location: location || project.configuration.draft.fields.location.value,
    comp_range: project.configuration.draft.fields.salary.value,
    sender_name: "Demo Recruiter",
    meeting_date_time: s.meetingTime || "To be confirmed",
    meeting_link: s.meetingLink || "https://meet.example/demo",
    current_date: new Date(project.clock).toLocaleDateString(),
    current_day: new Date(project.clock).toLocaleDateString("en", {
      weekday: "long",
    }),
    current_month: new Date(project.clock).toLocaleDateString("en", {
      month: "long",
    }),
  };
  let body = template.body;
  if (template.channel === "WhatsApp") {
    const approved =
      APPROVED_WA.find((a) => a.id === template.approvedId) ??
      Object.values(operations(project).approvals).find(
        (a) => a.id === template.approvedId && a.status === "Approved",
      );
    if (!approved) throw new Error("Select an approved WhatsApp template.");
    body = approved.body.replace(
      /\{\{(\d+)\}\}/g,
      (_, n: string) => template.slots[Number(n) - 1] || `{{${n}}}`,
    );
  }
  const render = (v: string) =>
    v.replace(
      /\{\{\s*(\w+)\s*\}\}/g,
      (match, key: string) => tokens[key] ?? match,
    );
  return { subject: render(template.subject), body: render(body) };
}
export function sendOutreach(
  jobId: string,
  ids: string[],
  template: MessageTemplate,
) {
  return change(
    jobId,
    `${template.channel} outreach queued for ${ids.length} recipients (demo)`,
    (o, p) => {
      if (!ids.length) throw new Error("Select at least one recipient.");
      for (const id of new Set(ids)) {
        const c =
          (p.candidates[id] as DemoCandidate | undefined) ?? o.prospects[id];
        if (!c) throw new Error("Recipient not found.");
        if (
          template.stage !== "All" &&
          ("stageId" in c ? c.stageId : "prospects") !== template.stage
        )
          throw new Error("Template is scoped to another stage.");
        if (template.channel === "Email" ? !c.email : !c.phone)
          throw new Error(
            `${c.name} has no ${template.channel === "Email" ? "email" : "phone"}.`,
          );
        if (template.channel === "AI call" && !template.provisioned)
          throw new Error(
            "Provision this stage’s calling agent before calling.",
          );
        const message = renderMessage(template, p, c.name, c.location);
        if (
          !message.body.trim() ||
          /\{\{.*?\}\}/.test(message.body + message.subject)
        )
          throw new Error(
            "Complete the message and all template variables before sending.",
          );
        const deliveryId = crypto.randomUUID();
        p.deliveries[deliveryId] = {
          id: deliveryId,
          candidateId: id,
          recipient: template.channel === "Email" ? c.email : c.phone,
          nodeId: template.id,
          name: `${template.channel}: ${template.name}`,
          ...message,
          dueAt: p.clock,
          sentAt: p.clock,
          status: "delivered",
          eventKey: deliveryId,
        };
        if ("timeline" in c)
          c.timeline.push({
            id: deliveryId,
            at: p.clock,
            actor: "team",
            label: `Demo ${template.channel}: ${template.name}`,
          });
        else
          c.outcome =
            template.channel === "Email"
              ? "Email sent"
              : template.channel === "WhatsApp"
                ? "Message sent"
                : "Connected";
      }
    },
    "Candidates",
  );
}
export function validateAssessment(a: Assessment) {
  if (!a.title.trim() || !a.stage || !a.levers.length)
    throw new Error("Add a title, target stage and at least one lever.");
  for (const l of a.levers) {
    if (!l.prompt.trim() || !Number.isFinite(l.seconds) || l.seconds < 1)
      throw new Error("Every lever needs a prompt and a positive time cap.");
    if (
      l.type === "Rapid Fire" &&
      (!l.statements.length || l.statements.some((s) => !s.text.trim()))
    )
      throw new Error("Add statements and answer keys to Rapid Fire.");
    if (
      l.type === "Pick & Defend" &&
      (l.options.length < 2 || !l.options[l.preferred] || !l.defense.length)
    )
      throw new Error(
        "Pick & Defend needs two options, a preferred answer and a defense question.",
      );
    if (l.type === "Demo" && !l.screen && !l.face)
      throw new Error(
        "Demo must capture screen or face. Audio alone is not enough.",
      );
  }
}
export function publishAssessment(jobId: string, id: string) {
  return change(jobId, "Published assessment · content frozen", (o, p) => {
    const a = o.assessments[id];
    if (a.publishedAt)
      throw new Error("Already published. Duplicate to revise.");
    validateAssessment(a);
    a.publishedAt = p.clock;
  });
}
export function inviteAssessment(
  jobId: string,
  id: string,
  roster: string[],
  expiresAt: number,
) {
  return change(
    jobId,
    `Sent assessment to ${roster.length} selected candidates (demo)`,
    (o, p) => {
      const a = o.assessments[id];
      if (!a?.publishedAt) throw new Error("Publish the assessment first.");
      if (!roster.length)
        throw new Error("Select candidates from the target stage.");
      if (!Number.isFinite(expiresAt) || expiresAt < p.clock + 3_600_000)
        throw new Error(
          "Link expiry must be at least one hour after the demo clock.",
        );
      for (const candidateId of new Set(roster)) {
        const c = p.candidates[candidateId];
        if (!c || c.stageId !== a.stage || !c.email)
          throw new Error(
            "Only candidates with email in the target stage are eligible.",
          );
        if (a.invites[candidateId]?.completed)
          throw new Error(
            `${c.name} has already completed this assessment version.`,
          );
        a.invites[candidateId] = {
          ...a.invites[candidateId],
          at: p.clock,
          expiresAt,
        };
        const deliveryId = crypto.randomUUID();
        p.deliveries[deliveryId] = {
          id: deliveryId,
          candidateId,
          recipient: c.email,
          nodeId: a.id,
          name: "Assessment invitation",
          subject: a.title,
          body: `Hi ${c.name}, complete ${a.title}: ${location.origin}/demo/assessment/${jobId}/${a.id}/${candidateId}`,
          dueAt: p.clock,
          sentAt: p.clock,
          status: "delivered",
          eventKey: deliveryId,
        };
        c.tripStatus = "sent";
      }
      a.roster = [];
      a.expiresAt = expiresAt;
    },
    "Candidates",
  );
}

export function completeAssessment(
  jobId: string,
  id: string,
  candidateId: string,
  answers: Record<string, string>,
) {
  const existing = demoService().get(jobId);
  if (existing?.operations?.assessments[id]?.invites[candidateId]?.completed)
    return existing;
  return change(
    jobId,
    "Candidate completed a published assessment",
    (o, p) => {
      const a = o.assessments[id],
        invite = a?.invites[candidateId];
      if (!a?.publishedAt || !invite)
        throw new Error("This candidate has not been invited.");
      if (invite.completed) return;
      if (invite.expiresAt <= p.clock)
        throw new Error(
          "This assessment invitation has expired. Ask the hiring team for a new invitation.",
        );
      for (const l of a.levers) {
        const required =
          l.type === "Rapid Fire"
            ? l.statements.map((_, i) => `${l.id}:statement:${i}`)
            : l.type === "Pick & Defend"
              ? [
                  `${l.id}:option`,
                  ...l.defense.map((_, i) => `${l.id}:defense:${i}`),
                ]
              : [`${l.id}:recording`];
        if (required.some((key) => !answers[key]?.trim()))
          throw new Error(`Complete all responses in ${l.title}.`);
        if (
          l.type === "Rapid Fire" &&
          l.statements.some(
            (_, i) =>
              !["SERIOUS", "JOKING"].includes(
                answers[`${l.id}:statement:${i}`],
              ),
          )
        )
          throw new Error("Choose Serious or Joking for each statement.");
        if (
          l.type === "Pick & Defend" &&
          !l.options[Number(answers[`${l.id}:option`])]
        )
          throw new Error("Choose a valid option.");
      }
      invite.completed = p.clock;
      invite.answers = answers;
      const c = p.candidates[candidateId];
      const pending =
        Object.values(p.assignments).some(
          (x) => x.candidateId === candidateId && x.status === "assigned",
        ) ||
        Object.values(o.assessments).some(
          (x) => x.invites[candidateId] && !x.invites[candidateId].completed,
        );
      c.tripStatus = pending ? "sent" : "completed";
      c.timeline.push({
        id: crypto.randomUUID(),
        at: p.clock,
        actor: "candidate",
        label: `Completed assessment: ${a.title}`,
      });
    },
    "Candidates",
    candidateId,
  );
}

/** RFC-style quoted cells, escaped quotes and CRLF; used by both import modes. */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [],
    value = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        value += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(value.trim());
      value = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = "";
    } else value += c;
  }
  if (quoted) throw new Error("CSV contains an unclosed quoted field.");
  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}
export function downloadCSV(filename: string, rows: string[][]) {
  const blob = new Blob(
    [
      rows
        .map((r) =>
          r
            .map(
              (c) =>
                `"${(/^[=+@\-\t\r]/.test(c) ? "'" + c : c).replaceAll('"', '""')}"`,
            )
            .join(","),
        )
        .join("\r\n"),
    ],
    { type: "text/csv" },
  );
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
