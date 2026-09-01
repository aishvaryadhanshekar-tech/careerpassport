import type { JSX } from "react";
import { SparkleIcon } from "./icons";
import { useBuildPhase } from "./useBuildPhase";

const REWRITE_PHASES = ["Rewriting…", "Polishing…"] as const;

/**
 * Small floating "Rewrite" affordance shown near a text selection inside a textarea (see
 * `useTextSelectionToolbar`). Fixed-positioned near the selection's last-known client
 * coordinates — this app has no selection-toolbar library, so like every other popover here
 * it's a plain absolutely/fixed-positioned panel rather than something anchored precisely.
 *
 * The `onMouseDown` `preventDefault` below matters: without it, clicking this button would
 * shift focus away from the textarea first, firing its `blur` handler and unmounting this
 * button before the `onClick` ever runs.
 */
export function SelectionRewriteButton({
  position,
  busy,
  onClick,
}: {
  position: { x: number; y: number };
  busy: boolean;
  onClick: () => void;
}): JSX.Element {
  const phase = useBuildPhase(busy);

  return (
    <div
      className="selection-rewrite-wrap"
      style={{ left: position.x, top: position.y }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {busy ? (
        <span className="build-loading selection-rewrite-busy" aria-live="polite">
          <SparkleIcon />
          <span className="build-loading-text">
            {REWRITE_PHASES[phase % REWRITE_PHASES.length]}
          </span>
        </span>
      ) : (
        <button type="button" className="selection-rewrite-btn" onClick={onClick}>
          <SparkleIcon />
          Rewrite
        </button>
      )}
    </div>
  );
}
