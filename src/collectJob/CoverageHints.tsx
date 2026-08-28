import { useEffect, useMemo, useRef } from "react";
import {
  COVERAGE_LABELS,
  REQUIRED_COVERAGE_IDS,
  type CoverageId,
  type JobDraft,
} from "../types";
import { BulbIcon } from "./icons";
import { mentionedCoverage } from "./mentionedCoverage";

export function CoverageHints({
  draft,
  open,
  onToggle,
  onClose,
  onJump,
}: {
  draft: JobDraft;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onJump: (id: CoverageId) => void;
}) {
  const hintsRef = useRef<HTMLDivElement>(null);

  // Transcript detection re-runs a regex pass, so memoise on the inputs that
  // actually affect it rather than on every render.
  const mentioned = useMemo(
    () => mentionedCoverage(draft),
    [draft.transcript, draft.fields, draft.salaryCurrency],
  );

  const total = REQUIRED_COVERAGE_IDS.length;

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (hintsRef.current && !hintsRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="hints-wrap" ref={hintsRef}>
      <button
        type="button"
        className="hints-btn"
        aria-label={`Hints — ${mentioned.size} of ${total} covered`}
        aria-expanded={open}
        aria-controls="hints-popover"
        onClick={onToggle}
      >
        <BulbIcon />
        <span className="hints-count">{`${mentioned.size}/${total}`}</span>
      </button>
      {open ? (
        <div
          id="hints-popover"
          className="hints-popover"
          role="dialog"
          aria-label="Coverage hints"
        >
          <p className="hints-intro">
            Mention these while you talk — we’ll extract them when you
            Continue.
          </p>
          <ul className="hints-list">
            {REQUIRED_COVERAGE_IDS.map((id) => (
              <li key={id}>
                <button
                  type="button"
                  className={`hint-item${mentioned.has(id) ? " mentioned" : ""}`}
                  onClick={() => onJump(id)}
                >
                  {COVERAGE_LABELS[id]}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
