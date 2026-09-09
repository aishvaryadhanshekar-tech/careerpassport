# Interface copy and light-theme audit

## Scope and decisions

Reviewed the routed screens in `App.tsx`, their canvas and hiring panels, job/application/trip editors, candidate experiences, and shared controls. This pass removes narration of obvious interactions while preserving text that affects a decision or recovery. It does not remove real job, candidate, assessment, or message content.

Detailed coverage:
- [Editor and shared-component review](2026-09-05-editor-copy-audit.md)
- [Hiring, demo, job and pipeline review](2026-09-05-hiring-copy-audit.md)

| Area | Cleanup |
| --- | --- |
| Canvas chrome | Removed repeated workspace/type kickers and the opening slogan; retained job title, status and save feedback. |
| Node cards | Removed per-card “Click to open/close · Drag to move” and “Click to configure”. Kept icons, grip, selected state, titles, counts, duration and trigger data. Capability explanations remain available on hover. |
| Job configuration | Replaced four repeated “Required to publish” lines with one legend and labelled required markers. Accessible field names and required semantics remain. |
| AI components | One scope title and one demo indicator; sender identities stay accessible without repeated visible badges. Removed introductory filler and repeated follow-up invitations. Task chips, errors and editable prompts remain. |
| Global demo replies | Pipeline requests show the suggested steps directly. Reviews retain actual counts and missing fields. Simulation/no-change status appears once in the assistant footer. |
| Setup and onboarding | Removed text that merely repeats visible choices. Kept input formats, distinctions between choices, and useful empty-state next actions. |
| Shared molecules | Reviewed tabs, steppers, buttons, field controls, switches, chips, preview controls, send-menu previews, and card headers. Preserved names, values, actions and decision-making metadata. |
| Errors and constraints | Kept required-field errors, microphone recovery, file limits, publication/assessment locking, permissions, recipient/channel requirements and destructive-action consequences. |

## Light theme

- Explicit light `color-scheme` on the document and base CSS, including native inputs/selects under an OS dark preference.
- Converted global AI dock, composer, model picker and conversation surfaces together to white/mint with dark text.
- Converted the role-brief card and outgoing chat bubbles to light surfaces.
- Converted rewrite action/loading pills, including hover and busy text, to light surfaces.
- Retained green primary actions, selected navigation, modal dimming and device hardware; these are contrast/interaction accents, not dark-theme content surfaces.
- Existing candidate preview and editor surfaces were already light.

## Validation

Production build and all 221 unit tests passed. Integrated browser checks passed for the demo/hiring journeys, 27 node panels at 1512, 1024, 780 and 390px, node dragging/reset, panel resizing and assistant coexistence. Eleven additional routes rendered successfully in light mode under a dark OS preference. Reviewed representative canvas/assistant, job creation, application editor and job-list screenshots. Screenshots are saved as `/tmp/careerpassport-screen-*.png` and `/tmp/careerpassport-global-assistant-desktop.png`.

## Follow-up: responsive layout repair

The first audit checked panel bounds but missed some overlapping controls and route-level overflow. This follow-up removes the remaining layout assumptions tied to deleted descriptions:

- Node cards and start choices use content-driven height; title margins no longer reserve byline spacing.
- Node chat reserves room for the bottom toolbar, and empty global chat content no longer creates a blank band. Start-screen utilities scroll after the choice cards instead of covering them.
- Editor columns and field rows respond to their actual container width. Preview devices fit their panes, and mobile wizard navigation stays compact.
- Job tabs, summary cards, candidate actions, filters and message cards wrap or stack. Wide tables and pipeline boards scroll locally.
- Screen checks now assert horizontal bounds across five widths, including 320px, and node-chat checks assert that the global toolbar remains unobstructed.

Final verification passed: production build, whitespace checks, 55 route/width combinations from 320–1512px without page/content horizontal overflow, 27 panels at four widths, start choices at five widths, toolbar non-overlap, and the existing demo/hiring and canvas interaction regressions. Reviewed representative mobile screenshots after fixes.
