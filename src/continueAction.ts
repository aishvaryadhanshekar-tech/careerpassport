export function continueEnabled(input: {
  recording: boolean;
  analysing: boolean;
  analysedOnce: boolean;
  hasContent: boolean;
}): boolean {
  if (input.recording || input.analysing) return false;
  return input.analysedOnce || input.hasContent;
}

export function continueClickAction(input: {
  allCovered: boolean;
  hasContent: boolean;
}): "navigate" | "analyse" | "stay" {
  if (input.allCovered) return "navigate";
  if (input.hasContent) return "analyse";
  return "stay";
}
