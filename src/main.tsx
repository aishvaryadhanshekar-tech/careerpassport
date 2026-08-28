import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { ensureSeedJobs } from "./jobsStore";
import "./index.css";

// Storage is in-memory, so this runs once per page load, before the first render reads the
// jobs list. Deleting the demo job keeps it gone for the rest of the session.
ensureSeedJobs();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
