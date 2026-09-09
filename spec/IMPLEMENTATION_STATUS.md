# Funnel implementation status

The default canvas entry now renders `FunnelWorkspace`. The older wizard-style canvas components remain in the repository but are no longer routed from the app.

## Implemented

- Scratch, role-template, and document/description import entry paths.
- Root role node; vertical Prospects → Pipeline → Interview stages.
- Application below Prospects; assessment nodes below Pipeline; rounds, trips, and communications below Interview.
- Independent node selection, layer navigation, selected-node AI action, expandable branches, pan/zoom, saved viewport.
- Editable required role fields with publication validation; application editor and preview reused from the existing app.
- Round creation, naming, descriptions, removal with child cleanup.
- Trip creation within a round, type, duration, instructions, assignment from available trips, removal.
- Message templates, editable subject/body, recipients, active toggle, and basic event/delay/score triggers.
- Explicitly identified template suggestions with review, accept, and dismiss; text and dictation input.
- Candidate stage counts, search, details, and movement between stages/rounds.
- Local funnel persistence; session persistence for existing job stores; published jobs reopen on the canvas.

## Demo functionality added

- Populated, resettable sample scenario with eight candidates and executable assessments and communications.
- Candidate application route with sample answers, submission validation, and live cross-tab Prospects updates.
- Candidate detail actions for progression, assignment, scoring, interview scheduling, and immediate/scheduled messages.
- Trigger simulation and outbox with a controllable demo clock for delayed messages.
- Mock Google Drive and Slack connections with sample role imports, without authentication.
- Published revisions retained for existing candidates; new applicants use the latest version.
- Versioned per-job repository, ID-keyed runtime entities, and persistence across browser sessions.
- Contextual form suggestions with acceptance plus candidate preview sample/error states.
- Browser smoke test and screenshots. See `docs/DEMO_GUIDE.md` for the walkthrough and storage design.

## Jobs audit additions

Connected hiring-tool nodes now cover detailed role settings, private sourcing, rich pipeline review, multi-channel outreach, three-lever assessments with immutable publication and invite rosters, tasks, client coordination, team/partner access and activity. Existing canvas features remain. See `docs/JOBS_AUDIT_IMPLEMENTATION.md` for the capability-by-capability map and explicit demo adaptations.

## Remaining beyond the demo

- Public candidate application endpoint, hosted share links, actual message delivery and trigger execution.
- Google Drive/Slack authentication and import; live model backend.
- Shared trip entities across multiple assignments (current assignment copies the configuration).
- Mandatory-field recommendation confirmation, prior-job template browsing/filtering, and richer role-specific templates.
- Simultaneous split-screen form editor and candidate preview.
- Boolean trigger conditions, communication reordering, analytics and real-time collaboration.
- Production-scale concurrency, authentication, API integrations, and server-side persistence.

## Verification

214 tests passed, including the existing regressions and 21 audit-domain checks. Production build passed. The isolated browser smoke suite verifies both the original demo and new audited workflows, including selected assessment invites and candidate responses. Existing bundle-size warning remains.
