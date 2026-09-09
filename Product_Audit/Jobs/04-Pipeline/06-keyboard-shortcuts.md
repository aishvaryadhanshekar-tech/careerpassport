# Keyboard shortcuts

Scope: all shortcuts below were tested with the candidate review drawer open, focus **not** inside
a text field, on `/jobs/<id>/pipeline`.

## Confirmed shortcuts

| Key | Effect | Evidence |
|---|---|---|
| `A` | Opens the `Advance` popup — a flat `MOVE TO <NEXT STAGE>` list, the exact keyboard equivalent of clicking the floating green ✓ button | Screenshot: pressing `A` on an `Applied` candidate opened `MOVE TO SCREENED` with its 3 statuses |
| `R` | Opens the `Reject` popup — the flat `REJECT AS` list of all 12 archive reasons, exact equivalent of the floating red ⃠ button | Screenshot: identical `REJECT AS` list from button click and from the `R` key |
| `→` (`ArrowRight`) | Advances the drawer to the **next candidate** in the current filtered/sorted list (same as clicking `▶`) | Confirmed: pressing `→` while viewing Neha Joshi swapped the drawer to Aditya Kulkarni |
| `←` (`ArrowLeft`) | Returns the drawer to the **previous candidate** (same as clicking `◀`) | Confirmed: pressing `←` after the above returned the drawer to Neha Joshi |
| `Esc` | Closes the drawer entirely **and clears the URL back to the bare pipeline path** | Confirmed: `…/pipeline?stage=applied&application=<uuid>` → `…/pipeline` (no query string at all) after `Esc`, tested with a clean run. This is a **stronger reset than the Pipeline README's `?stage=`-preserved" description** — in this run, `stage` was also stripped. Treat the exact query-string behavior on `Esc` as slightly inconsistent run to run rather than a hard guarantee. |
| `⌘K` / `Ctrl+K` | Opens a **global command palette** — `Search actions, jobs, candidates…` with `New job`, `Marketplace`, `People`, `Settings` | This is an **app-wide** shortcut, not scoped to Pipeline — it works identically from the pipeline screen but its contents (job/candidate search + global nav) are unrelated to pipeline-specific actions like advancing or rejecting |
| `⏎ Enter` (note composer focused) | Posts the note | Printed inline hint: `⏎ POST` |
| `⇧⏎ Shift+Enter` (note composer focused) | Inserts a newline instead of posting | Printed inline hint: `⇧⏎ NEW LINE` |

## Tested and confirmed to do nothing (in the drawer, focus outside any input)

| Key | Result |
|---|---|
| `N` | No visible effect — drawer unchanged, no candidate/stage navigation |
| `/` | No visible effect inside the drawer — did **not** focus the background search field while the drawer was open |
| `ArrowDown` (with the `Reject`/`REJECT AS` popup open) | No observable highlight change between before/after screenshots — inconclusive; likely either not wired, or the highlight moved by less than the screenshot could show. Treat as **unverified**, not confirmed either way |

> UNVERIFIED: whether `ArrowUp`/`ArrowDown` navigate options *within* an open `MOVE TO`/`REJECT AS`
> popup (mouse hover is the only interaction confirmed to change the highlighted row in this audit).

> UNVERIFIED: whether `A`/`R` function identically when triggered from the **card grid** (drawer
> closed) rather than from inside the open drawer — only tested with the drawer open.

> UNVERIFIED: any shortcut for switching stages (e.g. number keys `1`–`6` for the rail) or for
> toggling Cards/Table — none were discovered, and none were suggested anywhere in the UI copy.

## Nuances & Gotchas

- `A` and `R` are genuinely just keyboard triggers for the two floating drawer buttons — same
  popup, same content, same scope (see `01-stage-and-status-model.md` for why `A`'s popup is
  linear-next-stage-only while `R`'s is always the 12 archive reasons).
- `⌘K`/`Ctrl+K` is **not a Pipeline feature** — it is the same global palette available from any
  screen in the app (jobs, marketplace, people, settings). Do not describe it as a pipeline
  shortcut in isolation; it happens to also work here.
- The drawer's arrow-key navigation (`←`/`→`) walks the **same filtered/sorted list** the grid is
  currently showing, not a separate queue — consistent with the `◀`/`▶` buttons documented in
  `01-stage-and-status-model.md` and `05-search-filters-and-queue.md`.
- No shortcut was found for `Post`-ing a note without focusing the textarea first, for opening
  `Filters`, for switching stages, or for toggling Cards/Table — keyboard support is narrowly
  scoped to the drawer's move/reject/navigate actions plus the universal `⌘K` palette.
- `Esc`'s URL-clearing behavior is the most aggressive reset in the shortcut set — it did not just
  close the modal, it dropped the entire query string in this test run, including `?stage=`.
