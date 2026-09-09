# Search, filters, and queue order

## Search

- Single input above the grid/table: `Search applicants by name, skill, answer, or tag…`.
- Live-filters as you type; no submit button, no debounce delay observed.
- **Searches across all stages simultaneously.** The stage heading (`Applied`, `Screened`, …) is
  replaced by a match count while search is active.
- Result header: `<n> MATCH` / `<n> MATCHES` (singular/plural handled correctly here, unlike the
  `1 candidates` stage-count grammar bug).
- Zero-result state: `0 MATCHES` heading, body `NO MATCHES` / `No applicants matched this search.`
- Clearing the search (✕ in the field) restores the normal stage-scoped view.
- The `Filters` button is **hidden** while a search is active — search and the filter modal are
  mutually exclusive entry points into narrowing the list, not composable in the UI at the same time.

| Search term tried | Result |
|---|---|
| `Aditya` | `1 MATCH` — found a candidate in a different stage than the one the rail had highlighted |
| `Insuffic` | matched the confidence badge text, confirming search indexes more than just the name field |
| `react` | matched a skill chip |
| `zzzznomatch` | `0 MATCHES` / `NO MATCHES` / `No applicants matched this search.` |

> UNVERIFIED: the precise field weighting behind "name, skill, answer, or tag" — not exercised
> field-by-field beyond the four examples above.

---

## Filters modal — `Filter the pipeline`

Opened by the `Filters` button (Cards view) or `Filters` (Table view, same modal). Header eyebrow
`REFINE`, title `Filter the pipeline`.

```
STATUS            OWNER              CONFIDENCE BAND
[Any status ⌄]    [Any owner ⌄]      [Any confidence band ⌄]

TRIP STATUS       SOURCE             LOCATION
[Any trip status ⌄] [Any source ⌄]  [Any location ⌄]
─────────────────────────────────────────────────────────
CONDITIONS                                            CLEAR
WHERE [field ⌄] [operator ⌄] [value ⌄]           ✕  ⠿
[+ Add filter]
─────────────────────────────────────────────────────────
<n> FILTERS SELECTED                        [Reset] [Done]
```

### The 6 fixed filter fields

| Field | Options observed | Notes |
|---|---|---|
| `STATUS` | All 32 statuses, flat, in the same stage-grouped order as the `MOVE TO` menus, plus a `(Select All)` row | Multi-select checklist with its own `Find status…` search box |
| `OWNER` | `Demo Recruiter` (only one, single-seat demo tenant) | `Find owner…` search box |
| `CONFIDENCE BAND` | `Strong`, `Moderate`, `Emerging`, `Weak`, `Insufficient` — listed high-to-low | Single search-filterable list |
| `TRIP STATUS` | `Not sent`, `Invited`, `In progress`, `Completed` | Exactly 4 values |
| `SOURCE` | `(Select All)`, `Referral`, `LinkedIn`, `Naukri`, `Applied`, `Vendor`, … (list continues, scrollable) | Multi-select with `(Select All)` |
| `LOCATION` | `Indore, India`, `Pune, India` (only 2, scoped to this job's actual candidate pool) | Location list is data-driven from real candidate locations, not a fixed geography list |

Every one of the 6 dropdowns opens as its own popover with a `Find <field>…` search box — none of
them are plain native `<select>` elements.

### `CONFIDENCE BAND` is a fixed 5-tier scale

`Strong → Moderate → Emerging → Weak → Insufficient`. This resolves the `Insufficient` badge seen
throughout the review drawer and cards (`02-candidate-review-drawer.md`) as the **bottom rung of a
5-level confidence scale**, not a one-off label.

### Conditions — the free-form builder

Below the 6 fixed filters, a `CONDITIONS` section lets you add arbitrary `WHERE <field> <operator>
<value>` rows:

- `+ Add filter` appends a row: `WHERE [Verified ⌄] [Is ⌄] [Unverified ⌄]`.
- Each row has a drag handle (⠿) for reordering and an `✕` to remove it.
- A `CLEAR` link sits at the section's top-right once at least one condition exists.
- Empty-state copy: `No conditions added` / `Use the filters above, or add a condition for
  something they don't cover.`
- Footer counter `<n> FILTERS SELECTED` counts **both** the 6 fixed dropdowns and any conditions
  together into one number.
- One condition observed: field `Verified`, operator `Is`, value `Unverified` — confirming
  `Verified`/`Unverified` (the same badge shown in the table's `VERIFIED` column) is itself a
  filterable condition field, distinct from the 6 built-in dropdowns above it.

> UNVERIFIED: the full list of condition fields and operators beyond `Verified` / `Is` — the
> dropdown for other fields/operators was not exhaustively expanded.

### Modal footer

- `Reset` clears every fixed filter and every condition in one click.
- `Done` applies and closes — there is no live-apply-while-open behavior implied by the modal
  needing an explicit `Done`.

---

## Queue order

- The `MOVE TO` / status-pill mechanics aside, the **grid/table order within a stage** follows
  whatever the active sort is (see `04-views-and-table.md` for the `APPLIED DATE ↓` sort control) —
  there is no separate "priority queue" ordering concept distinct from the visible sort.
- The drawer's `◀ Previous` / `▶ Next` buttons walk the **currently filtered/searched list**, in
  the same order as the grid — confirmed by the disabled state showing up at the first/last visible
  card, not the first/last card system-wide.
- Previous/Next **do not wrap** and **do not cross stages** — see `01-stage-and-status-model.md`
  and the Pipeline README for the full nuance.

## Nuances & Gotchas

- Search and `Filters` are mutually exclusive UI entry points — the `Filters` button disappears
  the moment you type into search, rather than the two composing.
- The `STATUS` filter dropdown is the **single most reliable place to enumerate every status in
  the product** — it lists all 32 unique values flat, once each, unlike any per-stage `MOVE TO` menu.
- `CONFIDENCE BAND` is a fixed 5-tier scale (`Strong` down to `Insufficient`) — every "Insufficient"
  badge seen elsewhere in the drawer is the lowest rung of this same scale, not a special state.
- `LOCATION` filter options are derived from actual candidate data (only 2 cities appeared for this
  job), not a static country/city list — expect this dropdown's contents to vary job to job.
- `SOURCE` includes a plain `Applied` value alongside sourcing channels like `Referral`, `LinkedIn`,
  `Naukri`, `Vendor` — meaning "the candidate applied directly" is tracked as a **source**, not
  just a stage name (do not confuse `SOURCE: Applied` with the `Applied` **stage**).
- The `CONDITIONS` builder's footer count is combined with the 6 fixed filters into one
  `<n> FILTERS SELECTED` number — you cannot tell from the footer alone whether the count came from
  a fixed dropdown or a custom condition.
- Every filter dropdown (including the 6 "fixed" ones) is a custom searchable popover, not a native
  `<select>` — each has its own `Find <field>…` box.
