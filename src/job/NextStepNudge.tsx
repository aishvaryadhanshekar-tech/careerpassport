import { Link } from "react-router-dom";
import { PROFILE } from "../profile";
import { REQUIRED_COVERAGE_IDS } from "../types/jobs";
import type { JobRecord } from "../jobsStore";
import { inviteTemplateForStage } from "../communications/templates";
import { SendMessageMenu } from "../communications/SendMessageMenu";
import { countAwaitingReview } from "../candidatesStore";
import type { Candidate, JobDraft, MessageTemplate, PipelineBoard, TemplateValues } from "../types";

const COMPANY_NAME = "Conte";

export type NudgeState = {
  message: string;
  linkTo?: string;
  linkLabel?: string;
};

/** First matching next step wins — draft-stage guidance, unchanged from before. */
export function getNextStep(
  jobId: string,
  job: JobRecord,
  draft: JobDraft,
  board: PipelineBoard,
): NudgeState | null {
  const missingRequired = REQUIRED_COVERAGE_IDS.some(
    (id) => draft.fields[id].value.trim() === "",
  );
  if (missingRequired) {
    return { message: "Finish role details before publishing." };
  }

  if (draft.application === null) {
    return { message: "Set up application questions." };
  }

  if (!job.publishDestinations.internal && !job.publishDestinations.marketplace) {
    return { message: "Publish this job to start receiving candidates." };
  }

  if (board.candidates.length === 0) {
    return { message: "No candidates yet — consider sourcing." };
  }

  const awaitingReview = countAwaitingReview(board);
  if (awaitingReview > 0) {
    return {
      message: `${awaitingReview} candidate${awaitingReview === 1 ? "" : "s"} awaiting your review.`,
      linkTo: `/jobs/${jobId}/pipeline`,
      linkLabel: "Review in Pipeline",
    };
  }

  return null;
}

/** What the agent has already done — informational, no action needed from the recruiter. */
export function agentSummaryFor(board: PipelineBoard) {
  return {
    sourced: board.candidates.length,
    tripsCompleted: board.candidates.filter((c) => c.tripStatus === "completed").length,
    messagesSent: board.candidates.reduce((sum, c) => sum + (c.messages?.length ?? 0), 0),
  };
}

const CONTACTABLE_STAGES = new Set(["applied", "screened", "interviewing"]);

/** What still needs a human call, surfaced with enough structure to act on inline. */
export function needsReviewFor(board: PipelineBoard) {
  const awaitingReview = countAwaitingReview(board);
  const tripReview = board.candidates.filter(
    (c) => c.tripStatus === "completed" && (c.stageId === "applied" || c.stageId === "screened"),
  ).length;
  const flagged = board.candidates.filter((c) => c.aiFlag && c.aiFlag !== "recommended").length;
  const notContacted = board.candidates.filter(
    (c) => CONTACTABLE_STAGES.has(c.stageId) && (c.messages?.length ?? 0) === 0,
  );
  return { awaitingReview, tripReview, flagged, notContacted };
}

function templateValuesFor(candidate: Candidate, jobTitle: string, stageLabel: string): TemplateValues {
  return {
    candidate_name: candidate.name,
    job_title: jobTitle,
    company: COMPANY_NAME,
    sender_name: PROFILE.name,
    stage: stageLabel,
  };
}

async function copyInviteLink(jobId: string, candidateId: string) {
  const link = `${window.location.origin}/jobs/${jobId}/apply?ref=${candidateId}`;
  try {
    await navigator.clipboard.writeText(link);
  } catch {
    // ignore clipboard failures — this is a cosmetic convenience, not the primary action
  }
}

/**
 * Top-of-Overview summary. Pre-publish it's a single priority-ordered callout (unchanged
 * behavior); once published it becomes a two-part panel reflecting the product's real model —
 * the agent gathers and acts, the human evaluates and decides — so "done for you" is purely
 * informational and "needs your call" is where the recruiter actually has to do something.
 */
export function JobActionSummary({
  jobId,
  job,
  draft,
  board,
  onSendMessage,
}: {
  jobId: string;
  job: JobRecord;
  draft: JobDraft;
  board: PipelineBoard;
  onSendMessage: (candidateId: string, template: MessageTemplate, values: TemplateValues) => void;
}) {
  if (job.status !== "Published") {
    const nudge = getNextStep(jobId, job, draft, board);
    if (!nudge) return null;
    return (
      <div className="next-step-nudge">
        <span>{nudge.message}</span>
        {nudge.linkTo ? (
          <Link to={nudge.linkTo} className="next-step-nudge-link">
            {nudge.linkLabel}
          </Link>
        ) : null}
      </div>
    );
  }

  const jobTitle = draft.fields.designation.value.trim() || "this role";
  const { sourced, tripsCompleted, messagesSent } = agentSummaryFor(board);
  const { awaitingReview, tripReview, flagged, notContacted } = needsReviewFor(board);
  const hasAnyNeedsCall = awaitingReview > 0 || tripReview > 0 || flagged > 0 || notContacted.length > 0;

  return (
    <div className="job-action-summary">
      <section className="job-action-summary-section">
        <h3>Done for you</h3>
        <ul className="job-action-summary-stats">
          <li>{sourced} candidate{sourced === 1 ? "" : "s"} sourced</li>
          <li>{tripsCompleted} Trip{tripsCompleted === 1 ? "" : "s"} completed and scored</li>
          <li>{messagesSent} message{messagesSent === 1 ? "" : "s"} sent</li>
        </ul>
      </section>

      <section className="job-action-summary-section">
        <h3>Needs your call</h3>
        {!hasAnyNeedsCall ? (
          <p className="jd-empty">Nothing needs you right now.</p>
        ) : (
          <>
            <ul className="job-action-summary-stats">
              {awaitingReview > 0 ? (
                <li>
                  {awaitingReview} candidate{awaitingReview === 1 ? "" : "s"} awaiting your review
                  <Link to={`/jobs/${jobId}/pipeline`} className="next-step-nudge-link">
                    Review in Pipeline
                  </Link>
                </li>
              ) : null}
              {tripReview > 0 ? (
                <li>
                  {tripReview} Trip result{tripReview === 1 ? "" : "s"} ready for your review
                  <Link to={`/jobs/${jobId}/pipeline`} className="next-step-nudge-link">
                    Review in Pipeline
                  </Link>
                </li>
              ) : null}
              {flagged > 0 ? (
                <li>
                  {flagged} candidate{flagged === 1 ? "" : "s"} flagged by the agent for a closer look
                  <Link to={`/jobs/${jobId}/pipeline`} className="next-step-nudge-link">
                    Review in Pipeline
                  </Link>
                </li>
              ) : null}
            </ul>

            {notContacted.length > 0 ? (
              <div className="job-action-summary-contact">
                <p className="job-action-summary-contact-label">
                  {notContacted.length} candidate{notContacted.length === 1 ? "" : "s"} not yet contacted
                </p>
                {notContacted.slice(0, 3).map((candidate) => {
                  const stage = board.stages.find((s) => s.id === candidate.stageId);
                  const stageLabel = stage?.label ?? "current";
                  const values = templateValuesFor(candidate, jobTitle, stageLabel);
                  const invite = inviteTemplateForStage(candidate.stageId);
                  return (
                    <div className="job-action-row" key={candidate.id}>
                      <span className="job-action-row-name">{candidate.name}</span>
                      <span className="job-action-row-stage">{stageLabel}</span>
                      <div className="job-action-row-actions">
                        <SendMessageMenu
                          stageId={candidate.stageId}
                          values={values}
                          buttonClassName="btn btn-sm"
                          onSend={(template) => onSendMessage(candidate.id, template, values)}
                        />
                        {invite ? (
                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={() => onSendMessage(candidate.id, invite, values)}
                          >
                            Send invite
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="btn ghost btn-sm"
                          onClick={() => copyInviteLink(jobId, candidate.id)}
                        >
                          Copy invite link
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
