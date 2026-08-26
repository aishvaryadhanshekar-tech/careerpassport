export const MISSING_DETAILS_ID = "missing-details";

export function analysisRevealTarget(missingCount: number): string | null {
  return missingCount > 0 ? MISSING_DETAILS_ID : null;
}

export function scrollOffsetToAlignTop(input: {
  scrollerTop: number;
  scrollerScrollTop: number;
  targetTop: number;
}): number {
  return Math.max(
    0,
    input.scrollerScrollTop + (input.targetTop - input.scrollerTop),
  );
}

export function pinElementToScrollerTop(
  scroller: HTMLElement,
  target: HTMLElement,
  behavior: ScrollBehavior = "smooth",
): void {
  const nextTop = scrollOffsetToAlignTop({
    scrollerTop: scroller.getBoundingClientRect().top,
    scrollerScrollTop: scroller.scrollTop,
    targetTop: target.getBoundingClientRect().top,
  });
  if (Math.abs(nextTop - scroller.scrollTop) < 2) return;
  scroller.scrollTo({ top: nextTop, behavior });
}

export function revealMissingDetails(
  scroller: HTMLElement | null,
  target: HTMLElement | null,
): boolean {
  if (!scroller || !target) return false;
  pinElementToScrollerTop(scroller, target);
  return true;
}
