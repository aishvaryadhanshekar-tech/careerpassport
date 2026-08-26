import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./AppShell";
import { ApplicationPage } from "./ApplicationPage";
import { CollectJobPage } from "./CollectJobPage";
import { JobsPage } from "./JobsPage";
import { RoleProfilePage } from "./RoleProfilePage";
import { SettingsPage } from "./SettingsPage";
import { Step3Page } from "./Step3Page";

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
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
