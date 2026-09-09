# Pipeline builder revamp

## Task index — execute in order

| ID | Task | Status |
| --- | --- | --- |
| 1 | Inventory existing capabilities and map the new architecture | Done |
| 2 | Migrate saved workflows; model stages, transition activities and rule outcomes | Done |
| 3 | Build distinct vertical workflow nodes, stage insertion/reordering and attachment pickers | Done |
| 4 | Connect full Trips creation/editing, preview, publishing and assignment | Done |
| 5 | Add workflow navigation, expandable detail and stage/candidate focus | Done |
| 6 | Make AI draft → review → publish and published decisions/candidate locations clear | Done |
| 7 | Verify migration, preserved capabilities, interactions and responsive light layout | Done |
| 8–10 | Candidates navigation, toolbar and UX audit | Done |
| 11–17 | Implement audit recommendations and verify | Done |
| 18–21 | Direct canvas connections and consistent panel headers | Done |
| 22–23 | Assistant documents and two-choice new-job entry | Done |
| 24–25 | Contextual breadcrumbs and return navigation | Done |
| 26–28 | Drag-out nodes and deferred Trip/message configuration | Done |

## Confirmed product direction

Migrate existing saved workflows without dropping content or settings. Maintain the light theme, vertical draggable canvas, reset layout, compact AI and resizable details. Stages are the candidate journey backbone; workflow settings, brief, sharing, team and history belong to the parent. Activities sit on transitions; Trips and communications have distinct treatments and clear attachment/outcome labels.

Before publishing, the primary job is asking AI to draft a pipeline, reviewing and configuring it, then publishing. AI remains a scripted prototype, with explicit review before applying a suggested structure. After publishing, the primary job is seeing where candidates are, identifying pending human decisions, and opening an individual candidate from their stage quickly.

Failure paths use explicit hard rules such as unrelated resume domain or insufficient experience. Trip scores do not automatically reject candidates. Rules and associated thank-you/rejection communications must be reviewable. Ambiguous evidence stays with a human reviewer.

## Required interactions

- Insert and reorder stages without losing activities or attachments.
- Attach existing/new Trips and communication templates between stages and on success/failure outcomes.
- Use the existing full Trips model: generation from insights, editing, assessment components, preview, publishing and assignment. Assessments are components of Trips, not a competing creation model.
- Pipeline / Trips / Communications navigation at workflow level.
- Expandable right detail panels for activities, trips and candidates. Expanded views preserve the builder's selection and viewport on return.
- Stage candidate trays expose counts, decision status and individual details. Candidate-management focus minimizes the builder.
- Preserve application configuration, team/prospects/review/outreach/calling/client/history capabilities in appropriate workflow/stage tools.

## Migration and verification requirements

Migration is idempotent, preserves node IDs, content, manual positions, trip data and candidate links, and avoids deleting legacy data. New semantic links are derived or added without mutating unrelated stored data. Checks cover migration, insertion/reordering and outcome relationships, full Trips entry points, preview/publish/assign, candidate focus and return, and responsive layouts.

## Capability inventory and mapping

| Existing capability | Current implementation | New home |
| --- | --- | --- |
| Role inputs, import, publish revisions, application preview | FunnelWorkspace, JobDetailsPanel, demo service | Parent workflow and review/publish actions |
| Settings, brief/sharing, team, tasks, history | HiringWorkspace panels | Parent workflow tools and decisions entry |
| Application fields and question editors | ApplicationPanel | Application transition + explicit configuration entry |
| Candidate stage/status, résumé, feedback, tasks, movement | ReviewPanel, candidate board, demo service | Stage tray and expandable candidate detail |
| Prospects and promotion, client coordination | ProspectsPanel, ClientPanel | Contextual stage tools |
| Email/WhatsApp/calling templates and approvals | MessagesPanel, communication templates/service | Communications library and attached message nodes |
| Legacy funnel trips/instructions/rounds | FunnelNode tree, demo assignments | Linked first-class Trips; original IDs/content retained |
| Trip generation from role insights, round editing, scenario, difficulty, duration | tripsStore, tripAIBuild, TripRoundTabs, SpineEditor | Shared full embedded Trips workspace |
| Trip mobile/desktop preview, publish, duplicate | TripPreview, TripPublishBar | Trip panel / expanded workspace |
| Rapid Fire, Pick & Defend, Demo + frozen roster/invites/responses | AssessmentsPanel, hiring service | Preserved as legacy Trips components/roster access within Trips |
| Canvas drag/reset/zoom, compact scoped/global AI | FunnelCanvas, assistants | Retained in builder |

The current demo uses broad visual buckets (Prospects, Pipeline, Interview process) while its candidate board uses Applied, Screened, Submitted to Client, Interviewing, Offered and Archive. Migration will expose the real candidate stages, retaining old node IDs through stage-key mapping and retaining legacy round-based candidate locations. Archive is an exit path, not an automatic step after an offer. Existing score-trigger messages will be retained as legacy configuration, disabled pending review in the migrated draft; no score-based rejection is introduced.

## Implementation and verification

Completed the sequential implementation. Existing drafts migrate into version 2 of the workflow model, retaining legacy content and IDs. Full Trips are linked by ID and retain the shared editor; legacy assessment components, response history and rosters remain accessible under Trips. Existing candidate invitations keep their published snapshots; reviewers explicitly move older candidates to the latest workflow before applying its rules.

The AI composer provides a scripted proposal with an explicit apply step. Workflow publication requires review of stages, rules and communications. Published workflows expose stage counts, pending decisions and direct candidate detail access. Explicit verified experience/domain evidence drives rule outcomes; missing evidence requires review. Rejection records its reason and queues the associated communication in the demo outbox. Trip submissions await human review and do not automatically reject candidates.

Validation completed:

- Production build and all 237 tests across 32 test files passed.
- Browser regression passed for AI proposal/apply/review/publish, migration, stage insertion/reordering, Trip reuse, generation from insights, editing, preview, publication, assignment and candidate response.
- Candidate focus, explicit hard-rule rejection, expanded workspace modes and saved state passed browser checks.
- Whole-node and keyboard toggling, smooth drag tracking, node-position persistence, panel resize bounds, vertical scrolling and layout reset preserving links passed browser checks.
- Responsive audit passed for 60 route/width combinations at 320, 390, 780, 1024 and 1512 pixels. No page overflow; light styling remained active with a dark operating-system preference. Pipeline, Trips, Communications and Decisions panels also passed overflow checks at all five widths.

AI generation and message delivery remain prototype simulations. No external LLM or email delivery is connected. The production build retains a bundle-size advisory; compilation succeeds.

## Follow-up: candidate navigation and canvas insertion

| ID | Task | Status |
| --- | --- | --- |
| 8 | Move stage navigation under Candidates beside Pipeline | Done |
| 9 | Add a light canvas toolbar with AI, Stage, Activity, Trip and Communication insertion | Done |
| 10 | Audit build/review/publish and candidate-management UX; repair friction and verify | Done |

Candidates owns All candidates, Needs decision and stage subtabs. Pipeline keeps building controls. The toolbar offers explicit placement and outcome selection, new blocks and import from existing Trip/communication libraries, retaining full editors. Insertion must work from a blank workflow as well as with a selected node. The audit will cover discoverability, context, navigation consistency, responsive layout and preservation of current capabilities.


Follow-up verification: production build and 237 unit tests pass. Browser checks cover Candidates subtabs, all four toolbar block types, library imports, direct full Trip creation, blank-canvas stage creation, AI/picker dismissal, responsive pickers at five widths, preserved drag/resize/reset, and 60 light-mode route/width combinations. The [UX review](../audits/2026-09-05-pipeline-ux-review.md) records completed fixes and prioritizes remaining design opportunities.

## Audit implementation follow-up

| ID | Task | Status |
| --- | --- | --- |
| 11 | Compact stage overview preserving canvas positions and links | Done |
| 12 | Draft-versus-live publication comparison for nodes, rules, messages and Trips | Done |
| 13 | Concrete next actions on candidate rows | Done |
| 14 | Inline transition insertion using the toolbar picker | Done |
| 15 | Search and filters in Trip/message libraries and attachment pickers | Done |
| 16 | Reconcile legacy Trip components and response UI; retain stored history | Done |
| 17 | Validate all audit changes and update UX review | Done |

Compact overview is a view-only projection; it must never overwrite authored positions or connections. The publication comparison uses the actual live revision and excludes viewport/collapse-only changes. Next-action labels are advisory, derived from current candidate context without triggering decisions. Edge insertion prefills the existing picker. Legacy data remains in its current storage model while labels, filtering and navigation are aligned with Trips.

Audit implementation verified with 242 tests across 33 files and the browser regression suite, including overview position/link preservation, edge insertion, live revision comparison, filters and component Trip UI. The 60 route/width light-mode audit remains passing. Overview fit reserves room for the toolbar; detailed views retain zoom, drag, resize and reset behavior.

## Direct canvas connections — 2026-09-06

| ID | Task | Status |
| --- | --- | --- |
| 18 | Vertical progression, side message attachments and consistent connector colors | Done |
| 19 | Drag connections from node ports; reconnect and remove links on canvas | Done |
| 20 | Verify persistence, reset, cycle prevention and existing workflows | Done |
| 21 | Align expand/close actions together at the right edge across all detail headers | Done |

Progression uses bottom-to-top ports by default. Messages use side ports and one amber connector color independent of success/failure; outcome labels retain that distinction. Every node exposes multiple connection points on hover/selection. Direct edits persist, update activity/message ownership or progression destinations, and survive reset layout. Invalid self/cyclic connections are rejected. Removing a connector leaves its nodes intact. Existing React Flow is used; no new dependency is required.


Header repair applies to the shared inspector: the title owns remaining width, actions retain their size and gap at narrow, resized and expanded widths. Verify every representative panel rather than patching only the activity view.

## Assistant documents and new-job entry — 2026-09-06

| ID | Task | Status |
| --- | --- | --- |
| 22 | Upload/remove documents within the canvas AI composer | Done |
| 23 | Two new-job choices: Build with AI and Start with a Template | Done |

Build with AI retains the existing one-node scratch start with the composer open. Import is no longer a separate starting choice; documents can be attached in the composer. Reuse the existing draft attachment limits (10 files, 25 MB each), show filenames/removal/errors, accept PDF, Word, TXT and Markdown, and allow a document-only submission. AI remains an explicitly simulated draft/review experience.

Validation for items 18–23: production build and 248 tests passed. Browser checks passed for port dragging, endpoint reconnection, both message attachment directions, amber message links, save/reload/reset persistence and removal without deleting nodes. Header actions remain adjacent and vertically aligned in Pipeline, Trips, Communications and Candidates at five widths. The 60-combination light-mode audit passed. New-job entry exposes exactly two choices; document attachment, filename display, document-only submission and removal passed the browser walkthrough. Document generation remains a demo simulation; filenames/metadata use the existing draft attachment model and files are not sent to an external LLM.

## Contextual return navigation — 2026-09-06

| ID | Task | Status |
| --- | --- | --- |
| 24 | Add L1 breadcrumbs/back navigation to the originating node and Pipeline | Done |
| 25 | Verify return context, panel alignment and responsive navigation | Done |

Node shortcuts currently replace the inspector with a capability screen, losing the visible route back. Add Pipeline → originating node → current screen breadcrumbs plus a back arrow. Returning restores the originating node, panel expansion, scroll and canvas viewport. The Pipeline crumb closes detail and returns to the canvas. When no explicit origin exists, use the capability's configured parent, falling back to Job configuration. Keep expand/close actions adjacent; do not add a competing header action.

Validated with a production build and browser regression: return from Private prospect pool, Candidate review and Role & hiring settings restores the originating node and exact canvas viewport. Expanded panel state survives the round trip. Pipeline breadcrumb dismisses the detail panel. Breadcrumbs fit at 1512, 390 and 320 px. Existing end-to-end flows and the 60 route/width light-mode audit pass. The originating panel scroll offset is captured and restored; capability screens no longer recenter the canvas on hidden configuration nodes.

## Drag-out placeholders — 2026-09-06

| ID | Task | Status |
| --- | --- | --- |
| 26 | Drag/click toolbar blocks onto canvas without configuration or automatic links | Done |
| 27 | Keep Trip/Message placeholders until an existing item is selected or a new one created | Done |
| 28 | Verify placement, connection, deferred configuration and persistence | Done |

Toolbar drag creates an unconnected node at the drop point; clicking creates one in the visible canvas. Do not open a panel automatically. Inline transition insertion retains its contextual picker. Placeholder Trips must bypass legacy automatic Trip generation. Trip/message placeholders expose Choose/Create actions when opened; configuring them fills the same node and preserves its links and position. Manual nodes acquire only explicitly authored connections.

Validated: production build and 250 tests passed. Browser checks cover dragging Stage, Activity, Trip and Message types; no automatic connections or inspector; placeholder persistence across reload; direct connection before configuration; existing Trip selection and new Trip/message creation filling the same node; click-to-add at four widths. Existing context navigation, drag/resize/reset and direct-connection suites pass, along with 60 responsive light-mode route checks. The prior configuration-first smoke script is retained as pre-placeholder-smoke.mjs; demo-smoke.mjs now exercises the current interaction.
