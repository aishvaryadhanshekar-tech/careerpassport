# Job Creation — `Start new role` / `+ New job`

Two entry points lead to the **same wizard**:

| Entry point | Location |
|---|---|
| `+ Start new role` | Solid coral pill, top-right of `/jobs` |
| `+ New job` | Bottom of the job-switcher dropdown (left rail, under `ALL JOBS`) |

The flow is a **dedicated route wizard** (not a modal), each step its own URL under `/jobs/new/…`,
with a **5-step breadcrumb** running along the top of the page:

```
①─────②─────③─────④─────⑤
Express Missing Evaluation Application Preview
```

| Step | Breadcrumb label | Route | Conditional? |
|---|---|---|---|
| 1 | `Express` | `/jobs/new/express` | Always shown first |
| 2 | `Missing` | `/jobs/new/express/missing` | **Conditionally skipped.** If the step-1 brief already covers all 5 hard-required fields well enough for the parser, submitting step 1 jumps straight to step 3 — this was observed live in one run. In another run (same account, same brief text, submitted with a shorter debounce pause) step 2 appeared and required a manual fix to the `DESIGNATION` field before it would advance. **Do not treat step 2 as guaranteed to appear** — it's a gap-filler, not a fixed page |
| 3 | `Evaluation` | `/jobs/new/evaluation` | Confirmed live — see below |
| 4 | `Application` | `/jobs/new/application-form` | Route confirmed (from the step's breadcrumb link `href`); content not opened live in this audit |
| 5 | `Preview` | > UNVERIFIED exact route string (the breadcrumb's `aria-label` confirms the label `Step 5: Preview` exists; the `href` itself was not captured in this pass) | Content not opened |

The breadcrumb steps are themselves links with descriptive `aria-label`s confirmed via the DOM,
e.g. `Step 1: Express (completed)`, `Step 3: Evaluation (current)`, `Step 4: Application`, `Step
5: Preview` — so a user can jump backward to a completed step directly from the breadcrumb once
past it (each prior step renders as a clickable `href`, not a disabled marker).

## Step 1 — `Express` ("Whom are you looking for?")

**H1:** `Whom are you looking for?`
**Subtitle:** `Speak as if you were briefing a trusted recruiter.`

### Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `HIRING THIS ROLE FOR` | dropdown (client picker) | not enforced before proceeding | Options: `No client` (default/first item), `+ New client` (opens client creation — not explored further). Helper text: `Pick the company this job is for, or add a new one.` |
| Free-text brief box | large multiline textarea | effectively required — the wizard scores it against a 12-item checklist | Placeholder: `Example: Senior backend engineer, 5–8 years, Bangalore hybrid, ₹45–60L, ownership of payments services, on-call OK…` |
| `Tap to speak` | mic button, left of textarea | optional alternate input | Voice-to-text entry into the same textarea |
| `Upload JD` | button, right of textarea | optional alternate input | Accepts `PDF or DOCX`; caption: `text auto-fills below` — parses an uploaded JD into the same free-text box |

### `SELECT TO APPLY` checkboxes (right rail)

A fixed list of 7 tags, checkboxes, multi-select, no visible cap:

`Confidential` · `No upper salary cap` · `New position` · `Replacement hiring` ·
`1st principle thinker` · `AI tool power user` · `Any experience works`

> UNVERIFIED: what each tag actually changes downstream (visibility on marketplace? scoring
> weights? just informational tags on the job record?).

### `COVERAGE CHECKLIST` (bottom of the text box)

A live, auto-parsed checklist of **12 items** the brief should cover, with a running counter
(`0/12 COVERED` → `8/12 COVERED` once text is entered). Items get a green `✓` and highlighted
border once the parser detects them in the free text:

`Designation` · `Experience (in yrs)` · `Location` · `WFO/WFH` · `Salary` · `Industry type` ·
`Company type` · `Experience type` · `Must haves` · `Disqualifier` · `Red flags` ·
`Thoughts on search strategy`

The first five (`Designation`, `Experience (in yrs)`, `Location`, `WFO/WFH`, `Salary`) render in
**bold/dark outline** even when unchecked — they are the fields step 2 treats as hard-required
(marked with a red `*` there). The remaining seven are soft/optional.

**Parsing is imperfect and worth calling out explicitly**: typing a brief that opens with the
literal string `Designation: ZZ-Audit-Do-Not-Use.` still left `Designation` unchecked in the
`8/12 COVERED` state, while `Experience (in yrs)`, `Location`, `WFO/WFH`, and `Salary` — stated
identically as `Label: value.` sentences — were correctly detected. The parser is not a naive
`label:` splitter; it appears to special-case or mis-handle `Designation` specifically.

### Footer

- `Design the role →` — solid dark-green pill, bottom-right, advances the wizard. On click it
  shows a **spinner state** (button turns pale/greyed with a loading glyph) — this is an async
  step, presumably server-side extraction of the 12 fields from the free text.
- `Saved just now` — plain text, bottom-left, appears once any content changes. **Progress
  autosaves as you type**, confirming the flow persists a draft mid-wizard.
- A toast can appear bottom-right: `Need a longer brief before restructuring.` — a validation
  message gating advancement when the text is too short/sparse for the parser to work with.

## Step 2 — `Missing` ("A few things are still missing")

**H1:** `A few things are still missing`
**Subtitle:** `Speak once more to complete only the missing signals.`

The same free-text box carries forward (pre-filled with everything typed in step 1), and below it
the wizard renders the **12 checklist items as actual form fields**, pre-filled from the parse:

| Field | Required | Example captured value |
|---|---|---|
| `DESIGNATION` * | yes | `ZZ-Audit-Do-Not-Use` |
| `EXPERIENCE (IN YRS)` * | yes | `3 to 5 years` |
| `LOCATION` * | yes | `Bengaluru, India` |
| `WFO/WFH` * | yes | `Hybrid, three days in office` |
| `SALARY` * | yes | `1,000,000 to 1,500,000 INR per year` |
| `INDUSTRY TYPE` | no | `B2B SaaS` |
| `COMPANY TYPE` | no | `Series B product startup` |
| `EXPERIENCE TYPE` | no | `product companies only` |
| `MUST HAVES` | no | `TypeScript, React, Node.js` |
| `DISQUALIFIER` | no | `no production experience` |
| `RED FLAGS` | no | `frequent job hopping under six months, cannot...` (visibly truncated in its single-line input) |
| `THOUGHTS ON SEARCH STRATEGY` | no | `source from Series A to C startups in Bengalu...` (visibly truncated) |

Two extra fields appear **only at this step**, below the grid, not part of the 12-item checklist:

| Field | Type | Default |
|---|---|---|
| `SALARY CURRENCY` | dropdown | `Select` (unset) |
| `SALARY PERIOD` | dropdown | `Per year` |

> UNVERIFIED: full option list for `SALARY CURRENCY` — not opened live in the captured evidence.

All five hard-required fields (`*`) are single-line text inputs, **not typed/constrained inputs**
— `EXPERIENCE (IN YRS)`, `LOCATION`, `SALARY`, and `WFO/WFH` all accepted free-form natural-language
strings (`"3 to 5 years"`, `"Hybrid, three days in office"`) rather than being forced into
structured min/max/enum controls at this step. Structuring likely happens later (step 3+, or in
`Job Setup` post-creation).

Footer is identical to step 1: `Design the role →`, `Saved just now`, autosave-on-type.

## What happens after step 2 (unverified)

The audit was not able to advance past step 2 live (see Nuances). Two things are confirmed from
context:

1. Progress **autosaves as a draft** at every step (`Saved just now` fires on every keystroke
   batch) — so a job record almost certainly exists in the backend from step 1 onward, before any
   terminal "publish."
2. The button copy `Design the role →` (not `Create job` / `Publish`) strongly implies steps 3–5
   move into structuring/reviewing a generated job design (likely: parsed fields review →
   AI-generated brief/crystallization cards, matching the `Inferred cards` sections seen on
   `/jobs/<id>/overview`, e.g. `Ideal candidate`, `Tribal details`, `Skills expected`, `Must-haves
   / Red flags`, `Sourcing playbook`, `Evaluation framework` — see `a8-resume-overview.png`) rather
   than plain form filling.

> UNVERIFIED: whether the wizard writes directly into `/jobs/<newid>/setup` on completion, or
> stays on its own route until a final "Create"/"Publish" action, then redirects.

## Disposable audit draft

Per the audit's permission to create one throwaway draft to map the flow, brief text naming the
job **`ZZ-Audit-Do-Not-Use`** was typed into step 1/2 of the wizard (see
`a8-wiz-filled.png`, `a8-wiz-step2-filled.png`). The audit did **not** click through to a final
create/publish action — the flow was backed out of after step 2 to avoid producing a live
artifact from an ambiguous terminal step.

> UNVERIFIED: whether the autosave behavior documented above (`Saved just now`) already
> persisted a draft job server-side under this name even without reaching a final submit. If a
> job titled `ZZ-Audit-Do-Not-Use` (or with that designation) appears in `/jobs`, it originated
> from this audit and is safe to delete — **no id was recorded because no draft was confirmed to
> exist; check `/jobs` search for the literal string to find it if so.**

## Nuances & Gotchas

- **The wizard is a dedicated route, not a modal** — both entry points (`Start new role` on
  `/jobs`, `+ New job` in the switcher) land on the same stepped page, not an overlay.
- **Step labels are dynamic, not fixed ordinals.** Step 1 is always `Express`; step 2 relabels
  itself to `Missing` once the parser finds gaps — implying step 2 could carry a different label
  (e.g. skip straight past, or a "complete" label) if the step-1 brief already covers everything.
- **The 12-field coverage checklist and the step-2 form are the same 12 fields** — step 1 is a
  single free-text capture step; step 2 is the identical data shown as structured, editable
  single-line inputs. There's no separate "review" step between free text and fields.
- **Only 5 of the 12 fields are hard-required** to proceed: `Designation`, `Experience (in yrs)`,
  `Location`, `WFO/WFH`, `Salary`. The other 7 are optional signal-gathering, not blockers.
- **The `Designation` field is the one checklist item that reliably fails auto-detection** from
  free text in this audit's tests, even when stated in an identical `Label: value` pattern to
  fields that *did* get detected. Treat `Designation` as needing manual confirmation in step 2
  even after a "complete-looking" brief.
- **All required fields at step 2 are free-text, not structured** — `LOCATION`, `SALARY`, and
  `EXPERIENCE (IN YRS)` accept prose, not a picker/number range. If later steps re-parse these
  into structured job-setup fields (e.g. the `Role & comp` section elsewhere in Job Setup), that
  second parse is a second point where information can be lost or misread — worth testing
  end-to-end in a future pass.
- **`SALARY CURRENCY` and `SALARY PERIOD` are separate from the free-text `SALARY` field** and are
  not covered by the coverage checklist — a brief can state a currency in prose while the
  structured `SALARY CURRENCY` dropdown stays on `Select` (unset). Watch for this mismatch.
- **Progress autosaves continuously** (`Saved just now`), so the flow behaves like editing a
  draft record from the first keystroke, not like a multi-page form that only commits at the end.
- **A validation toast exists** (`Need a longer brief before restructuring.`) gating the
  transition when the brief is too sparse — this is a soft length/content check, separate from
  the 5 hard-required fields.
