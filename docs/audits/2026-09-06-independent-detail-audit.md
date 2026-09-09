# Independent screen-detail audit and sequential corrections

## Status index

| Step | Owner | Status |
| --- | --- | --- |
| 1 | Independent canvas / inspector auditor | Done |
| 2 | Independent Trips / communications auditor | Done |
| 3 | Independent pages / candidates auditor | Done |
| 4 | Consolidate and prioritize verified findings | Done |
| 5 | Separate implementation agent, sequential fixes | Done |
| 6 | Parent verification and regression checks | Done |

## Scope and user examples

Review each route family, modal, side screen and shared molecule independently. Find small concrete defects affecting scan order, alignment, hierarchy and expected interaction: the off-center two-choice New job screen; Role & comp and related navigation looking like selectors; duplicated Trips list pages. Preserve the current light theme and every product capability.

Auditors own disjoint families and write their own evidence before reading one another's findings. No implementation begins until the reports are consolidated here. One separate agent will apply prioritized corrections sequentially. The parent will verify responsive geometry and affected interactions, with particular attention to the merged Trips experience.

## Independent reports

- [Canvas, entry and hiring inspectors](2026-09-06-detail-canvas-findings.md)
- [Trips, communications and dialogs](2026-09-06-detail-trips-findings.md)
- [Pages, candidates and shared controls](2026-09-06-detail-pages-findings.md)

## Consolidated correction queue

Reports are being consolidated. Each item retains its source ID. No UI changes yet.

| ID | Correction | Status |
| --- | --- | --- |
| TRP-01 | One canonical combined Trip library, preserving native records, editors, invitations and responses | Done |
| TRP-02 | Underline navigation and keyboard semantics for Trip views and rounds | Done |
| TRP-03 | Full-width AI settings below compact modal choices | Done |
| TRP-04 | Focused communication edit view with return to filtered templates | Done |
| TRP-05 | Compact contextual back/title and canonical Trip return paths | Done |
| TRP-06 | Published Trip title is read-only; duplicate remains available | Done |
| TRP-07 | Expand a classic communication template only within its stage group | Done |
| TRP-08 | Correct candidate-message popover semantics and focus behavior | Done |
| PAG-01 | Anchor candidate drawer Close; group stage/document controls below identity | Done |
| PAG-02 | Keep Jobs identity/compensation readable on small screens and preserve explicit view selection | Done |
| PAG-03 | Single-line scrolling classic job tabs with active tab visibility | Done |
| PAG-04 | Reflect real Draft/Published state in classic job details and publication metadata | Done |
| PAG-05 | Keep completed summary compact beside actionable work | Done |
| PAG-06 | Identify only genuinely unimplemented CV/Schedule controls as unavailable | Done |
| PAG-07 | Use existing round display labels in candidate Trip headings | Done |

## Verification plan

- New-job choices centered inside the available content area at desktop and narrow sizes.
- Tabs retain keyboard semantics and clearly distinguish active content from choices in a form.
- One shared Trips library model: all old entry points retain creation, search/filtering, editing, insights, preview, publishing, assignment and return navigation.
- Existing node placement, placeholder filling, connections, inspector resizing and candidate work remain intact.
- Reset-on-refresh remains enabled for the prototype. Persistence-dependent smoke checks use a separate server with the flag disabled.
- Scope is per-family source review plus named browser states, not an exhaustive claim about every possible data/configuration combination.
