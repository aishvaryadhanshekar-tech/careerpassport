# Pipeline UX review

## Scope and method

Heuristic review of the build → review → publish → manage candidates journey, informed by local browser walkthroughs, responsive screenshots and regression checks. This is not a usability study with recruiters. Preserve existing editors and product capabilities while separating authoring from candidate operations.

## Changes made during this pass

| Friction | Change | Job supported |
| --- | --- | --- |
| Stage counts compete with the canvas and resemble a second pipeline | Candidates is a primary tab beside Pipeline; All candidates, Needs decision and stages are subtabs | Find people and decisions without interpreting the graph |
| Adding blocks requires discovering controls inside node details | Persistent light toolbar offers Stage, Activity, Trip, Message and Ask AI | Build manually or with AI from one visible entry point |
| Placement and outcome are unclear when importing reusable content | Picker asks Insert after / Attach to and shows the selected path before opening the library | Add the right activity or communication in the right place |
| Blank workflows depend too heavily on AI | Stage insertion works directly after the workflow root; activities can then attach to it | Start from scratch without being forced through AI |
| New Trip action leads to another library action | Open the full Trip creation choice directly from Create new trip | Preserve full capabilities with fewer navigation steps |
| Candidate filters duplicate the stage and decision subtabs | Remove the duplicate dropdown and checkbox; keep name/email search | Keep a single visible source of filter state |
| AI and insertion popovers can compete | Opening a block picker dismisses AI; opening AI dismisses the picker | Focus on one authoring action at a time |
| Draft coaching banner duplicates the AI toolbar | Remove the draft banner; retain published candidate/decision summary | Reduce recurring copy while retaining operational context |
| Mobile navigation consumes several rows | Keep primary navigation and stage subtabs horizontally scrollable | Preserve workspace height and consistent tab order |
| Returning to a library can leave a previous insertion target pending | Clear pending Trip attachment when switching primary tabs | Avoid attaching a later Trip to an abandoned destination |

## What aligns with the core jobs

- **Ask AI to build:** the composer remains on demand and opens on scratch start. Proposals require an explicit apply step; generation remains simulated.
- **Review before publishing:** nodes retain editable rules, forms, Trips and messages; workflow review precedes publish. Trip publication is separate from workflow publication.
- **Understand the workflow:** the main path stays vertical, with distinct stage, activity, Trip and communication treatments. Placement is explicit when adding a block.
- **Return to manage candidates:** Candidates has stage counts and a dedicated Needs decision subtab. Search and a single click reach an individual record, rule evidence and response details.
- **Make a decision:** missing evidence remains a human decision; explicit experience/domain rules drive the rejection path. Trip completion does not automatically reject a person.
- **Work in detail:** reusable full Trips and communication experiences remain available, with expandable workspaces and a return to the pipeline.

## Audit recommendations — implemented

| Priority | Observation | Recommended next step |
| --- | --- | --- |
| High | Long workflows require substantial scrolling; side attachments can leave the visible canvas | Explore a compact overview / collapse-by-stage mode with a clear selected-stage marker. Keep saved manual positions and existing links. |
| High | Publication review lists configuration but does not visually distinguish changes from the live revision | Add a draft-versus-published change summary, especially for rules and communications. |
| Medium | Candidate rows show stage and Trip status, but decision reasons are still broad | Surface the concrete next action, such as verify experience or review submitted response, directly in each row. |
| Medium | Stage insertion uses explicit placement rather than direct edge insertion | Add an inline plus on a transition that opens the same toolbar picker with placement prefilled; retain the toolbar as a discoverable global entry. |
| Medium | Template libraries work, but larger collections will become difficult to scan | Add search and type/status filtering once the demo has enough reusable templates to make those controls useful. |
| Medium | Legacy assessment response tooling retains a denser interaction style than the new full Trips workspace | Gradually reconcile component terminology and presentation while preserving historical assignments and responses. |

All six recommendations above are now implemented:

- **Stage overview:** view-only compact projection with candidate counts, selected-stage highlighting and summarized failure links to Archive. Selecting a stage returns to detailed editing. Returning to the detailed canvas restores its viewport; authored positions and connections are unchanged.
- **Publication comparison:** compares the draft with the actual live revision. Lists added/removed/changed nodes, stage order, role/application changes and full Trips. Rule and communication edits display live/draft values. Moving or collapsing nodes does not appear as a content change.
- **Candidate next actions:** rows surface the earliest open task, submitted-response review, experience/domain verification, waiting state or offer/archive context. No scores drive these labels or decisions.
- **Inline insertion:** transition plus buttons open the existing toolbar picker with the source stage preselected. Users can choose Stage, Activity, Trip or Message while retaining library import and full creation flows.
- **Library filters:** Trip libraries and attachment pickers support search, publication status and component type. Message attachment search includes subject/body and channel filtering; the Communications workspace retains its existing search/channel views. Empty results are explicit and creation remains available.
- **Trip component UI:** historical component Trips retain their data model, invitations and responses. The workspace now uses Edit / Preview / Assign / Responses labels, consistent Trip/component terminology, a searchable/filterable library and back navigation. Opening one Trip hides the library list to reduce clutter.

Validation: production build, 242 unit tests, end-to-end audit checks and the 60-combination responsive/light-mode screen audit passed. Browser checks explicitly verify that overview toggling preserves detailed positions and links, transition placement is prefilled, comparison includes new content, filters work and component Trip navigation remains available. This remains a heuristic and prototype validation, not a recruiter usability study.
