import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { ensureSeedJobs, getJob, publishJob, upsertJobFromDraft } from "./jobsStore";
import { demoService } from "./demo/service";
import { prototypeConfig } from "./prototypeConfig";
import { browserStorage, resetPrototypeOnRefresh } from "./prototypeReset";
import { DEMO_JOB_IDS } from "./seedJobs";
import { ensureSeedFunnels } from "./seedFunnel";
import "./index.css";
import "./styles/reference-system.css";

const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
if (resetPrototypeOnRefresh(prototypeConfig.resetOnRefresh, navigation?.type,
  [browserStorage("localStorage"), browserStorage("sessionStorage")])) {
  // Deep links to user-created jobs no longer exist after resetting the demo.
  window.history.replaceState(null, "", import.meta.env.BASE_URL);
}
// Seed before the first render; deleting a sample keeps it gone until the next reset.
ensureSeedJobs();
// Gives each demo job its own canvas graph (real Trip nodes at the right stage, tailored
// invite messages) instead of the generic empty skeleton every job would otherwise synthesize.
ensureSeedFunnels(DEMO_JOB_IDS);
// Restore durable demo projects into the existing jobs index after a new browser session.
for (const project of demoService().list()) {
  if (getJob(project.id)) continue;
  if (project.configuration.published) publishJob(project.id, project.configuration.draft);
  else upsertJobFromDraft(project.id, project.configuration.draft);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
