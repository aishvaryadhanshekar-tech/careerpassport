# Full application UI / IA audit — 6 September 2026

## Execution index

| Step | Scope | Status |
| --- | --- | --- |
| 1 | Inventory routes, sections, shared molecules; independent design and technical assessments | Done |
| 2 | Record verified findings and preservation checks before editing UI | Done |
| 3 | Shared visual foundations: contrast, focus, motion, control consistency | Done |
| 4 | Shared interactions: navigation, selection controls, overlays | Done |
| 5 | Page and section corrections identified in the audit | Done |
| 6 | Batched responsive and interaction verification; regression checks | Done |

## Brief and boundaries

Use the project-local Impeccable skill in Operate/refinement mode. Preserve the light, restrained green workspace identity. Improve UI and information architecture, not business logic. The primary jobs are AI-assisted drafting, human review before publishing, then locating candidates and making decisions. AI remains a demo. Do not remove fields, routes, question types, actions, templates, or candidate evidence to simplify a screen.

Audit sources: `src/App.tsx` route tree, all rendered component families below, existing specs and smoke coverage. Impeccable context was invoked once; its output was unavailable after output truncation. No PRODUCT.md or DESIGN.md was found in the project file inventory; the user brief and established source conventions govern this refinement.

## Coverage inventory

Every family receives source review; browser evidence distinguishes rendered routes from conditional states. Unrouted historical canvas components are retained and reviewed as legacy, not presented as active pages.

| Page / route family | Sections and molecules included | Functionality to preserve |
| --- | --- | --- |
| Workspace shell; Settings | Sidebar, profile popover, collapse, wizard header, stepper, account details | Navigation and collapse preference |
| Jobs `/` | Search, sorting, table/cards, overflow menu, status, deletion dialog, empty states | Open/copy/delete jobs and persisted filters |
| Collect `/create-job` | Composer, upload/audio chips, coverage hints, follow-up form, tags, choices, salary | Input capture, attachments, analysis and draft continuation |
| Role `/role-profile` | Sidebar, requirements, sourcing, evaluation, editable fields, importance/unit selectors | All editable fields and evaluation weights |
| Application `/step-2` | Context, standard/custom questions, sections, all question types, preview/device toggle | Required flags, option editing, ordering, preview |
| Publish `/step-3` | Role/application preview, destinations, sharing, success overlay | Review and explicit publishing |
| Job detail `/jobs/:id` | Overview, navigation, status, next action | Access to all original job tools |
| Classic pipeline `/jobs/:id/pipeline` | Board/table, filters, bulk actions, candidate cards, drawer/document tabs | Candidate stage changes, evidence, feedback, messaging |
| Prospects and communications job tabs | Search, add/import, templates, message preview | Prospect records, template editing and sending demo messages |
| Trips list and full editor | Search/status, creation choices, insights, spine, rounds, questions, Demo, preview, publish | Full existing Trip creation, edit, preview, publish and assign model |
| Canvas entry and pipeline | Two start options, primary tabs, node types, ports/edges, toolbar, AI attachments, utilities | Drag placeholders, explicit links, reset, save, review/apply AI, publication comparison |
| Canvas inspectors | Parent settings, stage/activity/rules, Trip/message placeholders, expand/resize, breadcrumbs | Same-node configuration, min width, L1-to-L0 return, success/failure links |
| Candidates workspace | Stage subtabs, decision queue, filters, candidate details | Evidence-based decisions, candidate history, live revision context |
| Hiring capabilities | Setup, brief/sharing, team, tasks/history, prospects, review, messages, Trips/legacy assessments, coordination | Existing operations, assignments, templates and evidence |
| Candidate demo routes | Application, Trip assignment, assessment, completion/error states | Required responses, submission, invitation state and completion |
| Shared molecules | Buttons, fields, tabs, tags, point lists, switches, dropdowns, chips, tables, dialogs, notifications | Existing callbacks, values, validation and keyboard/mouse access |

## Findings

Source-verified findings recorded before UI edits:

| ID | Severity / category | Evidence and user impact | Planned correction |
| --- | --- | --- | --- |
| F1 | P1 Accessibility / theme | `styles/controls.css`, `shell.css`, `jobs.css`, Trip and candidate sheets use #9aa0a6 / #98a2b3 for secondary text on white (below AA). Metadata, hints and choices are harder to read. | Replace foreground-only low-contrast neutrals with a shared readable secondary token; retain distinct semantic node colors. `/impeccable colorize` |
| F2 | P1 Accessibility | `formControls.tsx` TagInput closes on blur; its suggestions cannot be reached/selected with arrows. `roleProfile/UnitCombobox.tsx` renders clickable nonfocusable list items. | Complete keyboard selection and announced state while retaining custom values and existing data callbacks. `/impeccable harden` |
| F3 | P2 Accessibility / consistency | `Tabs.tsx`, `hiring/shared.tsx`, `trips/TripRoundTabs.tsx` use tab roles without arrow/Home/End navigation. | Shared keyboard helper; preserve all tab contents. `/impeccable harden` |
| F4 | P1 Accessibility | Trip creation/add-round and share dialogs declare modality without focus containment or restoration. | Reusable dialog focus lifecycle with Escape and return to trigger. Apply only to modal surfaces; canvas inspector remains nonmodal. `/impeccable harden` |
| F5 | P2 Responsive / consistency | Tiny chip remove/pencil controls; long point/tag content can overwhelm its row. Generic controls have uneven focus treatment. | Shared focus, wrap resilience and coarse-pointer targets; preserve canvas geometry. `/impeccable adapt` |
| F6 | P2 Motion | Shared loading sparkle/shimmer and recording pulse lack a local reduced-motion alternative. | Static readable loading/recording state under reduced motion; keep asynchronous behavior. `/impeccable polish` |
| F7 | P2 Status / error recovery | `ShareComposeModal.tsx` clipboard success has no feedback and failure is silently swallowed. | Inline status / actionable failure next to existing copy controls; no change to message generation. `/impeccable harden` |

Positive findings to preserve: intentional distinct stage/Trip/message treatments; candidate decision actions colocated with evidence; editable Trip placeholders retain explicit connections; persistent light theme; responsive inspector with context-preserving breadcrumbs; native input validation in candidate experiences.


## Independent synthesis (recorded before implementation)

Method: dual-agent (A: `/root/impeccable_design`; B: `/root/impeccable_evidence`). Assessment A completed before detector evidence was read. Independent design score: 28/40. Its ten scores, in Nielsen order, are 3, 3, 3, 2, 3, 3, 2, 3, 3, 3. This is a qualitative review, not an accessibility certification.

Implementation integrity: coherent product-specific system, with shared interaction gaps. The deterministic scan returned 12 warnings: 6 side-tab, 2 bounce-easing, 2 border-accent-on-rounded, 1 layout-transition, 1 overused-font. Inter is appropriate for an operational app; semantic node borders are deliberate user-requested distinctions and historical rules may be overridden. These are not reasons to replace the theme or erase node types. The short resize-grip height transition is bounded, not evidence of canvas layout thrashing. Preserve it. The two publish success easing warnings are minor; a restrained ease-out can preserve completion feedback.

| Audit dimension | Before / 4 | Key finding |
| --- | --- | --- |
| Accessibility | 2 | Incomplete keyboard widgets and modal focus |
| Performance | 3 | No verified blocking performance issue; bounded success animation polish |
| Responsive design | 3 | Existing structural breakpoints; small secondary controls remain |
| Theming | 2 | Light theme established, readable secondary token not used consistently |
| Implementation integrity | 3 | Coherent hiring IA, terminology and interaction drift |
| Total | 13/20 | Significant shared-component improvements warranted |

Additional finding F8 (P2, IA): Trip editor uses “Add lever” beside “Remove round”. Use “round” consistently in visible controls and accessible labels; keep type names and data schema untouched. F9 (P2, accessibility): AppShell content lacks a main landmark / skip target; provide a keyboard skip link and main landmark without changing routing. F10 (P3): publish success uses overshooting easing; retain the success state with restrained deceleration.

Severity totals: P0=0, P1=3 (F1/F2/F4), P2=6 (F3/F5/F6/F7/F8/F9), P3=1 (F10). Ten findings total.

Implementation order: shared foundations → keyboard and modal molecules → status/terminology/navigation corrections → batched browser checks and existing functional tests. Questions skipped: user explicitly requested documenting then implementing, and no product-scope decision is required.

### Browser evidence and final initial-audit addition

Assessment B injected the detector on Jobs, Collect, Settings, new Canvas and Role Profile at desktop/mobile. Clean measurements exclude detector-overlay overflow. Candidate unavailable routes were also inspected. All retained light mode under dark OS. Screenshots and raw evidence are in `/tmp/impeccable-*`; independent reports are copied alongside this audit.

F11 (P2, recovery): Trip unavailable page has only “Invitation not found”; assessment unavailable/expired states lack a normal page heading. Add a concise explanation to request a fresh invitation, retaining candidate context and existing data logic. Recorded before the corresponding edits. Final findings total: 11 (P0=0, P1=3, P2=7, P3=1).

### Batched visual inspection corrections (before final correction batch)

F12 (P2, IA): mobile Application editor stacks the long preview before form controls. Preserve DOM/reading order and preview functionality, but add visible jump links to form editing and preview. Apply the same pattern to the focused Trip builder.
F13 (P2, consistency): full Trip builder round ordering buttons and candidate-instructions textarea fall back to browser styling outside the canvas inspector. Style their owning component so both entry points share the same controls. The rewrite action also wraps awkwardly; reserve its intrinsic width.
F5 follow-up: the actual Role Profile edit action is `.tab-edit-toggle`, which also needs the coarse-pointer target rule. Final scope: 13 findings (P1=3, P2=9, P3=1).

## Implementation record

| Findings | Implemented change | Functionality preserved |
| --- | --- | --- |
| F1, F5, F6, F10 | Readable secondary foreground tokens, shared focus and selection, wrapping/removal targets, reduced-motion loading, restrained completion easing | Colors identifying node types, loading state, recording and publication timing |
| F2 | Keyboard selection of suggested tags/units; retain free text and removals | Original value setters and custom input behavior |
| F3 | Shared arrow/Home/End navigation across every existing tablist; key shared tabs use roving focus; Trip round panel association | Existing tab selection callbacks and contents |
| F4 | Shared modal focus containment, initial focus, Escape and trigger restoration; separate native AI disclosure from nested form controls | Backdrop close, explicit close, reset, manual/AI Trip creation, archive/delete confirmation |
| F7 | Share copy success and actionable clipboard failure notice | Generated content and clipboard payloads |
| F8, F9 | Round terminology; workspace main/skip link with child sections | Internal lever APIs, routing and existing content |
| F11 | Candidate invitation unavailable/expired headings and recovery text | Existing eligibility, invitation and completion checks |
| F12, F13 | Narrow-screen editor jump links; matching Trip order/instruction/rewrite controls | Preview, field values, round movement, removal and rewrite handlers |

The audit does not claim that every possible dynamic state has been browser-tested. Route families and component families were source-reviewed; the browser checks below cover representative renderings and named interactions. Original unrouted canvas components are retained. No business-service or data-model files were changed for this audit.

## Final verification

- `npm test`: 250 tests across 34 files passed, including job/draft storage, application forms, Trips, hiring operations, pipeline migration, connections and decisions.
- `npm run build`: passed after final UI edits.
- `node scripts/demo-smoke.mjs`: passed after final corrections. Covers existing placeholder creation/configuration, links/reconnection, save/reload, reset, smooth dragging, inspector resize/expansion and contextual return.
- 60 existing route/width combinations passed at 1512/1024/780/390/320px, including full Trip editor; no document overflow and light theme under dark OS. Intentional scrolling tables, tab strips and canvas remain scrollable.
- 12 additional candidate route/width combinations cover a valid published application, valid assigned full Trip, missing Trip and missing assessment at 1512/390/320px. Full Trip response submission passed.
- Added actual shared-widget browser fixture verifies preset/custom tag entry, unit selection, arrow/Home tab navigation, skip link, modal focus containment/restoration and actionable clipboard failure.
- Final screenshots visually confirmed mobile editing jump links, styled full-page Trip controls and candidate Trip form.
- `git diff --check`: passed.

All 13 documented corrections implemented. No detected regression in the exercised paths. This is not a WCAG certification or exhaustive combinatorial test of every possible state; conditional capability forms have source coverage and share the corrected primitives. No live AI or external delivery was introduced.
