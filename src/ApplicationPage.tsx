import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ContextCard } from "./ContextCard";
import { CustomQuestionsCard } from "./CustomQuestionsCard";
import { ApplicationPreview } from "./ApplicationPreview";
import { StandardFieldsCard } from "./StandardFieldsCard";
import { estimateApplicationOverview, mandatoryCount } from "./applicationForm";
import { getCurrentJobId, startNewJob, upsertJobFromDraft } from "./jobsStore";
import { pickActiveAnchor, type PreviewAnchor } from "./previewScroll";
import { deriveContextText, seedApplication } from "./seedApplication";
import { loadDraft, saveDraft } from "./storage";
import type { ApplicationConfig, JobDraft } from "./types";

const ANCHORS: PreviewAnchor[] = ["company", "role", "fields", "questions"];

// Backfills the Application step from Job Details / Role Profile data.
// On first visit there's no application config yet, so seed it wholesale.
// On later visits, re-derive the company/role context copy from the latest
// draft fields and merge it in — but only for fields the user hasn't
// personally edited (source !== "user") — so edits elsewhere in the wizard
// (e.g. going back and changing the designation or location) keep flowing
// into this step instead of leaving stale, pre-edit copy behind.
function withApplication(draft: JobDraft): JobDraft {
  if (!draft.application) {
    const next = { ...draft, application: seedApplication(draft) };
    saveDraft(next);
    return next;
  }

  const config = draft.application;
  const derived = deriveContextText(draft);

  const company =
    config.context.company.source === "user" ||
    config.context.company.text === derived.company
      ? config.context.company
      : { ...config.context.company, text: derived.company, source: "extracted" as const };

  const role =
    config.context.role.source === "user" || config.context.role.text === derived.role
      ? config.context.role
      : { ...config.context.role, text: derived.role, source: "extracted" as const };

  if (company === config.context.company && role === config.context.role) {
    return draft;
  }

  const next = {
    ...draft,
    application: { ...config, context: { company, role } },
  };
  saveDraft(next);
  return next;
}

export function ApplicationPage() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<JobDraft>(() => withApplication(loadDraft()));
  const [mode, setMode] = useState<"mobile" | "desktop">("mobile");
  const [activeAnchor, setActiveAnchor] = useState<PreviewAnchor | null>(null);
  const draftRef = useRef(draft);
  const editorsRef = useRef<HTMLDivElement>(null);
  draftRef.current = draft;

  useEffect(() => {
    const timer = window.setTimeout(() => saveDraft(draftRef.current), 2000);
    return () => window.clearTimeout(timer);
  }, [draft]);

  useEffect(() => {
    return () => {
      saveDraft(draftRef.current);
    };
  }, []);

  useEffect(() => {
    const root = editorsRef.current;
    if (!root) return;

    const ratios = new Map<PreviewAnchor, number>(
      ANCHORS.map((anchor) => [anchor, 0]),
    );

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const anchor = entry.target.getAttribute("data-editor-anchor");
          if (!anchor) continue;
          ratios.set(
            anchor as PreviewAnchor,
            entry.isIntersecting ? entry.intersectionRatio : 0,
          );
        }
        const next = pickActiveAnchor(ratios);
        if (next) setActiveAnchor(next);
      },
      {
        threshold: [0, 0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 1],
        rootMargin: "0px 0px -40% 0px",
      },
    );

    root.querySelectorAll("[data-editor-anchor]").forEach((node) => {
      observer.observe(node);
    });

    function onFocusIn(event: FocusEvent) {
      const host = (event.target as HTMLElement | null)?.closest(
        "[data-editor-anchor]",
      );
      const anchor = host?.getAttribute("data-editor-anchor");
      if (anchor) setActiveAnchor(anchor as PreviewAnchor);
    }

    root.addEventListener("focusin", onFocusIn);
    return () => {
      observer.disconnect();
      root.removeEventListener("focusin", onFocusIn);
    };
  }, []);

  const config = draft.application;
  if (!config) return null;

  const overview = estimateApplicationOverview(config);

  function patch(next: ApplicationConfig) {
    setDraft((current) => ({ ...current, application: next }));
  }

  function onContinue() {
    const from = draftRef.current;
    saveDraft(from);
    const id = getCurrentJobId() ?? startNewJob();
    upsertJobFromDraft(id, from);
    navigate("/step-3");
  }

  return (
    <div className="app-shell create-job application-page">
      <div className="application-split">
        <div className="application-editors" ref={editorsRef}>
          <ContextCard config={config} onChange={patch} />
          <StandardFieldsCard config={config} onChange={patch} />
          <CustomQuestionsCard config={config} onChange={patch} />
        </div>
        <ApplicationPreview
          draft={draft}
          config={config}
          mode={mode}
          onMode={setMode}
          activeAnchor={activeAnchor}
        />
      </div>
      <footer className="footer">
        <div className="meta">
          <span>{overview.totalItems} items</span>
          <span className="meta-dot" aria-hidden="true">·</span>
          <span>~{overview.estimatedMinutes} min to complete</span>
          <span className="meta-dot" aria-hidden="true">·</span>
          <span>{mandatoryCount(config)} mandatory</span>
        </div>
        <button type="button" className="btn primary" onClick={onContinue}>
          Continue
        </button>
      </footer>
    </div>
  );
}
