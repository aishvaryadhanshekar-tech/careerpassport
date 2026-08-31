import type { Dispatch, SetStateAction } from "react";
import { useOutletContext } from "react-router-dom";
import type { JobRecord } from "../jobsStore";
import type { JobDraft } from "../types";

/**
 * What the job shell hands to each tab.
 *
 * The shell hydrates the draft once and shares it. Each tab used to call `hydrateFromJob`
 * itself, which is a read with a write side effect (`openJob` overwrites the singleton draft
 * key), so doing it per-tab meant redundant writes on every tab switch.
 */
export type JobOutletContext = {
  jobId: string;
  job: JobRecord;
  draft: JobDraft;
  title: string;
  setDraft: Dispatch<SetStateAction<JobDraft>>;
};

export function useJobContext(): JobOutletContext {
  return useOutletContext<JobOutletContext>();
}
