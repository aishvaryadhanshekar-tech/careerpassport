import { uid } from "./files";
import { memoryStorage } from "./memoryStore";
import { seedBoard } from "./seedCandidates";
import {
  ARCHIVE_STAGE_ID,
  MESSAGE_CHANNEL_LABELS,
  flagForScore,
  type Candidate,
  type MessageTemplate,
  type PipelineBoard,
  type SentMessage,
  type TemplateValues,
  type TimelineEvent,
  type TripStatus,
} from "./types";
import { renderTemplate } from "./types";

/**
 * Pipeline board storage, keyed by job id.
 *
 * Deliberately NOT hung off JobDraft like trips are. `upsertJobFromDraft`/`publishJob` in
 * jobsStore rebuild JobRecord field-by-field and would silently drop anything new, and a
 * kanban writes on every card move — rewriting the whole draft each drag would be wasteful
 * and would fight the wizard's 2s autosave. Same in-memory backing store, own key.
 */
export const PIPELINE_KEY = "cp.pipeline.v1";

type BoardsById = Record<string, PipelineBoard>;

function readAll(): BoardsById {
  try {
    const raw = memoryStorage.getItem(PIPELINE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as BoardsById;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(boards: BoardsById) {
  memoryStorage.setItem(PIPELINE_KEY, JSON.stringify(boards));
}

function save(jobId: string, board: PipelineBoard): PipelineBoard {
  const all = readAll();
  all[jobId] = board;
  writeAll(all);
  return board;
}

/** Board for a job, seeding prototype data the first time the job is opened. */
export function getBoard(jobId: string): PipelineBoard {
  const all = readAll();
  const existing = all[jobId];
  if (existing && Array.isArray(existing.stages) && Array.isArray(existing.candidates)) {
    return existing;
  }
  return save(jobId, seedBoard());
}

export function getCandidate(jobId: string, candidateId: string): Candidate | null {
  return getBoard(jobId).candidates.find((c) => c.id === candidateId) ?? null;
}

export function countsByStage(board: PipelineBoard): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const stage of board.stages) counts[stage.id] = 0;
  for (const candidate of board.candidates) {
    counts[candidate.stageId] = (counts[candidate.stageId] ?? 0) + 1;
  }
  return counts;
}

/** Candidates still in the earliest, unreviewed stages of the pipeline. */
export function countAwaitingReview(board: PipelineBoard): number {
  const counts = countsByStage(board);
  return (counts.applied ?? 0) + (counts.screened ?? 0);
}

function event(
  label: string,
  actor: TimelineEvent["actor"],
  detail?: string,
): TimelineEvent {
  return { id: uid(), label, actor, at: Date.now(), detail };
}

/** Apply a change to one candidate, leaving every other candidate untouched. */
function patchCandidate(
  jobId: string,
  candidateId: string,
  patch: (candidate: Candidate) => Candidate,
): PipelineBoard {
  const board = getBoard(jobId);
  let changed = false;
  const candidates = board.candidates.map((candidate) => {
    if (candidate.id !== candidateId) return candidate;
    const next = patch(candidate);
    if (next !== candidate) changed = true;
    return next;
  });
  if (!changed) return board;
  return save(jobId, { ...board, candidates });
}

function withEvent(candidate: Candidate, entry: TimelineEvent): Candidate {
  return { ...candidate, timeline: [...candidate.timeline, entry] };
}

// --- stages -----------------------------------------------------------------

export function addStage(jobId: string, label: string): PipelineBoard {
  const trimmed = label.trim();
  if (trimmed === "") return getBoard(jobId);
  const board = getBoard(jobId);
  const stage = { id: uid(), label: trimmed, removable: true };
  // Archive reads as terminal, so new rounds belong before it rather than after.
  const archiveAt = board.stages.findIndex((s) => s.id === ARCHIVE_STAGE_ID);
  const stages = [...board.stages];
  if (archiveAt === -1) stages.push(stage);
  else stages.splice(archiveAt, 0, stage);
  return save(jobId, { ...board, stages });
}

export function renameStage(jobId: string, stageId: string, label: string): PipelineBoard {
  const trimmed = label.trim();
  if (trimmed === "") return getBoard(jobId);
  const board = getBoard(jobId);
  return save(jobId, {
    ...board,
    stages: board.stages.map((s) => (s.id === stageId ? { ...s, label: trimmed } : s)),
  });
}

export function removeStage(jobId: string, stageId: string): PipelineBoard {
  const board = getBoard(jobId);
  const stage = board.stages.find((s) => s.id === stageId);
  if (!stage || !stage.removable) return board;
  const stages = board.stages.filter((s) => s.id !== stageId);
  const fallback = stages[0];
  if (!fallback) return board;
  // Never strand candidates on a stage that no longer exists.
  const candidates = board.candidates.map((c) =>
    c.stageId === stageId
      ? withEvent(
          { ...c, stageId: fallback.id },
          event("Stage removed", "team", `${stage.label} → ${fallback.label}`),
        )
      : c,
  );
  return save(jobId, { stages, candidates });
}

// --- candidates -------------------------------------------------------------

export function moveCandidate(
  jobId: string,
  candidateId: string,
  toStageId: string,
): PipelineBoard {
  const board = getBoard(jobId);
  const to = board.stages.find((s) => s.id === toStageId);
  if (!to) return board;
  return patchCandidate(jobId, candidateId, (candidate) => {
    // A drag that lands back in the same column must not log anything.
    if (candidate.stageId === toStageId) return candidate;
    const from = board.stages.find((s) => s.id === candidate.stageId);
    return withEvent(
      { ...candidate, stageId: toStageId },
      event(`Moved to ${to.label}`, "team", `${from?.label ?? "Unassigned"} → ${to.label}`),
    );
  });
}

/** Same as moveCandidate for every id, in one read/save round trip instead of N. */
export function bulkMoveCandidates(
  jobId: string,
  candidateIds: readonly string[],
  toStageId: string,
): PipelineBoard {
  const board = getBoard(jobId);
  const to = board.stages.find((s) => s.id === toStageId);
  if (!to) return board;
  const ids = new Set(candidateIds);
  let changed = false;
  const candidates = board.candidates.map((candidate) => {
    if (!ids.has(candidate.id) || candidate.stageId === toStageId) return candidate;
    const from = board.stages.find((s) => s.id === candidate.stageId);
    changed = true;
    return withEvent(
      { ...candidate, stageId: toStageId },
      event(`Moved to ${to.label}`, "team", `${from?.label ?? "Unassigned"} → ${to.label}`),
    );
  });
  if (!changed) return board;
  return save(jobId, { ...board, candidates });
}

export function setTripStatus(
  jobId: string,
  candidateId: string,
  status: TripStatus,
): PipelineBoard {
  return patchCandidate(jobId, candidateId, (candidate) => {
    if (candidate.tripStatus === status) return candidate;
    if (status === "sent") {
      return withEvent(
        { ...candidate, tripStatus: "sent", tripSentAt: Date.now() },
        event("Trip sent", "team"),
      );
    }
    if (status === "completed") {
      // Mock evaluation: a stable pseudo-score derived from the id, so a given candidate
      // always returns the same result rather than changing on every click.
      const score = mockScoreFor(candidate.id);
      return withEvent(
        { ...candidate, tripStatus: "completed", tripScore: score, aiFlag: flagForScore(score) },
        event("Trip completed", "candidate", `Scored ${score}`),
      );
    }
    return {
      ...candidate,
      tripStatus: "none",
      tripSentAt: undefined,
      tripScore: undefined,
      aiFlag: undefined,
    };
  });
}

/** Deterministic 45-95 score from the candidate id — no Math.random, stable across reloads. */
function mockScoreFor(candidateId: string): number {
  let hash = 0;
  for (let i = 0; i < candidateId.length; i += 1) {
    hash = (hash * 31 + candidateId.charCodeAt(i)) % 1000;
  }
  return 45 + (hash % 51);
}

export function addNote(
  jobId: string,
  candidateId: string,
  body: string,
  author: string,
): PipelineBoard {
  const trimmed = body.trim();
  if (trimmed === "") return getBoard(jobId);
  const mentions = parseMentions(trimmed);
  return patchCandidate(jobId, candidateId, (candidate) =>
    withEvent(
      {
        ...candidate,
        notes: [
          ...candidate.notes,
          { id: uid(), body: trimmed, author, createdAt: Date.now(), mentions },
        ],
      },
      event(
        mentions.length > 0 ? "Note added with follow-up" : "Note added",
        "team",
        mentions.length > 0 ? `Assigned to ${mentions.join(", ")}` : undefined,
      ),
    ),
  );
}

/** Pulls "@First Last" or "@First" out of note text so follow-ups can be surfaced. */
export function parseMentions(body: string): string[] {
  const found = body.match(/@([A-Z][a-z]+(?: [A-Z][a-z]+)?)/g);
  if (!found) return [];
  return Array.from(new Set(found.map((m) => m.slice(1))));
}

export function setRating(
  jobId: string,
  candidateId: string,
  criterionId: string,
  rating: number,
): PipelineBoard {
  const clamped = Math.max(1, Math.min(5, Math.round(rating)));
  return patchCandidate(jobId, candidateId, (candidate) => {
    const existing = candidate.ratings.find((r) => r.criterionId === criterionId);
    if (existing && existing.rating === clamped) return candidate;
    const ratings = existing
      ? candidate.ratings.map((r) =>
          r.criterionId === criterionId ? { ...r, rating: clamped } : r,
        )
      : [...candidate.ratings, { criterionId, rating: clamped }];
    return { ...candidate, ratings };
  });
}

export function toggleTag(jobId: string, candidateId: string, tag: string): PipelineBoard {
  return patchCandidate(jobId, candidateId, (candidate) => {
    const has = candidate.tags.includes(tag);
    return {
      ...candidate,
      tags: has ? candidate.tags.filter((t) => t !== tag) : [...candidate.tags, tag],
    };
  });
}

export function scheduleInterview(
  jobId: string,
  candidateId: string,
  at: number,
): PipelineBoard {
  return patchCandidate(jobId, candidateId, (candidate) =>
    withEvent({ ...candidate, interviewAt: at }, event("Interview scheduled", "team")),
  );
}

// --- communications ---------------------------------------------------------

/**
 * Records a template send against a candidate.
 *
 * The prototype does not actually deliver anything — it renders the template with the
 * candidate's values and files the result, so the drawer timeline and the message history
 * show exactly what would have gone out. When the Communications module lands, this is the
 * single place that has to start calling it.
 */
export function sendMessage(
  jobId: string,
  candidateId: string,
  template: MessageTemplate,
  values: TemplateValues,
): PipelineBoard {
  return patchCandidate(jobId, candidateId, (candidate) => {
    const message: SentMessage = {
      id: uid(),
      templateId: template.id,
      templateName: template.name,
      channel: template.channel,
      intent: template.intent,
      subject: renderTemplate(template.subject, values),
      body: renderTemplate(template.body, values),
      sentAt: Date.now(),
      sentBy: values.sender_name,
    };
    return withEvent(
      { ...candidate, messages: [...(candidate.messages ?? []), message] },
      event(`Sent “${template.name}”`, "team", MESSAGE_CHANNEL_LABELS[template.channel]),
    );
  });
}

/**
 * Same as sendMessage for every id, in one read/save round trip instead of N.
 * Takes a values-per-candidate function since {{stage}} (and potentially other tokens)
 * differ across a mixed-stage selection.
 */
export function bulkSendMessage(
  jobId: string,
  candidateIds: readonly string[],
  template: MessageTemplate,
  valuesForCandidate: (candidate: Candidate) => TemplateValues,
): PipelineBoard {
  const board = getBoard(jobId);
  const ids = new Set(candidateIds);
  let changed = false;
  const candidates = board.candidates.map((candidate) => {
    if (!ids.has(candidate.id)) return candidate;
    const values = valuesForCandidate(candidate);
    const message: SentMessage = {
      id: uid(),
      templateId: template.id,
      templateName: template.name,
      channel: template.channel,
      intent: template.intent,
      subject: renderTemplate(template.subject, values),
      body: renderTemplate(template.body, values),
      sentAt: Date.now(),
      sentBy: values.sender_name,
    };
    changed = true;
    return withEvent(
      { ...candidate, messages: [...(candidate.messages ?? []), message] },
      event(`Sent “${template.name}”`, "team", MESSAGE_CHANNEL_LABELS[template.channel]),
    );
  });
  if (!changed) return board;
  return save(jobId, { ...board, candidates });
}
