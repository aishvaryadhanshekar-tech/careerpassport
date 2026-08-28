import { extractFromTranscript } from "../extractJobFields";
import { REQUIRED_COVERAGE_IDS, isFieldCovered, type CoverageId, type JobDraft } from "../types";

/**
 * Which required coverage fields the user has already supplied.
 *
 * A field counts as mentioned if EITHER the form field is filled in, OR the raw transcript
 * mentions it. The transcript arm is what makes the hint list strike through live while the
 * user is still talking/typing, before "Build with AI" has populated any form field.
 *
 * Salary needs a currency in both arms — an amount alone is not enough, matching
 * `isFieldCovered`.
 */
export function mentionedCoverage(draft: JobDraft): Set<CoverageId> {
  const extraction = extractFromTranscript(draft.transcript);
  const set = new Set<CoverageId>();
  for (const id of REQUIRED_COVERAGE_IDS) {
    if (isFieldCovered(id, draft.fields, draft.salaryCurrency)) {
      set.add(id);
      continue;
    }
    const detected = extraction.fields[id];
    if (typeof detected !== "string" || detected.trim() === "") continue;
    if (id === "salary" && !extraction.salaryCurrency) continue;
    set.add(id);
  }
  return set;
}
