import { deriveJobPreview } from "../derivePreviewFields";
import { deriveRoleProfile } from "../deriveRoleProfile";
import { loadDraft } from "../storage";
import type { FieldState, JobDraft, RoleProfileFields } from "../types";

export type TabId = "requirements" | "sourcing" | "evaluation";

/**
 * Editable regions on the Role Profile page. The sidebar ("summary") is not a tab but uses the
 * same snapshot/discard machinery, so headline, portrait and the role's core fields keep working
 * Discard — they used to live in the now-deleted Overview tab and would otherwise have lost it.
 *
 * "application" is Job Overview's own slice — the wizard's Role Profile page never edits it,
 * but it shares this snapshot/discard machinery rather than duplicating it.
 */
export type EditKey = TabId | "summary" | "application";

// Every field with its own FieldState only refills when it's genuinely
// unset (never "user"-sourced, never already carrying a value) so a
// second hydrate — e.g. after the user goes back and fills in more Job
// Details — keeps picking up new upstream data without ever clobbering
// something the user typed directly on this page.
export function mergeFieldState(current: FieldState, derived: FieldState): FieldState {
  if (current.source === "user") return current;
  if (current.value.trim() !== "") return current;
  return derived;
}

export function withPreview(draft: JobDraft): JobDraft {
  const derived = deriveJobPreview(draft);
  return {
    ...draft,
    preview: {
      idealCandidate: draft.preview.idealCandidate.trim() !== "" ? draft.preview.idealCandidate : derived.idealCandidate,
      expectedSkills: draft.preview.expectedSkills.trim() !== "" ? draft.preview.expectedSkills : derived.expectedSkills,
      targetCompanies: draft.preview.targetCompanies.trim() !== "" ? draft.preview.targetCompanies : derived.targetCompanies,
      industrySectors: draft.preview.industrySectors.trim() !== "" ? draft.preview.industrySectors : derived.industrySectors,
    },
    previewGenerated: true,
  };
}

export function withRoleProfile(draft: JobDraft): JobDraft {
  // Previously this only ran once (gated on roleProfileGenerated), so
  // editing Job Details after visiting Role Profile left this page's
  // headline/portrait/department stuck on stale, pre-edit copy. Re-derive
  // every hydrate and merge field-by-field instead, so user edits stay
  // sticky but unedited fields keep resyncing with upstream data.
  const derived = deriveRoleProfile(draft);
  const current = draft.roleProfile;
  const roleProfile: RoleProfileFields = {
    headline: mergeFieldState(current.headline, derived.headline),
    portrait: mergeFieldState(current.portrait, derived.portrait),
    department: mergeFieldState(current.department, derived.department),
    avoidLookalikes: current.avoidLookalikes.trim() !== "" ? current.avoidLookalikes : derived.avoidLookalikes,
    evaluationFramework:
      current.evaluationFramework.length > 0 ? current.evaluationFramework : derived.evaluationFramework,
  };
  return { ...draft, roleProfile, roleProfileGenerated: true };
}

export function hydrate(): JobDraft {
  return withRoleProfile(withPreview(loadDraft()));
}

// Each tab only owns a slice of the shared draft. Snapshotting the whole
// draft on entry and restoring just that tab's slice on Discard means a
// discard in one tab can never clobber concurrent edits made in another.
export function restoreTabSlice(id: EditKey, current: JobDraft, snapshot: JobDraft): JobDraft {
  switch (id) {
    case "summary":
      return {
        ...current,
        roleProfile: {
          ...current.roleProfile,
          headline: snapshot.roleProfile.headline,
          portrait: snapshot.roleProfile.portrait,
          department: snapshot.roleProfile.department,
        },
        fields: {
          ...current.fields,
          designation: snapshot.fields.designation,
          experienceYears: snapshot.fields.experienceYears,
          location: snapshot.fields.location,
          salary: snapshot.fields.salary,
          industryType: snapshot.fields.industryType,
          workMode: snapshot.fields.workMode,
        },
        salaryCurrency: snapshot.salaryCurrency,
      };
    case "requirements":
      return {
        ...current,
        preview: { ...current.preview, expectedSkills: snapshot.preview.expectedSkills },
        fields: {
          ...current.fields,
          mustHaves: snapshot.fields.mustHaves,
          redFlags: snapshot.fields.redFlags,
        },
      };
    case "sourcing":
      return {
        ...current,
        preview: {
          ...current.preview,
          targetCompanies: snapshot.preview.targetCompanies,
          industrySectors: snapshot.preview.industrySectors,
        },
        roleProfile: { ...current.roleProfile, avoidLookalikes: snapshot.roleProfile.avoidLookalikes },
      };
    case "evaluation":
      return {
        ...current,
        roleProfile: { ...current.roleProfile, evaluationFramework: snapshot.roleProfile.evaluationFramework },
      };
    case "application":
      return { ...current, application: snapshot.application };
  }
}
