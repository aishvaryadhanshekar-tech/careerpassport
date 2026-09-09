# Independent detail audit: pages, candidate views, and shared molecules

Status: audited; findings ready for the separate implementation agent. No product files changed.

This is an independent Operate-mode review using Impeccable's audit and critique concepts: clear hierarchy, truthful affordances, consistent navigation, responsive composition, and preservation of existing behavior. It is one branch of the parent audit, not a standalone full Impeccable critique command. No other auditor's findings were read. Questions skipped: the user has authorized sequential fixes after consolidation.

## Findings index

| ID | Priority | Finding | Evidence |
| --- | --- | --- | --- |
| PAG-01 | P2 | Candidate drawer header scatters actions and puts Close below the controls | Browser + source |
| PAG-02 | P2 | Mobile Jobs table compresses titles and salary into narrow text columns | Browser + source |
| PAG-03 | P2 | Classic job navigation wraps into two rows and loses tab continuity | Browser + source |
| PAG-04 | P2 | Classic draft detail shows a Published status badge | Browser + source |
| PAG-05 | P2 | Completed summary stretches to the height of the action roster | Browser + source |
| PAG-06 | P2 | Candidate detail exposes enabled controls that have no action | Source, controls visible in browser |
| PAG-07 | P3 | Candidate Trip headings expose stored type names instead of UI labels | Source only |

## PAG-01 — Candidate drawer header actions and Close

- **Location:** `src/pipeline/CandidateDrawer.tsx`, `.drawer-head`, `.drawer-head-actions`, `.drawer-close`; `src/pipeline/drawer.css`; inherited `.pill-select` styling.
- **Evidence:** `/tmp/detail-audit-drawer-1512.png`. At 1512 px the candidate identity starts at y20; Update CV is on the right at y32, the stage select takes a full row at y54, and Close drops below it at y105 near the left edge of that action cluster. This creates a 134 px header for a small amount of content. It is the same misplaced-control pattern the user identified for Expand.
- **Correction:** Give the stage select an explicit content-sized flex basis within this header. Keep Close in a dedicated trailing position aligned with the identity's first row. Allow the lower-priority controls to wrap below identity at narrow widths, while retaining Close at the top trailing corner. Scope the change to this drawer rather than changing all selects.
- **Regression:** Verify stage changes still call `moveCandidate`, close/Escape/backdrop still dismiss, focus returns, and identity/close remain visible with a long name at 390/320 px. Preserve both document and feedback panes and their scrolling.

## PAG-02 — Mobile Jobs table readability

- **Location:** `src/JobsPage.tsx`; `src/styles/jobs.css`, `.jobs-table`, `.jobs-table td`, `.jobs-panel-body`; salary and title cells.
- **Evidence:** `/tmp/detail-audit-jobs-390.png`. The default table uses only a 660 px minimum for eight columns. Job titles wrap into four or five lines and salary splits into a tall narrow stack. Location/status/actions require horizontal movement, while row height is already excessive. Document overflow checks pass because the table is inside a scroller; that does not make the table readable.
- **Correction:** Keep table view available, but establish useful column widths (especially job identity and salary), prevent compensation fragments wrapping, and use the existing card view as the initial narrow-screen view when the user has not chosen a view. Preserve an explicit user view choice. Alternatively a compact responsive row layout may expose identity/status first and metadata below without adding a second implementation of actions.
- **Regression:** Both views must retain search, select-all/individual selection, job opening, status, compensation, copy link, and delete confirmation. Check 320/390/780/1512 and resize after a user changes view.

## PAG-03 — Wrapped classic job tabs

- **Location:** `src/JobDetailsPage.tsx`, `.job-pagetabs`, shared `Tabs`; `src/job/jobTabs.css` / `src/styles/controls.css`.
- **Evidence:** `/tmp/detail-audit-board-390.png` and `/tmp/detail-audit-draft-overview.png`. Job Overview / Trips / Pipeline occupy one row, Prospects / Communications a second row. The active underline appears mid-strip with another navigation row below it; the navigation consumes 90 px and stops reading as one set of peer tabs.
- **Correction:** Make this tab strip a single nonwrapping horizontal scroller with stable tab widths and an active underline. Ensure activating a clipped tab scrolls it into view. Keep all existing routes until the parent consolidates duplicate Trips IA.
- **Regression:** Arrow/Home/End keyboard behavior, selected state, all five routes, back navigation, and sticky header offset must remain correct. Use the same visual tab primitive as the workflow-level navigation where practical.

## PAG-04 — Draft rendered as Published

- **Location:** `src/JobDetailsPage.tsx`, `.jd-status-badge` hardcodes `Published`.
- **Evidence:** `/tmp/detail-audit-draft-overview.png`. Opening the seeded draft Product Manager, Growth at its existing classic detail route renders a green PUBLISHED badge. Browser readback of `.jd-status-badge` was `Published`; `listJobs()` classified this record as Draft.
- **Correction:** Render the actual `job.status` and derive the badge tone from that status. Do not change or auto-publish the record. Where the summary says “Published to,” show that only when the record is actually published; retain draft destination choices in the editor.
- **Regression:** Verify both seeded drafts and a published role, including navigation into/out of the canvas and preview. This is display truthfulness, not a lifecycle change.

## PAG-05 — Summary card whitespace competes with work

- **Location:** `src/job/NextStepNudge.tsx`, `.job-action-summary`, `.job-action-summary-section`.
- **Evidence:** `/tmp/detail-audit-overview-1512.png`. The three-line Completed card stretches to match the roughly 300 px Needs attention card containing an outreach roster. Two thirds of the Completed card is empty and its equal width/equal height visually competes with the actionable content.
- **Correction:** Separate the compact completed metrics from the actionable roster, or stop grid-item stretch and give the action section more width. Preserve every metric and each row action; no need for extra description. Keep candidate identity and review decisions as the primary scan path.
- **Regression:** Counts, all review links, per-candidate Message/Send invite/Copy invite link, zero-state behavior, and mobile stacking remain present.

## PAG-06 — Inert candidate controls look enabled

- **Location:** `src/pipeline/CandidateDrawer.tsx`: Update CV button, Open CV button in `ResumePreview`, Schedule button in `NoteComposer`.
- **Evidence:** These controls appear as enabled buttons in `/tmp/detail-audit-drawer-1512.png`. Source has no `onClick`, link target, or file input association for those buttons. The existing Voice and Post controls do have state/handlers and must not be swept into this finding.
- **Correction:** For this UI-only pass, visibly mark only these unimplemented controls unavailable with an accessible short explanation (or provide a small existing-demo-compatible feedback message). Do not remove functional upload, scheduling, or resume experiences elsewhere. Do not invent real CV editing or scheduling as part of styling.
- **Regression:** Verify the actual stage selector, tags, notes/Post, voice state, skill ratings, document tabs, and Timeline retain their handlers and state. Ensure unavailable controls do not imply data was modified.

## PAG-07 — Trip type labels

- **Location:** `src/demo/TripAssignmentExperience.tsx`, heading `stage.type.replaceAll('_', ' ')`.
- **Evidence:** Source-only: stored identifiers are used directly as lowercase heading text. Other product surfaces use deliberately named round labels (Rapid fire, Multiple choice, Case study, Demo, etc.).
- **Correction:** Reuse the existing Trip type-to-label mapping for the candidate heading while retaining duration. Do not alter stored type IDs, question inputs, answers, or completion logic.
- **Regression:** Each supported round renders the same questions, required behavior, duration, and submission values as before. Snapshot/browser verify at least one valid assigned Trip.

## Independent coverage record

| Family / surface | Inspection | Result / boundary |
| --- | --- | --- |
| Global shell and account placement | Source + desktop/mobile Jobs and Settings captures | Brand/navigation/account alignment acceptable in inspected default state; existing account menu behavior not re-exercised here |
| Jobs table, actions, bulk deletion | Source + 1512/390 table and delete dialog | PAG-02; deletion dialog title/buttons remained contained |
| Jobs card view/search/menu | Source | Handlers and structure retained; no claim of full interactive state coverage |
| Settings | Source + 1512/390 | No additional actionable visual defect |
| Classic job-details collection composer | Source + 1512/390 | Centered bounded composer, attachment/record/build controls present; no additional defect |
| Role Profile editor | Source + 1512/390 | Summary/editor stack fits; editors require scrolling on mobile, with horizontal section navigation preserved |
| Application editor and preview | Source + 1512/390 | Preview and editor jump links present; no horizontal page overflow; detailed question-type variants source reviewed only |
| Publish review and destination choices | Source + 1512/390 | Footer and destination choices contained; no additional defect |
| Classic job overview | Source + 1512/390, seeded draft route | PAG-03/04/05 |
| Classic prospects | Source + 1512/390 empty state | Empty state contained; populated prospect table not browser exercised |
| Classic candidate pipeline board | Source + 1512/390 populated board | Expected horizontal board scrolling; PAG-03 |
| Candidate drawer / notes / resume / skills | Source + 1512/390 capture | PAG-01/06. Mobile capture caught entry animation and is not used as proof of opacity/overlay defects |
| Candidate application | Source + 1512/390 unavailable-link state | Fresh seed's demo project had not been initialized; this is not valid populated-form visual coverage |
| Candidate assigned Trip | Source + 1512/390 missing-invitation state | PAG-07 source-only; valid assignment not created in this audit branch |
| Candidate assessment | Source + 1512/390 missing-invitation state | Error state contained; capture/countdown and all assessment variations not browser exercised |
| Share/publish dialogs, tag and unit inputs | Source inventory; existing test fixtures reviewed | Preserve existing modal focus and input behavior; not independently browser re-exercised in this branch |

The browser run used an isolated Chromium context at `http://127.0.0.1:5173`, existing seeded records, and normal page navigation. It produced 24 route/width captures, four dialog captures, and a draft-status capture. All route-level overflow measurements were zero. Measurements are in `/tmp/detail-pages-audit.json`; screenshots use `/tmp/detail-audit-*`. Those `/tmp` artifacts are local evidence, not durable shipped assets.

No performance score or WCAG conformance claim is made: this is a scoped visual/IA audit. No dark theme was introduced. Existing functional exceptions (e.g. seed jobs needing a demo project before candidate-link access) should not be silently treated as styling work.
