# Views and table

Two views of the same stage-scoped data: `Cards` (default, grid of cards — see the Pipeline
README) and `Table`. The toggle sits top-right of the page (`⊞ Cards | ⊟ Table`). Switching views
does **not** clear search/filters, and both views share the same stage rail on the right.

```
[⊞ Cards]  [⊟ Table]                                    (toggle, top-right)

Search…                                    [⚙ Filters] [⊞ COLUMNS]   ← Table only
Applied                                          2 candidates · 6 stages · 33 statuses
┌──┬──────────────┬──────────┬─────────────┬──────────────────┬─────────────┬──...
│○ │Candidate ⇕   │VERIFIED  │COMMUNICATION│STATUS            │APPLIED DATE⇓│ROLE TITLE...
├──┼──────────────┼──────────┼─────────────┼──────────────────┼─────────────┼──...
│○ │Neha Joshi    │Unverified│📞✉💬 Not    │Application       │  —          │Full-Stack...
│  │              │          │  contacted  │submitted         │             │
├──┼──────────────┼──────────┼─────────────┼──────────────────┼─────────────┼──...
│○ │Aditya Kulkarni│Unverified│📞✉💬 Not   │Application       │  —          │Full-Stack...
│  │              │          │  contacted  │submitted         │             │
└──┴──────────────┴──────────┴─────────────┴──────────────────┴─────────────┴──...
PAGE 1 OF 1 · 2 ITEMS                                                    ◀  ▶
```

`Table` view only adds a `COLUMNS` button next to `Filters` — Cards view has no column control.

---

## Columns picker

`COLUMNS` opens a `Visible columns` popover: `YOURS ONLY — NOBODY ELSE'S VIEW CHANGES` — an
explicit statement that column visibility is a **per-recruiter, local preference**, not shared
job configuration.

Every column is tagged with a category badge on the right of its toggle:

| Category badge | Columns observed |
|---|---|
| `IDENTITY` | `Candidate`, `Verified`, `Email`, `Phone` |
| `APPLICATION` | `Trip status`, `Communication`, `Stage`, `Status`, `Role title` |
| `META` | `Applied date` |
| `EXPERIENCE` | `Current company`, (and further columns below the fold, e.g. `Years of experience`) |

- `Candidate` is the only column whose toggle renders visually **locked on** (dimmed/disabled
  switch) — every other toggle is a live green/off switch. The name column cannot be hidden.
  columns; `Email` and `Phone` were off by default in the reference job.
- A `Reset` link at the bottom restores the default set.
- Default-on columns observed: `Candidate` (locked), `Verified`, `Communication`, `Status`,
  `Applied date`, `Role title`, `Current company`, `Years of experience`. Default-off: `Email`,
  `Phone`, `Trip status`, `Stage`.

> UNVERIFIED: the full column list beyond what fit in the popover before scrolling — only the
> first ~10 rows were captured.

---

## Table columns, as rendered

| Column | Content |
|---|---|
| (checkbox) | Row selection |
| `Candidate` ⇕ | Name, sortable |
| `Verified` | `Unverified` / `Verified` badge — the same confidence-adjacent field surfaced elsewhere as a filter condition (`Verified Is Unverified`, see `05-search-filters-and-queue.md`) |
| `Communication` | Stacked ☎ ✉ 💬 icons + a muted `Not contacted` caption |
| `Status` | Plain-text pill, no colored dot (unlike the card/drawer pill) |
| `Applied date` ⇊ | Sort arrow shown active by default (`↓`); shows `—` when not yet applied via a form (e.g. prospect-originated) |
| `Role title` | e.g. `Full-Stack Engineer` |
| `Current company` | `—` when unknown |
| `Years of ex[perience]` | e.g. `3y` / `6y`, colored like the card's badge |

`Status` in the table is **read-only text** — there is no inline dot or caret. Changing status
from Table view requires either opening the row's own menu or using the bulk bar (below); it is
not a directly-clickable pill the way the card is.

---

## Sorting and pagination

- Only `Candidate` and `Applied date` showed sort affordances (⇕ / ↓) among observed columns.
- `Applied date` sorts **descending by default** (`↓` shown pre-applied, most-recent first).
- Footer: `PAGE 1 OF 1 · 2 ITEMS`, with `◀`/`▶` page arrows — both disabled on a single page.
- Pagination and counts are **scoped to the current stage** (and any active search/filter), same
  as Cards — switching stages resets to `PAGE 1 OF 1` for that stage's own count.

> UNVERIFIED: page size (candidates-per-page) — never observed with enough candidates in one
> stage to force a second page.

---

## Row selection and bulk actions

Checking any row checkbox replaces the stage heading's row with a dark **bulk action bar**:

```
[1 selected]  |  ⇄ Move   ⌘ Assign to   ✉ Email   💬 WhatsApp   📞 AI call        ✕
```

| Action | Behavior |
|---|---|
| `Move` | Opens the **same two-level `MOVE TO` menu** as the card/drawer status pill — all 6 stages, then that stage's statuses. Confirmed identical structure via screenshot, including for 2 selected rows at once |
| `Assign to` | A single-column `ASSIGN TO` list — only `Demo Recruiter` shown (single-seat demo tenant) |
| `Email` / `WhatsApp` / `AI call` | Each opens the **same bulk-outreach modal** described in `02-candidate-review-drawer.md` (`Outreach to <n> candidates`, template picker, live preview, footer `Will run for <n> of <n>` and `Run · send <n>`) — scoped to however many rows are checked |
| Header checkbox | Selects/deselects every row on the current page |
| `✕` (bulk bar) | Clears selection, restores the normal `PAGE n OF n · <n> ITEMS` footer row |

The bulk-action `Move` is the **full jump-anywhere** menu (unlike the drawer's linear `Advance`
button — see `01-stage-and-status-model.md`). Bulk moving 2 candidates from `Applied` still offers
all 6 destination stages, not just `Screened`.

The bulk outreach modal's template picker is filtered by the **selected rows' current stage** —
its caption reads `The filter narrows this list only — any template here can be sent to these
candidates`, and the template dropdown showed `Applied` as the active stage filter. Sending to `2`
selected candidates showed `Will run for 2 of 2` and a `Run · send 2` button (not clicked, per
guardrail).

## Nuances & Gotchas

- Column visibility is **explicitly per-recruiter** (`YOURS ONLY — NOBODY ELSE'S VIEW CHANGES`) —
  this is stated inline in the picker, not left implicit.
- `Candidate` is the only column that cannot be hidden — its toggle renders visually locked.
- The table's `Status` cell is plain text with no click affordance — status changes in Table view
  go through the bulk bar or a row-level menu, not a directly editable inline pill like Cards.
- Bulk `Move` and the card/drawer status-pill `MOVE TO` are the **same two-level, jump-anywhere**
  menu; bulk actions do not get a "linear advance" shortcut the way the drawer's floating ✓ does.
- The bulk outreach modal is identical in structure whether triggered from a single card's ✉ icon
  or from N selected table rows — only the candidate count and preview target change.
- `Verified`/`Unverified` appears in three independent places that must be kept consistent when
  documenting the product: the table's `VERIFIED` column, the `Filters → CONDITIONS` builder
  (`Verified Is Unverified`), and nowhere on the card itself (cards show a confidence badge like
  `Insufficient` instead — a different field).
- Switching between Cards and Table does not reset search or filters, but (per the Pipeline
  README's URL surface notes) it does not reliably keep `?stage=` in the URL either.
