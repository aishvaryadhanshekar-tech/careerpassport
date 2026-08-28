# CareerPassport — Project Notes

> **Purpose of this file:** a living reference for anyone (human or agent) picking up this repo cold.
> It covers what the product is, how the code is organized, the end-to-end workflow, and where to
> make changes safely. **Update this file whenever the workflow, routes, data model, or file
> layout changes** — treat it as part of the diff, not an afterthought.
>
> Last updated: 2026-08-28

---

## 1. What this is

CareerPassport is a **working prototype** (not production) of a hiring-manager tool for creating a
job requisition through a guided, AI-assisted wizard. A hiring manager describes a role (by voice,
typed notes, or file upload), the app extracts structured fields from that text, and the manager
walks through a 4-step wizard to produce: a Role Profile, an Application form, and a final
preview/publish step.

There is **no backend**. All "AI" is a local heuristic/mock (regex-based extraction over transcript
text — see `src/extractJobFields.ts`), and all persistence is an **in-memory store** scoped to the
browser tab's lifetime (`src/memoryStore.ts` — a `Map`, not `localStorage`/`sessionStorage`). A page
refresh wipes state by design (see commit `e3214a6`).

Reference docs from the product side live in `reference-materials/` (PDFs/docx, not source of
truth for code) and `docs/specs/` (implementation specs — currently one file,
`docs/specs/2026-08-24-step-1-collect-job-information.md`, which is the authoritative spec for
Step 1). Screenshots used during manual/visual QA are dumped in `.verify-screens/` (scratch, not
documentation).

⚠️ **`.verify-screens/` is NOT git-ignored, despite what this doc previously said** — it is tracked,
with ~13,900 files / 569MB of PNGs, which is why `.git` is ~100MB. Adding it to `.gitignore` and
`git rm -r --cached .verify-screens` would shrink the working tree massively (history would still
carry the blobs unless rewritten). Left alone pending a call from the repo owner.

---

## 2. Tech stack

> **Note (2026-08-28):** the codebase was restructured for parallel work — `index.css` and the two
> largest page components were split up, and duplicated helpers were consolidated. See
> **§2.5 Code layout** below before looking for a file where this doc used to say it was.

- **React 19** + **TypeScript**, built with **Vite 7**.
- **react-router-dom v7** for routing (`BrowserRouter`).
- **Vitest** for unit tests (`*.test.ts` files sit next to the module they test).
- No CSS framework — hand-written CSS, split into modules under `src/styles/` (see §2.5).
- Deployed via Vercel (`vercel.json`, `.vercel/`).

### Scripts (`package.json`)
| Command | Does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | `tsc --noEmit` then `vite build` |
| `npm run preview` | Preview production build |
| `npm test` | `vitest run` (all `*.test.ts`) |

---

## 2.5 Code layout & working in parallel

The repo was restructured on 2026-08-28 so that separate pieces of work touch separate files. The
refactor was behaviour-preserving: the production CSS bundle is byte-identical to before, and the
rendered DOM of every route was diffed against the pre-refactor build and matched exactly.

### Directories

| Path | Contains |
|---|---|
| `src/styles/` | 11 CSS modules + `README.md`. `src/index.css` is now **only an ordered `@import` list** — never put rules in it. |
| `src/shared/` | Cross-feature primitives: `icons.tsx`, `labels.ts` (`WORK_MODE_LABEL`), `useBuildPhase.ts`, `hydrateFromJob.ts`. |
| `src/types/` | Domain types split by area (`shared`/`jobs`/`application`/`roleProfile`/`trips`/`draft`) behind a barrel `index.ts`. **`import … from "./types"` still works unchanged.** |
| `src/roleProfile/` | Step 2 internals: one file per tab, plus `hydrate.ts`, `shared.tsx` (badges/tables reused by other pages), `readOnly.tsx` (shared read-only Role Details tab) and `RoleSidebar.tsx` (**shared by all three role pages**). |
| `src/collectJob/` | Step 1 internals: `useSpeechRecording`, `useAttachments`, `Composer`, `CoverageHints`, `JobFieldsForm`, `icons`. |
| `src/trips/` | Trips feature (unchanged location). |

### Which areas are independent?

These can be worked on at the same time without touching each other's files:

| Area | Owns |
|---|---|
| **Jobs list / details** | `JobsPage.tsx`, `JobDetailsPage.tsx`, `jobsStore.ts`, `jobsListQuery.ts`, `styles/jobs.css` |
| **Step 1 — collect** | `CollectJobPage.tsx`, `collectJob/*`, `extractJobFields.ts`, `styles/collect-job.css` |
| **Step 2 — role profile** | `RoleProfilePage.tsx`, `roleProfile/*`, `deriveRoleProfile.ts`, `evaluationFramework.ts`, `styles/role-profile.css` |
| **Step 3 — application form** | `ApplicationPage.tsx`, `ContextCard`/`StandardFieldsCard`/`CustomQuestionsCard`/`QuestionEditor`, `applicationForm.ts`, `styles/application.css`, `styles/question-editor.css` |
| **Preview** | `ApplicationPreview.tsx`, `previewScroll.ts`, `styles/application-preview.css` |
| **Trips** | `trips/*`, `tripsStore.ts`, `tripStages.ts`, `tripSpine.ts`, `tripInference.ts`, `trips/trips.css` |

**Shared files — expect conflicts if two tasks both touch these:** `src/types/*`, `src/shared/*`,
`src/storage.ts`, `src/AppShell.tsx`, `src/App.tsx`, `styles/base.css`, `styles/shell.css`,
`styles/controls.css`, `styles/footer-responsive.css`, and `roleProfile/shared.tsx` +
`roleProfile/readOnly.tsx` (both used by JobDetailsPage and Step3Page).

### Known coupling that still exists

- **Trips live inside `JobDraft`** (`JobDraft.trips`), so trip persistence changes ripple into
  `storage.ts` and `applyAnalysis.ts`. There is no trips-only storage seam.
- **`jobsStore` imports `storage`** — `openJob(id)` *writes* the singleton draft key as a side effect
  of a read. `shared/hydrateFromJob.ts` documents this.
- **No reactive store.** Pages `loadDraft()` once into `useState`, autosave on a 2s debounce, and
  re-hydrate on navigation. Two mounted components never see each other's edits.
- **`collectJob/icons.tsx` has its own `SparkleIcon`** whose path data differs from
  `shared/icons.tsx` — they are genuinely different glyphs. Do not merge them.
- **Wizard step order is encoded in three places**: `App.tsx`, `Stepper.tsx` (`stepPath`/`STEPS`),
  and `wizardHeader.ts`.
- `Step3Page` links to `/jobs/:id/apply`, **a route that does not exist**.

---

## 3. The wizard — routes & steps

Defined in [src/App.tsx](src/App.tsx). All wizard routes render inside `AppShell` (sidenav + wizard
header + stepper).

| Step | Route | Page component | Purpose |
|---|---|---|---|
| 1 | `/create-job` | `CollectJobPage` | Capture role info via voice/text/files → extract 12 coverage fields → "Analyse"/"Build with AI" |
| 2 | `/role-profile` | `RoleProfilePage` | Review/edit derived Role Profile. Sidebar (headline as heading, portrait as byline, editable role fields) + tabs: Requirements / Sourcing Playbook / Evaluation Framework |
| 3 | `/step-2` (route path, **displayed as step 3**) | `ApplicationPage` | Build the candidate-facing application form (standard fields, custom questions, context card) with live mobile/desktop preview |
| 4 | `/step-3` (route path, **displayed as step 4**) | `Step3Page` | Final read-only summary/preview before publishing |

Non-wizard routes: `/` → `JobsPage` (list of saved job drafts), `/settings` → `SettingsPage`.

⚠️ **Gotcha:** route paths (`/step-2`, `/step-3`) don't match their displayed step numbers (3, 4).
Step numbering and back-navigation logic live in [src/wizardHeader.ts](src/wizardHeader.ts) and the
`step` calculation in [src/AppShell.tsx](src/AppShell.tsx) — if you add/reorder a step, update
**both**, plus `src/Stepper.tsx`.

### Wizard data flow
1. Each page loads the current draft via `loadDraft()` ([src/storage.ts](src/storage.ts)), mutates
   local React state, and autosaves back via `saveDraft()` (usually debounced ~2s, plus on
   unmount).
2. Moving forward calls `upsertJobFromDraft(jobId, draft)` ([src/jobsStore.ts](src/jobsStore.ts))
   to snapshot the draft into the `JobsPage` list.
3. Downstream pages **derive** their initial content from the draft the first time they're visited
   (`roleProfileGenerated`, `previewGenerated`, `application` flags on `JobDraft` gate this so
   re-visiting doesn't clobber user edits) — see §5.

---

## 4. Data model (`src/types/`)

Central type file. Key shapes:

- **`JobDraft`** — the one object that flows through the whole wizard (transcript, clips,
  attachments, the 12 `fields` (`CoverageId → FieldState`), salary currency/period, flags,
  `application`, `preview`, `roleProfile`, plus `*Generated` booleans that gate one-time derivation).
- **`FieldState`** — `{ value, source }` where `source` is `"empty" | "extracted" | "user"`. This
  tracks *provenance* so that AI-derived pages never overwrite something the user typed by hand —
  see `mergeFieldState` in `RoleProfilePage.tsx` and the merge logic in `applyAnalysis.ts`.
- **`CoverageId`** — the 12 (13 incl. `evaluationCriteria`, which is unused/dead — see
  `deriveRoleProfile.ts` comment) required fields captured on Step 1: designation,
  experienceYears, location, workMode, salary, industryType, companyType, experienceType,
  mustHaves, disqualifier, redFlags, searchStrategy.
- **`FlagId`** — optional "Select to apply" flags (confidential, no upper salary cap, new
  position, replacement hiring, etc).
- **`RoleProfileFields`** — headline, portrait, department, avoidLookalikes, evaluationFramework
  (array of `EvaluationCriterion`).
- **`EvaluationCriterion`** — one scoring rule (`type`: must_have / number_threshold /
  rating_scale / qualitative; `importance`: critical / important / nice_to_have).
- **`ApplicationConfig`** — standard fields order + required-ness, context card copy, and a list of
  `CustomQuestion | SectionBreak` items for the candidate-facing form.
- **`JobPreviewFields`** — idealCandidate / expectedSkills / targetCompanies / industrySectors,
  derived text shown in the final preview.

`createDraft()` / `emptyFields()` / `emptyFlags()` / `emptyRoleProfile()` / `emptyPreviewFields()`
are the canonical "blank slate" constructors — use these instead of hand-rolling empty objects.

---

## 5. Derivation pipeline (the "AI" layer)

Everything billed as AI in the UI is a deterministic, local, regex/heuristic function. No network
calls, no LLM.

| Module | Input → Output |
|---|---|
| [extractJobFields.ts](src/extractJobFields.ts) | transcript text → `Extraction` (partial coverage fields + flags), via regex/keyword matching |
| [applyAnalysis.ts](src/applyAnalysis.ts) | `applyExtraction(draft, extraction)` merges extraction into draft **without overwriting user-sourced or already-filled fields**; `persistableDraft(draft)` strips blob URLs etc. for storage |
| [derivePreviewFields.ts](src/derivePreviewFields.ts) | `deriveJobPreview(draft)` → ideal candidate blurb, target companies (industry keyword lookup table), sectors |
| [deriveRoleProfile.ts](src/deriveRoleProfile.ts) | `deriveRoleProfile(draft)` → headline, portrait, department (keyword-matched from designation), avoid-lookalikes bullets, evaluation framework seeded from Must Haves (critical) + Red Flags (important) |
| [evaluationFramework.ts](src/evaluationFramework.ts) | CRUD helpers for the evaluation-criteria list (add/remove/update criterion, grades) |
| [seedApplication.ts](src/seedApplication.ts) | seeds the candidate `ApplicationConfig` (standard fields + starter questions) from the draft |
| [continueAction.ts](src/continueAction.ts) | gating logic: `continueEnabled`, `generateEnabled`, and the cycling "Build with AI" loading copy (`BUILD_PHASES`) |

**Provenance rule to preserve everywhere:** derived/extracted values only fill a field when it is
currently empty *and* not `source: "user"`. Never write code that blindly overwrites a field the
user touched.

---

## 6. Page-by-page notes

### CollectJobPage (`src/CollectJobPage.tsx`) — Step 1
- Spec: `docs/specs/2026-08-24-step-1-collect-job-information.md` (treat as source of truth for
  this page's locked decisions — re-read before changing Step 1 behavior).
  - "Analyse" only fills empty fields; never overwrites.
  - Continue unlocks only when all 12 coverage fields are covered (salary requires currency too).
  - Uploaded files/audio are **not** parsed — attach-only, mock analysis reads transcript text only.
- Uses `getUserMedia`/`MediaRecorder`/Web Speech API for real mic capture + live transcription (real
  browser APIs, mocked downstream analysis).

### RoleProfilePage (`src/RoleProfilePage.tsx`) — Step 2 (`/role-profile`)
- Split into `src/roleProfile/` (one file per tab); the page file itself just orchestrates.
  Tabs: Requirements / Sourcing / Evaluation (`TabId` in `roleProfile/hydrate.ts`). **The Overview
  tab was removed** — headline/portrait moved into the shared sidebar, and its other fields were
  already duplicated there.
- Uses the shared `RoleSidebar` in `editable` mode. Its edit state uses the same snapshot/discard
  machinery as the tabs under the key `"summary"` (`EditKey = TabId | "summary"`), so Discard still
  works for headline/portrait/designation.
- Per-tab edit toggle (commit `af305c1`) — each tab has its own edit/view state.
- Hydrates from `deriveRoleProfile(draft)` + `deriveJobPreview(draft)` on first visit only
  (`roleProfileGenerated` flag), then user edits win via `mergeFieldState`.
- Evaluation tab manages the `EvaluationCriterion[]` list via `evaluationFramework.ts` helpers —
  supports custom importance dropdown, unit combobox, dedup on Add-criterion (recent fix, commit
  `d744caf`).

### ApplicationPage (`src/ApplicationPage.tsx`) — Step 3 (route `/step-2`)
- Footer has `Back` (ghost, → `wizardBackTo(3)` = `/role-profile`) and `Continue` (primary) buttons,
  matching the pattern established on `RoleProfilePage`.
- Builds the candidate application form: `StandardFieldsCard`, `CustomQuestionsCard`, `ContextCard`,
  with a live `ApplicationPreview` (mobile/desktop toggle) that scroll-syncs to the active editor
  section (`previewScroll.ts`, `pickActiveAnchor`).
- Seeds `application` config once via `seedApplication.ts` if not already present.
- The Google-Forms-style question block editor (prompt input, type dropdown, per-type body,
  Duplicate/Delete, Required toggle, hover-reveal add-question/image/section toolbar) lives in
  **`src/QuestionEditor.tsx`** (`QuestionBlock`, `SectionBlock`, `QBlockToolbar`, `TYPE_LABELS`) —
  extracted out of `CustomQuestionsCard.tsx` specifically so a future step can import the same
  question-authoring UI. `CustomQuestionsCard.tsx` is now just the "Questions" card wrapper
  (header, item list + drag-reorder, "+ Add another") around those building blocks.
- `CustomQuestionType` (`src/types/application.ts`) covers all 12 Google Forms types: short_answer, paragraph,
  multiple_choice, checkboxes, dropdown, file_upload, linear_scale, rating,
  multiple_choice_grid, checkbox_grid, date, time. Type-specific fields on `CustomQuestion`
  (rows/columns, scaleMin/Max, ratingMax/Icon, maxFiles, etc.) are all optional so older
  questions without them keep working. Mutators for the new types live in `applicationForm.ts`
  alongside the existing option helpers.

### Step3Page (`src/Step3Page.tsx`) — Step 4 (route `/step-3`)
- Read-only final summary: role summary card + application preview. Hydrates preview/application if
  not already generated. Footer has `Back` (ghost, → `wizardBackTo(4)` = `/step-2`) and the terminal
  `Save & finish` primary button (→ `navigate("/")`).

### Back/Continue footer convention across the wizard
- Step 1 (`CollectJobPage`): `Continue` only — no `Back` button (only the AppShell header back-arrow
  → `/`), by design.
- Steps 2–4 (`RoleProfilePage`, `ApplicationPage`, `Step3Page`): each footer's `.footer-actions` has
  a `Back` button (`btn ghost`, left) navigating via `wizardBackTo(step)` from
  [src/wizardHeader.ts](src/wizardHeader.ts), followed by the primary forward CTA (`btn primary`,
  right — `Continue` or, on the last step, `Save & finish`).

### JobsPage (`src/JobsPage.tsx`) (route `/`)
- Lists saved `JobRecord`s from `jobsStore.ts` (title/location/workMode/salary label, relative
  "updated" time via `formatUpdated`). Supports opening/deleting jobs, starting a new job
  (`startNewJob()` resets the draft).

### AppShell (`src/AppShell.tsx`)
- Renders sidenav (collapsible, preference persisted via `sidenavPref.ts`) + wizard header (back
  link + title + `Stepper`) only when `pathname` matches one of the 4 wizard routes.

---

## 7. Persistence (important: it's NOT real storage)

- [src/memoryStore.ts](src/memoryStore.ts) — `memoryStorage` is a plain in-memory `Map` wrapper with
  the same interface as `localStorage`/`sessionStorage`, but data is lost on reload. This was a
  deliberate choice (commit `e3214a6`, "so a page refresh starts fresh") — **do not "fix" this by
  swapping in real `localStorage` without checking with the user first**, it's intentional
  prototype behavior.
- [src/storage.ts](src/storage.ts) — `loadDraft()`/`saveDraft()` for the *current* draft, keyed
  `cp.jobDraft.v1`. Has defensive readers (`readApplication`, `readPreview`, `readRoleProfile`)
  that tolerate partial/missing shape on load.
- [src/jobsStore.ts](src/jobsStore.ts) — `listJobs()`/`openJob()`/`upsertJobFromDraft()`/
  `deleteJobs()`/`startNewJob()`, keyed `cp.jobs.v1` + `cp.currentJobId`. Each `JobRecord` stores a
  `snapshot: persistableDraft(draft)`.

---

## 8. Testing

Every non-trivial pure-logic module has a co-located `*.test.ts` (Vitest). Notable ones:
`extractJobFields.test.ts`, `applyAnalysis.test.ts`, `formControls.test.ts`, `jobsStore.test.ts`,
`continueAction.test.ts`, `wizardHeader.test.ts`, `Stepper.test.ts`, `seedApplication.test.ts`.
Run `npm test` before considering a logic change done. There is no component/integration test
runner (no React Testing Library in deps) — UI verification is manual (see `.verify-screens/`
screenshots from past sessions, and the `run` skill for launching the dev server to check changes
visually).

---

## 9. Conventions / gotchas worth knowing before editing

- **Field provenance (`source: "user"` vs `"extracted"`)** must be respected in any new
  derive/merge function — see §5.
- **`*Generated` boolean flags** (`roleProfileGenerated`, `previewGenerated`) gate one-time
  derivation on page mount. If you add a new derived section, follow this pattern rather than
  re-deriving on every render.
- **`evaluationCriteria` coverage field is dead** — it's in `COVERAGE_IDS` but never surfaced on
  Step 1's form (see comment in `deriveRoleProfile.ts`); Role Profile's evaluation framework is
  seeded from `mustHaves`/`redFlags` instead. Don't assume `fields.evaluationCriteria` is populated.
- **Route path vs. displayed step number mismatch** (`/step-2` = step 3, `/step-3` = step 4) — see
  §3 gotcha.
- **Uncommitted local changes**: as of this writing, `git status` shows modifications to
  `ApplicationPage.tsx`, `CollectJobPage.tsx`, `EditableField.tsx`, `RoleProfilePage.tsx`,
  `Step3Page.tsx`, `deriveRoleProfile.ts`, `index.css` — check `git diff`/`git status` for current
  in-flight work before assuming this doc reflects HEAD exactly.
- Commit history shows heavy iterative UI polish (spacing, dropdown chevrons, button width jitter,
  sticky footers) — visual tweaks now land in one `src/styles/*` module rather than a single 4000-line
  file; check existing class naming patterns before adding new ones.

---

## 10. Where to look for X

| Need to... | Look at |
|---|---|
| Change the 12 required job fields | `src/types/jobs.ts` (`COVERAGE_IDS`, `COVERAGE_LABELS`) + `src/extractJobFields.ts` (extraction) + `docs/specs/2026-08-24-step-1-collect-job-information.md` |
| Change wizard step order/count | `src/App.tsx`, `src/AppShell.tsx`, `src/Stepper.tsx`, `src/wizardHeader.ts` |
| Change how Role Profile is derived | `src/deriveRoleProfile.ts` |
| Change evaluation criteria behavior | `src/evaluationFramework.ts`, `RoleProfilePage.tsx` (Evaluation tab) |
| Change candidate application form fields | `src/StandardFieldsCard.tsx`, `src/CustomQuestionsCard.tsx`, `src/seedApplication.ts`, `src/applicationForm.ts` |
| Change persistence behavior | `src/storage.ts`, `src/jobsStore.ts`, `src/memoryStore.ts` |
| Change visual styling | the right module in `src/styles/` — see `src/styles/README.md` |
| Understand Step 1's exact locked UX rules | `docs/specs/2026-08-24-step-1-collect-job-information.md` |

---

## 11. Maintenance instruction for future agents

When you make a change that affects: routes, the wizard step order/count, the `JobDraft`/
`CoverageId`/`RoleProfileFields` shapes, the derivation pipeline, or persistence — **update the
relevant section of this file in the same session**, not as a follow-up. Keep entries factual and
pointer-based (file + short description) rather than duplicating code. If a section goes stale and
you're not sure it's still accurate, verify against the current code before trusting it (this file
can drift, same as any memory).
