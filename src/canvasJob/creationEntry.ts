// Branch-local experiment: the canvas flow (src/canvasJob/) is the default
// "create a job" entry point on this branch instead of the linear wizard at
// /create-job. Flip CANVAS_IS_DEFAULT_ENTRY to false (or delete this module
// and its call sites) to fall back to the linear wizard everywhere.
export const CANVAS_IS_DEFAULT_ENTRY = true;

export function createJobEntryRoute(): string {
  return CANVAS_IS_DEFAULT_ENTRY ? "/create-job-canvas" : "/create-job";
}
