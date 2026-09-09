# Editor copy audit — 5 September 2026

Scope: top-level `src/*.tsx` except `App.tsx` and `main.tsx`, plus `src/roleProfile`, `src/collectJob`, and `src/trips`. Canvas and other product areas are reviewed separately. This pass changes rendered copy only; it does not change workflow logic, CSS, accessibility labels, or user-authored content.

| Area reviewed | Decision |
| --- | --- |
| Jobs list and empty states | Replaced the welcome pitch with “No jobs yet” and one next action. Kept search recovery and deletion consequences. |
| Job collection, composer, and coverage hints | Shortened required-field feedback and checklist guidance. Kept recording status, transcript limit, microphone recovery, file errors, and the example role prompt. |
| Role profile requirements, sourcing, evaluation, and sidebar | Existing text describes actual role data, criteria, or editing controls. Kept it, including empty values and evaluation units. No blanket removal. |
| Application editor, standard fields, context, and custom questions | Existing labels and controls are already concise. Preserved field types, requirements, file limits, and dictation recovery. |
| Application preview | Reduced resume-import marketing copy to its supported formats. Kept candidate-facing job content, field labels, and submission controls. |
| Job details and publication | Kept destination visibility explanations, publication status, and link handoff status because they describe real outcomes. |
| Sharing modal | Removed the static “Ready to share” badge and redundant “Composer settings” kicker. Preserved platform/tone/sender choices and generated outreach content. |
| Settings | Shortened the prototype account notice while retaining the sign-in limitation. |
| Trips list and creation modal | Replaced the empty-state slogan with the purpose and next action. Removed the repeated choice intro and recommendation badge; shortened the two options while retaining their distinction. |
| Stage picker and add-lever modal | Removed intros that repeated the heading or visible controls. Retained stage-type descriptions, prerequisites, counts, and difficulty labels. |
| Trip loading | Removed a redundant subtitle and shortened per-step text; retained the existing loading state and behavior. |
| Trip builder, round editor, spine, and preview | Kept useful prerequisites, type explanations, time units, and empty states. Shortened the published read-only note and removed its duplicate from the footer; “Duplicate to edit” remains. |
| Demo recording editor | Shortened the description while preserving that candidates record both screen and video. |
| Shared top-level shell, tabs, stepper, editable fields, and form controls | No redundant prose found. Navigation labels, accessible names, and edit actions retained. |

Validation: `tsc -b --pretty false` passed after the copy changes. Visual integration and repository-wide smoke checks are handled with the overall UI change.
