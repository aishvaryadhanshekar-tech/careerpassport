# Job overview — `/jobs/<id>/overview`

**H1:** `The brief, in one place`
**Subtitle:** `Everything not covered elsewhere — context, expectations, fitment notes.`
**Breadcrumb:** `JOB OVERVIEW · <JOB TITLE> →` + status pill (`Active` / `Draft` / …)

This is the landing page for an **Active** job when opened from the jobs list (Draft jobs land on
`/setup` instead — see [Draft vs Active](#draft-vs-active) below). It is a read-mostly dashboard: most
of what it shows is either a mirror of `/setup` fields or AI-generated derivative content, not a place
to author new facts. The two authoring surfaces that *do* live here are the **Job description** modal
(a document layered on top of setup data) and the **Share application link** composer (a one-off
message, not a stored field).

## Layout

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ JOB OVERVIEW · FULL-STACK ENGINEER →  [Active]        [↓ Download JD] [↔ Share application link] │
│ The brief, in one place                                                         │
│ Everything not covered elsewhere — context, expectations, fitment notes.       │
│                                                                                  │
│ ┌──────────────────────────────────────────────────────────────────────────┐   │
│ │ ○ ACTIVE BRIEF                                          [Internal team ▾]│   │
│ │ Full-Stack Engineer                                                      │   │
│ │ ⏱ 3–7 yrs · 📍 Bengaluru, India · Hybrid · ₹ 1,800,000–3,200,000/yr     │   │
│ │ 🗓 Published 30 Jul 2026                                                 │   │
│ └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│ ┌───────────────────────────┐                                                  │
│ │ 📄 APPLICATIONS            │                                                  │
│ │ Review applicants in the   │                                                  │
│ │ Applied stage of your      │                                                  │
│ │ pipeline.                  │                                                  │
│ │ OPEN →                     │                                                  │
│ └───────────────────────────┘                                                  │
│                                                                                  │
│ ┌──────────────────────────────────────────────────────────────────────────┐   │
│ │ 🧾 RECRUITER BRIEF                                                       │   │
│ │ <long AI/recruiter-authored free text — the JD summarised as prose>     │   │
│ └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│ CRYSTALLIZATION                                                                 │
│ Inferred cards                                                                  │
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐                         │
│ │1. IDEAL        │ │2. TRIBAL       │ │3. SKILLS       │                        │
│ │   CANDIDATE    │ │   DETAILS      │ │   EXPECTED     │                        │
│ └───────────────┘ └───────────────┘ └───────────────┘                         │
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐                         │
│ │4. MUST-HAVES / │ │5. SOURCING     │ │6. EVALUATION   │                        │
│ │   RED FLAGS    │ │   PLAYBOOK     │ │   FRAMEWORK    │                        │
│ └───────────────┘ └───────────────┘ └───────────────┘                         │
└────────────────────────────────────────────────────────────────────────────────┘
```

## 1. Header chrome

| Element | Copy / behaviour |
|---|---|
| Breadcrumb kicker | `JOB OVERVIEW · <TITLE> →` — the `→` is a chevron, presumably a job-switcher trigger (see below) |
| Status pill | `Active` (pale green) or `Draft` (pale grey) next to the breadcrumb — mirrors `Status` from Setup › Lifecycle |
| `Download JD` button | top-right; opens the same modal as the brief card's implicit JD (see §3) pre-set to a downloadable state |
| `Share application link` button | top-right; opens the AI message-composer drawer (see §4) |

### Job switcher

Clicking the job title area (left rail shows `ACTIVE JOB` / job name as a dropdown trigger) opens a
searchable job switcher:

```
┌ ACTIVE JOB              ▾ ┐   ┌ 🔍 Search jobs...                    ┐
│ Full-Stack Engineer       │   │ ⏱ RECENTLY VIEWED                    │
│ OPEN · BENGALURU, INDIA   │   │  Full-Stack Engineer   OPEN · BENGALURU, INDIA │
└────────────────────────────┘  │ ⏱ ALL JOBS                            │
                                 │  Draft Job         DRAFT · —          │
                                 │  UI/UX Designer    OPEN · UK          │
                                 │  Draft Job         DRAFT · —          │
                                 │  … (5 draft jobs, 2 more open jobs)   │
                                 │  Product Designer                    │
                                 │  + New job                           │
                                 └────────────────────────────────────────┘
```

- Rows show `<title>` / `<STATUS> · <LOCATION>` (drafts show `DRAFT · —` since location isn't set yet).
- A `RECENTLY VIEWED` section pins the current job at top, highlighted.
- `+ New job` at the very bottom starts job creation.
- This is a **global job switcher**, not scoped to overview — it is the left-rail's `ACTIVE JOB` label
  literally naming whichever job is currently open (the label text is the job's own status, e.g. it
  would read `DRAFT JOB` for a draft).

### Posting-destination pill

Top-right of the green brief card, a pill reads `Internal team ▾` and opens a two-item menu:

```
┌ Internal team ▾ ┐
│ Marketplace      │
│ Internal team  ✓ │
└──────────────────┘
```

This is the **published-to destination** — mirrors `Visibility & posting` in Setup. `Internal team`
keeps the job private to the org's recruiters; `Marketplace` (seen on the `UI/UX Designer` reference
job) exposes it externally. > UNVERIFIED: whether changing this selector here actually writes back to
Setup, or is read-only chrome that must be changed in Setup itself — no save action was observed on the
menu itself (it may apply instantly like a toggle, consistent with the Setup module's other
instant-apply controls such as `Close job`). Treat as **do not click through to confirm** given the
live-tenant guardrail; flagged for a follow-up pass in a disposable job.

## 2. Active brief card (the green hero)

A dark-green card, kicker `○ ACTIVE BRIEF` (or `○ DRAFT BRIEF` for a draft job — see below).

| Field | Source | Mirror or edit here? |
|---|---|---|
| Job title | Setup › Role & comp | **mirror**, read-only text |
| Experience range (`3–7 yrs`) | Setup › Role & comp › Experience level | **mirror** |
| Location + work mode (`Bengaluru, India · Hybrid`) | Setup › Role & comp › Location / Location type | **mirror** |
| Compensation range (`₹1,800,000–3,200,000/yr`) | Setup › Role & comp › CTC min/max, Currency, Salary period | **mirror** |
| `Published <date>` | Setup › Lifecycle (implicitly, whenever status first went Active) | **mirror**, not independently editable |
| Posting-destination pill | Setup › Visibility & posting | **mirror**, see caveat above |

**Nothing on this card is directly editable.** There is no inline edit affordance on any of these
values; every one of them is authored in Setup and rendered here as text. This matches the Setup
README's own claim that `/setup` is the sole authoring surface.

## 3. Applications card

Small white card, kicker `📄 APPLICATIONS`, body `Review applicants in the Applied stage of your
pipeline.`, link `OPEN →`. This is a shortcut into the job's **Pipeline** section (left rail), filtered
to the `Applied` stage — not unique overview content, just a navigational card.

## 4. Recruiter brief

Kicker `🧾 RECRUITER BRIEF`. A single dense paragraph of prose — reads as the job description's
opening + responsibilities + requirements concatenated into one narrative block. This is very likely
**derived/rendered text**, not a separately authored field — it closely mirrors the `Job description`
document's opening paragraph, responsibilities list, and requirements list stitched together
sentence-by-sentence.

> UNVERIFIED: whether `Recruiter brief` is a distinct stored field (editable somewhere) or purely a
> computed rendering of the JD document at read time. No edit control was found attached to this card
> directly; editing the underlying JD (via `Download JD` → `Edit`) is presumed to be the only way to
> change it.

## 5. Job description modal (`Download JD`)

Opens a modal titled `Job description` with a `Preview` / `Edit` toggle (segmented control, top-right
of the modal).

**Preview mode** renders the candidate-facing JD document: a green header block (title + chips:
location, work mode, employment type, experience range, comp range) followed by the free-text body and
a `RESPONSIBILITIES` bullet list.

**Edit mode** exposes a field-by-field editor:

| Field | Toggle (`Shown`) | Source note printed in the UI |
|---|---|---|
| `JOB TITLE` | — (no toggle, always shown) | plain text input |
| `OPENING PARAGRAPH` | ✅ Shown | helper text: `Sits above the sections.` |
| `HEADER CHIPS` (`LOCATION`, `WORK MODE`, `EMPLOYMENT TYPE`, `EXPERIENCE`, `COMPENSATION`) | each has its own `Shown` toggle | **`These live on Role & comp; edits here apply to this document only.`** |
| `RESPONSIBILITIES` | ✅ Shown | one-per-line textarea; helper text **`One per line — the document shows the first 5.`** |
| `MUST-HAVE SKILLS` | ✅ Shown | textarea; helper text **`Owned by Requirements — edits here apply to this document only.`** |
| `GOOD-TO-HAVE SKILLS` | ✅ Shown | textarea; helper text `One per line.` (no ownership note printed — unclear if it forks or has no Setup source at all) |
| `BENEFITS` | ✅ Shown | textarea, empty on the reference job; helper text `Comma- or line-separated.` |
| `TECH & TAGS` | ✅ Shown | textarea, e.g. `React, TypeScript, Node.js, Next.js, PostgreSQL`; helper text `Short tokens render as chips.` |

The modal's own footer states the rule for the **entire document**, not just the header chips:
**`Edits here apply to this download only — change the job on the Job setup tab.`** — printed just
above the `Download PDF` / `Done` buttons. Note the modal's own button is `Done`, never `Save` — there
is nothing to save back upstream.

**This is the single most important fact about this screen's editability model:** every field in the
JD document — header chips, responsibilities, must-have skills, and (by the same footer disclaimer)
presumably good-to-have skills, benefits, and tech tags too — is *seeded* from Setup (Role & comp for
the chips, Requirements for responsibilities/must-haves) but editing it **inside this JD document**
does **not** write back to Setup. The `Download JD` modal is a **one-way fork**: Setup → JD document,
never JD document → Setup. The only field with no stated Setup origin is `JOB TITLE` and
`OPENING PARAGRAPH`, which read as document-native content.

| Field | Behaviour |
|---|---|
| `JOB TITLE` (in JD edit mode) | free text — > UNVERIFIED whether editing this here also renames the job everywhere, or forks like every other field |
| Each field's `Shown` toggle | hide/show that field in the rendered JD without deleting its value — same required-vs-visible pattern seen in the Application form's standard fields |
| `RESPONSIBILITIES` truncation | the document caps at **5** rendered responsibilities regardless of how many lines are typed — authoring more than 5 has no visible effect on the download |

## 6. Crystallization › Inferred cards

Header: small-caps red kicker `CRYSTALLIZATION`, H2 `Inferred cards`. Six cards in a 3×2 grid, each
numbered and small-caps titled. This is explicitly **AI-generated derivative content** (the section
name "Crystallization" and "Inferred" both signal computation, not authoring) built from the Setup
fields (requirements, sourcing brief, JD) and possibly the recruiter brief.

| # | Card | Content observed (reference job) |
|---|---|---|
| 1 | `IDEAL CANDIDATE` | one paragraph, second-person narrative profile of the ideal hire |
| 2 | `TRIBAL DETAILS` | terse `·`-joined fragment — `Not specified · On-site · Not specified` on the reference job (i.e. renders literal `Not specified` when a source field is empty, rather than omitting the card) |
| 3 | `SKILLS EXPECTED` | comma-joined list of skill/responsibility phrases |
| 4 | `MUST-HAVES / RED FLAGS` | bullet list; ✓-prefixed items are must-haves, a trailing ✗-prefixed item is a red flag (e.g. `✗ no production React experience`) |
| 5 | `SOURCING PLAYBOOK` | sub-labelled `TARGETS` (named companies), `SECTORS`, `AVOID` — mirrors Setup › Sourcing brief structure closely |
| 6 | `EVALUATION FRAMEWORK` | list of criteria, each with a proficiency/level tag (e.g. `Pro · R3 · L2`) and, on the Draft reference job, additional `Must have`/`Critical`/`Number threshold` badges |

**Card 6 (`Evaluation framework`) renders differently between jobs** — the Active `Full-Stack Engineer`
job shows plain `Pro · R2/R3 · L2` level tags with no colour, while the Draft `UI/UX Designer` /
`Draft Job` references show coloured badges (`Must have`, `Critical`, `Number threshold`) attached to
each criterion. > UNVERIFIED whether this is a per-job authoring difference (some jobs have richer
evaluation criteria typed into Requirements) or a rendering variant tied to job status.

> UNVERIFIED: the exact regeneration mechanism for these six cards — no `Regenerate` button was found
> directly on this page. They likely regenerate whenever the underlying Setup fields (Requirements,
> Sourcing brief, JD) are saved, similar to how the `Share application link` composer has an explicit
> `Generate message` action (see below) — but no equivalent visible trigger exists for the Inferred
> cards specifically.

## 7. Share application link (AI message composer)

`Share application link` (top-right button) opens a drawer:

```
┌ 🔗 Application link  ✓ READY TO SHARE                    [⧉ Copy link] ┐
│ Share the application link                                             │
│ ┌ COMPOSER SETTINGS ────────┐  ┌ LIVE PREVIEW         LINKEDIN · WARM ┐│
│ │ PLATFORM   [LinkedIn ▾]   │  │ <AI-generated outreach message,      ││
│ │ TONE       [Warm ▾]       │  │  ends with the application link>     ││
│ │ SENDER     [Demo Recr. ▾] │  │                                       ││
│ │ YOUR INPUT [free text]    │  │                    [Copy message]    ││
│ │ [✨ Generate message]     │  └───────────────────────────────────────┘│
│ └────────────────────────────┘                                         │
└──────────────────────────────────────────────────────────────────────────┘
```

| Control | Options observed |
|---|---|
| `PLATFORM` | `LinkedIn`, `Email`, `WhatsApp` |
| `TONE` | `Warm`, `Direct`, `Editorial` |
| `SENDER` | dropdown, defaulted to the logged-in recruiter (`Demo Recruiter`) |
| `YOUR INPUT` | free-text box, placeholder `Suggest any changes or add context for the message…` — feeds the generator as extra instruction |
| `Generate message` | button with a sparkle icon — (re)runs AI generation using the current Platform/Tone/Sender/Input |
| `Copy message` | copies the generated text to clipboard |
| `Copy link` | top-right of the drawer header, copies the raw application URL independent of the message |

The `LIVE PREVIEW` panel's top-right label always echoes the current `PLATFORM · TONE` pair
(`LINKEDIN · WARM`). The application URL embeds a `recruiter=<uuid>` query param that is presumably the
sender's identity for attribution when a candidate applies through this specific link — worth noting
that different senders would produce different trackable links.

This is the clearest AI-generation surface on the Overview page: it has an explicit generate action,
explicit inputs, and a visible "this is a draft you can edit before sending" framing — unlike the
Inferred cards and Recruiter brief, which have no visible regenerate control.

## 8. Candidate-facing job-post preview

> UNVERIFIED: no distinct "candidate view of the job posting" (i.e. what a candidate sees on the
> external application page, as opposed to the JD document) was located as reachable from Overview
> during this pass. The `Job description` modal's `Preview` mode is the closest analogue and is
> presumed to be the actual candidate-facing rendering, but this was not cross-checked against the live
> `/apply` URL embedded in the Share drawer (`https://app.careerpassport.ai/jobs/cp-demo-full-stack-engineer/apply?recruiter=…`).

## Draft vs Active

Draft jobs deep-link to `/setup` from the jobs list (per the Setup README), so reaching a draft's
`/overview` requires navigating there directly (e.g. via the job switcher). Observed on `Draft Job`
(id ends `/setup` in `.audit/recon.json`, confirming its draft state):

| Element | Active job (`Full-Stack Engineer`) | Draft job (`Draft Job`) |
|---|---|---|
| Breadcrumb pill | `Active` | `Draft` |
| Brief card kicker | `○ ACTIVE BRIEF` | `○ DRAFT BRIEF` |
| Brief card stat line | `3–7 yrs · Bengaluru, India · Hybrid · ₹1,800,000–3,200,000/yr · Published 30 Jul 2026` — fully formatted, real values | `4 · 1·1 · ₹1` — **raw, unformatted placeholder-looking fragments, no `Published` date, no units, no location/mode text** |
| `RECRUITER BRIEF` card | present | **absent entirely** — the draft has no recruiter-brief section, jumping straight from `APPLICATIONS` to `CRYSTALLIZATION` |
| `CRYSTALLIZATION › Inferred cards` | present, 6 cards | present, 6 cards — but `Card 6 (Evaluation framework)` shows extra badges (`Must have`, `Critical`, `Number threshold`) not seen on the Active reference job |
| `APPLICATIONS` card | present | present, identical copy |
| Header buttons (`Download JD`, `Share application link`) | present | present |

**The draft brief card's stat line is the most important finding here.** `4 · 1·1 · ₹1` is almost
certainly the unformatted concatenation of whatever numeric placeholders exist in Setup fields that
were never filled in (experience level defaulted/blank rendering as a bare `4`; location rendering as
`1·1`; compensation rendering as a bare `₹1`) — i.e. **the Overview header has no guard against
unfilled Setup data**, and will happily render garbled fragments instead of a sensible fallback like
`Not specified`. Contrast this with the `TRIBAL DETAILS` inferred card, which *does* fall back
gracefully to the literal string `Not specified` for the same kind of missing data. Two different
renderers on the same page handle "field not filled in Setup" in two very different ways.

The missing `RECRUITER BRIEF` card on the draft is consistent with it being **derived text** (§4): a
draft job's JD/requirements are typically thinner, and the renderer appears to suppress the card
entirely rather than show an empty/placeholder brief — unlike the numeric stat line, which renders
garbage rather than suppressing.

## Nuances & Gotchas

- **Nothing on the green brief card is directly editable** — title, experience, location, comp,
  published date, and the posting-destination pill are all mirrors of Setup. To change any of them you
  must go to `/setup`.
- **The entire `Download JD` modal is a one-way fork of Setup, not a two-way mirror.** Its own footer
  says so for the whole document: `Edits here apply to this download only — change the job on the Job
  setup tab.` Individual fields repeat the same warning (`These live on Role & comp…`, `Owned by
  Requirements…`). Editing anything inside this modal — chips, responsibilities, must-have skills —
  changes only this exported document, never Setup, and (presumably) never the green brief card either.
  The modal's own confirm button is labelled `Done`, not `Save`, reinforcing that nothing is written
  upstream.
- **The JD document silently truncates `RESPONSIBILITIES` to 5 lines** regardless of how many are
  authored (`One per line — the document shows the first 5.`) — a count that doesn't reconcile is
  expected behaviour here, not a bug, if you type a 6th line and never see it rendered.
- **The draft job's brief-card header renders unformatted placeholder fragments** (`4 · 1·1 · ₹1`)
  when Setup fields are unfilled, instead of falling back to `Not specified` the way the `TRIBAL
  DETAILS` inferred card does for the same missing data. Two renderers, two different failure modes,
  same page.
- **The `RECRUITER BRIEF` card disappears entirely on at least one draft job** rather than rendering
  empty — don't assume every card on this page is always present; some are conditional on having enough
  source content.
- The `Inferred cards` section has **no visible regenerate control**, unlike the Share-link composer's
  explicit `Generate message` button — if these six cards do regenerate, the trigger is invisible from
  this screen (likely tied to saving Setup sections).
- The posting-destination pill (`Internal team` / `Marketplace`) opens a menu with no visible Save —
  treat any change there as **possibly instant-apply**, consistent with this product's pattern of
  instant-apply controls elsewhere (e.g. Setup › Lifecycle's `Close job`). Do not click through it to
  confirm on the live tenant.
- The `Share application link` message embeds a `recruiter=<uuid>` query parameter — different senders
  chosen in the composer likely produce differently-attributed links, not just different message text.
- The job switcher's left-rail label (`ACTIVE JOB` / presumably `DRAFT JOB`) literally states the
  currently-open job's status as its own section heading — it is not a static label.
- `Card 6` (`Evaluation framework`) is the one Inferred card observed to render structurally differently
  across jobs (plain level tags vs. badge-decorated criteria) — do not assume all six cards have a
  single fixed template; at least one has variant layouts.
