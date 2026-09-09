# Independent detail audit — canvas and hiring panels

Status: audit complete; implementation pending. Auditor: canvas/panels subagent. No UI code edited. Impeccable Operate principles applied: clear control semantics, proximity, hierarchy, readable density, preservation of task capability. This is a scoped design/source audit, not a full scored Impeccable critique command. Other auditors’ reports were not consulted.

## Findings index

| ID | Severity | Finding |
|---|---|---|
| CAN-01 | P2 | Two entry choices occupy a stale three-column grid |
| CAN-02 | P2 | All hiring section tabs inherit button/selector styling |
| CAN-03 | P2 | Role & compensation fields break meaningful proximity |
| CAN-04 | P2 | Activity filters have indistinguishable visible values |
| CAN-05 | P2 | Candidate-review filters expose raw property names and dominate the panel |
| CAN-06 | P3 | Owner and brief summaries introduce an unrelated serif hierarchy |
| CAN-07 | P2 | Expanded mobile detail spends too much height on repeated chrome |

### CAN-01 — entry options are not centered under their heading

- **Surface:** New job, desktop. `src/canvasJob/workspace-responsive.css:72`, `.funnel-start-options`.
- **Evidence:** Browser at 1512px reports grid columns `236px 236px 236px`, container x516/width740, but only two buttons (x516 and x768). Actual choices’ midpoint is x760; heading/container midpoint is x886: a 126px left shift. Screenshot `/tmp/detail-newjob-1512.png`. Mobile correctly uses one column.
- **Correction:** Declare two equal columns, with a maximum width suited to two cards; retain the single-column narrow breakpoint. Center the choices and heading as one group. Remove the obsolete empty third track.
- **Regression:** Exactly two choices; both entry actions still work; visual centers within 2px at desktop/tablet; no overflow at 320/390px.

### CAN-02 — section navigation looks like a collection of selection buttons

- **Surfaces:** All seven Setup tabs; Brief/Download/Share; Action on you’s two tab rows; review detail tabs; shared `src/hiring/shared.tsx` Tabs.
- **Files/selectors:** `.hire-tabs` and `.hire-tabs button` in `src/hiring/hiring.css`; generic `.funnel-workspace button` in `src/canvasJob/funnel.css`; selected override in `src/styles/reference-system.css`.
- **Evidence:** Browser Setup renders every tab with a rounded enclosing border and gaps, over two rows, followed by a disconnected divider. `/tmp/detail-setup-Role-comp.png`, `/tmp/detail-tasks-1512.png`. Base funnel button selector specificity wins over `.hire-tabs button` for borders; active pale fill compounds selector appearance.
- **Correction:** Explicitly scoped, borderless section tabs with one baseline and active underline, matching main Pipeline navigation at a smaller level. Keep single-row horizontal scrolling when needed; selected tab must scroll into view. Preserve genuine filters/segmented controls rather than globally changing every `.is-active` button.
- **Regression:** Existing roles, aria-selected, arrow/Home/End handling and selection behavior preserved. Seven Setup tabs reachable at 320px and minimum inspector width. Other buttons retain normal borders. Nested task navigation remains visibly differentiated by size/spacing.

### CAN-03 — Role & comp does not group fields by the task

- **Surface:** Role & hiring settings > Role & comp. `src/hiring/SetupPanel.tsx`, `sections['Role & comp']` and `.hire-form-grid`.
- **Evidence:** `/tmp/detail-setup-Role-comp.png`: “Location type” sits beside “CTC minimum”; “CTC maximum” sits beside “Notice period”. Currency and salary period follow beneath. The two ends of one salary range are spatially separated by unrelated fields. All twelve-plus fields form one undifferentiated run.
- **Correction:** Preserve fields and handlers, but group Role (title/client/department/team/type/level/openings), Location (location/mode), Compensation (currency/period/min/max), Availability (notice). Place min and max together in a nested two-column row that collapses cleanly at narrow width. Use short section legends and spacing, not new explanatory paragraphs.
- **Regression:** Canonical autosave and explicit settings save behavior unchanged; salary values/currency/period retained; each field remains present and associated with its label; mobile order follows the same grouping.

### CAN-04 — two “All” controls in Activity history cannot be distinguished visually

- **Surface:** Activity history, normal/expanded. `src/hiring/CoordinationPanels.tsx` ActivityPanel, `.hire-actions`.
- **Evidence:** `/tmp/detail-activity-1512.png` shows This job / All / Last 30 days, then All / Newest. The two All controls mean category and actor, but this is only exposed in aria-labels. Changing a value also hides its dimension from sighted users.
- **Correction:** Add concise persistent visible labels (Scope, Category, Date range, Actor, Sort), or dimension-bearing option text. Prefer labeled aligned fields consistent with other filters.
- **Regression:** Every current option/filter remains, custom date range still appears, pagination resets as before, no horizontal overflow.

### CAN-05 — review controls obscure the candidate list and expose implementation names

- **Surface:** Candidate review within the inspector. `src/hiring/ReviewPanel.tsx` filters and shared filter UI.
- **Evidence:** `/tmp/detail-review-1512.png`: stage strip + search/sort/view + six selectors + Advanced filters + Table columns consume roughly 325px before the first candidate. A select literally displays `All tripStatus`. At minimum width the table requires internal horizontal scrolling while candidate details compete with filter chrome.
- **Correction:** Give property names human labels (“Trip status”); keep search/stage and the frequently used status filter visible, move secondary owner/confidence/source/location controls behind a named Filters disclosure with an active count. Preserve all saved/advanced filter and column actions. Prefer cards automatically in a narrow inspector, retaining an explicit table/cards choice.
- **Regression:** All filters and column settings reachable; active filter values stay applied when collapsed; reset state evident; all candidates accessible in both views; full expanded table remains available. Coordinate ownership with the candidate-screen auditor to avoid duplicate changes.

### CAN-06 — serif owner and brief titles break the established hierarchy

- **Surfaces:** Hiring team owner block and Role brief summary. `src/hiring/hiring.css`, `.hire-brief h2`.
- **Evidence:** `/tmp/detail-team-1512.png` shows Demo Recruiter in Georgia; `/tmp/detail-brief-1512.png` shows role title in the same serif. Nearby identities and all workflow chrome use the shared sans. The rule hardcodes `28px/1.2 Georgia, serif`; later theme font-size overrides do not reset font-family.
- **Correction:** Use inherited app font and the same title weight/size scale as other person/role identities; preserve the summary background and metadata.
- **Regression:** Long titles wrap, owner/team details/actions unchanged; no global heading reset that changes candidate assessment content.

### CAN-07 — mobile expanded details retain too much global chrome

- **Surfaces:** Every expanded hiring panel at 390px. `FunnelWorkspace.tsx` expanded state, responsive workspace/pipeline CSS.
- **Evidence:** `/tmp/detail-client-390.png`: app header (72px), job header (103px), global tabs (51px), review banner (83px), panel header (73px), breadcrumbs (49px), demo strip follow before actual client work. The first content starts near y482. “Expanded” still leaves less than half the initial viewport for work.
- **Correction:** In mobile expanded mode, retain a compact job identity/back affordance plus detail header; collapse the global review banner and main navigation while focused. Return restores the exact former navigation/view. Keep the demo label available in workspace info rather than repeating a full row in every detail.
- **Regression:** All main tabs/review queue remain reachable after leaving focus; close/contract/back remain visible; focus and scroll/viewport restoration preserved; no overlay covers controls. This is UI state presentation, not removal of navigation.

## Coverage and evidence

One completed batched browser capture on isolated Chromium context, persistent local server 5180 (default-reset server 5173 initially prevented useful fixture setup). Fixture sample confirmation accepted; no user browser state used. No implementation or cosmetic edit loop occurred.

| Surface | Coverage | Finding/result |
|---|---|---|
| New job choices | Desktop 1512 and mobile390, geometry measured | CAN-01 |
| Canvas initial node and global AI composer | Runtime during entry, source review | No separate reproducible defect; existing selected-node colors/toolbar retained |
| Nodes, ports, toolbar, inline AI | Source review; shown with panel captures | No new behavior claim; direct manipulation regression suite should be retained |
| Setup Role & comp | Desktop | CAN-02/03 |
| Setup Requirements | Desktop | CAN-02; no separate alignment defect |
| Setup Job description | Desktop | CAN-02; no separate alignment defect |
| Setup Sourcing brief | Desktop | CAN-02; no separate alignment defect |
| Setup Visibility & posting | Desktop | CAN-02; no separate alignment defect |
| Setup Lifecycle | Desktop | CAN-02; no separate alignment defect |
| Setup Evaluation & playbook | Desktop + expanded + mobile390 | CAN-02/07; embedded controls preserved |
| Team | Desktop + expanded + mobile390 | CAN-06/07 |
| Tasks | Desktop + expanded + mobile390 | CAN-02/07 |
| Activity | Desktop + expanded + mobile390 | CAN-04/07 |
| Review | Desktop + expanded + mobile390 | CAN-05/07 |
| Client coordination | Desktop + expanded + mobile390 | CAN-07; candidate strip intentionally scrolls |
| Brief | Desktop + expanded + mobile390 | CAN-02/06/07 |

Evidence measurements `/tmp/canvas-detail-audit.json`; all inspected panels had zero outer horizontal overflow. Screenshots `/tmp/detail-setup-{tab}.png`, `/tmp/detail-{setup,team,tasks,activity,review,client,brief}-{1512,expanded,390}.png`.

Not exercised in this read-only audit: every conditional editor, custom activity date state, ownership transfer, external partner approval, scheduling/message mutations, candidate detail tabs after choosing a candidate, live microphone permissions, every port reconnection, inspector drag at all intermediate widths. These need regression checks by the implementation owner; no claim of exhaustive conditional-state testing. Trips and communications libraries/modal audits belong to the separate assigned auditor.

Positive controls to preserve: header expand/close buttons are correctly grouped at the far right; breadcrumbs provide parent context; semantic node colors are stable; panel content uses its own scrolling; mobile client strip scrolls internally without causing page overflow.
