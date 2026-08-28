import { useEffect, useState } from "react";

/**
 * Drives the cycling "Building your role…" copy shown while a mock analysis runs.
 *
 * The same `useState` + 850ms `setInterval` ticker was hand-rolled in three places
 * (CollectJobPage, trips/SpineEditor, trips/InferenceCardsSection). The phase index counts up
 * without clamping — consumers index into their own phase list, matching the previous behaviour.
 *
 * Returns the current phase index, which resets to 0 whenever `active` goes false.
 */
export function useBuildPhase(active: boolean, intervalMs = 850): number {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!active) {
      setPhase(0);
      return;
    }
    const id = window.setInterval(() => {
      setPhase((p) => p + 1);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [active, intervalMs]);

  return phase;
}
