# Independent layout evidence — reference refinement

Scope: bounded source scan of shared shell/form styles, workflow canvas/inspector/node styles, candidate lists, Trips, and hiring/detail styles. No UI changes, no browser verification. Impeccable `detect --json --scope layout src` run once; output `/tmp/reference-layout-scan.json` is `[]` (no mechanical findings). Empty scan output is not evidence of full visual correctness.

## Preserve these geometry contracts

- `src/canvasJob/workspace-responsive.css:8`: inspector minimum 340px; narrow canvas switches to a stacked panel at 740px using container queries. Preserve resize controls and max-height behavior.
- `src/canvasJob/workspace-responsive.css:93`: inspector title + expand + close use `minmax(0,1fr) auto auto`. Keep adjacent trailing controls rather than spacing them across the header.
- `src/canvasJob/flow-visual.css:66`: canvas toolbar adapts to available canvas width (560px container), including when the inspector is widened. Preserve that container, not only viewport breakpoints.
- `src/canvasJob/PipelineCandidates.css:77`: candidate row/detail panes collapse at 640px of actual container width. Keep long-name wrapping and stage/decision metadata.
- `src/trips/pipeline-trip-workspace.css`: embedded Trip controls use their own container rules and input min-width overrides. Preserve full editor within inspector and expanded mode.
- `src/styles/jobs.css:312`: jobs table deliberately has min-width 660px inside horizontal scroll. Do not remove columns to avoid overflow.
- `src/styles/footer-responsive.css`: fixed footer offsets depend on sidebar state; mobile footer wraps. Preserve bottom content space when changing padding/control heights.

## Source-supported opportunities and risks

1. **Shared hierarchy is inconsistent across module owners.** Canvas inspection titles 18px, candidate headings 16px, full-page headers separately defined. Use consistent page / section / card / field hierarchy within established layouts. Improve hierarchy through type weight/spacing first; avoid wholesale geometry overrides.
2. **Micro-label density remains high in hiring and embedded Trips.** Hiring rows/timeline/library/chat use 9–10px metadata; Trip embedded tabs 11px. Prefer readable 11–12px metadata with clear spacing, ensuring details remain available. Relevant `src/hiring/hiring.css:584,609,649,669,678`, `src/trips/pipeline-trip-workspace.css:7,22`.
3. **Large independent card gaps vary across surfaces.** Full Trip builder has 24px gaps while libraries/candidate cards use 8px. Harmonize within each density tier (page section vs repeated row), retaining compact operating views. `src/trips/trips.css:208`, `src/canvasJob/PipelineCandidates.css:42`, `src/hiring/hiring.css:596`.
4. **Viewport breakpoints alone are insufficient for legacy content embedded in resizable panels.** Current inspector explicitly overrides hiring/review/client/form grids with container queries; any new wrapper/card padding can narrow content earlier. Keep container-based adaptations and check 340px inspector + expanded inspector.
5. **CSS cascade is a concrete regression risk.** `src/index.css` is an ordered barrel with documented load-bearing imports. `flow-visual.css` adds component-specific visual overrides; `node-cards.css:199` has high-specificity/important message shape/color rules. Edit owning rules or make deliberate scoped overrides; avoid changing global button/input geometry without inspecting specialized switches, connection ports, and icon controls.
6. **Communication node visual shape is intentional.** Message nodes have pill shape and amber edges distinct from green/gray progression. A common rounded-card restyle must not flatten semantic distinctions or reposition connection handles.
7. **Potential stale rule, not a confirmed visual defect:** `.funnel-start-options` still declares three columns in `workspace-responsive.css:72`; current product has two choices. Another later selector may override. Confirm final cascade before adjusting, and retain mobile single-column rule.

## Suggested one-batch browser checks after refinement

- Jobs card + table, new-job choices, assistant composer.
- Pipeline selected/unselected node variants, placeholder Trip/message, connections/ports, toolbar with widened inspector.
- 340px inspector and expanded inspector with hiring review, application editor, Trips editor, rules and communications.
- Candidates row/detail/decision sections; full Trips builder and preview/assign; legacy role/application views.
- Desktop and 390/320px: wrapping controls, sticky/fixed footers, modal content, focus outlines, horizontal scrolling intentionally limited to tables/tabs.

No scan results have been used to direct another assessor before independent review completes.
