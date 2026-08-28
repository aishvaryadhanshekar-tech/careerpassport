import { useEffect, useRef, useState, type JSX } from "react";
import { addNote, moveCandidate, setRating, toggleTag } from "../candidatesStore";
import { PROFILE } from "../profile";
import {
  AI_FLAG_LABELS,
  CANDIDATE_TAG_SUGGESTIONS,
  type Candidate,
  type CandidateNote,
  type EvaluationCriterion,
  type PipelineBoard,
  type PipelineStage,
  type TimelineEvent,
} from "../types";
import "./drawer.css";

type DocTab = "resume" | "application" | "trip" | "evaluation" | "communications";
type SideTab = "feedback" | "timeline" | "notes";

function formatWhen(at: number): string {
  return new Date(at).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Renders @mentions as highlighted spans without dangerouslySetInnerHTML. */
function NoteBody({ body }: { body: string }): JSX.Element {
  const parts = body.split(/(@[A-Z][a-z]+(?: [A-Z][a-z]+)?)/g);
  return (
    <p className="note-item-body">
      {parts.map((part, i) =>
        part.startsWith("@") ? (
          <span className="note-mention" key={i}>
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  );
}

function NoteList({ notes }: { notes: CandidateNote[] }): JSX.Element {
  if (notes.length === 0) {
    return <p className="drawer-empty">No notes yet.</p>;
  }
  return (
    <ul className="note-list">
      {notes
        .slice()
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((note) => (
          <li className="note-item" key={note.id}>
            <div className="note-item-head">
              <span className="note-item-author">{note.author}</span>
              <span>{formatWhen(note.createdAt)}</span>
            </div>
            <NoteBody body={note.body} />
            {note.mentions.length > 0 ? (
              <p className="note-assigned">Follow-up assigned to {note.mentions.join(", ")}</p>
            ) : null}
          </li>
        ))}
    </ul>
  );
}

function NoteComposer({ onSubmit }: { onSubmit: (body: string) => void }): JSX.Element {
  const [body, setBody] = useState("");
  const [recording, setRecording] = useState(false);

  return (
    <div className="note-composer">
      <textarea
        value={body}
        aria-label="Add a note"
        placeholder="Add a note… Type @ to assign a task"
        onChange={(e) => setBody(e.target.value)}
      />
      <div className="note-composer-actions">
        <button
          type="button"
          className={`note-mini-btn${recording ? " is-recording" : ""}`}
          aria-pressed={recording}
          onClick={() => setRecording((v) => !v)}
        >
          {recording ? "● Recording…" : "Voice"}
        </button>
        <button type="button" className="note-mini-btn">
          Schedule
        </button>
        <span className="spacer" />
        <button
          type="button"
          className="btn primary note-mini-btn"
          disabled={body.trim() === ""}
          onClick={() => {
            onSubmit(body);
            setBody("");
          }}
        >
          Post
        </button>
      </div>
    </div>
  );
}

function TimelineList({ events }: { events: TimelineEvent[] }): JSX.Element {
  if (events.length === 0) return <p className="drawer-empty">Nothing has happened yet.</p>;
  return (
    <ul className="timeline">
      {events
        .slice()
        .sort((a, b) => b.at - a.at)
        .map((e) => (
          <li className="timeline-item" key={e.id}>
            <span className={`timeline-actor ${e.actor}`}>
              {e.actor === "candidate" ? "Candidate" : "Your team"}
            </span>
            <span className="timeline-label">{e.label}</span>
            {e.detail ? <span className="timeline-detail">{e.detail}</span> : null}
            <span className="timeline-when">{formatWhen(e.at)}</span>
          </li>
        ))}
    </ul>
  );
}

function SkillMatrix({
  criteria,
  candidate,
  onRate,
}: {
  criteria: EvaluationCriterion[];
  candidate: Candidate;
  onRate: (criterionId: string, rating: number) => void;
}): JSX.Element {
  if (criteria.length === 0) {
    return (
      <p className="drawer-empty">
        No evaluation criteria defined for this job yet — add them in the Role Profile.
      </p>
    );
  }
  return (
    <div>
      {criteria.map((criterion) => {
        const current = candidate.ratings.find((r) => r.criterionId === criterion.id)?.rating;
        return (
          <div className="skill-row" key={criterion.id}>
            <span className="skill-row-label">{criterion.label}</span>
            <div
              className="skill-scale"
              role="radiogroup"
              aria-label={`Rating for ${criterion.label}`}
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={current === value}
                  className={`skill-dot${current === value ? " on" : ""}`}
                  onClick={() => onRate(criterion.id, value)}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ResumeViewer({ candidate }: { candidate: Candidate }): JSX.Element {
  return (
    <div className="resume-frame">
      <div className="resume-toolbar">
        <span>{candidate.resumeFileName}</span>
        <button type="button" className="note-mini-btn">
          Open CV
        </button>
      </div>
      {/* Prototype: there is no real PDF to embed, so this is a greeked stand-in. */}
      <div className="resume-page" aria-label={`Preview of ${candidate.resumeFileName}`}>
        <div className="resume-line title" />
        <div className="resume-line" style={{ width: "58%" }} />
        <div className="resume-line heading" />
        <div className="resume-line" />
        <div className="resume-line" style={{ width: "92%" }} />
        <div className="resume-line" style={{ width: "76%" }} />
        <div className="resume-line heading" />
        <div className="resume-line" style={{ width: "88%" }} />
        <div className="resume-line" style={{ width: "94%" }} />
        <div className="resume-line" style={{ width: "63%" }} />
      </div>
    </div>
  );
}

export function CandidateDrawer({
  jobId,
  candidate,
  criteria,
  stages,
  onClose,
  onBoardChange,
}: {
  jobId: string;
  candidate: Candidate;
  criteria: EvaluationCriterion[];
  stages: PipelineStage[];
  onClose: () => void;
  onBoardChange: (board: PipelineBoard) => void;
}): JSX.Element {
  const [docTab, setDocTab] = useState<DocTab>("resume");
  const [sideTab, setSideTab] = useState<SideTab>("feedback");
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const origin =
    candidate.origin.kind === "applied"
      ? "Application submitted"
      : `Submitted by ${candidate.origin.by}`;

  const docTabs: { id: DocTab; label: string }[] = [
    { id: "resume", label: "Résumé" },
    { id: "application", label: "Application form" },
    { id: "trip", label: "Trip" },
    { id: "evaluation", label: "Evaluation" },
    { id: "communications", label: "Communications" },
  ];

  return (
    <div className="drawer-backdrop" role="presentation" onClick={onClose}>
      <div
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`${candidate.name} details`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="drawer-head">
          <div className="drawer-identity">
            <div className="drawer-name-row">
              <h2 className="drawer-name">{candidate.name}</h2>
              <span className="drawer-origin">{origin}</span>
              {candidate.aiFlag ? (
                <span className={`ai-flag ai-flag-${candidate.aiFlag}`}>
                  {AI_FLAG_LABELS[candidate.aiFlag]}
                </span>
              ) : null}
            </div>
            <p className="drawer-contact">
              <span>{candidate.email}</span>
              <span>·</span>
              <span>{candidate.phone}</span>
              <span>·</span>
              <span>{candidate.location}</span>
            </p>
          </div>
          <div className="drawer-head-actions">
            <button type="button" className="btn ghost">
              Update CV
            </button>
            <select
              className="pill-select select-icon"
              aria-label="Stage"
              value={candidate.stageId}
              onChange={(e) => onBoardChange(moveCandidate(jobId, candidate.id, e.target.value))}
            >
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              ref={closeRef}
              className="drawer-close"
              aria-label="Close"
              onClick={onClose}
            >
              ×
            </button>
          </div>
        </header>

        <div className="drawer-body">
          <div className="drawer-left">
            <div className="drawer-tabbar" role="tablist" aria-label="Candidate documents">
              {docTabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={docTab === t.id}
                  className={`drawer-tab${docTab === t.id ? " active" : ""}`}
                  onClick={() => setDocTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="drawer-scroll">
              {docTab === "resume" ? <ResumeViewer candidate={candidate} /> : null}
              {docTab === "application" ? (
                <div className="drawer-panel">
                  <h3>Application form</h3>
                  <p className="drawer-empty">
                    Submitted {formatWhen(candidate.appliedAt)}. Answers will render here once the
                    candidate-facing form is wired to real submissions.
                  </p>
                </div>
              ) : null}
              {docTab === "trip" ? (
                <div className="drawer-panel">
                  <h3>Trip</h3>
                  {candidate.tripStatus === "none" ? (
                    <p className="drawer-empty">No trip sent yet.</p>
                  ) : candidate.tripStatus === "sent" ? (
                    <p className="drawer-empty">
                      Trip sent{candidate.tripSentAt ? ` ${formatWhen(candidate.tripSentAt)}` : ""} —
                      waiting on the candidate.
                    </p>
                  ) : (
                    <p className="drawer-empty">
                      Completed with a score of {candidate.tripScore}.{" "}
                      {candidate.aiFlag ? AI_FLAG_LABELS[candidate.aiFlag] : ""}
                    </p>
                  )}
                </div>
              ) : null}
              {docTab === "evaluation" ? (
                <div className="drawer-panel">
                  <h3>Evaluation</h3>
                  <SkillMatrix
                    criteria={criteria}
                    candidate={candidate}
                    onRate={(criterionId, rating) =>
                      onBoardChange(setRating(jobId, candidate.id, criterionId, rating))
                    }
                  />
                </div>
              ) : null}
              {docTab === "communications" ? (
                <div className="drawer-panel">
                  <h3>Communications</h3>
                  <p className="drawer-empty">No messages exchanged yet.</p>
                </div>
              ) : null}
            </div>
          </div>

          <aside className="drawer-right">
            <div className="drawer-tabbar" role="tablist" aria-label="Candidate activity">
              {(
                [
                  { id: "feedback", label: "Feedback" },
                  { id: "timeline", label: "Timeline" },
                  { id: "notes", label: "Notes" },
                ] as { id: SideTab; label: string }[]
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={sideTab === t.id}
                  className={`drawer-tab${sideTab === t.id ? " active" : ""}`}
                  onClick={() => setSideTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="drawer-scroll">
              {sideTab === "feedback" ? (
                <>
                  <div className="drawer-panel">
                    <h3>Add a note</h3>
                    <NoteComposer
                      onSubmit={(body) =>
                        onBoardChange(addNote(jobId, candidate.id, body, PROFILE.name))
                      }
                    />
                  </div>
                  <div className="drawer-panel">
                    <h3>Candidate attributes</h3>
                    <div className="tag-grid">
                      {CANDIDATE_TAG_SUGGESTIONS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          aria-pressed={candidate.tags.includes(tag)}
                          className={`tag-toggle${candidate.tags.includes(tag) ? " on" : ""}`}
                          onClick={() => onBoardChange(toggleTag(jobId, candidate.id, tag))}
                        >
                          {tag}
                        </button>
                      ))}
                      <button type="button" className="tag-toggle">
                        + Add tag
                      </button>
                    </div>
                  </div>
                  <div className="drawer-panel">
                    <h3>Skill feedback</h3>
                    <SkillMatrix
                      criteria={criteria}
                      candidate={candidate}
                      onRate={(criterionId, rating) =>
                        onBoardChange(setRating(jobId, candidate.id, criterionId, rating))
                      }
                    />
                  </div>
                </>
              ) : null}

              {sideTab === "timeline" ? (
                <div className="drawer-panel">
                  <h3>Timeline</h3>
                  <TimelineList events={candidate.timeline} />
                </div>
              ) : null}

              {sideTab === "notes" ? (
                <div className="drawer-panel">
                  <h3>Notes</h3>
                  <NoteList notes={candidate.notes} />
                  <NoteComposer
                    onSubmit={(body) =>
                      onBoardChange(addNote(jobId, candidate.id, body, PROFILE.name))
                    }
                  />
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
