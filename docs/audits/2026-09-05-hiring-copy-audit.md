# Hiring, demo, job and pipeline copy audit

Date: 2026-09-05. Scope: all 23 TSX modules directly inside `src/hiring`, `src/demo`, `src/job` and `src/pipeline`.

Removed repeated explanations and promotional language. Retained field labels, accessible control names, errors, useful empty states, real candidate/document/message content, counts, demo limitations and constraints that affect decisions. No behavior or CSS changes.

| Module | Change or retention rationale |
| --- | --- |
| hiring/SetupPanel | Removed generic role intro; shortened sourcing and visibility notes while keeping their effects. |
| hiring/CoordinationPanels | Removed action-queue intro; shortened team/demo, client privacy and immutable activity notes. Kept ownership-transfer consequences. |
| hiring/ProspectsPanel | Shortened sourcing and application explanations; retained import formats, limits and filename-only demo behavior. |
| hiring/MessagesPanel | Reduced intro to channel prerequisites and demo delivery status; shortened approval disclaimer. Kept variable and template instructions. |
| hiring/ReviewPanel | Kept only stage/status and optional-feedback constraints in intro; shortened selection status. Preserved evaluation evidence and counts. |
| hiring/AssessmentsPanel | Shortened publishing, generation, capture and invitation notes. Preserved locking, selection, expiry and recording requirements. |
| hiring/BriefPanel | Removed repeated “derived from role settings” eyebrow on each field; shortened empty and download-scope notes. |
| hiring/HiringChrome | Removed sort narration and repeated candidate action byline; shortened no-results message. Kept useful role and job status context. |
| hiring/AssessmentExperience | Kept candidate prompts, timing, capture requirements, expiry and demo restrictions; these affect task completion. |
| hiring/DataFilters | Kept filter names, view naming and current values; no redundant bylines. |
| hiring/HiringWorkspace | Kept single local-demo/no-external-sends banner, errors and notices. |
| hiring/shared | Kept field labels, tabs, empty state and clipboard recovery guidance. |
| demo/DemoPanel | Shortened candidate empty state, demo outbox and connection notices. Preserved simulated-delivery status and sample content. |
| demo/DemoApplication | Replaced motivational success heading and internal stage explanation with direct receipt confirmation. Kept form guidance, validation and demo/browser constraints. |
| job/CommunicationsTab | Condensed long intro to template availability by stage. |
| job/ProspectsTab | Shortened empty-state description while preserving prospect/application distinction. |
| job/NextStepNudge | Replaced conversational summary headings with “Completed” and “Needs attention”; shortened flagged and empty states. Preserved counts and actions. |
| job/JobOverviewTab | Kept existing labels and edit/save controls; no redundant bylines. |
| pipeline/CandidateDrawer | Shortened empty activity and evaluation-setup guidance; retained actual profile, notes, evidence and status. |
| pipeline/CandidateCard | Kept candidate attributes, statuses and actions needed for comparison. |
| pipeline/CandidateTable | Kept column labels, filters and concise no-match state. |
| pipeline/PipelineTab | Kept stage counts and drop-target empty hint, which supports discovery. |
| pipeline/BulkActionsBar | Kept selected count and archive/recovery consequence in confirmation. |

Validation: TypeScript check and existing hiring/demo service tests; no new tests for copy-only edits.
