import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { ApplicationPreview } from "../../ApplicationPreview";
import { deriveJobPreview } from "../../derivePreviewFields";
import { deriveRoleProfile } from "../../deriveRoleProfile";
import { publishJob, type JobRecord } from "../../jobsStore";
import { RoleDetailsTab } from "../../roleProfile/readOnly";
import { seedApplication } from "../../seedApplication";
import { TabPanel, Tabs } from "../../Tabs";
import type { JobDraft, PublishDestinations } from "../../types";

// Silently backfills the Role Profile + preview derivation that the linear wizard's Step 2/4
// would normally have produced — the canvas has no dedicated node for that step, but downstream
// consumers (Pipeline's evaluation framework, this page's own summary) still expect it to exist.
function withDerivedSummary(draft: JobDraft): JobDraft {
  let next = draft;
  if (!next.application) {
    next = { ...next, application: seedApplication(next) };
  }
  if (!next.roleProfileGenerated) {
    next = { ...next, roleProfile: deriveRoleProfile(next), roleProfileGenerated: true };
  }
  if (!next.previewGenerated) {
    next = { ...next, preview: deriveJobPreview(next), previewGenerated: true };
  }
  return next;
}

function PublishDestinationsSection({
  value,
  onChange,
}: {
  value: PublishDestinations;
  onChange: (next: PublishDestinations) => void;
}) {
  return (
    <div className="publish-destinations">
      <h3 className="publish-destinations-title">Publish to</h3>
      <label className="publish-destination-option">
        <input
          type="checkbox"
          checked={value.internal}
          onChange={(event) => onChange({ ...value, internal: event.target.checked })}
        />
        <span>
          <span className="publish-destination-label">Internal talent pool</span>
          <span className="publish-destination-blurb">Visible to your existing sourced candidates</span>
        </span>
      </label>
      <label className="publish-destination-option">
        <input
          type="checkbox"
          checked={value.marketplace}
          onChange={(event) => onChange({ ...value, marketplace: event.target.checked })}
        />
        <span>
          <span className="publish-destination-label">Open marketplace</span>
          <span className="publish-destination-blurb">Listed publicly for new applicants to discover</span>
        </span>
      </label>
    </div>
  );
}

export function PublishPanel({
  jobId,
  draft,
  setDraft,
  onPublished,
}: {
  jobId: string;
  draft: JobDraft;
  setDraft: Dispatch<SetStateAction<JobDraft>>;
  onPublished: (job: JobRecord) => void;
}) {
  const [tab, setTab] = useState<"details" | "application">("details");
  const [mode, setMode] = useState<"mobile" | "desktop">("desktop");

  useEffect(() => {
    setDraft((current) => withDerivedSummary(current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setPublishDestinations(next: PublishDestinations) {
    setDraft((current) => ({ ...current, publishDestinations: next }));
  }

  function onPublish() {
    onPublished(publishJob(jobId, draft));
  }

  const config = draft.application;

  return (
    <div className="canvas-panel-scroll canvas-publish-panel">
      <Tabs
        ariaLabel="Preview sections"
        active={tab}
        onChange={(id) => setTab(id as "details" | "application")}
        tabs={[
          { id: "details", label: "Role Details" },
          { id: "application", label: "Application Summary" },
        ]}
      />
      <TabPanel id="details" active={tab === "details"}>
        <RoleDetailsTab draft={draft} />
      </TabPanel>
      <TabPanel id="application" active={tab === "application"}>
        {config ? (
          <ApplicationPreview draft={draft} config={config} mode={mode} onMode={setMode} activeAnchor={null} />
        ) : null}
      </TabPanel>

      <PublishDestinationsSection value={draft.publishDestinations} onChange={setPublishDestinations} />

      <div className="canvas-publish-actions">
        <button type="button" className="btn primary" onClick={onPublish}>
          Publish
        </button>
      </div>
    </div>
  );
}
