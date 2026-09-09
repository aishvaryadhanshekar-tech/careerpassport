# Career Passport visual demo

Run `npm run dev`, open the local URL, open a job, and choose **Load sample demo** (or **Reset sample demo** if you have used it before). Reset replaces only the currently open job’s demo data after confirmation.

## Five-minute walkthrough

1. **Explain the canvas.** The sample starts with eight candidates, a role, an application, assessments, two interview rounds, and communications. Click a layer to zoom to its node. Collapse a stage to show the overview.
2. **Edit the journey.** Select Interview process → Add round, rename it, create a trip, and add a communication. Pick a message template and trigger. Changes save automatically.
3. **Show contextual assistance.** Select Application form → Ask AI, type “Add a portfolio work sample”, suggest changes, and accept. Use Preview to show sample answers or required-field errors.
4. **Publish and apply.** Publish updates, then Open candidate view. Click Fill sample answers and Submit application. Return to Candidates & outbox: Alex Morgan appears immediately in Prospects, including across tabs.
5. **Progress a candidate.** Open Priya Nair, move her to Pipeline, and complete the assigned assessment at 28%. The follow-up appears in Outbox. Move her into Design review to assign its trip and deliver its invitation.
6. **Simulate time and integrations.** Click +1 day three times to deliver reminders. Under Integrations, connect demo Google Drive or Slack and import a sample role brief. No authentication is involved.

## Other things to show

### Audited hiring-manager capabilities

The canvas now includes connected hiring-tool nodes. Open **Role & hiring settings** for the detailed setup, **Private prospect pool** for pre-application sourcing, **Candidate review** for full decisions and feedback, and **Outreach library** for email/WhatsApp/calling configuration.

For an assessment demo:

1. Open **Assessment studio → Generate AI trip**. Choose a target stage and generate the three demo levers.
2. Review the content and hidden keys, then **Publish and assign**. The published cards are now view-only.
3. In **Invite roster**, select candidates from the target stage and send. Publication itself sends nothing.
4. Open one candidate link, answer the assessment and submit. Return to **Responses** to show the result.
5. In **Candidate review**, post a note assigned to Demo Recruiter. Find and complete it under **Action on you → Feedback**.
6. Show **Hiring team** partner approval, **Client coordination** isolated conversations, and **Activity history** recording the changes.

The original automatically assigned canvas trips and **Candidates & outbox** controls are still available. Use **Switch job** or **⌘K** to navigate without changing the funnel model. Detailed audit mapping and explicit demo limitations are in [JOBS_AUDIT_IMPLEMENTATION.md](JOBS_AUDIT_IMPLEMENTATION.md).

- Candidate details include application answers, journey version, assignments, interview scheduling, immediate/scheduled messages, and a timestamped activity timeline.
- New applicants receive the latest published journey. Existing candidates retain the version they entered, including rounds and messages removed from the current editor.
- Refreshes retain progress. Closing and reopening the browser restores demo projects into the Jobs list.
- The application link works in the same browser profile and origin; it is not a server-backed public link. All email/SMS delivery is simulated in the outbox. File attachments store filenames only.
- Scratch and template creation work without loading sample candidates. Use the toolbar to load the populated scenario when you want to show candidate operations.

## Data architecture

`src/demo/types.ts` defines a versioned project document. Each job has its own durable storage key, `cp.demo.v1.project.<jobId>`. Candidates, trip assignments, deliveries, and published revisions use ID-keyed maps. Candidates reference a revision; assignments and delivered messages capture the content used at the time.

`src/demo/repository.ts` is the persistence boundary. The current adapter uses localStorage, publishes same-tab change notifications, and listens for cross-tab storage events. No credentials are collected. Storage failures surface through the calling UI; nothing is sent to external services.

`src/demo/service.ts` owns application submission, publication, candidate movement, assessment assignment/completion, trigger processing, scheduling, and demo time. Configuration autosaves merge with the latest project and do not replace candidate or delivery data. Repeated stage moves and completion events are idempotent.

`src/demo/fixtures.ts` owns role templates and connected-source samples. `src/seedCandidates.ts` supplies the sample identities. Expand these fixtures without adding mock logic to the UI. Published revisions and event keys provide a starting point for migrating to API/database entities and queued delivery later.

This storage is designed for a local single-presenter demo, not concurrent production workloads. A backend adapter should make commands asynchronous, provide transactions and concurrency control, and replace storage subscriptions with a query/event layer. Browser storage has capacity limits, so large documents and uploaded file contents belong in a backend or IndexedDB adapter.

## Verification

- `npm test`: domain and regression tests.
- `npm run build`: typecheck and production build.
- With the app at port 5173, `node scripts/demo-smoke.mjs`: isolated Playwright browser test. It exercises the original journey plus the audited hiring capabilities and invited assessment response. It never uses your browser’s saved state. Screenshots go to `/tmp/careerpassport-demo-*.png` and `/tmp/careerpassport-audit-*.png`.

## Demo catalogue and refresh behavior

The Jobs list starts with seven complete example roles: Backend Engineer (Payments), Product Designer, Frontend Engineer, Product Manager (Growth), Data Analyst, Customer Success Manager and Operations Lead. Five are published and two are sample drafts. Sample drafts are intentional; drafts you create are cleared when reset is enabled.

`src/prototypeConfig.ts` controls `resetOnRefresh`, enabled by default. A browser refresh clears CareerPassport-owned `cp.*` entries from local/session storage, clears in-memory drafts, returns to Jobs and reseeds the catalogue. This includes candidates, workflow changes, communications, Trips and UI preferences. Other applications' storage is preserved. Normal navigation, back/forward navigation and opening a candidate link do not trigger this reset. Reloading a candidate page does reset the prototype and return to Jobs.

To keep your work across refreshes, set the fallback in `src/prototypeConfig.ts` to `false`, or add this to `.env.local` and restart the dev server:

```dotenv
VITE_RESET_ON_REFRESH=false
```

The environment setting takes precedence over the source fallback. Production builds read it at build time. Turning the flag off retains the existing storage behavior (drafts in the current browser session, demo projects in local storage); it cannot recover work already reset.

Validation commands:

- `npm test` and `npm run build`
- Default-reset browser check: `node scripts/demo-smoke.mjs --reset-only`
- Flag-off browser check against a preview started with `VITE_RESET_ON_REFRESH=false`: `node scripts/demo-smoke.mjs --reset-only --persistent --base=http://127.0.0.1:5175`
- The existing full workflow smoke deliberately tests save/reload persistence. Run its server on port 5173 with `VITE_RESET_ON_REFRESH=false` before `node scripts/demo-smoke.mjs`.
