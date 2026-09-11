import { useRef, type JSX, type MouseEvent, type ReactNode } from "react";
import { FlowIcon } from "../FlowIcon";
import type { FunnelNode } from "../funnelModel";
import { BRIEF_READING_LABEL, BRIEF_SECTIONS, type BriefCardModel, type BriefSectionKey, type BriefSectionView } from "./buildPhase";

const TILE_ICONS: Record<BriefSectionKey, ReactNode> = {
  summary: <path d="M6 4h12v16H6z M9 8h6 M9 12h6 M9 16h3" />,
  requirements: <path d="M10 6h10 M10 12h10 M10 18h10 M4 6l1.2 1.2L7.5 5 M4 12l1.2 1.2L7.5 11 M4 18l1.2 1.2L7.5 17" />,
  sourcing: <path d="M17 11a6 6 0 1 1-12 0a6 6 0 0 1 12 0z M15.5 15.5L20 20" />,
  evaluation: <path d="M4 20h16 M7 20v-7 M12 20V6 M17 20v-10" />,
};

function TileIcon({ section }: { section: BriefSectionKey }): JSX.Element {
  return (
    <svg className="brief-tile-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {TILE_ICONS[section]}
    </svg>
  );
}

function ReviewedMark(): JSX.Element {
  return (
    <svg className="brief-tile-check" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="8" fill="currentColor" />
      <path d="M4.6 8.2l2.2 2.2 4.6-4.8" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Keeps a click inside the card from reaching React Flow, where it would count as a node click. */
function inCard(action: () => void) {
  return (event: MouseEvent) => {
    event.stopPropagation();
    action();
  };
}

/** Tiles shown before the card is wired to the flow (e.g. a saved canvas): all ready, no actions. */
const STATIC_SECTIONS: BriefSectionView[] = BRIEF_SECTIONS.map(({ key, label }) => ({ key, label, status: "ready" }));

/**
 * Content of the single Role brief card on the canvas: header, a 2×2 grid of section tiles and
 * either the generating status line or the review progress and actions.
 */
export function BriefCard({
  item,
  model,
  selected,
  onSelect,
}: {
  item: FunnelNode;
  model?: BriefCardModel;
  selected?: boolean;
  /** Keyboard activation of the card header (mouse clicks go through React Flow). */
  onSelect?: () => void;
}): JSX.Element {
  // Tiles that were pending while this card was mounted pop in when they become ready.
  const seenPending = useRef(new Set<BriefSectionKey>());
  const sections = model?.sections ?? STATIC_SECTIONS;
  for (const section of sections) if (section.status === "pending") seenPending.current.add(section.key);

  const reviewed = model?.reviewed ?? 0;
  const total = model?.total ?? BRIEF_SECTIONS.length;
  const allReviewed = reviewed >= total;
  // Once reading is done, the first pending tile is the one being drafted right now.
  const draftingKey =
    model?.generating && model.statusLabel !== BRIEF_READING_LABEL
      ? sections.find((section) => section.status === "pending")?.key
      : undefined;

  return (
    <div className={`brief-card ${model?.generating ? "brief-card-generating" : ""}`}>
      <div className="fn-top">
        <span className="fn-kind-icon" aria-hidden="true"><FlowIcon kind="insight" /></span>
        <span className="fn-kind">ROLE BRIEF</span>
        <span className="fn-drag-hint" title="Drag to move" aria-hidden="true">⠿</span>
      </div>
      <div
        className="fn-main brief-card-head"
        role="button"
        tabIndex={0}
        aria-label={item.title}
        aria-expanded={selected}
        onKeyDown={(event) => {
          if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            event.stopPropagation();
            onSelect?.();
          }
        }}
      >
        <strong>{item.title}</strong>
        {item.description && <span className="brief-card-copy">{item.description}</span>}
      </div>

      <ul className="brief-tiles nodrag" aria-label="Role brief sections">
        {sections.map((section) => {
          const pending = section.status === "pending";
          const active = model?.activeSection === section.key;
          const popped = !pending && seenPending.current.has(section.key);
          const state = pending ? "drafting" : section.status === "reviewed" ? "reviewed" : "ready to review";
          return (
            <li key={section.key}>
              <button
                type="button"
                className={[
                  "brief-tile",
                  "nodrag",
                  `brief-tile-${section.status}`,
                  active ? "brief-tile-active" : "",
                  section.key === draftingKey ? "brief-tile-drafting" : "",
                  popped ? "brief-tile-pop" : "",
                ].filter(Boolean).join(" ")}
                disabled={pending || !model}
                aria-current={active ? "true" : undefined}
                aria-label={`${section.label}, ${state}`}
                onClick={inCard(() => model?.onOpenSection(section.key))}
              >
                {pending ? (
                  <>
                    <span className="brief-tile-skeleton brief-tile-skeleton-icon" />
                    <span className="brief-tile-skeleton brief-tile-skeleton-text" />
                  </>
                ) : (
                  <>
                    <TileIcon section={section.key} />
                    <span className="brief-tile-label">{section.label}</span>
                    {section.status === "reviewed" && <ReviewedMark />}
                  </>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {model?.generating ? (
        <p className="brief-status" role="status">
          <span className="brief-status-sparkle" aria-hidden="true"><FlowIcon kind="insight" /></span>
          <span key={model.statusLabel} className="brief-status-text">{model.statusLabel}</span>
        </p>
      ) : model ? (
        <div className="brief-card-foot nodrag">
          <div
            className="brief-progress"
            role="progressbar"
            aria-label="Sections reviewed"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={reviewed}
          >
            <span className="brief-progress-track"><span style={{ width: `${(reviewed / total) * 100}%` }} /></span>
            <small>{reviewed} of {total} reviewed</small>
          </div>
          {(!allReviewed || model.canGenerate) && (
            <div className="brief-actions">
              {!allReviewed ? (
                <>
                  <button type="button" className="brief-cta brief-cta-primary nodrag" onClick={inCard(model.onReview)}>
                    Review role brief
                  </button>
                  {model.canGenerate && (
                    <button type="button" className="brief-cta brief-cta-ghost nodrag" onClick={inCard(model.onGenerate)}>
                      Skip review
                    </button>
                  )}
                </>
              ) : (
                <button type="button" className="brief-cta brief-cta-primary brief-cta-ready nodrag" onClick={inCard(model.onGenerate)}>
                  Generate pipeline →
                </button>
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
