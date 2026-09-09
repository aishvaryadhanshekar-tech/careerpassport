# Assessment A — independent design review

Target: src/App.tsx and its app surfaces. Method: source-led UI/IA inventory plus a fresh isolated Chromium canvas inspection. No detector run or findings read. Browser screenshot: /tmp/design-canvas.png. Browser follow-on navigation timed out because the candidate navigation item was queried as a button; this is a harness selector issue, not a product failure. Consequently candidate/mobile routes below are source-reviewed, not claimed visually verified.

## Verdict
The visual language is appropriately quiet and grounded in a hiring workflow: sage workflow node, candidate stages, discrete activities, Trips and amber communications. It should retain this identity. The largest remaining weakness is interaction consistency among shared controls, not lack of ornament. A recruiting operator should be able to move reliably among data entry, pipeline construction and candidate decisions with the same keyboard and modal expectations.

## Route/section inventory
| Route family | Sections/molecules reviewed in source | Assessment |
|---|---|---|
| / Jobs | header actions, search, table/card switch, selection, menus, delete confirmation, empty state | Good task naming and destructive confirmation; generic dialog/focus consistency applies |
| /settings | profile name/email, demo account status, Jobs return | Concise, preserve static account semantics |
| /create-job | composer, attachments, fields, coverage, speech | Preserve input/attachment behavior; common form focus and contrast pass |
| /create-job-canvas, /jobs/:id/canvas | primary tabs, start options, root node, toolbar, node handles, inspector, AI, templates, publish review | Strong segregation; inspect small text/readability and tab keyboard semantics |
| /role-profile | sidebar, Requirements, Sourcing, Evaluation, tags, unit and importance selectors | Confirmed keyboard gaps in UnitCombobox; broader common widget consistency |
| /step-2 | application section cards, field editors, standard/custom fields | Retain all field types and ordering; shared molecule keyboard and labels |
| /step-3 | candidate preview, publish/share | Preserve candidate content and status; modal conventions |
| /jobs/:id overview | job information and actions | Keep legacy route accessible; consistent heading/status treatments |
| /jobs/:id/pipeline | candidate board, filtering, management actions | Retain stage movement and candidate access; common control contrast/focus |
| /jobs/:id/prospects | prospect listing and import/review | Preserve import/filter/move semantics |
| /jobs/:id/communications | templates, compose/send | Shared modal semantics; no simplification of sending scope |
| /jobs/:id/trips | library, statuses, create choices | Shared modal keyboard gaps confirmed |
| /jobs/:id/trips/:tripId | preview, component tabs, content, time, difficulty, publish/duplicate | Confirmed tab accessibility gap; inconsistent terminology |
| /demo/apply/:id | candidate application | Include in final visual validation; source entry inventoried |
| /demo/trip/:id/:assignmentId | candidate Trip execution | Include in final visual validation; source entry inventoried |
| /demo/assessment/:id/:assessmentId/:candidateId | legacy assessment execution | Include in final visual validation; do not remove route |
| Canvas capability panels | setup, brief, sharing, team, tasks, activity, prospects, review, messages, Trips, client coordination | Preserve breadcrumbs, expansion and candidate actions; common form/dialog/table styles apply |

## Scores (0 poor—4 excellent)
| Heuristic | Score | Rationale |
|---|---:|---|
| System status | 3 | Draft/save/publish visible; low-emphasis text needs legibility |
| Real-world match | 3 | Hiring stage architecture clear; lever/round/component language mixed |
| Control/freedom | 3 | Reset, breadcrumbs, resizing, direct canvas manipulation; modal gaps |
| Consistency | 2 | Native buttons mixed with incomplete custom listbox/tab patterns |
| Error prevention | 3 | Explicit publishing and deletion; preserve these |
| Recognition | 3 | Labeled toolbar and workflow child actions |
| Efficiency | 2 | Mouse paths clear, custom keyboard paths incomplete |
| Minimalism | 3 | Restrained canvas; tiny/low-emphasis metadata counterbalances cleanliness |
| Recovery | 3 | Existing notices and confirmation; focus return needs standardization |
| Help | 3 | Contextual AI and placeholder instructions, without persistent prose |
| Total | 28/40 | Solid structure; interaction polish needed |

## Priority issues
1. **P1 Custom unit chooser cannot select suggestions by keyboard.** `src/roleProfile/UnitCombobox.tsx:45–70`: trigger handles ArrowDown but options are click-only li elements with no active descendant or roving focus. Make option navigation/select/Escape complete while retaining custom values. Keyboard-only users cannot complete the same evaluation configuration as mouse users. Suggested command: harden.
2. **P1 Modal accessibility is declared but incomplete.** `src/trips/TripCreateChoiceModal.tsx:49–70`, `src/trips/TripAddLeverModal.tsx:90`, `src/ShareComposeModal.tsx:110`: role dialog/aria-modal exist, but no local focus initialization/trapping/Escape/return. Apply a shared focus lifecycle to dialogs, preserving backdrop and explicit close. Verify nested dialogs and form typing. Suggested command: harden.
3. **P2 Tabs look standard but omit standard keyboard/panel wiring.** `src/trips/TripRoundTabs.tsx:145–180`: tablist and tabs have selected state, all remain default tab stops, no arrow/Home/End behavior or tab-to-panel IDs. Apply consistent tab semantics across route and inspector tab groups without changing which actions are available. Suggested command: polish.
4. **P2 Small muted canvas metadata is hard to scan.** `src/canvasJob/funnel.css:23–39`: chat metadata includes 9–11px text and pale green-gray colors. Screenshot independently shows low-emphasis save status and compact workflow child buttons. Improve secondary text contrast, minimum useful metadata type, and focus visibility while retaining compact nodes and the light identity. Do not enlarge the AI helper overall. Suggested command: typeset.
5. **P2 Trip terminology mixes lever, round, stage and component.** `src/trips/TripRoundTabs.tsx:164` labels addition “Add lever”, while nearby actions say “Move round earlier/later”, “Remove round”; pipeline stages mean something else. Standardize the visible control vocabulary to “round” or product-approved component language, preserving underlying types and all component choices. Suggested command: clarify.

## Cognitive load / emotional journey
Canvas visible choices are sensibly grouped: four primary workspace tabs; four block types separated from Ask AI; root configuration actions separate from progression. Groups with >4 controls exist in candidate review bulk actions and Trip editing, so preserve grouping and distinguish destructive actions rather than removing capabilities. New-job calm one-node start is a strength. Peak confidence should come from explicit review-before-publish; post-publish return should prioritize candidate counts and decisions. Avoid making dense reviewer content look empty merely to reduce visible text.

## Strengths
- Workflow configuration stays distinct from candidate progression, matching the actual hiring task.
- Light, restrained canvas puts editable objects ahead of decorative UI.
- Direct manipulation, reset, expandable inspector and origin breadcrumbs provide useful control without abandoning the overview.

## Personas
- Keyboard recruiter: blocked at choosing a suggested unit; inconsistent tab navigation adds unnecessary traversal.
- Returning hiring manager: small low-emphasis status requires extra reading; preserve prominent candidate decision indicators.
- First-time trip author: “lever” versus “round” makes a familiar add-content task less recognizable.

## Implementation guardrails
No graph mutation semantics, automatic evaluations, data migration, candidate stage movement, sending/assignment/publish logic or AI behavior should change. Preserve placeholder nodes, manual connections, colored message links, minimum inspector width, expansion, back navigation, full Trip editor, document attachments and all legacy routes. UI validation should include desktop/mobile, open dialogs, keyboard selection and focus restoration, dark OS/light app, error/empty/published states.

Questions skipped: user already explicitly authorized audit followed by implementation; recommendations do not require product scope decisions.
