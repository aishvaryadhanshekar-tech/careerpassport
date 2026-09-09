import { createDraft, type JobDraft } from '../types';
import { seedApplication } from '../seedApplication';
import { templateFunnel, node } from '../canvasJob/funnelModel';

export const DEMO_ROLES = ['Senior Product Designer', 'Software Engineer', 'Account Executive'];
export function demoDraft(role = DEMO_ROLES[0]): JobDraft {
  const draft = createDraft();
  const design = /design/i.test(role); const sales = /account|sales/i.test(role);
  const values = {
    designation: role, experienceType: 'Full-time', location: 'Bangalore', workMode: 'Hybrid',
    experienceYears: '5–8', salary: '35–50L', industryType: 'B2B SaaS', companyType: 'Product',
    mustHaves: design ? 'Strong product thinking, a portfolio of shipped work, interaction design, and cross-functional collaboration.' : sales ? 'Enterprise sales experience, consultative discovery, pipeline ownership, and clear communication.' : 'Production engineering experience, system design, automated testing, and cross-functional collaboration.',
  };
  for (const [key, value] of Object.entries(values)) draft.fields[key as keyof typeof draft.fields] = { value, source: 'extracted' };
  draft.salaryCurrency = 'INR'; draft.analysedOnce = true;
  draft.transcript = `We are hiring a ${role} in Bangalore, hybrid, with 5–8 years of experience. ${values.mustHaves}`;
  draft.application = seedApplication(draft);
  return draft;
}
export function demoNodes(role: string) {
  const nodes = templateFunnel(role);
  if (/sales|account/i.test(role)) {
    const rounds = nodes.filter(n => n.kind === 'round');
    rounds[0].title = 'Discovery & sales strategy';
    nodes.filter(n => n.kind === 'trip').forEach((n, i) => { n.title = ['Customer discovery', 'Account strategy', 'Negotiation scenario'][i] ?? 'Sales work sample'; n.tripType = 'Case study'; });
  }
  const acknowledgement = node('communication', 'Application received', 'prospects', 'demo-acknowledgement');
  acknowledgement.body = 'Hi {{candidate_name}},\n\nThanks for applying for {{job_title}}. We have received your application and will review it shortly.\n\nThe hiring team';
  acknowledgement.subject = 'Your application for {{job_title}}';
  nodes.push(acknowledgement);
  const reminder = node('communication', 'Assessment reminder', 'pipeline', 'demo-reminder');
  reminder.trigger = 'After a delay'; reminder.delay = 3;
  reminder.subject = 'A reminder about your assessment';
  reminder.body = 'Hi {{candidate_name}}, your assessment for {{job_title}} is ready. Please let us know if you need more time.';
  nodes.push(reminder);
  const lowScore = node('communication', 'Assessment follow-up', 'pipeline', 'demo-low-score');
  lowScore.trigger = 'When score below threshold'; lowScore.threshold = 50;
  lowScore.subject = 'An update on {{job_title}}';
  lowScore.body = 'Hi {{candidate_name}}, thank you for completing the assessment. We would like to discuss your approach in more detail.';
  nodes.push(lowScore);
  return nodes;
}
export const MOCK_SOURCES = [
  { id: 'drive-design', provider: 'Google Drive', title: 'Product Design — hiring brief', detail: 'People / Hiring / Design brief', role: 'Senior Product Designer' },
  { id: 'drive-engineering', provider: 'Google Drive', title: 'Engineering role requirements', detail: 'Engineering / Team growth', role: 'Software Engineer' },
  { id: 'slack-sales', provider: 'Slack', title: '#hiring-sales · Role alignment', detail: 'Hiring manager notes and success criteria', role: 'Account Executive' },
];
