import { useEffect, type JSX } from "react";
import "./PublishSuccess.css";
import type { PublishDestinations } from "./types";

/** How long the celebration holds before handing off to the share composer. */
export const PUBLISH_SUCCESS_MS = 1500;

/**
 * Fixed confetti geometry. Deliberately a constant rather than Math.random() so the burst is
 * identical on every render and every reload — a re-render mid-animation would otherwise
 * reshuffle the pieces and make them jump.
 *
 * x = horizontal start (%), delay/duration in ms, rot = end rotation (deg).
 */
const CONFETTI = [
  { x: 8, delay: 0, duration: 2100, rot: 320, color: "a" },
  { x: 18, delay: 180, duration: 2400, rot: -240, color: "b" },
  { x: 27, delay: 60, duration: 1900, rot: 180, color: "c" },
  { x: 36, delay: 300, duration: 2300, rot: -300, color: "d" },
  { x: 45, delay: 120, duration: 2000, rot: 260, color: "b" },
  { x: 54, delay: 260, duration: 2500, rot: -160, color: "a" },
  { x: 63, delay: 40, duration: 2200, rot: 340, color: "c" },
  { x: 72, delay: 220, duration: 1950, rot: -280, color: "d" },
  { x: 81, delay: 100, duration: 2350, rot: 200, color: "b" },
  { x: 90, delay: 320, duration: 2050, rot: -220, color: "a" },
  { x: 13, delay: 400, duration: 2250, rot: 300, color: "d" },
  { x: 68, delay: 460, duration: 2150, rot: -190, color: "c" },
] as const;

export function PublishSuccess({
  jobTitle,
  destinations,
  onDone,
}: {
  jobTitle: string;
  destinations: PublishDestinations;
  onDone: () => void;
}): JSX.Element {
  // Hands off on its own. Escape/Enter still skip ahead — there is no visible button, so this
  // is the only way out for a keyboard user who does not want to wait.
  useEffect(() => {
    const timer = window.setTimeout(onDone, PUBLISH_SUCCESS_MS);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" || e.key === "Enter") {
        window.clearTimeout(timer);
        onDone();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
    };
  }, [onDone]);

  const where = [
    destinations.internal ? "your internal talent pool" : null,
    destinations.marketplace ? "the open marketplace" : null,
  ].filter(Boolean);

  return (
    <div className="publish-success-backdrop" role="presentation">
      <div
        className="publish-success"
        role="dialog"
        aria-modal="true"
        aria-labelledby="publish-success-title"
      >
        <div className="publish-confetti" aria-hidden="true">
          {CONFETTI.map((piece, i) => (
            <span
              key={i}
              className={`publish-confetti-piece c-${piece.color}`}
              style={{
                left: `${piece.x}%`,
                animationDelay: `${piece.delay}ms`,
                animationDuration: `${piece.duration}ms`,
                // consumed by the keyframes via a custom property
                ["--rot" as string]: `${piece.rot}deg`,
              }}
            />
          ))}
        </div>

        <div className="publish-check" aria-hidden="true">
          <svg viewBox="0 0 52 52" width="52" height="52">
            <circle className="publish-check-ring" cx="26" cy="26" r="24" />
            <path className="publish-check-mark" d="M15 27.5 22.5 35 37.5 19" />
          </svg>
        </div>

        <h2 id="publish-success-title" className="publish-success-title">
          You&rsquo;re live
        </h2>
        <p className="publish-success-role">{jobTitle}</p>
        <p className="publish-success-sub">
          {where.length > 0
            ? `Published to ${where.join(" and ")}. Candidates can start applying now.`
            : "Candidates can start applying now."}
        </p>

        {/* No button: this hands off on its own. The bar shows that something is coming so the
         * pause reads as intentional rather than as a dialog waiting on the user. */}
        <div className="publish-success-next">
          <span className="publish-success-next-label">Getting your candidate link…</span>
          <span className="publish-success-progress" aria-hidden="true">
            <span className="publish-success-progress-fill" />
          </span>
        </div>
      </div>
    </div>
  );
}
