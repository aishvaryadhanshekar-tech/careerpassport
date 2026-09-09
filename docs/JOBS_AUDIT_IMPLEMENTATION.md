# Jobs audit → canvas implementation

This pass adds hiring-manager capabilities from `Product_Audit/Jobs` to the existing funnel. It does not replace the funnel with the audited product's navigation, remove the existing wizard, or remove the original demo controls.

## Where the capabilities live

| Audit area | Canvas entry | Implemented demo capabilities |
| --- | --- | --- |
| Job setup | **Role & hiring settings**, attached to the role | Role/client/department/team, employment and seniority, headcount, location/work mode, currency/period/CTC ranges, notice period; requirements, education/certifications/experience ranges/prospect companies; JD fields and document metadata; company context; sourcing channels/exclusions/context/audio URL; internal/marketplace visibility and four posting destinations; lifecycle/dates/headcount. Existing evaluation framework, requirements and sourcing editors remain available. Client selection has a managed suggestion list. |
| Job overview | **Role brief & sharing**, attached to the role | Read-only brief derived from source fields, six inferred-summary areas, independently editable export document with field visibility and five-responsibility preview, browser Print / Save PDF, share composer with platform/tone/sender/context, editable message and attributed application link. Export edits never write back into role setup. |
| Application | Existing **Application form** node | Existing standard/custom question editor, ordering, preview and required/optional/skipped controls retained. Candidate view now also shows company context, independent CTC currencies, notice-period choices and resume format/size limits. Paused/closed jobs reject submissions. |
| Prospects | **Private prospect pool**, attached to Prospects | Private people pool and separate job attachments; disjoint My/Team leads; single/positional CSV/mapped CSV/CV intake, mapping/preview/confirm; search, source/intent/owner/date/experience/salary/email/outcome filters, advanced saved filters and column selection; selection, hotlist/export/removal; profile signals, properties/application/communication/resume/outreach detail tabs; disposition notes; application completion gate before promotion into Applied. |
| Pipeline | **Candidate review**, attached to Pipeline | All six fixed stages and audited statuses, plus existing custom rounds; move/advance/archive reasons; cards/table, search across evidence, quick/advanced saved filters, sorting/pagination/column preferences, bulk ownership/move/outreach; résumé/application/trip/evaluation/communications evidence alongside feedback/timeline/notes; tags, 1–5 criterion ratings, verification separate from confidence, dictation, mentions/assignment and scheduled tasks. Arrow navigation and A/R shortcuts ignore text inputs. |
| Communications | **Outreach library**, attached to Pipeline | Email template create/edit/duplicate/delete/default/search, scopes, tone, subject/body, named variables and candidate preview; organization-template reuse across demo jobs; approved WhatsApp bodies with numbered slots and named-token substitution; approval-request metadata and explicit simulated decisions; per-stage calling scripts/defaults/provisioning. Missing contact details, unresolved variables and unprovisioned calls block sending. Deliveries use the existing outbox. |
| Trips | **Assessment studio**, attached to Pipeline and linked from trip inspectors | Stage/difficulty/storyline/instructions/spine, dictation, reorderable/repeatable lever slots, per-slot time/count/difficulty, reusable slot configurations and deterministic generation. Rapid Fire statements/binary answer keys; Pick & Defend options/rationale/defense/constraint/resources/voice metadata/hidden key; Demo capture flags/prep/timer/teleprompter/uploads/hidden rubric. Publish freezes content; duplicate to revise; explicit target-stage roster and minimum-one-hour expiry; invite links and response review. |
| Action on you | **Action on you**, attached to the role | On-you/by-me queues; assigned notes, feedback, follow-ups, meetings, status-derived client tasks and scheduled outreach; completion/reopening/rescheduling and candidate drill-through. Partner requests and approved sub-vendors stay separate from team membership. |
| Client coordination | **Client coordination**, attached to Interview | Independent per-candidate threads ordered by activity, messages/attachment metadata, explicit mock client replies, scheduling with meeting-task creation, rejected-by-client and on-hold decisions. Enabled for the demo even though the audited product's navigation dark-launches it. |
| Manage team | **Hiring team**, attached to the role | Single admin owner, Sourcing/Screening/HM-representative collaborators, add/change/remove, ownership transfer, external partner request/approve/decline/revoke. Former owner remains an HM representative on transfer—an explicit demo choice because the audit did not establish that behavior. |
| Activity | **Activity history**, attached to the role | Appended job-tool events plus existing candidate timelines; job/organization scope, categories, actor/date/custom-range/order filters and pagination. No editing or deleting individual history entries in the UI. |
| Jobs chrome | Header and Jobs index | Searchable job switching, Command-K hiring-tool/job/candidate lookup, actionable task/partner notifications with mark-all-read, settings shortcut, application-link copy, lifecycle labels. Existing Jobs table/cards/search/bulk controls are preserved. |

## Important model distinctions

- **Private prospect ≠ applicant.** Attaching a person does not create an application or run applicant triggers. Promotion validates the published form and creates a linked applicant once.
- **Stage ≠ status.** Status options belong to a stage. Legacy demo movements normalize displayed status when changing stages.
- **Visibility ≠ lifecycle.** An active job can remain internal. Pausing/closing changes application eligibility without deleting the published journey.
- **Setup ≠ exported JD.** Export edits are a one-way document fork. Role fields are not overwritten by download customization.
- **Automatic canvas trip ≠ roster-assigned studio assessment.** The existing automatic-assignment demo remains intact. Studio assessments never send to an entire stage on publication.
- **Published content ≠ draft content.** Existing journey version pinning remains intact. Published studio content is view-only; invitations and responses are separate from content. Repeated completion does not overwrite responses; completed recipients cannot be reinvited to the same version.
- **Internal collaborator ≠ external sourcing partner.** Separate collections and permission/configuration flows.

## Demo boundaries and deliberate adaptations

This is not a production backend or a claim of pixel-for-pixel parity with the old product. The audit contains explicitly unverified behavior and live-tenant bugs; those are not treated as product requirements.

- AI generation is deterministic demo content; dictation and voice preview use available browser capabilities. Calling, WhatsApp approval, job-board posting, email delivery, integration access and client replies are visibly simulated.
- Uploaded documents, resources and voice overrides retain **metadata/filenames**, not file bytes. Candidate Demo recording is explicitly simulated, with prep countdown, start-early and time-limit behavior. No camera/screen/microphone capture is performed by that simulation.
- Candidate answer keys/rubrics are omitted from the candidate UI, but local storage is **not a security boundary**. This demo intentionally has no authentication or protected server endpoint.
- No-go companies use case-insensitive exact-name warnings, not inferred company categories or automatic rejection. Sourcing context does not automatically rank or reject people.
- Advanced filters include date comparisons; date values refer to the demo clock for relative ranges. Prospect compensation presets are expressed in lakhs. Backend filter dialects, production eligibility and evaluation algorithms were not established by the audit.
- The WhatsApp approval designer stores header/button specifications in editable text fields, rather than reproducing every platform-specific subform. Approved bodies are read-only; numbered variables are validated before sending.
- Assessment generation caps sub-item count at 100 per lever for the local demo; repeated lever slots remain supported. Reordering uses explicit up/down controls rather than drag handles.
- PDF export uses the browser's **Print / Save PDF** flow. No server PDF service is connected.
- The existing account-settings placeholder remains; global Marketplace/Reports/Control bodies and organization administration are outside this Jobs implementation. Full global account-settings parity is not claimed.
- The existing application editor and candidate preview remain separate inspector modes rather than a simultaneous split-screen editor.

## Persistence and extension

`src/hiring/types.ts` adds a versioned `operations` extension to `DemoProject`. Prospect attachments, candidate review metadata, templates, approvals, assessments, tasks, team membership, partners, threads and activity have stable IDs. Existing projects lazily receive this extension; configuration autosaves never overwrite it.

The shared private people pool uses `cp.hiring.v1.people.private`. It can feed multiple jobs. Removing a job attachment does not delete the person from other jobs. Job reset affects job-specific operations; the shared people pool remains available. Column/filter/notification/client preferences use separate local keys.

`src/hiring/service.ts` owns key validation and mutation paths. `src/demo/repository.ts` remains the persistence boundary. Replace the local adapter with an API/database, add command-level concurrency control and entity/blob storage before scaling beyond a single-presenter demo. Metadata types intentionally keep real storage/delivery adapters separate from the visual interactions.

## Verification

- `npm test`: **214 passing tests**, including 21 audit-domain checks.
- `npm run build`: typecheck and production bundle pass; existing bundle-size warning remains.
- `node scripts/demo-smoke.mjs`: existing demo regression plus `scripts/hiring-audit-smoke.mjs` in an isolated browser context. Covers setup persistence, private/team separation, promotion validation, stage/status changes, assigned feedback/tasks, outreach and provisioning gates, immutable publishing, explicit invitations, candidate responses, partners/client threads/activity, and reload persistence.
- Screenshots: `/tmp/careerpassport-audit-{setup,prospects,review,assessment,candidate,client}.png` plus the original demo screenshots.

The tests verify representative end-to-end flows and domain safeguards, not every combination of configuration fields or every mobile breakpoint.
