export function continueEnabled(input: {
  recording: boolean;
  analysing: boolean;
  allCovered: boolean;
}): boolean {
  if (input.recording || input.analysing) return false;
  return input.allCovered;
}

export function generateEnabled(input: {
  recording: boolean;
  analysing: boolean;
  hasContent: boolean;
}): boolean {
  if (input.recording || input.analysing) return false;
  return input.hasContent;
}

export const BUILD_PHASES = [
  "Reading your notes…",
  "Structuring the role…",
  "Building your role…",
] as const;

export function generateLabel(input: {
  analysing: boolean;
  analysedOnce: boolean;
  buildPhase?: number;
}): string {
  if (input.analysing) {
    return BUILD_PHASES[(input.buildPhase ?? 0) % BUILD_PHASES.length];
  }
  return input.analysedOnce ? "Re-build with AI" : "Build with AI";
}
