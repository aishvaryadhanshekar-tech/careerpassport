# `/jobs` — The Jobs Index

**H1:** `Everything you're` `hiring`(italic, coral) `for`
**Kicker:** `YOUR JOBS`
**Subtitle:** `Open a draft, jump back into a live job, or kick off a new one.`

Below that sits a second header block for the job grid itself:

**Kicker:** `LIVE & PAST`
**Section title:** `All jobs`
**Count (top-right of section, small grey text):** `33 jobs`

Two controls sit to the right of the page-level H1, at the same height:

| Control | Icon | Behaviour |
|---|---|---|
| Settings gear | ⚙ | **Confirmed live: navigates straight to `/settings`** (account settings — `Personal` / `Organization` / `Clients` / `Team` tabs). It is not a list-local control (no column picker, no view toggle) — it's simply another entry point into the same `/settings` page reachable from the account menu and Command-K. |
| `+ Start new role` | solid coral pill button | Opens the job-creation wizard (see `01-Job-Creation-Flow.md`) |

## Layout — the grid is the ONLY view; no toggle, no search, no bulk-select exist here

**Confirmed live (this audit), contradicting the brief's premise:** `/jobs` has exactly one
layout — the 3-column card grid described below. A full DOM sweep of the page found:

- **No view-mode toggle** (no table/list icon button anywhere in the header or section bar).
- **No search input** of any kind on this page (`Search jobs…` lives only in the job-switcher
  dropdown in the left rail — see `02-Global-App-Chrome.md` — not on `/jobs` itself).
- **No filter or sort control**, and the gear icon is not one either (see above — it's a
  `/settings` shortcut).
- **No checkboxes** on any card — there is no multi-select and therefore no bulk-action bar to
  reveal.
- **No pagination and no "load more."** All jobs render in a single ungapped grid; the visible
  card count matches the header count exactly every time (33 on one pass, 36 on a later pass —
  see gotcha below) with no truncation.

The only two per-card icon controls are `Copy application link` (🔗) and, on drafts only,
`Delete draft <title>` (🗑) — both confirmed via `aria-label` in the DOM, not just visually.

The grid renders **3 cards per row**, full width, with generous white cards on the page's cream
background:

```
┌─────────────────────────┐ ┌─────────────────────────┐ ┌─────────────────────────┐
│ Job Title           [Badge]│ Job Title           [Badge]│ Job Title           [Badge]│
│ 📍 Location                │ 📍 Location                │ 📍 Location                │
│ 🕐 Experience range        │ 🕐 Experience range        │ 🕐 Experience range        │
│ 🏢 Client / Career Passport│ 🏢 Client / Career Passport│ 🏢 Client / Career Passport│
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │
│ UPDATED <n>D AGO   [🗑][🔗]│ UPDATED <n>D AGO       [🔗]│ UPDATED <n>D AGO       [🔗]│
└─────────────────────────┘ └─────────────────────────┘ └─────────────────────────┘
```

### Card fields

| Field | Present on | Notes |
|---|---|---|
| Title | always | For drafts with no designation typed, literally renders the placeholder string `Draft Job` (also seen bare `5` and bare `w` — single-character titles from partially-filled drafts/live jobs) |
| Status badge (top-right) | always | See status reconciliation below |
| Location | when set | Pin icon. Missing on many drafts and even on some `Active` cards (e.g. `Mechanical Design Engineer` first occurrence has no location line) |
| Experience range | when set | Clock icon, e.g. `4 yrs`, `6–10 yrs` |
| Owner / source line | always | Building icon; either `Career Passport` (internally created) or `CP` (abbreviated, seen on `Sales Manager (B2C) L1`), or `Posted by CP` (partner-sourced) |
| `UPDATED <x>` | always | Relative (`7D AGO`, `15D AGO`) or absolute (`30 JUL 2026`, `5 AUG 2026`) — the switch to absolute dates happens for older items; exact threshold unverified |
| Trash icon (🗑, coral) | **`Draft` cards only** | Deletes the draft. **Never appears on `Active`/`Paused`/`Partner` cards.** |
| Link/copy icon (🔗) | always | Copies the job's shareable/application link to clipboard. In a headless/no-clipboard-permission context it fails with a toast: `Could not copy. Open the job to copy the link manually.` — confirms this is a `navigator.clipboard` write, not a navigation |

### Card → route mapping (confirmed)

Clicking a card title navigates to the job. This audit's harvested set of 33 job links
(`.audit/recon.json`) shows a **100% clean split**:

| Card status | Deep-links to |
|---|---|
| `Draft` | `/jobs/<id>/setup` |
| `Active` / `Paused` / `Partner` (anything not Draft) | `/jobs/<id>/overview` |

No exceptions were found in the harvested set. This is the authoritative routing rule: **draft
jobs open on the Setup tab (nothing to show yet); live/closed/paused/partner jobs open on the
Overview brief.**

## Status vocabulary — reconciled

Four label surfaces were observed showing job state, using different vocabularies for the *same*
underlying values:

| Surface | Vocabulary used |
|---|---|
| Jobs list card badge | `Active`, `Draft`, `Paused`, `Partner` |
| Job switcher dropdown (sidebar) | `OPEN`, `DRAFT` (all-caps, abbreviated) |
| Setup › Lifecycle `STATUS` field (`01-Job-Setup/07-Lifecycle.md`) | lowercase raw value: `active` (also implies `draft`, `paused`/`closed` exist) |
| `/activity` log entries | verb form: `closed <job>`, `changed status on <job>` |

**These are the same state machine, rendered four different ways** — not four different concepts.
Card `Active` = switcher `OPEN` = Setup `STATUS: active`.

### Authoritative status list (reconciled)

| Canonical value | List-card label | Switcher label | Trash icon on card? | Notes |
|---|---|---|---|---|
| `draft` | `Draft` | `DRAFT` | ✓ yes | Not yet published; title usually still the placeholder `Draft Job` |
| `active` | `Active` | `OPEN` | ✗ no | Published, hiring in progress |
| `paused` | `Paused` | > UNVERIFIED | ✗ no | Seen once (`Sales Manager (B2C) L1`). Produced by the `Pause job` button in Setup › Lifecycle |
| `closed` | > UNVERIFIED (not observed on any card in the harvested 33) | > UNVERIFIED | > UNVERIFIED | Produced by the `Close job` button in Setup › Lifecycle; reversible back to `active` |
| n/a — **not a lifecycle state** | `Partner` | — | ✗ no | Seen on `Strategic & Planning Manager Recruitment`, sub-labelled `Posted by CP`. This is a **source/ownership tag** (job posted by a partner/agency), orthogonal to lifecycle status, not a stage in the state machine |

### Lifecycle state machine

```
        (creation wizard,
         "Design the role")
                │
                ▼
            ┌─────────┐
            │  draft  │◄──────────────┐
            └────┬────┘               │
                 │ publish            │ (no observed
                 │ (unverified UI     │  path back to
                 │  trigger — likely  │  draft from
                 │  inside /setup)    │  active/paused)
                 ▼                    │
            ┌─────────┐   Pause job   │
            │ active  │──────────────►│ paused
            │ (OPEN)  │◄──────────────┘ (reversible:
            └────┬────┘   set STATUS     re-select
                 │ Close job   back to    STATUS=active)
                 │ (instant,   active
                 │  no confirm)
                 ▼
            ┌─────────┐  set STATUS
            │ closed  │──back to──────► active
            └─────────┘  active (reversible)
```

Confirmed from `01-Job-Setup/07-Lifecycle.md`: `Pause job` and `Close job` fire **instantly with
no confirmation dialog**, and the closed→active transition is reversible via the `STATUS` select
(a second, independent path to the same state, going through `Save section` rather than an
instant button).

## `RECENTLY VIEWED`, search, filters — resolved

**Confirmed live: none of these exist on the `/jobs` index page.** There is no `RECENTLY VIEWED`
block, no search box, and no filter/sort control anywhere on `/jobs` itself. The task brief's
description of these matches the **job-switcher dropdown** in the left rail almost exactly
(`RECENTLY VIEWED`, `Search jobs…`, `+ New job`) — that dropdown is documented in full in
`02-Global-App-Chrome.md`. It's reasonable to conclude the brief's authors were describing the
switcher, seen from a job's sub-page, and not a second copy of the same UI on `/jobs`.

## Nuances & Gotchas

- **This is a live shared tenant with real concurrent activity.** The job count moved from `33
  jobs` to `36 jobs` between two audit passes minutes apart, with the newest `Draft Job` cards
  timestamped `UPDATED 53M AGO` / `54M AGO` / `1H AGO` — other users (or other agents) are
  actively creating draft jobs on this tenant in real time. Any exact count or exact card list
  captured in this doc is a snapshot, not a stable fixture.
- **The header "gear" icon is just a `/settings` shortcut**, not a list-local settings/config
  control — confirmed by clicking it and landing on the account `Settings` page (`Personal` ·
  `Organization` · `Clients` · `Team` tabs). Don't look for column/view config behind it.
- **There is no table/list view, no search, no filters, no sort, no bulk multi-select on `/jobs`
  itself.** A full DOM sweep found only two icon-only button types on any card
  (`Copy application link`, `Delete draft <title>`) and zero `<input>` elements on the whole
  page. Anything resembling those controls in the product actually lives in the job-switcher
  dropdown (search, recently-viewed) — not here.
- **The trash icon is a hard signal of state**: if a card shows a delete icon, it is a draft. No
  live/paused/partner card ever exposes a delete affordance from the list.
- **Status vocabulary is not consistent across the app.** `Active` (list) = `OPEN` (switcher) =
  `active` (Setup). Do not treat these as different states — they are one state, three label sets.
- **`Partner` is a badge, not a lifecycle stage.** It marks a partner/agency-sourced posting
  (`Posted by CP`) and can in principle co-exist with any real lifecycle status; the list UI just
  doesn't show both at once.
- **Draft jobs frequently have no real title** — the placeholder `Draft Job` ships as the literal
  card title until a designation is typed. Single-character titles (`5`, `w`) show that almost any
  string can end up as a title, including test/junk input from other recruiters on this shared
  tenant.
- **The routing split (draft→`/setup`, everything else→`/overview`) had zero exceptions** across
  33 harvested jobs — treat it as a hard rule, not a heuristic.
- **`UPDATED` timestamps switch formats** between relative (`7D AGO`) and absolute (`30 JUL
  2026`) with no visible boundary rule observed; do not assume a fixed cutoff (e.g. "7 days") without
  further testing.
- **The copy-link icon can fail silently-ish**: in a context without clipboard write permission it
  shows a toast telling the user to open the job and copy manually — i.e. the fallback path is
  "click into the job," not a URL shown inline in the toast.
- Owner/source line renders three different strings for what appears to be the same "internal"
  concept: `Career Passport`, `CP`, and `Posted by CP` — these look inconsistent rather than
  intentionally distinct; unclear if `CP` vs `Career Passport` is a data entry difference or a
  deliberate abbreviation for certain job types.
