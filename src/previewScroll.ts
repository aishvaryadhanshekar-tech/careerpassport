export type PreviewAnchor = "company" | "role" | "fields" | "questions";

export function pickActiveAnchor(
  ratios: Map<PreviewAnchor, number>,
): PreviewAnchor | null {
  let best: PreviewAnchor | null = null;
  let bestRatio = 0;
  for (const [anchor, ratio] of ratios) {
    if (ratio > bestRatio) {
      bestRatio = ratio;
      best = anchor;
    }
  }
  return best;
}

// Anchors map directly to DOM ids that are always mounted in the preview
// when their content is visible (company/role/fields/questions render in
// one continuous scroll, not behind separate tabs), so no tab state is
// involved here — only whether the company/role sections have content to show.
export function previewTargetId(
  anchor: PreviewAnchor,
  visible: { company: boolean; role: boolean },
): string {
  if (anchor === "company" && !visible.company) return "preview-job";
  if (anchor === "role" && !visible.role) return "preview-job";
  return `preview-${anchor}`;
}

export function contextVisibleInPreview(shown: boolean, text: string): boolean {
  return shown && text.trim().length > 0;
}

export function childNeedsScroll(
  container: { top: number; bottom: number },
  child: { top: number; bottom: number },
  epsilon = 2,
): boolean {
  const fullyVisible =
    child.top >= container.top - epsilon &&
    child.bottom <= container.bottom + epsilon;
  const topAligned = Math.abs(child.top - container.top) <= epsilon;
  return !(fullyVisible || topAligned);
}

export function scrollChildIntoContainer(
  container: HTMLElement,
  child: HTMLElement,
): void {
  const cRect = container.getBoundingClientRect();
  const tRect = child.getBoundingClientRect();
  if (!childNeedsScroll(cRect, tRect)) return;
  const nextTop = container.scrollTop + (tRect.top - cRect.top);
  container.scrollTo({ top: Math.max(0, nextTop) });
}
