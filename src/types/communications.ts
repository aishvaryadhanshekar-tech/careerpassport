/**
 * Candidate messaging types.
 *
 * Shaped for a future Communications module: a template is data, not code, and every
 * consumer resolves templates through `templatesForStage` rather than hard-coding which
 * message belongs to which column. Swapping the dummy list in communications/templates.ts
 * for a fetched one should not touch anything else.
 */

export const MESSAGE_CHANNELS = ["email", "sms", "whatsapp"] as const;
export type MessageChannel = (typeof MESSAGE_CHANNELS)[number];

export const MESSAGE_CHANNEL_LABELS: Record<MessageChannel, string> = {
  email: "Email",
  sms: "SMS",
  whatsapp: "WhatsApp",
};

/**
 * What the message is trying to do. Drives grouping and the tone of the confirmation, and
 * lets a caller pick out (say) the rejection template without matching on its name.
 */
export const MESSAGE_INTENTS = [
  "acknowledge",
  "advance",
  "schedule",
  "nudge",
  "offer",
  "reject",
] as const;
export type MessageIntent = (typeof MESSAGE_INTENTS)[number];

export const MESSAGE_INTENT_LABELS: Record<MessageIntent, string> = {
  acknowledge: "Acknowledge",
  advance: "Move forward",
  schedule: "Scheduling",
  nudge: "Nudge",
  offer: "Offer",
  reject: "Reject",
};

/**
 * Stages a template applies to. `"all"` rather than listing every stage id, so templates
 * stay correct when a recruiter adds a custom stage — a custom column still gets the
 * generic messages instead of an empty menu.
 */
export type TemplateScope = "all" | readonly string[];

export type MessageTemplate = {
  id: string;
  name: string;
  channel: MessageChannel;
  intent: MessageIntent;
  /** Ignored for sms/whatsapp, which have no subject line. */
  subject: string;
  body: string;
  scope: TemplateScope;
  /** One-line description shown under the name in the picker and the tab. */
  blurb: string;
};

/** Tokens a template body may contain. Kept as data so the tab can document them. */
export const TEMPLATE_TOKENS = [
  { token: "{{candidate_name}}", description: "The candidate's full name" },
  { token: "{{job_title}}", description: "The job's designation" },
  { token: "{{company}}", description: "Your company name" },
  { token: "{{sender_name}}", description: "The hiring manager sending the message" },
  { token: "{{stage}}", description: "The candidate's current pipeline stage" },
] as const;

export type TemplateValues = {
  candidate_name: string;
  job_title: string;
  company: string;
  sender_name: string;
  stage: string;
};

/** Fills {{tokens}} in a template string. Unknown tokens are left as-is so they are visible. */
export function renderTemplate(text: string, values: TemplateValues): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    key in values ? values[key as keyof TemplateValues] : match,
  );
}

/** A message that was actually sent, kept on the candidate for the drawer timeline. */
export type SentMessage = {
  id: string;
  templateId: string;
  templateName: string;
  channel: MessageChannel;
  intent: MessageIntent;
  subject: string;
  body: string;
  sentAt: number;
  sentBy: string;
};
