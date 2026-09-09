import { estimateApplicationOverview } from "../applicationForm";
import type { JobRecord } from "../jobsStore";
import {
  coveredCount,
  REQUIRED_COVERAGE_IDS,
  type CanvasNodeId,
  type CanvasNodeStatus,
  type JobDraft,
} from "../types";

/** Job Details is "done" by the same rule the linear wizard uses to unlock Continue. */
export function jobDetailsDone(draft: JobDraft): boolean {
  return coveredCount(draft.fields, draft.salaryCurrency) === REQUIRED_COVERAGE_IDS.length;
}

export function jobDetailsInProgress(draft: JobDraft): boolean {
  return draft.analysedOnce || draft.transcript.trim() !== "" || draft.attachments.length > 0;
}

/**
 * The linear wizard never gates "Continue" on Role Profile edits — it's a review/refine step,
 * always allowed to proceed. The canvas node follows the same rule: simply opening it once (which
 * sets roleProfileGenerated via withRoleProfile/withPreview) is enough to mark it done.
 */
export function roleProfileDone(draft: JobDraft): boolean {
  return draft.roleProfileGenerated;
}

/** "Minimum application content" per the plan — seeded and has at least one item to answer. */
export function applicationDone(draft: JobDraft): boolean {
  if (!draft.application) return false;
  return estimateApplicationOverview(draft.application).totalItems > 0;
}

export function publishDone(job: JobRecord | null): boolean {
  return job?.status === "Published";
}

export type CanvasStatuses = Record<CanvasNodeId, CanvasNodeStatus>;

/**
 * Every node's status derives purely from the existing JobDraft/JobRecord — nothing new is
 * persisted. Unlock order is linear: jobDetails -> roleProfile -> application -> publish,
 * mirroring the wizard's step order, but all nodes are visible up front so the canvas can show
 * what's ahead.
 */
export function getCanvasStatuses(draft: JobDraft, job: JobRecord | null): CanvasStatuses {
  const jdDone = jobDetailsDone(draft);
  const rpDone = roleProfileDone(draft);
  const appDone = applicationDone(draft);
  const pubDone = publishDone(job);

  const jobDetails: CanvasNodeStatus = jdDone
    ? "done"
    : jobDetailsInProgress(draft)
      ? "in_progress"
      : "active";

  const roleProfile: CanvasNodeStatus = !jdDone ? "pending" : rpDone ? "done" : "active";

  const application: CanvasNodeStatus = !rpDone
    ? "pending"
    : appDone
      ? "done"
      : draft.application
        ? "in_progress"
        : "active";

  const publish: CanvasNodeStatus = !appDone ? "pending" : pubDone ? "done" : "active";

  const funnelStatus: CanvasNodeStatus = appDone ? "active" : "pending";
  return { jobDetails, roleProfile, application, publish, prospects: funnelStatus, pipeline: funnelStatus, interview: funnelStatus };
}

export function isNodeUnlocked(id: CanvasNodeId, statuses: CanvasStatuses): boolean {
  return statuses[id] !== "pending";
}

export type CanvasNudge = { message: string; tone: "todo" | "progress" | "success" };

/** Deterministic "what to do next" guidance — same mocked-AI philosophy as the rest of the app. */
export function getCanvasNudge(draft: JobDraft, statuses: CanvasStatuses): CanvasNudge {
  if (statuses.publish === "done") {
    return { message: "Published — candidates can now apply.", tone: "success" };
  }
  if (statuses.publish === "active") {
    return { message: "Review the summary, then publish when you're ready.", tone: "progress" };
  }
  if (statuses.application === "active" && !draft.application) {
    return { message: "Role profile's set — let's build the application form.", tone: "progress" };
  }
  if (statuses.application === "active" || statuses.application === "in_progress") {
    return { message: "Add a question or two so candidates know what to expect.", tone: "progress" };
  }
  if (statuses.roleProfile === "active") {
    return { message: "Review the role profile, then move on to the application.", tone: "progress" };
  }
  if (statuses.jobDetails === "in_progress") {
    return { message: "A few required details are still missing.", tone: "todo" };
  }
  return { message: "Start by telling me about this role — type, talk, or upload a JD.", tone: "todo" };
}
