export function liveInterimGap(committed: string): string {
  return committed && !committed.endsWith(" ") && !committed.endsWith("\n")
    ? " "
    : "";
}
