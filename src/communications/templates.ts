import type { MessageTemplate } from "../types";

/**
 * Dummy template library, standing in for the Communications module.
 *
 * Everything downstream reads through `templatesForStage` / `templateById`, so replacing
 * this array with a fetch is the whole migration. Ordering inside a stage is meaningful:
 * the first match is what the card offers as its default.
 */
export const MESSAGE_TEMPLATES: readonly MessageTemplate[] = [
  {
    id: "tpl-application-received",
    name: "Application received",
    channel: "email",
    intent: "acknowledge",
    scope: ["applied"],
    blurb: "Confirms the application landed and sets an expectation for next steps.",
    subject: "We've got your application for {{job_title}}",
    body:
      "Hi {{candidate_name}},\n\n" +
      "Thanks for applying to {{job_title}} at {{company}}. Your application is with our " +
      "hiring team now, and we'll come back to you within five working days either way.\n\n" +
      "Best,\n{{sender_name}}",
  },
  {
    id: "tpl-trip-invite",
    name: "Trip invitation",
    channel: "email",
    intent: "advance",
    scope: ["applied", "screened"],
    blurb: "Asks the candidate to complete their Trip questionnaire.",
    subject: "Next step for {{job_title}}: a short Trip",
    body:
      "Hi {{candidate_name}},\n\n" +
      "We'd like to learn more about how you work. The next step is a short Trip — a set of " +
      "questions you can answer in your own time, usually about 15 minutes.\n\n" +
      "The link is in the following email. No prep needed.\n\n" +
      "Best,\n{{sender_name}}",
  },
  {
    id: "tpl-application-rejected",
    name: "Not moving forward (early)",
    channel: "email",
    intent: "reject",
    scope: ["applied", "screened"],
    blurb: "Early-stage rejection, sent before the candidate has invested interview time.",
    subject: "Your application for {{job_title}}",
    body:
      "Hi {{candidate_name}},\n\n" +
      "Thank you for your interest in {{job_title}} at {{company}}. After reviewing your " +
      "application we've decided not to move forward on this role.\n\n" +
      "We'd genuinely welcome an application from you for a future opening.\n\n" +
      "Best,\n{{sender_name}}",
  },
  {
    id: "tpl-trip-nudge",
    name: "Trip reminder",
    channel: "whatsapp",
    intent: "nudge",
    scope: ["applied", "screened"],
    blurb: "Gentle reminder when a sent Trip has gone quiet.",
    subject: "",
    body:
      "Hi {{candidate_name}}, this is {{sender_name}} from {{company}}. Just a nudge that " +
      "your Trip for {{job_title}} is still open — it takes about 15 minutes whenever suits you.",
  },
  {
    id: "tpl-profile-shared",
    name: "Profile shared with client",
    channel: "email",
    intent: "advance",
    scope: ["submitted"],
    blurb: "Tells the candidate their profile is now with the hiring client.",
    subject: "Your profile is with the {{job_title}} hiring team",
    body:
      "Hi {{candidate_name}},\n\n" +
      "Good news — we've shared your profile with the hiring team for {{job_title}}. " +
      "They typically come back within a week, and I'll let you know as soon as I hear.\n\n" +
      "Best,\n{{sender_name}}",
  },
  {
    id: "tpl-interview-invite",
    name: "Interview invitation",
    channel: "email",
    intent: "schedule",
    scope: ["interviewing"],
    blurb: "Invites the candidate to book an interview slot.",
    subject: "Interview for {{job_title}}",
    body:
      "Hi {{candidate_name}},\n\n" +
      "We'd like to take your {{job_title}} application to an interview. It's a 45-minute " +
      "conversation with the hiring manager, focused on the work you've owned.\n\n" +
      "Reply with a couple of windows that suit you and I'll get it booked.\n\n" +
      "Best,\n{{sender_name}}",
  },
  {
    id: "tpl-interview-reminder",
    name: "Interview reminder",
    channel: "sms",
    intent: "nudge",
    scope: ["interviewing"],
    blurb: "Day-before reminder with the essentials only.",
    subject: "",
    body:
      "Hi {{candidate_name}} — reminder of your {{job_title}} interview with {{company}} " +
      "tomorrow. Joining details are in your email. — {{sender_name}}",
  },
  {
    id: "tpl-interview-rejected",
    name: "Not moving forward (post-interview)",
    channel: "email",
    intent: "reject",
    scope: ["submitted", "interviewing"],
    blurb: "Late-stage rejection with room for specific feedback.",
    subject: "Your interview for {{job_title}}",
    body:
      "Hi {{candidate_name}},\n\n" +
      "Thank you for the time you gave us on {{job_title}}. After the interview we've decided " +
      "not to move ahead, and I want to be straight with you about why rather than leave it " +
      "vague.\n\n" +
      "[Add the specific reason here before sending.]\n\n" +
      "I'd be glad to stay in touch for future roles.\n\n" +
      "Best,\n{{sender_name}}",
  },
  {
    id: "tpl-offer",
    name: "Offer",
    channel: "email",
    intent: "offer",
    scope: ["offered"],
    blurb: "Extends the formal offer and points at the paperwork.",
    subject: "Offer: {{job_title}} at {{company}}",
    body:
      "Hi {{candidate_name}},\n\n" +
      "We'd like to offer you the {{job_title}} role at {{company}}. The formal letter with " +
      "compensation and start date is attached.\n\n" +
      "Happy to talk anything through before you decide — just say when.\n\n" +
      "Best,\n{{sender_name}}",
  },
  {
    id: "tpl-offer-nudge",
    name: "Offer follow-up",
    channel: "email",
    intent: "nudge",
    scope: ["offered"],
    blurb: "Checks in on an offer that hasn't been signed yet.",
    subject: "Checking in on your {{job_title}} offer",
    body:
      "Hi {{candidate_name}},\n\n" +
      "Just checking in on the {{job_title}} offer. No pressure on timing — if there's " +
      "anything you'd like to discuss or renegotiate, I'd rather hear it than have you sit " +
      "with it.\n\n" +
      "Best,\n{{sender_name}}",
  },
  {
    id: "tpl-archived",
    name: "Keeping your profile on file",
    channel: "email",
    intent: "reject",
    scope: ["archive"],
    blurb: "Closes the loop when a candidate is archived rather than rejected outright.",
    subject: "Your application for {{job_title}}",
    body:
      "Hi {{candidate_name}},\n\n" +
      "We've closed the {{job_title}} search for now. Your profile stays on file with us, and " +
      "I'll reach out directly when something closer to your strengths opens up.\n\n" +
      "Best,\n{{sender_name}}",
  },
  {
    id: "tpl-general-checkin",
    name: "General check-in",
    channel: "email",
    intent: "acknowledge",
    scope: "all",
    blurb: "Stage-agnostic holding note for when a decision is taking longer than promised.",
    subject: "An update on {{job_title}}",
    body:
      "Hi {{candidate_name}},\n\n" +
      "A quick note so you're not left wondering: you're currently at the {{stage}} stage for " +
      "{{job_title}}, and we're taking a little longer than we said. Nothing is wrong — I'll " +
      "come back to you with a real update shortly.\n\n" +
      "Best,\n{{sender_name}}",
  },
] as const;

/**
 * Templates offered for a stage: the ones scoped to it, then the stage-agnostic ones.
 *
 * A custom stage matches nothing by id and so falls through to the `"all"` templates —
 * deliberate, and the reason scope is not an exhaustive stage list.
 */
export function templatesForStage(stageId: string): MessageTemplate[] {
  const scoped = MESSAGE_TEMPLATES.filter(
    (t) => t.scope !== "all" && t.scope.includes(stageId),
  );
  const generic = MESSAGE_TEMPLATES.filter((t) => t.scope === "all");
  return [...scoped, ...generic];
}

export function templateById(id: string): MessageTemplate | null {
  return MESSAGE_TEMPLATES.find((t) => t.id === id) ?? null;
}

/** Stage ids any template names explicitly — lets the tab group without a board loaded. */
export function scopedStageIds(): string[] {
  const ids = new Set<string>();
  for (const template of MESSAGE_TEMPLATES) {
    if (template.scope === "all") continue;
    for (const id of template.scope) ids.add(id);
  }
  return [...ids];
}
