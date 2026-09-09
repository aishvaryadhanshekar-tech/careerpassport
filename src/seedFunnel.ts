import { getBoard } from "./candidatesStore";
import { baseFunnel, expandFunnel, node, type FunnelNode } from "./canvasJob/funnelModel";
import { migratePipeline } from "./canvasJob/pipelineModel";
import { withCapabilities } from "./hiring/catalog";
import { getJob } from "./jobsStore";
import type { Trip } from "./types";

/**
 * Gives each demo job its own canvas graph — real Trip nodes (linked to the job's actual
 * `draft.trips`, not auto-generated placeholders) landing on whichever pipeline stage that Trip
 * was built for, plus a tailored invite message per Trip. Without this, every job's canvas
 * synthesizes the same generic empty skeleton (`migratePipeline` with no trips/activities
 * attached) the first time it's opened, which is why every demo job's Pipeline tab looked
 * identical regardless of how different their Trips/candidates were.
 *
 * Canvas state lives in real `localStorage` (`cp.funnel.<jobId>`), not the sessionStorage-backed
 * `memoryStorage` the rest of the seed data uses (see FunnelWorkspace's `read()`), so this writes
 * there directly. It still resets together with everything else: `resetPrototypeOnRefresh` clears
 * every `cp.`-prefixed localStorage key, this key included.
 */
function localStore(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function durationOf(trip: Trip): number {
  return trip.stages.reduce((sum, stage) => sum + stage.durationMinutes, 0);
}

function inviteMessageFor(trip: Trip, designation: string): { subject: string; body: string } {
  const roundWord = trip.stages.length === 1 ? "round" : "rounds";
  return {
    subject: `Your next step for ${designation}: ${trip.title}`,
    body:
      `Hi {{candidate_name}},\n\nAs the next step for ${designation}, please complete ` +
      `"${trip.title}" — ${trip.stages.length} ${roundWord}, about ${durationOf(trip)} minutes ` +
      `total.\n\nThanks,\n{{sender_name}}`,
  };
}

function buildFunnelNodes(jobId: string): FunnelNode[] | null {
  const job = getJob(jobId);
  if (!job) return null;
  const board = getBoard(jobId);
  const draft = job.snapshot;
  const nodes = migratePipeline(withCapabilities(expandFunnel(baseFunnel())), board);
  const stageNode = (stageKey: string | null) =>
    nodes.find((item) => item.kind === "stage" && item.stageKey === stageKey);
  const designation = draft.fields.designation.value.trim() || "this role";

  for (const trip of draft.trips) {
    const parentStage = stageNode(trip.pipelineStageId) ?? stageNode("screened");
    if (!parentStage) continue;

    const tripNode = node("trip", trip.title, parentStage.id, `seed-trip-${trip.id}`);
    tripNode.tripId = trip.id;
    tripNode.description = trip.spine;
    tripNode.duration = durationOf(trip);
    nodes.push(tripNode);

    const { subject, body } = inviteMessageFor(trip, designation);
    const message = node("communication", `${trip.title} invite`, tripNode.id, `seed-invite-${trip.id}`);
    message.subject = subject;
    message.body = body;
    message.trigger = `When ${trip.title} is assigned`;
    nodes.push(message);
  }

  return nodes;
}

/** One-time per browser session/reset — mirrors ensureSeedJobs' own idempotency guard. */
const FUNNEL_SEEDED_KEY = "cp.funnel.seeded.v1";

export function ensureSeedFunnels(jobIds: string[]): void {
  const storage = localStore();
  if (!storage) return;
  if (storage.getItem(FUNNEL_SEEDED_KEY)) return;
  storage.setItem(FUNNEL_SEEDED_KEY, "1");

  for (const jobId of jobIds) {
    const key = `cp.funnel.${jobId}`;
    if (storage.getItem(key)) continue; // Respect any canvas the user has already saved over.
    const job = getJob(jobId);
    const nodes = buildFunnelNodes(jobId);
    if (!job || !nodes) continue;
    const saved = {
      nodes,
      draft: job.snapshot,
      board: getBoard(jobId),
      started: true,
      published: job.status === "Published",
    };
    try {
      storage.setItem(key, JSON.stringify(saved));
    } catch {
      // Storage full/unavailable — the canvas falls back to its generic default graph.
    }
  }
}
