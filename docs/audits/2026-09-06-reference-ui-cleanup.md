# Reference-led UI cleanup

## Status index

| Step | Scope | Status |
| --- | --- | --- |
| 1 | Inspect Figma and page/component inventory | Done |
| 2 | Document page-by-page corrections | Done |
| 3 | Workspace foundations and navigation | Done |
| 4 | Editors, forms, preview and shared molecules | Done |
| 5 | Workflow nodes, inspector, libraries, candidates and candidate pages | Done |
| 6 | Responsive visual and functional verification | Done |

## Reference and direction

Reference inspected with Figma design context: [Create a job — Application · Light](https://www.figma.com/design/WCghUzecsonToq8dCxpm3W/?node-id=6836-23646). Although the file is titled Valmo Partner App, the supplied node is a CareerPassport application editor. It uses Figtree, dark slate text, cool gray surfaces, amber active steps, thin rules, generous separation between sections, a grounded preview area, and brand/navigation above account controls.

Adapt its structure and emphasis rather than reproducing the screen. Keep the current sans family, functional components and content. No ambient glow, gradients, promotional banners, fictional navigation or reference assets are introduced. Existing stage/Trip/message semantic colors remain meaningful. Use Impeccable Operate mode: task priority, proximity before boxes, deliberate spacing rhythm and stable readable typography.

## Initial page and molecule findings — before implementation

| Family | Current hierarchy problem | Correction | Preserve |
| --- | --- | --- | --- |
| App shell / Settings | Account and collapse controls occupy the brand/navigation area; black active Jobs competes with primary actions | Dedicated brand/collapse header, quieter selected navigation, account at bottom on desktop, compact mobile row | All links, profile popover, collapse preference, skip link |
| Jobs | Table metadata and framing compete with job title; heavy selected toggles | Clear title/action row, restrained table header, consistent hover/status and view selection | Table/cards, sorting, search, selection, delete/copy |
| Collect / role setup | Form and editor styles vary from canvas controls | Shared control surfaces, deliberate section rhythm and readable labels | All input, upload, dictation, analysis and continuation |
| Role Profile / overview / publish review | Repeated card headers and tinted summary blocks make everything look equally important | Quiet section dividers, stronger main title, calm summary surface, aligned metadata | Requirements, sourcing, evaluation, editing, preview, publish |
| Application editor | Boxed headers and nested sections add visual weight; preview floats without clear workspace | Unboxed section headers and rows; flat cool preview surface; consistent field spacing | Every question type, switches, ordering, preview and mobile jump links |
| Trips list / full editor / canvas Trip workspace | Editor uses heavy card headers; library rows feel like generic buttons | Shared section treatment, calm row-based library, consistent round tabs/inputs | Existing creation, insights, full editing, preview, publish, assign |
| Canvas and all node types | Green chrome overstates the product's neutral UI; node accents should carry semantics | Slate workspace chrome, clear stage/activity surfaces, quieter configuration tools; maintain colored graph semantics | Geometry, ports, manual links, drag/reset, placeholders and AI |
| Hiring inspectors | Nested cards, fields and actions compete; body hierarchy varies by capability | Consistent section spacing, label weight, tables and restrained selected tabs | Setup, brief, team, tasks, history, prospects, review, comms, assessments, coordination |
| Candidate workspace / classic board and drawer | Row borders, metadata and action areas have inconsistent density | Clear identity-first rows, aligned evidence/action groups, quiet data chrome | Candidate details, decisions, messages, bulk actions and history |
| Standalone candidate application / Trip / assessment | Separate green page theme weakens continuity | Same neutral surface/text system, clear headings and primary submit, preserve content | Invitations, requirements, responses, completion and errors |
| Shared molecules | Black, green and gray primary controls; many section-header treatments | Common slate primary buttons, neutral borders, amber wizard emphasis, consistent labels and spacing | Focus, disabled, loading, error, selection, native control behavior |

No service, data-model, migration, candidate decision or AI functionality changes are planned. This is a visual/structural pass; conditional states receive source review and named representative browser checks, not an exhaustive claim about every combination.


## Independent assessment

The [page and component review](2026-09-06-reference-ui-review-evidence.md) and [layout evidence](2026-09-06-reference-ui-layout-evidence.md) were prepared independently before their findings were reconciled. The mechanical layout scan returned no findings; this was not treated as visual validation. Both assessments supported a shared neutral palette, section dividers, identity-first rows and preservation of container-based inspector/toolbar geometry. Their optional design suggestions are evidence, not a claim that every suggested stylistic alternative was adopted.

## Implemented, in sequence

1. **Workspace foundations:** added a dedicated CareerPassport brand/collapse row and moved account controls to the bottom of the desktop sidebar. Kept mobile navigation compact. Quieter active Jobs navigation and consistent slate primary actions. Wizard steps now have small numbered indicators and amber current-step emphasis.
2. **Editors and previews:** replaced repeated filled card headers with thin section dividers in Role Profile, publish review, Application and full/embedded Trip editors. Improved label, field and row spacing. Added flat preview workbench surfaces. Left-aligned role identity with its metadata.
3. **Workflow and operations:** neutralized canvas/inspector chrome, refined libraries and candidate rows, reduced nested hiring-card framing, and aligned shared controls and candidate-facing surfaces. Preserved stage, activity, Trip and message semantics, connector colors and all canvas geometry contracts.
4. **Visual correction batch:** removed remaining heavy classic Trip-list shadows, corrected legacy title colors and Trip header spacing, anchored the sidebar to the viewport, and corrected account popovers for collapsed desktop/mobile navigation.

Implementation is concentrated in `src/styles/reference-system.css`, imported after the existing style system from `src/main.tsx`, with structural changes limited to `src/AppShell.tsx` and `src/Stepper.tsx`. Existing component sheets continue to own responsive grids, connection ports, transforms, minimum panel widths and control behavior. No service, data model, content-generation or candidate-decision logic changed in this pass.

## Verification

- `npm test`: **250 tests passed across 34 files**.
- `npm run build`: passed TypeScript and Vite production build. Existing bundle-size advisory remains; no new dependencies were introduced.
- `git diff --check`: passed.
- `node scripts/demo-smoke.mjs`: passed both the initial inspection and the final confirmation after the correction batch.
- **60 recruiter route/width combinations**, covering 12 routes at 1512, 1024, 780, 390 and 320 pixels: meaningful rendered content, no page/content horizontal overflow and light theme under a dark OS preference.
- **12 candidate route/width combinations**, plus a valid end-to-end Trip submission: application, Trip and missing invitation/assessment states.
- Existing flows passed: all four manually placed node types, placeholders, save/reload, explicit connections/reconnections/removal, smooth dragging, reset preserving links, node/keyboard toggles, AI coexistence, inspector resizing and contextual back navigation, existing/new Trip and communication configuration.
- Shared interaction checks passed: skip link, keyboard presets/custom values, tabs, modal focus/return, clipboard failure. Added account visibility checks across all recruiter routes and six expanded/collapsed desktop/mobile popover checks, including the Settings link and Escape dismissal.
- Visually inspected representative desktop/mobile screenshots for Jobs, Role Profile, Application, publish review, full Trips editor/list, canvas, widened inspector and account menus. The confirmation verified the header, list and account-position corrections.

Coverage is route-family/source review plus named browser scenarios. It is not an exhaustive visual inspection of every possible data state, modal combination or node arrangement. All existing functionality was retained; no regressions were found in the tested flows.
