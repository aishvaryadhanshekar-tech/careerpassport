import { useEffect, type JSX } from "react";
import { SparkleIcon } from "../shared/icons";
import { useBuildPhase } from "../shared/useBuildPhase";

/**
 * Full-screen illustrated loader shown while a trip is auto-built with AI.
 *
 * Pulls its shimmer/pulse visual language from the `.build-loading` /
 * `.build-loading-text` pattern in src/styles/controls.css (same one used by
 * InferenceCardsSection and SpineEditor via useBuildPhase) — just scaled up
 * into three sequenced rows instead of one inline chip.
 *
 * Sequencing: useBuildPhase ticks every ~1650ms, so across the ~5s window
 * phase goes 0 -> 1 -> 2 -> 3, lighting up one row per tick. onComplete()
 * fires once, ~5000ms after `active` becomes true.
 */
const TICK_MS = 1650;
const TOTAL_MS = 5000;

const ROWS = [
  {
    key: "requirements",
    label: "Requirements",
    detail: "Pulling information from your Requirements tab…",
  },
  {
    key: "sourcing",
    label: "Sourcing Playbook",
    detail: "Pulling information from your Sourcing Playbook…",
  },
  {
    key: "evaluation",
    label: "Evaluation Framework",
    detail: "Pulling information from your Evaluation Framework…",
  },
] as const;

export type AIBuildLoaderProps = {
  active: boolean;
  onComplete: () => void;
};

export function AIBuildLoader({
  active,
  onComplete,
}: AIBuildLoaderProps): JSX.Element | null {
  const phase = useBuildPhase(active, TICK_MS);

  useEffect(() => {
    if (!active) return;
    const id = window.setTimeout(() => {
      onComplete();
    }, TOTAL_MS);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (!active) return null;

  return (
    <div className="ai-build-loader-overlay" role="status" aria-live="polite">
      <div className="ai-build-loader-card">
        <div className="ai-build-loader-icon" aria-hidden="true">
          <SparkleIcon />
        </div>
        <h2 className="ai-build-loader-heading build-loading-text">
          Building your trip…
        </h2>
        <p className="ai-build-loader-subheading">
          Using signals from your role profile
        </p>

        <div className="ai-build-loader-rows">
          {ROWS.map((row, index) => {
            const done = phase > index;
            const inProgress = !done && phase === index;
            return (
              <div
                key={row.key}
                className={
                  "ai-build-loader-row" +
                  (done ? " ai-build-loader-row-done" : "") +
                  (inProgress ? " ai-build-loader-row-active" : "")
                }
              >
                <span className="ai-build-loader-row-status" aria-hidden="true">
                  {done ? "✓" : <SparkleIcon />}
                </span>
                <span className="ai-build-loader-row-body">
                  <span className="ai-build-loader-row-label">
                    {row.label}
                  </span>
                  {!done && (
                    <span className="build-loading-text ai-build-loader-row-detail">
                      {row.detail}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
