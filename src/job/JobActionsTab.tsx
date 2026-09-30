import { useState } from "react";
import { getBoard, sendMessage } from "../candidatesStore";
import { useJobContext } from "./jobContext";
import { JobActionSummary, needsReviewFor } from "./NextStepNudge";

export function JobActionsTab() {
  const { jobId, job, draft } = useJobContext();
  const [board, setBoard] = useState(() => getBoard(jobId));

  const totalApplicants = board.candidates.length;
  const { awaitingReview, tripReview, flagged } = needsReviewFor(board);

  return (
    <div className="job-actions-tab">
      {job.status === "Published" ? (
        <div className="ja-stats-grid">
          <div className="ja-stat-card ja-stat-total">
            <span className="ja-stat-value">{totalApplicants}</span>
            <span className="ja-stat-label">Total applicants</span>
          </div>
          <div className="ja-stat-card ja-stat-review">
            <span className="ja-stat-value">{awaitingReview}</span>
            <span className="ja-stat-label">Awaiting your review</span>
          </div>
          <div className="ja-stat-card ja-stat-flagged">
            <span className="ja-stat-value">{flagged}</span>
            <span className="ja-stat-label">Flagged by AI</span>
          </div>
          <div className="ja-stat-card ja-stat-trip">
            <span className="ja-stat-value">{tripReview}</span>
            <span className="ja-stat-label">Trip results ready</span>
          </div>
        </div>
      ) : null}
      <JobActionSummary
        jobId={jobId}
        job={job}
        draft={draft}
        board={board}
        onSendMessage={(candidateId, template, values) =>
          setBoard(sendMessage(jobId, candidateId, template, values))
        }
      />
    </div>
  );
}
