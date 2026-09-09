import { Navigate } from "react-router-dom";
import { useJobContext } from "../job/jobContext";

/**
 * TRP-01: there is now one canonical Trips destination — the canvas Trips library in
 * PipelineTripWorkspace, which presents both full Trips (`draft.trips`) and component trips
 * (`ops.assessments`) in a single search/status/type-filtered list. This classic tab used to
 * render its own separate `draft.trips`-only list (and create flow); it now redirects to the
 * canonical library instead of duplicating it. `?tab=trips` tells the canvas workspace which
 * tab to open (see FunnelWorkspace's `workspaceTab` initial state).
 *
 * Direct trip editor URLs (`/jobs/:id/trips/:tripId`, handled by TripBuilderPage) are
 * unaffected — only this list-only tab redirects.
 */
export function TripsListPage() {
  const { jobId } = useJobContext();
  return <Navigate to={`/jobs/${jobId}/canvas?tab=trips`} replace />;
}
