# Prototype feature changes

## Status index

| ID | Requirement | Status |
| --- | --- | --- |
| 1 | Move demo and workspace utilities into an info popover beside Fit journey | Done |
| 2 | Canvas-wide AI icon and inline node chat | Done |
| 3 | Remove funnel navigation and canvas heading; retain zoom controls | Done |
| 4 | Compact AI helper alongside responsive detail panels | Done |
| 5 | Interactive movable node cards and parent-first layout | Done |
| 6 | Manually resize the right panel | Done |
| 7 | Smooth dragging, reset layout and vertical pipeline scrolling | Done |
| 8 | On-demand global AI action bar and progressive scratch start | Done |
| 9 | Reduce redundant interface copy across screens and components | Done |
| 10 | Consistent light theme throughout the prototype | Done |
| 11 | Responsive layout repair after copy cleanup | Done |
| 12 | Pipeline builder revamp, migration, full Trips and candidate decisions | Done |
| 13 | Candidates subtabs, canvas block toolbar and UX audit | Done |
| 14 | Implement all six UX audit recommendations | Done |
| 15 | Direct canvas connections and distinct side message links | Done |
| 16 | Consistent expand/close positioning across detail headers | Done |
| 17 | Assistant document uploads and two new-job starting choices | Done |
| 18 | Contextual L1 back navigation and Pipeline breadcrumbs | Done |
| 19 | Drag-out loose nodes with deferred Trip/message configuration | Done |
| 20 | Full-app Impeccable UI / IA audit and implementation | Done |
| 21 | Cohesive visual refinement of the workflow | Done |
| 22 | Reference-led cleanup across all page and component families | Done |
| 23 | Expanded demo jobs and configurable refresh reset | Done |
| 24 | Independent detail audits and sequential UI / Trips consolidation fixes | WIP |

New requests will be appended and implemented in order. Statuses: Planned, WIP, Done.

## 1. Info popover for secondary controls

The demo toolbar and header utilities look out of place in the main workspace. Consolidate the controls from both supplied screenshots behind an info icon at the bottom right, immediately beside the existing fit control (currently labelled “Fit journey”). This is the temporary home for these options.

### Requirements

- Remove the always-visible demo toolbar and Switch job / ⌘ K / Actions header buttons.
- Show a small outlined info icon beside Fit journey. Keep the fit action intact.
- Clicking the icon toggles a compact, tooltip-like interactive popover above it.
- Include Load/Reset sample demo, Candidates & outbox, Open candidate view, Copy application link, Switch job, ⌘ K search, and Actions with its unread count.
- Preserve existing handlers, disabled states, copy feedback, and the global search shortcut.
- Keep the info entry accessible on the initial workspace before a journey is created.
- Support keyboard activation, visible focus, Escape and outside-click dismissal; restore focus on Escape. Give the icon an accessible name and expanded state.
- Keep the popover within the available screen width; all options must remain available on narrow screens.

### Verification

- `npm run build` passed (TypeScript and production build).
- `node scripts/demo-smoke.mjs` passed, including the existing hiring audit.
- Verified controls are initially hidden, info reveals the options, Escape closes and restores focus, and the global search shortcut works while the popover is closed.
- Existing sample loading, candidate view, candidates/outbox and downstream hiring flows passed through the relocated entry points.


## 2. Canvas-wide AI icon and inline node chat

Selecting any canvas node reveals an AI icon beside that node, following the supplied visual references. Clicking the icon opens an inline chat composer beside the selection, anchored to the canvas node rather than housed in the right detail panel.

### Requirements

- Support every node kind, including hiring tools.
- Place the AI icon outside the selected card; open a compact chat with “Describe your idea…” input, dictation, and send action.
- Keep chat attached to the selection during pan and zoom, with viewport bounds handling.
- Keep the detail inspector available while chatting (updated by item 4).
- Support successive messages and separate conversation history and input drafts by node during the workspace session.
- Preserve existing proposal previews and explicit acceptance of changes; switching nodes clears pending proposals so they cannot apply to the wrong node.
- Close with the close button or Escape, stop dictation when leaving chat, and retain ordinary node configuration access.
- Use the existing prototype template engine, visibly labelled as demo suggestions. Hiring-tool nodes provide contextual guidance without modifying unrelated application fields. Live model integration is outside this UI change.

### Verification

- Production build and full demo/hiring browser smoke checks passed.
- Verified inline form proposal and acceptance, follow-up messages, Escape/focus return, separate node conversations and drafts, and hiring-tool chat without application mutations.
- Verified chat stays within a 780 × 720 viewport with the composer visible. Reviewed a desktop screenshot; long proposals scroll above the composer.


## 3. Simplify the canvas chrome

Remove the left “Your funnel” navigation, its count and footer, and the “Candidate journey” heading and zoom/pan hint. The canvas should use the freed horizontal space. Retain the bottom zoom in, zoom out, fit-view controls, and the bottom-right Fit journey and info actions. Nodes remain directly selectable for configuration and inline AI chat.

### Verification

- Verified the funnel navigation and canvas heading are absent and zoom controls remain visible.
- Updated the existing smoke/audit flows to select nodes directly on the canvas; all demo and hiring checks passed.


## 4. Compact AI helper and responsive detail panels

- Reduce the AI helper from 430px to 320px overall, with a smaller icon, tighter spacing and a 340px maximum conversation height. Keep the composer visible while content scrolls.
- Allow inline AI chat and the selected node’s right panel to remain open together.
- Give all node detail panels a consistent fluid width with a 340px minimum on desktop. Adapt to the available workspace width; on narrow workspaces stack the panel below the canvas so both remain usable, relaxing the minimum only to fit smaller screens.
- Reflow fields, cards, actions, previews and hiring-tool layouts based on panel width, not only browser width. Fix wrapping, alignment and input sizing issues without hiding content.
- Verify ordinary node kinds, hiring tools, application editing and previews at desktop and narrow widths.

### Verification

- `npm run build` passed.
- Full demo/hiring smoke checks passed, including chat and detail-panel coexistence.
- Audited 27 rendered node panels at widths of 1512, 1024, 780 and 390px for panel bounds, minimum width and horizontal overflow.
- Checked top-level panel tabs at desktop and phone widths, including application preview and role settings.
- Reviewed screenshots of desktop/mobile chat, application preview and role settings.
- Fixed the legacy mobile overlay rule, panel-based grid reflow, action wrapping, application field-row alignment and checkbox/radio sizing.


## 5. Interactive movable node cards and parent-first layout

- Revamp cards to visibly communicate selectable, draggable canvas nodes: distinct kind icons, borders, hover/selected states, and drag affordance.
- Clicking anywhere on a node opens its details; clicking the same node again closes them. Keep keyboard activation and separate expand/collapse controls.
- Drag nodes freely instead of enforcing a fixed flowchart. Preserve custom positions when editing, saving, reloading, and collapsing/expanding branches. Dragging must not toggle the detail panel.
- Default child nodes appear below their parent at every depth, with sibling spacing that avoids overlap. Use curved parent-child connectors that follow custom positions.
- Keep the compact AI helper anchored to the moved node and preserve responsive detail panels.

### Verification

- Hierarchy/reset model suite: 8 tests passed.
- Browser checks passed for whole-card header/footer clicks, repeated-click closing, keyboard activation, dragging without toggling, live AI anchoring and saved positions after reload.
- Reviewed the refreshed node cards and vertical connectors in screenshots.


## 6. Manually resize the right panel

- Provide a visible drag grip on the left edge of every desktop detail panel. Drag left to widen, right to narrow.
- Keep the 340px minimum and leave at least 280px for the canvas. Clamp the panel to available space on browser resize.
- Share the chosen width across node selections during the current workspace session; continue panel-based content reflow.
- Support keyboard adjustment with Left/Right arrows and Home/End. Hide the horizontal resize handle when the mobile panel is stacked below the canvas.

### Verification

- Browser checks passed for dragging wider, Home to 340px, arrow-key increments and maximum width preserving 280px of canvas.
- All 27 node panels passed at desktop, tablet and phone widths; chat and details remain available together.


## 7. Smooth dragging, reset layout and vertical scrolling

- Fix jitter by keeping pointer-move updates local to the canvas; save final positions on drop instead of recalculating the hierarchy and saving during every pointer move. Cancel pending camera centering when dragging starts.
- Replace the bottom-right Fit journey action with Reset canvas layout. Remove only custom positions, restore the default arrangement and readable starting view, and preserve all nodes, settings, collapse states and links. Retain the bottom-left zoom/fit controls.
- Keep the main pipeline vertical, with children below their parent and each section’s descendants placed before the next main stage. Prefer vertical scrolling over a wide tree or tiny fit-to-screen display.
- Mouse-wheel scrolling pans vertically; zoom buttons and pinch zoom remain available.

### Verification

- Browser checks verified incremental pointer tracking after the drag threshold with less than 4px tracking error in both axes.
- Reset restored the original node coordinates, retained every rendered edge ID, and persisted across reload. Vertical wheel scrolling passed.
- Full demo/hiring smoke suite, responsive panel audit and production build passed. Existing React Flow supports this implementation; no dependency added.


## 8. On-demand global AI action bar and progressive scratch start

Inspired by the supplied Zoho and Figma screenshots, add a global canvas assistant as a small floating bottom action bar. Its chat opens immediately above the bar and feels part of the canvas, without replacing the right detail panel.

### Requirements

- A compact “Ask AI” action opens/closes the global prompt panel on demand. Keep the node-specific assistant available as a separate scope; preserve the right panel when switching assistant scopes.
- Provide task chips for Describe role, Build pipeline and Review workflow, a prompt input, demo chat history, send/dictation controls, and a model selector defaulting to Claude with other placeholder model choices.
- All global assistant responses are scripted demo content. Model selection only changes the displayed choice. Do not call an LLM, require credentials, or modify job fields, nodes or links from this chat.
- Preserve chat input/history/model selection while closing/reopening during the workspace session. Make demo status clear without technical setup in the user flow.
- “Build from scratch” begins with only the job node and the global assistant open, without automatically opening the right panel or adding hiring-tool nodes.
- Preserve that single-node state after saving/reloading. Reveal additional workflow nodes only when the user explicitly chooses the existing manual building actions.
- Keep template and import entry paths usable. Keep the floating panel inside the available canvas width/height, above reset/info and zoom controls, with keyboard dismissal and focus restoration.

### Verification

- Production build and four pure demo-response tests passed.
- Browser checks passed for single-node scratch start and reload, automatic assistant opening, task chips, placeholder model selection, retained session history/drafts, Escape/focus return and switching assistant scopes with the right panel visible.
- Confirmed global demo chat leaves the node count and job title unchanged, while explicit manual building reveals further nodes.
- Reviewed desktop/mobile screenshots and verified panel bounds. Full demo/hiring, node-drag/reset, resize and 27-panel responsive audits passed.


## 9. Reduce interface reading load

Audit every screen family and its components, including small controls and repeated card patterns. Remove redundant bylines, instruction repetition, promotional filler and AI-pattern narration where labels, values, icons and established interaction patterns already communicate the behavior. Keep decision-making context, accessible labels, state/counts, meaningful empty states, errors and constraints. Record coverage and examples in the [interface audit](../audits/2026-09-05-interface-cleanup.md).

### Verification

Production build and all 221 unit tests passed. Integrated browser checks passed for the demo/hiring journeys, 27 node panels at four widths, and 11 additional routes. Reviewed representative screen and assistant screenshots.

## 10. Light mode throughout

Force light mode independently of OS preference, including native controls. Convert dark assistant, role-brief, chat and rewrite surfaces to light backgrounds with readable text and states. Preserve intentional primary-action, selected-navigation, overlay and device-hardware contrast.

### Verification

All 11 route checks retained light color-scheme under a dark OS preference. The global assistant rendered a white surface; representative canvas, editor and job-list screenshots passed visual review. Responsive and interaction checks passed.

## 11. Responsive layout repair after copy cleanup

Remove positioning and empty space that depended on deleted bylines. Size node cards, start choices and assistant content naturally; keep headers aligned and floating controls clear of each other. Reflow editor and job screens using available content width, with local scrolling for wide tables/boards. Verify phone, tablet and desktop widths with no page-level horizontal overflow and preserve panel resizing and canvas interactions.

### Verification

Production build and whitespace checks passed. Browser checks passed for 55 route/width combinations (1512, 1024, 780, 390 and 320px) with no page/content horizontal overflow; all 27 canvas panels passed at four widths. Start choices passed at five widths, and node chat no longer overlaps the global AI toolbar. Existing demo/hiring journeys, node drag/reset, resize and persistence checks passed. Reviewed representative mobile editor, job overview, start and chat screenshots.

## 12. Pipeline builder revamp

Detailed requirements, capability mapping, sequential task index and completed verification are maintained in [Pipeline builder revamp](2026-09-05-pipeline-builder-revamp.md). This extends the prior canvas work with distinct workflow/stage/activity/Trip/communication nodes, migrated workflows, full Trips entry points, hard-rule outcomes and candidate-focused published workflows.

## 13. Candidate navigation and canvas toolbar

Candidates now owns stage and decision subtabs. The canvas toolbar provides explicit insertion for stages and activities, Trip/message library import or creation, and the existing AI composer. See the [follow-up requirements](2026-09-05-pipeline-builder-revamp.md) and [UX review](../audits/2026-09-05-pipeline-ux-review.md).

## 14. UX audit implementation

Implemented compact stage overview, live/draft publication comparison, concrete candidate next actions, transition insertion controls, library search/filters and consistent historical Trip component navigation. Requirements and validation are tracked under items 11–17 in the [pipeline spec](2026-09-05-pipeline-builder-revamp.md).

## 15–17. Canvas editing and entry refinements

Added multi-point connection ports, vertical progression, amber side message links and direct create/reconnect/remove interactions. Saved links survive layout reset. Shared inspector headers keep expand and close together on the right. The canvas assistant supports document attachments and the new-job screen offers Build with AI / Start with a Template. Detailed requirements and validation are maintained in [pipeline continuation tasks 18–23](2026-09-05-pipeline-builder-revamp.md).

## 18. Contextual back navigation

Node-launched capability screens expose a back arrow and Pipeline / originating node / current screen breadcrumbs. Back restores the source node, expansion, panel scroll and viewport; Pipeline exits detail. Capability-parent fallback covers entry without a captured origin. See [tasks 24–25](2026-09-05-pipeline-builder-revamp.md) for verification.

## 19. Loose node creation

Toolbar types drag onto the canvas as unconnected nodes, with click-to-add as an alternative. No configuration is required to place a node. Trips and messages remain placeholders until selected or created in the inspector; the node identity, position and user-created links are retained. See [tasks 26–28](2026-09-05-pipeline-builder-revamp.md).

## 20. Full-app Impeccable UI / IA audit — Done

Audit every route family, section and shared molecule before editing. Preserve all functionality and the light theme. Findings, sequential implementation and evidence: [Full audit](../audits/2026-09-06-impeccable-ui-audit.md).

## 21. Cohesive visual refinement of the workflow — Done

Preserve all workflow behavior and the light identity. Refine the workspace as a whole: clearer primary navigation, quieter chrome, consistent authored SVG icons for node types and creation tools, deliberate semantic node surfaces, refined selection/hover, organized detail panels and matching libraries/candidate views. Retain node dimensions, ports, edge colors, drag/drop, placeholders, AI, editing, navigation, resizing, publishing and candidate actions. Verify using existing functional and responsive browser checks.

Validation: production build and full browser smoke passed, including 72 route/width checks, manual node creation/connections, inspector resize/back navigation, Trip configuration and candidate submission. Desktop/mobile screenshots reviewed; toolbar adapts to the remaining canvas width beside the inspector. Business logic and data models unchanged.

## 22. Reference-led cleanup across all page and component families — Done

Use the supplied CareerPassport Figma application screen as thematic direction, without gradients or elaborate styling. Apply Impeccable layout/typography concepts across all page, section, molecule and node families while preserving functionality. [Audit and sequential implementation](../audits/2026-09-06-reference-ui-cleanup.md).

Validation: production build, 250 unit tests and full browser smoke passed. Includes 72 route/width checks, six account-menu placements, canvas editing/navigation, full Trip configuration and candidate submission. Shared reference theme and editor hierarchy applied without changing product logic.

## 23. Expanded demo jobs and configurable refresh reset — Done

- Populate the list with distinct engineering, design, product, data, operations and customer-facing jobs, with realistic role details, locations, work modes and draft/published states.
- Enable `resetOnRefresh` by default in a central prototype configuration. A browser refresh clears CareerPassport-owned session/local data and returns to the freshly seeded Jobs list. Client-side navigation and opening candidate links continue to work within the demo.
- Allow disabling the flag (or using an environment override) to retain the existing persistence behavior. Do not erase unrelated browser storage.
- Verify seeded detail snapshots, repeatable reset, clearing old drafts/projects, ordinary navigation and persistence with the flag off.

Implemented seven full seed snapshots (five published, two draft). Configuration: `src/prototypeConfig.ts`, with `VITE_RESET_ON_REFRESH` override; usage documented in `docs/DEMO_GUIDE.md` and `.env.example`. Validation: 257 tests across 35 files and production build passed. Browser checks opened every sample job, verified normal navigation, repeated resets from a user-created job URL, removal of draft/project/preferences, preservation of unrelated storage, and flag-off persistence against a separate Vite instance. Desktop and narrow job-list checks passed.

## 24. Independent detail audits and sequential corrections — WIP

Three independent agents review canvas/inspectors, Trips/communications and remaining pages/candidates. Collect findings before a separate agent fixes them sequentially. Explicit requirements: center new-job choices, make section navigation read as tabs, merge duplicate Trips lists, preserve all functionality. [Consolidated audit](../audits/2026-09-06-independent-detail-audit.md).
