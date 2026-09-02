import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { ApplicationPreview } from "../../ApplicationPreview";
import { ContextCard } from "../../ContextCard";
import { CustomQuestionsCard } from "../../CustomQuestionsCard";
import { StandardFieldsCard } from "../../StandardFieldsCard";
import { mandatoryCount, estimateApplicationOverview } from "../../applicationForm";
import { deriveContextText, seedApplication } from "../../seedApplication";
import { TabPanel, Tabs } from "../../Tabs";
import type { ApplicationConfig, JobDraft } from "../../types";

// Mirrors ApplicationPage.tsx's withApplication() — seeds once, then keeps re-deriving
// company/role copy for fields the user hasn't personally edited.
function withApplication(draft: JobDraft): JobDraft {
  if (!draft.application) {
    return { ...draft, application: seedApplication(draft) };
  }
  const config = draft.application;
  const derived = deriveContextText(draft);
  const company =
    config.context.company.source === "user" || config.context.company.text === derived.company
      ? config.context.company
      : { ...config.context.company, text: derived.company, source: "extracted" as const };
  const role =
    config.context.role.source === "user" || config.context.role.text === derived.role
      ? config.context.role
      : { ...config.context.role, text: derived.role, source: "extracted" as const };
  if (company === config.context.company && role === config.context.role) return draft;
  return { ...draft, application: { ...config, context: { company, role } } };
}

export function ApplicationPanel({
  draft,
  setDraft,
}: {
  draft: JobDraft;
  setDraft: Dispatch<SetStateAction<JobDraft>>;
}) {
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [mode, setMode] = useState<"mobile" | "desktop">("mobile");

  useEffect(() => {
    setDraft((current) => withApplication(current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const config = draft.application;
  if (!config) return null;

  const overview = estimateApplicationOverview(config);

  function patch(next: ApplicationConfig) {
    setDraft((current) => ({ ...current, application: next }));
  }

  return (
    <div className="canvas-panel-scroll canvas-application-panel">
      <Tabs
        ariaLabel="Application form"
        active={tab}
        onChange={(id) => setTab(id as "edit" | "preview")}
        tabs={[
          { id: "edit", label: "Edit" },
          { id: "preview", label: "Preview" },
        ]}
      />
      <TabPanel id="edit" active={tab === "edit"}>
        <div className="application-editors">
          <ContextCard config={config} onChange={patch} />
          <StandardFieldsCard config={config} onChange={patch} />
          <CustomQuestionsCard config={config} onChange={patch} />
        </div>
      </TabPanel>
      <TabPanel id="preview" active={tab === "preview"}>
        <ApplicationPreview draft={draft} config={config} mode={mode} onMode={setMode} activeAnchor={null} />
      </TabPanel>
      <div className="canvas-application-meta">
        <span>{overview.totalItems} items</span>
        <span className="meta-dot" aria-hidden="true">·</span>
        <span>~{overview.estimatedMinutes} min to complete</span>
        <span className="meta-dot" aria-hidden="true">·</span>
        <span>{mandatoryCount(config)} mandatory</span>
      </div>
    </div>
  );
}
