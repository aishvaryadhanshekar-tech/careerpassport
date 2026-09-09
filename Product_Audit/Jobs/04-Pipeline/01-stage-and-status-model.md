# Stage and status model

**Header constant, every job:** `6 stages · 33 statuses`. This tenant-wide constant is **not
configurable per job** — `/jobs/<id>/setup` has no stage/status editor (see the Pipeline README).

## The 6 stages, in rail order

| # | Stage (`?stage=`) | Rail label | Statuses | `Advance` button present? |
|---|---|---|---|---|
| 1 | `applied` | `Applied` | 3 | ✅ |
| 2 | `screened` | `Screened` | 3 | ✅ |
| 3 | `submitted_to_client` | `Submitted to Client` | 2 | ✅ |
| 4 | `interviewing` | `Interviewing` | 4 | ✅ |
| 5 | `offered` | `Offered` | 9 | ❌ — **absent**, last advanceable stage |
| 6 | `archive` | `Archive` | 12* | ❌ |

`3+3+2+4+9+12 = 33` — but see **the 33rd status is a phantom** below; the true unique-status count is 32.

Movement is exclusively via a two-level `MOVE TO` menu: pick a **stage** (level 1, left column),
then a **status** inside it (level 2, right column, appears on hover). There is no drag-and-drop.

---

## All 33 (32 unique) statuses, stage by stage

Each status row in the `MOVE TO` menu carries a colored dot. The dot color is consistent enough to
read as a semantic signal, not per-status decoration:

| Dot | Meaning (inferred) |
|---|---|
| 🟢 green | Forward progress / positive outcome |
| 🟠 orange | In-progress / awaiting someone |
| 🔴 red | Negative / rejection outcome |
| ⚪ gray | Neutral / paused, not a rejection |

### 1. Applied (3)

| Status | Dot |
|---|---|
| `Application submitted` | 🟢 |
| `Awaiting shortlist decision` | 🟠 |
| `Shortlist qualifying` | 🟠 |

### 2. Screened (3)

| Status | Dot |
|---|---|
| `Invited to screen` | 🟢 |
| `Under screening review` | 🟠 |
| `Awaiting screen decision` | 🟠 |

### 3. Submitted to Client (2)

| Status | Dot |
|---|---|
| `Preparing for client` | 🟠 |
| `Pending client review` | 🟠 |

### 4. Interviewing (4)

| Status | Dot |
|---|---|
| `Scheduling interview` | 🟠 |
| `Interview scheduled` | 🟢 |
| `Awaiting interview feedback` | 🟠 |
| `Awaiting round decision` | 🟠 |

### 5. Offered (9)

| Status | Dot |
|---|---|
| `Offered_Candidate to revert` | 🟠 |
| `Rejected` | 🔴 |
| `Offer accepted` | 🟢 |
| `Offer declined` | 🔴 |
| `Documentation started` | 🟢 |
| `Joined` | 🟢 |
| `Invoicable` | 🟢 |
| `Invoice Cleared` | 🟢 |
| `Dropped Out` | 🔴 |

> `Offered_Candidate to revert` is shown verbatim with the underscore and no space — a literal
> label bug, the only status name that leaks an internal identifier format.

### 6. Archive (11 reachable via `Move to`, 12th only via `Reject`)

| Status | Dot | Reachable from `MOVE TO → Archive` | Reachable from `Reject` (R) |
|---|---|---|---|
| `Position filled` | 🔴 | ❌ | ✅ |
| `Rejected by client` | 🔴 | ✅ | ✅ |
| `Underqualified` | 🔴 | ✅ | ✅ |
| `Backed out` | 🔴 | ✅ | ✅ |
| `Not interested` | 🔴 | ✅ | ✅ |
| `Future hire` | ⚪ | ✅ | ✅ |
| `Overqualified` | 🔴 | ✅ | ✅ |
| `On hold` | ⚪ | ✅ | ✅ |
| `Offer declined`* | 🔴 | ✅ | ✅ |
| `Screen reject` | 🔴 | ✅ | ✅ |
| `Rejected in R1 or further rounds` | 🔴 | ✅ | ✅ |
| `Out of budget` | 🔴 | ✅ | ✅ |

`*Offer declined` is the **same status value** already listed under Offered — it is not a
second, distinct status. Archive's `MOVE TO` submenu and the `Reject` shortcut both surface it as
a rejection reason, but the platform's canonical status list (the `Filters → Status` dropdown,
which enumerates every value once) contains it only once.

---

## ⚠️ The 33rd status is a phantom — confirmed by direct enumeration

The header everywhere reads `6 stages · 33 statuses`. I enumerated the canonical status list two
independent ways and both land on **32 unique values**, not 33:

1. **`Filters → Status` dropdown** (`pipe-f0-STATUS.png`, and a live re-scroll/dedupe pass) — the
   single place the product lists every status once, with no stage grouping. Counted: **32**.
2. **Summing every stage's `MOVE TO` submenu** (3+3+2+4+9+11, not double-counting the shared
   `Offer declined`) = **32**.

So `33 statuses` in the header is very likely **off by one** — the same family of bug as the
`1 candidates` grammar miss documented in the Pipeline README. Whether the backend's true enum has
a 33rd value that no UI surface exposes (e.g. a deprecated/hidden status) is unverified; what is
verified is that **no UI path in Pipeline ever shows 33 distinct status strings**.

> UNVERIFIED: whether a 33rd status exists server-side but is filtered out of every client-facing
> list (dropdown, submenu, and Reject menu all agree at 32).

---

## The state machine — what's actually enforced

### Advance (green check, `A`) and Reject (red, `R`)

These two floating buttons in the review drawer are a **different control from the card's status
pill**, and they resolve to different destination scopes — confirmed by directly comparing the
popups each one opens:

| Button / key | Opens | Destination scope |
|---|---|---|
| Status pill (card or drawer header) | Two-level `MOVE TO` — pick any of the 6 stages, then a status inside it | Any stage/status, including sideways or backward moves |
| `Advance` (✓, green) / key `A` | A **flat, single-level** `MOVE TO <NEXT STAGE NAME>` menu — e.g. from `Applied` it opens `MOVE TO SCREENED` listing only `Invited to screen` / `Under screening review` / `Awaiting screen decision` | **Only the immediate next stage** — confirmed by direct screenshot of the `A`-triggered popup |
| `Reject` (⃠, red, labelled `REJECT AS`) / key `R` | A flat list of the 12 Archive-flavored reasons | Always lands the candidate in `Archive`, but the recruiter picks *why* |

**`Advance` genuinely is "move forward one step," not a jump-to-anywhere control.** Its popup title
literally changes to name the next stage (`MOVE TO SCREENED`, `MOVE TO SUBMITTED TO CLIENT`, …) and
lists only that stage's statuses — it never shows the other 5 stages. This is a materially
different (and more constrained) behavior than the status pill's two-level `MOVE TO` menu, which
does expose all 6 stages. Do not conflate the two: **the pill can jump anywhere; `Advance` cannot.**

### The one real constraint: `Offered` has no `Advance` button

The `Advance` (✓) button is **absent** from the floating action rail once a candidate is in
`Offered`. `Reject` remains available. This is the only stage-based gating observed — every other
stage keeps both buttons. Practically: `Offered` is a one-way gate outward (you can still `Reject`
into Archive, or manually reopen via the status pill's own `MOVE TO`, but the fast-path advance
control disappears).

> UNVERIFIED: whether the status **pill** dropdown on an Offered candidate's card (as opposed to
> the drawer's floating buttons) still exposes a full `MOVE TO` menu back to earlier stages — the
> menu control itself was not observed to be disabled, only the drawer's floating ✓ button.

### No required fields gate a transition

Neither a note nor a skill rating is required before `Advance` or `Reject` fires. The note
composer, tags, and skill-feedback sliders are entirely independent controls sitting beside the
mover, not validation gates in front of it.

---

## How a status reads on the card vs. in the drawer

| Surface | Control | Behavior |
|---|---|---|
| Card (grid) | Status pill with a caret, e.g. `● Application submitted ⌄` | Click opens the same two-level `MOVE TO` menu, scoped to that one candidate |
| Drawer header | Same pill, plus a green `Submitted by <name>` badge | Identical menu; the badge is provenance, not a status |
| Table row | `STATUS` column, plain text, no inline dot | Read-only in the grid; edited via row menu (see `04-views-and-table.md`) |

## Nuances & Gotchas

- **32 unique statuses exist; the UI header claims 33 everywhere.** Confirmed by independently
  enumerating the `Filters → Status` dropdown and by summing every stage's `MOVE TO` submenu.
- `Offer declined` is **shared** between the `Offered` stage's own submenu and the `Archive`
  rejection-reason list — it is one status, reachable through two different menus, not two statuses.
- `Position filled` is **archive-only reachable via the `Reject` (R) shortcut** — it is absent from
  the `MOVE TO → Archive` submenu. If a recruiter wants "position filled" as the reason, they must
  use `Reject`, not the plain stage-move menu.
- `Offered_Candidate to revert` renders with a literal underscore and no space — the only status
  string that leaks what looks like an internal enum key.
- Dot colors are a de facto semantic system (green=forward, orange=pending, red=rejection,
  gray=neutral-pause for `Future hire`/`On hold`) but are never explained anywhere in the UI —
  purely inferred from placement.
- `Advance` (button or `A` key) is genuinely linear — it opens a flat menu titled for the *next*
  stage only. The status **pill** is the one control that can jump anywhere across all 6 stages;
  don't confuse the two when describing "how a candidate moves."
- `Offered` is the only stage where the drawer's floating `Advance` (✓) button disappears; `Reject`
  (⃠) is available on every stage including `Offered`.
- `R` and `A` are true keyboard equivalents of the floating buttons — pressing them opens the exact
  same popup (`REJECT AS` / `MOVE TO <next stage>`) as clicking the icon.
- Stages/statuses are platform-fixed constants — confirmed absent from every one of `/setup`'s 7
  sections (Role & comp, Requirements, Job description, Application form, Sourcing brief,
  Visibility & posting, Lifecycle).
- No note or skill rating is required to advance or reject a candidate — the mover controls and
  the feedback controls are fully decoupled.
