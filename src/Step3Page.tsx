import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApplicationPreview } from "./ApplicationPreview";
import { deriveJobPreview } from "./derivePreviewFields";
import { getCurrentJobId, publishJob, startNewJob } from "./jobsStore";
import { RoleDetailsTab } from "./roleProfile/readOnly";
import { RoleSidebar } from "./roleProfile/RoleSidebar";
import { seedApplication } from "./seedApplication";
import { loadDraft, saveDraft } from "./storage";
import { TabPanel, Tabs } from "./Tabs";
import type { JobDraft, PublishDestinations } from "./types";
import { wizardBackTo } from "./wizardHeader";

function withApplication(draft: JobDraft): JobDraft {
  if (draft.application) return draft;
  return { ...draft, application: seedApplication(draft) };
}

function withPreview(draft: JobDraft): JobDraft {
  if (draft.previewGenerated) return draft;
  return {
    ...draft,
    preview: deriveJobPreview(draft),
    previewGenerated: true,
  };
}

function hydrate(): JobDraft {
  return withPreview(withApplication(loadDraft()));
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
          onChange={(event) =>
            onChange({ ...value, internal: event.target.checked })
          }
        />
        <span>
          <span className="publish-destination-label">Internal talent pool</span>
          <span className="publish-destination-blurb">
            Visible to your existing sourced candidates
          </span>
        </span>
      </label>
      <label className="publish-destination-option">
        <input
          type="checkbox"
          checked={value.marketplace}
          onChange={(event) =>
            onChange({ ...value, marketplace: event.target.checked })
          }
        />
        <span>
          <span className="publish-destination-label">Open marketplace</span>
          <span className="publish-destination-blurb">
            Listed publicly for new applicants to discover
          </span>
        </span>
      </label>
    </div>
  );
}

export function Step3Page() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<JobDraft>(() => hydrate());
  const [tab, setTab] = useState<"details" | "application">("details");
  const [mode, setMode] = useState<"mobile" | "desktop">("desktop");
  const draftRef = useRef(draft);
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

  function setPublishDestinations(next: PublishDestinations) {
    setDraft((current) => ({ ...current, publishDestinations: next }));
  }

  function onPublish() {
    const from = draftRef.current;
    saveDraft(from);
    const id = getCurrentJobId() ?? startNewJob();
    publishJob(id, from);
    // Go straight to the published job. The celebration and the share composer play on top of
    // that page, so the user lands where they belong before the overlays even finish — rather
    // than being held on the wizard until they dismiss something.
    navigate(`/jobs/${id}`, { state: { justPublished: true } });
  }

  const config = draft.application;

  return (
    <div className="app-shell create-job preview-page">
      <main className="preview-main">
        <div className="preview-layout">
          <RoleSidebar
            draft={draft}
            showExperienceType
            footer={
              <PublishDestinationsSection
                value={draft.publishDestinations}
                onChange={setPublishDestinations}
              />
            }
          />
          <div className="preview-content">
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
                <ApplicationPreview
                  draft={draft}
                  config={config}
                  mode={mode}
                  onMode={setMode}
                  activeAnchor={null}
                />
              ) : null}
            </TabPanel>
          </div>
        </div>
      </main>
      <footer className="footer">
        <div className="footer-actions">
          <button type="button" className="btn ghost" onClick={() => navigate(wizardBackTo(4))}>
            Back
          </button>
          <button type="button" className="btn primary" onClick={onPublish}>
            Publish
          </button>
        </div>
      </footer>
    </div>
  );
}
