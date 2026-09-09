# Pipeline — `/jobs/<id>/pipeline`

**Eyebrow:** `PIPELINE`
**H1:** `One candidate at a time`
**Subtitle:** `Move with intent — review each candidate, capture a note, and shift them along.`

## Purpose (one sentence)

Pipeline is where an applicant already inside the funnel is reviewed one at a time — résumé, form answers, trip, AI evaluation and comms in one drawer — and then moved to an explicit **stage + status**, with the note and skill ratings captured alongside the move.

## The architectural answer (the important part)

**It is NOT a drag-and-drop kanban.** There are no swimlanes, no draggable cards, no board.

It is a **single-stage card grid + a modal review drawer**, wrapped in a vertical stage rail:

- The page shows **exactly one stage at a time**. The stage rail on the far right selects which one.
- Cards inside that stage are a plain responsive grid. Cards are **not draggable**.
- Clicking a card opens a **full-screen two-pane modal** — the actual "one candidate at a time" surface.
- Inside the drawer, four floating circular buttons hug the modal edges: `Previous candidate` (◀), `Next candidate` (▶), `Reject` (red, keyed `R`), `Advance` (green check, keyed `A`).
- Movement happens through **menus**, never by dragging: pick a stage, then pick a status inside it.

So "one candidate at a time" describes the *review drawer*, and the arrows/`A`/`R` keys make it a queue you can chew through without returning to the grid.

A **Table** view exists alongside Cards (see [04-views-and-table.md](04-views-and-table.md)) and is the only place with multi-select bulk actions.

## Layout — ASCII sketch

### Cards view (default)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Career Passport   Jobs  Marketplace  People  Reports  Control    🔔17  DR  │
├──┬─────────────────────────────────────────────────────────────────────────┤
│J │  PIPELINE                                            ┌ Cards │ Table ┐ │
│o │  One *candidate* at a time                                              │
│b │  Move with intent — review each candidate, capture a note, and shift    │
│  │  them along.                                                            │
│r │                                                                         │
│a │  ┌───────────────────────────────────────────────┐  ┌──────────┐        │
│i │  │ 🔍 Search applicants by name, skill, answer,  │  │ ⚙ Filters│        │
│l │  │    or tag…                                    │  └──────────┘        │
│  │  └───────────────────────────────────────────────┘                      │
│  │  Applied              2 candidates · 6 stages · 33 statuses      ┌───┐ │
│  │  ┌───────────────────────┐ ┌───────────────────────┐             │ 2 │ │
│  │  │ Full-Stack Engineer   │ │ Full-Stack Engineer   │             │Ap.│ │
│  │  │ 3Y  [Insufficient]    │ │ 6Y            ✉ 💬 📞 │             ├───┤ │
│  │  │ ⚑ SUBMITTED BY DEMO…  │ │ ⚑ SUBMITTED BY DEMO…  │             │ 2 │ │
│  │  │ ⚑ OWNER: DEMO REC.    │ │ ⚑ OWNER: DEMO REC.    │             │Sc.│ │
│  │  │ [REACT][TYPESCRIPT]   │ │ [REACT][NODE.JS]      │             ├───┤ │
│  │  │ 🎙 ●Application       │ │ 🎙 ●Application       │             │ 2 │ │
│  │  │    submitted ⌄  👤    │ │    submitted ⌄  👤    │             │StC│ │
│  │  │            NEHA JOSHI │ │       ADITYA KULKARNI │             ├───┤ │
│  │  └───────────────────────┘ └───────────────────────┘             │ 1 │ │
│  │                                                                  │Int│ │
│  │                                                                  ├───┤ │
│  │                                                                  │ 1 │ │
│  │                                                                  │Off│ │
│  │                                                                  ├───┤ │
│  │                                                                  │ 0 │ │
│  │                                                                  │Arc│ │
│  │                                                                  └───┘ │
└──┴─────────────────────────────────────────────────────────────────────────┘
```

### Review drawer (card clicked)

```
                  ┌──────────────────────────────────────────────────────┐
                  │ NJ  Neha Joshi  [Insufficient]     ✉ 📞 [⇧ Update CV]│  ✕
                  │     neha.joshi@example.com                           │
                  │ (●Application submitted ⌄) (⚑Submitted by Demo Rec.) │
                  │ ┌Résumé│App form│Trip│Evaluation│Comms┐  │ Feedback │ Timeline │ Notes │
    ┌───┐         │ ┌──────────────────────────────┐      │  ├──────────────────────┤
    │ ◀ │  ←prev  │ │ neha-joshi.pdf   [Open CV ↗] │      │  │ ADD A NOTE           │
    └───┘         │ │                              │      │  │ Type a note or record│
    ┌───┐         │ │      (PDF / error text)      │      │  │ one — it posts to the│
    │ ⃠ │  reject │ │                              │      │  │ Notes tab.           │
    └───┘         │ │                              │      │  │ ┌──────────────────┐ │
     R            │ │                              │      │  │ │ Leave a note…    │ │
                  │ │                              │      │  │ │ type @ to assign │ │      ┌───┐
                  │ │                              │      │  │ └──────────────────┘ │  ▶   │ ▶ │ next
                  │ │                              │      │  │ 🎙Voice ⏱Schedule    │      └───┘
                  │ │                              │      │  │  ⏎ POST · ⇧⏎ NEW LINE│      ┌───┐
                  │ │                              │      │  │              [ Post ]│      │ ✓ │ advance
                  │ └──────────────────────────────┘      │  │ TAGS      0 SELECTED │      └───┘
                  │                                       │  │ [chips…] [+ Add tag] │        A
                  │                                       │  │ SKILL FEEDBACK 0/5   │
                  │                                       │  │ [criterion] 1 2 3 4 5│
                  └───────────────────────────────────────┴──┴──────────────────────┘
```

## Sub-documents

| File | Covers |
|---|---|
| [01-stage-and-status-model.md](01-stage-and-status-model.md) | All 6 stages, all 33 statuses, the state machine, legal transitions |
| [02-candidate-review-drawer.md](02-candidate-review-drawer.md) | The two-pane modal: every tab, panel, evaluation, comms popovers |
| [03-note-composer-and-feedback.md](03-note-composer-and-feedback.md) | Note composer, @mentions, voice, schedule, tags, skill feedback |
| [04-views-and-table.md](04-views-and-table.md) | Cards vs Table, columns, sorting, pagination, bulk actions |
| [05-search-filters-and-queue.md](05-search-filters-and-queue.md) | Search, Filters modal, condition builder, queue order |
| [06-keyboard-shortcuts.md](06-keyboard-shortcuts.md) | Every shortcut confirmed and every key tested that does nothing |

## URL surface

| Param | Values | Effect |
|---|---|---|
| `?view=` | `table` (absent = Cards) | Switches the view; Cards is the default and is not written to the URL |
| `?stage=` | `applied`, `screened`, `submitted_to_client`, `interviewing`, `offered`, `archive` | Selects the stage the grid/table shows |
| `?application=` | application UUID | Opens the review drawer for that application |

Example: `/jobs/<id>/pipeline?view=table&stage=applied&application=5dd33371-…`

- Deep-linking `?application=` opens the drawer directly on page load.
- `Escape` closes the drawer and strips `?application=` (keeps `?stage=`).
- Selecting a stage in the rail does **not** always write `?stage=` when in Table view — the rail click filtered to `Screened` while the URL stayed `?view=table`. Cards-view rail clicks likewise left the URL at `/pipeline`. `?stage=` is honoured on load but is not reliably kept in sync afterwards.

## Header counts and badges — exactly what is counted

| Readout | Literal example | What it counts |
|---|---|---|
| Stage heading | `Applied` | The currently selected stage's display name |
| Meta line | `2 candidates · 6 stages · 33 statuses` | `candidates` = applications **in the selected stage only** (after search/filters). `6 stages` and `33 statuses` are **platform constants**, identical on every job |
| Rail pill | `2` above `Applied` | Applications in that stage for this job. `0` renders in a muted/greyed pill |
| Search count | `1 MATCH` / `0 MATCHES` | Matches **across all stages**; replaces the stage heading while a search is active |
| Table footer | `PAGE 1 OF 1 · 2 ITEMS` | Rows in the current stage after search/filters |
| Bulk bar | `2 selected` | Checked rows in Table view |
| Feedback header | `0 / 5 RATED` | Skill-feedback criteria you have rated, out of the job's criteria count |
| Tags header | `0 SELECTED` | Tags currently applied to this candidate |
| Notes tab | `0 NOTES` | Notes on this application |
| Comms tab | `Email 0` | Email threads with this candidate |

Note the grammar bug: with one candidate the line still reads `1 candidates · 6 stages · 33 statuses`.

## How a candidate arrives here, and where they exit

| Direction | Path | Evidence |
|---|---|---|
| **In** — from Prospects | A prospect is promoted into an application. Every demo application's Timeline opens with `Added as prospect` by `Demo Recruiter` | Timeline tab |
| **In** — inbound application | Applications land in `Applied` with status `Application submitted`; the card chip reads `SUBMITTED BY <name>` and the drawer chip `Submitted by Demo Recruiter` | Card + drawer |
| **In** — from a Trip | The drawer's `Trip` tab reads the trip result; empty state `No trip assigned` / `This candidate has not been sent a trip.` | Trip tab |
| **Out** — Archive | `Reject` (R) or `Move to → Archive` | Reject menu |
| **Out** — Offered/hired | `Offered` stage statuses run all the way to `Joined`, `Invoicable`, `Invoice Cleared` | Offered submenu |
| **Cross-link** — Communications | Outreach modal footer: `Need a change? Manage in Communications` | Email modal |
| **Cross-link** — Trips | `Trip` tab; WhatsApp empty state `Create one`; AI call empty state `Create an agent` | Bulk modals |
| **Cross-link** — Job setup | Skill-feedback criteria and the Evaluation rubric are the job's Requirements from `/setup` | Setup + drawer |

## Empty / loading / error states (literal copy)

| State | Copy |
|---|---|
| Stage with no candidates | `NOTHING HERE YET` / `Pick a different stage from the right.` |
| Entire pipeline empty (0 in every stage) | Same copy — `NOTHING HERE YET` / `Pick a different stage from the right.` The rail still renders all 6 stages with `0` |
| Search no result | `0 MATCHES` heading, then `NO MATCHES` / `No applicants matched this search.` |
| Résumé loading | `Loading résumé…` |
| Résumé missing | `Resume with id '<uuid>' was not found` (raw backend message, shown in the viewer pane in monospace) |
| Feedback pane loading | `Loading your feedback…` |
| Evaluation running | `Evaluating candidate…` / `Scoring against the job's rubric. This can take a moment.` |
| Application form empty | `No form answers recorded.` |
| Trip empty | `No trip assigned` / `This candidate has not been sent a trip.` |
| Email thread empty | `No emails with <Name> yet.` |
| Notes empty | `No notes yet — leave the first one below.` |
| Skill feedback empty | `No skill feedback logged yet.` |
| Filters, nothing set | `No conditions added` / `Use the filters above, or add a condition for something they don't cover.` and footer `0 filters selected` |
| WhatsApp, no template | `No approved message fits this stage yet.` (single) / `No WhatsApp messages for this job yet.` + `Create one` (bulk) |
| AI call, unprovisioned | `No calling agent is provisioned for this job yet.` + `Create an agent` |

## Nuances & Gotchas

- Not a kanban. No drag-and-drop anywhere on this screen; every move is a two-level menu pick (stage → status).
- Only **one stage is visible at a time**. There is no all-stages board view, not even in Table view.
- The rail is the only stage switcher; the empty state literally instructs `Pick a different stage from the right.`
- `6 stages · 33 statuses` — but only **32 unique statuses exist**; the header over-counts because `Offer declined` is shared between `Offered` and `Archive` and gets counted twice. See [01-stage-and-status-model.md](01-stage-and-status-model.md). The label is **identical on every job** in the tenant, and `/jobs/<id>/setup` has no stage or status editor (its 7 sections are Role & comp, Requirements, Job description, Application form, Sourcing brief, Visibility & posting, Lifecycle). Stages/statuses are platform-fixed, not per-job configurable.
- The `Advance` button is **absent** on candidates in `Offered` — advance is one-directional and `Offered` is the last advanceable stage. `Reject` remains available there.
- `Previous candidate` is disabled on the first card, `Next candidate` on the last. The queue does **not** wrap around, and arrow keys stop at the ends rather than jumping stages.
- Neither a note nor a rating is required to advance — `Post` and the skill ratings are entirely independent of the `A`/`R` buttons.
- Meta line grammar is unguarded: `1 candidates`.
- Active search hides the `Filters` button and the stage heading, and searches across all stages, so the visible result may not be in the stage the rail has highlighted.
- The card-level ✉ icon opens a **bulk-outreach modal scoped to that one candidate** (`Outreach to 1 candidate` … `Run · send 1`), not a plain compose window.
- Résumé failures surface the raw backend string including the internal UUID.
