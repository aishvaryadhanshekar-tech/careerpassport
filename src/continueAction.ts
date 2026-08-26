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

export function generateLabel(input: {
  analysing: boolean;
  analysedOnce: boolean;
}): string {
  if (input.analysing) return "Analysing…";
  return input.analysedOnce ? "Re-analyse" : "Generate with AI";
}
