import { openJob } from "../jobsStore";
import { loadDraft } from "../storage";
import type { JobDraft } from "../types";

/**
 * Load a job into the current-draft slot and return the hydrated draft.
 *
 * NOTE: this is a read with a side effect — `openJob` WRITES the job's snapshot into the
 * singleton draft key (see jobsStore), so calling this switches what every other page will
 * subsequently load. That coupling is pre-existing; this helper just stops it being
 * reimplemented in three places (JobDetailsPage, trips/TripsListPage, trips/TripBuilderPage).
 *
 * Returns null when the id does not resolve to a job.
 */
export function hydrateFromJob(id: string): JobDraft | null {
  if (!openJob(id)) return null;
  return loadDraft();
}
