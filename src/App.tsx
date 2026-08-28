import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./AppShell";
import { ApplicationPage } from "./ApplicationPage";
import { CollectJobPage } from "./CollectJobPage";
import { JobDetailsPage } from "./JobDetailsPage";
import { JobOverviewTab } from "./job/JobOverviewTab";
import { ProspectsTab } from "./job/ProspectsTab";
import { SetupTab } from "./job/SetupTab";
import { JobsPage } from "./JobsPage";
import { PipelineTab } from "./pipeline/PipelineTab";
import { RoleProfilePage } from "./RoleProfilePage";
import { SettingsPage } from "./SettingsPage";
import { Step3Page } from "./Step3Page";
import { TripBuilderPage } from "./trips/TripBuilderPage";
import { TripsListPage } from "./trips/TripsListPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<JobsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/create-job" element={<CollectJobPage />} />
          <Route path="/role-profile" element={<RoleProfilePage />} />
          <Route path="/step-2" element={<ApplicationPage />} />
          <Route path="/step-3" element={<Step3Page />} />
          {/* Job shell: header + page tabs; tab bodies render into its <Outlet/>. */}
          <Route path="/jobs/:id" element={<JobDetailsPage />}>
            <Route index element={<JobOverviewTab />} />
            <Route path="trips" element={<TripsListPage />} />
            <Route path="pipeline" element={<PipelineTab />} />
            <Route path="prospects" element={<ProspectsTab />} />
            <Route path="setup" element={<SetupTab />} />
          </Route>
          {/* Full-page, outside the tab shell — a focused editor with its own chrome. */}
          <Route path="/jobs/:id/trips/:tripId" element={<TripBuilderPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
