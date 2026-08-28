import { useState } from "react";
import { ApplicationPreview } from "../ApplicationPreview";
import { RoleDetailsTab } from "../roleProfile/readOnly";
import { RoleSidebar } from "../roleProfile/RoleSidebar";
import { TabPanel, Tabs } from "../Tabs";
import { useJobContext } from "./jobContext";

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M2.5 6.3 4.8 8.6 9.5 3.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DestinationBadges({
  destinations,
}: {
  destinations: { internal: boolean; marketplace: boolean };
}) {
  const items: { label: string; active: boolean }[] = [
    { label: "Internal", active: destinations.internal },
    { label: "Marketplace", active: destinations.marketplace },
  ];
  return (
    <div className="jd-destinations">
      {items.map((item) => (
        <span
          key={item.label}
          className={`jd-destination-badge${item.active ? " active" : ""}`}
        >
          {item.active ? <CheckIcon /> : null}
          {item.label}
        </span>
      ))}
    </div>
  );
}

/**
 * Job Overview: the role sidebar plus the read-only role content — Job Description,
 * Requirements, Sourcing Playbook and Evaluation Framework (all inside RoleDetailsTab),
 * with the candidate-facing Application Summary alongside it.
 */
export function JobOverviewTab() {
  const { job, draft } = useJobContext();
  const [tab, setTab] = useState<"details" | "application">("details");
  const [mode, setMode] = useState<"mobile" | "desktop">("desktop");
  const config = draft.application;

  return (
    <div className="preview-layout">
      <RoleSidebar
        draft={draft}
        footer={
          <div className="jd-published-to">
            <span className="jd-published-to-label">Published to</span>
            <DestinationBadges destinations={job.publishDestinations} />
          </div>
        }
      />
      <div className="preview-content">
        <div className="jo-subtabs-sticky">
          <Tabs
            ariaLabel="Job overview sections"
            active={tab}
            onChange={(nextTab) => setTab(nextTab as "details" | "application")}
            tabs={[
              { id: "details", label: "Role Details" },
              { id: "application", label: "Application Summary" },
            ]}
          />
        </div>
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
  );
}
