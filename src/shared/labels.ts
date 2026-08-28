/**
 * Display-label lookups shared across features.
 *
 * `WORK_MODE_LABEL` previously existed as four separate identical copies (ApplicationPreview,
 * RoleProfilePage, Step3Page, JobDetailsPage), so renaming a mode meant four edits.
 */

export const WORK_MODE_LABEL: Record<string, string> = {
  WFH: "Remote",
  WFO: "On-site",
  Hybrid: "Hybrid",
};
