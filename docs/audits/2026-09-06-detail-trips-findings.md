# Trips and communications detail audit — 6 September 2026

Method: independent surface auditor (`audit_trips_comms`), source inspection plus isolated Playwright browser captures. Other auditors’ reports were not read. Impeccable Operate/audit/critique concepts guide the findings; this is a scoped input to the parent’s combined audit, not a standalone scored critique command. No product code was edited.

## Coverage and evidence

Reviewed independently: classic Trips list, canvas Trips library, component-trip library, manual/AI creation modal, standalone Trip editor, embedded Trip editor, preview, insights, publish controls, assignment, component editor/preview/expiry/roster/responses, communications templates/editor/approval/organization tabs, classic communication templates, and contextual candidate message popover.

Live desktop captures (1512×982): `/tmp/detail-classic-trips.png`, `/tmp/detail-trip-create.png`, `/tmp/detail-trip-create-ai.png`, `/tmp/detail-trip-full-editor.png`, `/tmp/detail-trip-embedded-editor.png`, `/tmp/detail-trip-preview.png`, `/tmp/detail-trip-insights.png`, `/tmp/detail-trip-assign.png`, `/tmp/detail-components-library.png`, `/tmp/detail-component-editor.png`, `/tmp/detail-communications-library.png`. Source verification covers the other listed states. Browser fixture had empty communication/component collections; creation was used for component inspection. The batch stopped at the missing communication Edit action, so populated communication editor and mobile captures were not obtained. Those findings below are explicitly source-backed. No claim that every template, response or mobile state was exercised.

## Required corrections, in implementation order

### TRP-01 · P1 · One Trips destination currently conceals three libraries

**Evidence:** `TripsListPage.tsx` lists `draft.trips`; `PipelineTripWorkspace.tsx` independently lists the same `draft.trips`, then exposes a full-width “Trip components & responses ↗” button. That button swaps to `AssessmentsPanel.tsx`, which has a second search/status/type toolbar, a second list, and another “Generate AI trip” creation path. Screenshots `detail-classic-trips`, `detail-components-library` verify the duplicated list shell. The arrow implies external navigation although it swaps the same inspector.

**Impact:** users must guess which collection holds their trip and which builder contains responses. The same word “Trip” leads to different libraries.

**Correction:** make the canvas Trips tab the canonical library. Present existing `draft.trips` and `ops.assessments` together in one search/status/type-filtered list. Retain a discriminator internally and dispatch each row into its existing full editor. Reuse that library from the classic `/jobs/:id/trips` entry (redirect to canvas Trips query/view is acceptable). Remove the extra intermediate component library, not its capabilities. Keep component creation available from the canonical Create control (a secondary creation option is acceptable). Preserve stable record IDs; do not cast or migrate assessment records into `Trip` without a proven mapping.

**Capability preservation checklist:** full Trips retain AI/manual creation, spine, inference cards, all rounds/question editors, preview, publish, duplicate, full-trip assignment and candidate links. Component Trips retain their existing generated levers, edit/order/delete rounds, rubric/expected beats, preview, publication lock/version behavior, stage eligibility, explicit recipient roster, expiry validation, invitations/copy links, submitted responses, and duplicate/edit behavior. Classic direct editor URLs continue working and return to the canonical library.

**Regression:** seed both record types; both appear in one list; search/type/status filters cover both; opening either record reaches the matching editor with the correct ID. Publish/assign/expiry/response flows still use their original store/service. Back returns to one library. Placeholder attachment still fills the same node and retains links/position.

### TRP-02 · P2 · Trip subviews and round tabs look like form choices

**Evidence:** `PipelineTripWorkspace.tsx` `.pipeline-trip-tabs` uses `aria-pressed` buttons. Its CSS gives each button `flex:1 0 auto` and selected fill/border. `detail-trip-embedded-editor.png` shows Edit/Preview/Insights/Assign as four wide outlined selector boxes; lower round tabs also inherit inspector button borders. This mirrors the user’s Role & comp example.

**Correction:** use the same underline tab treatment as primary navigation, with a quiet baseline and a single active marker. Give Trip views actual tablist/tab/tabpanel semantics and existing shared keyboard handling; strip generic inspector button borders from round tab buttons. Keep actions such as Add round visually distinct from tabs.

**Regression:** pointer and keyboard switch each view; active tab/panel match, Arrow/Home/End behavior works, long round names/narrow inspector scroll without clipped actions. All existing tab content remains mounted/updated according to original logic.

### TRP-03 · P2 · AI creation expansion wastes half the modal

**Evidence:** `TripCreateChoiceModal.tsx` nests `.trip-choice-ai-options` inside the second choice card. `detail-trip-create-ai.png` shows a short manual card on the left and a tall 245px AI form on the right; the lower-left half is dead space while stage and difficulty controls are squeezed.

**Correction:** retain two compact equal choices at the top, then render selected AI settings across the modal’s available width underneath. Use one aligned action area. Keep choice labels, AI/manual callbacks, difficulty/stage values, validation, focus containment, and close behavior. Mobile naturally stacks without a different conceptual layout.

**Regression:** select manual creates once; select AI reveals correct controls; no stage means Build disabled; close/reopen resets consistently; keyboard focus and Escape still work.

### TRP-04 · P2 · Communication editing is appended after the library

**Evidence (source):** `MessagesPanel.tsx` renders `templates.map(...)` before `{editing && <section className="hire-card">...}`. Clicking any Edit/Duplicate/Create changes `editing` but neither focuses nor scrolls to that editor. The entire list stays above it, with repeated Edit/Duplicate/Set default/Delete actions. A large library can make the click appear to do nothing.

**Correction:** switch the content area from library to focused editor when editing, with a compact “Back to templates” action preserving the current channel and search. Or place the editor before the list with explicit focus; the focused view is clearer. Keep save/cancel, all channel-specific settings, WhatsApp approval/variables, agent provisioning, defaults, organization copies and existing validation. Search should remain a library concern, not sit above the active form.

**Regression:** create/edit/duplicate always reveals the intended form; save/cancel restores the filtered library; no unsaved edits vanish on unrelated toolbar actions; Email, WhatsApp and AI-call controls remain reachable.

### TRP-05 · P2 · Trip navigation competes with the editor title

**Evidence:** `PipelineTripWorkspace.tsx` renders “← Trip library” as a direct flex-column child; `detail-trip-embedded-editor.png` shows a full-width bordered back button above the small Trip name. A second header has Create trip on the far right, above the view tabs. `TripBuilderPage.tsx` unconditionally links Back to trips to the classic library.

**Correction:** place a compact, left-aligned back link beside a clear Trip title/status, then view tabs. Keep Create in the library, or as a lower-priority overflow action when editing. Make both editor variants return to the canonical library; preserve origin when opened from a canvas node (existing parent breadcrumb is preferable).

**Regression:** Back from full/embedded/expanded editors returns to the correct job and library or node context; no lost draft, canvas position, trip selection or publishing state.

### TRP-06 · P2 · Published standalone Trip title advertises editing that silently does nothing

**Evidence (source):** `TripBuilderPage.tsx` always renders `EditableField` for title, even when status is published; `updateTrip` immediately returns for published trips. The body has a read-only note, but the title pencil still presents an editable input.

**Correction:** render plain title for published trips, or pass a read-only/disabled affordance if supported. Leave Duplicate to edit as the active path.

**Regression:** published title cannot enter a nonfunctional edit mode; duplicate opens an editable draft with content intact; draft inline title editing still persists.

## Optional follow-up (do not block the required correction batch)

- **TRP-07 · P3:** `CommunicationsTab.tsx` groups one template into multiple stages but tracks expansion only by `template.id`, so opening a shared template expands all of its appearances. Track composite group+template key. This is a classic route concern, independent of the canonical communications editor.
- **TRP-08 · P2 accessibility:** `SendMessageMenu.tsx` advertises `role=menu` but provides no initial menu focus or arrow-key navigation and later puts a full preview/action form inside that menu role. Use an anchored dialog/popover with focus return or implement a true menu only for the choice step. Existing Escape/outside close must remain.

## Strengths to preserve

The separate data models already provide substantial assessment/Trip capability; unifying the entry point can preserve it. Shared TripRoundTabs and TripPreview already reduce editor duplication. Publication locks, duplicate-to-edit, explicit assignment recipients, and human review remain understandable product rules. The existing light/slate visual theme should be retained; this audit recommends structural corrections, not another style replacement.
