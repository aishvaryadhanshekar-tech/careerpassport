# Global App Chrome

Shared across every page in the recruiter app. Rendered as one horizontal bar: brand mark, a
pill-shaped nav group, then notifications + account on the far right.

```
[Career Passport]  ( Jobs  Marketplace  People  Reports  Control )        (🔔17) (DR)
```

## Top nav

| Label | Route | Rendering |
|---|---|---|
| `Career Passport` (brand) | `/` | Serif logo, "Passport" in coral |
| `Jobs` | `/jobs` | Active tab has a solid dark-green pill background + white text; inactive tabs are plain text pills |
| `Marketplace` | `/marketplace` | out of scope — nav entry only |
| `People` | `/people` | out of scope — nav entry only |
| `Reports` | `/reporting` | out of scope — nav entry only (note: label `Reports`, route `/reporting` — mismatch between label and path) |
| `Control` | `/platform` | out of scope — nav entry only (note: label `Control`, route `/platform` — mismatch between label and path) |

All five are `<a>` tags with `href`, i.e. real navigation, not JS-only tab switches.

## Command-K palette

Opened with `⌘K` (the app's own hint: `Press Command-K to open the command palette.`). Renders as
a centered modal with a search input (placeholder `Search actions, jobs, candidates…`, with a
`⌘K` hint pinned inside the input on the right) over a blurred/dimmed background.

### Default (empty query) command list

| Command | Icon |
|---|---|
| `New job` | `+` |
| `Marketplace` | shop icon |
| `People` | people icon |
| `Settings` | gear icon |

Each row shows a `↵` (Enter) affordance on the right, confirming these are Enter-to-execute
commands, not just links.

### Search behaviour

Typing a query (tested: `des`) against the default list returned **`No results.`** — i.e. the
default 4 commands are not fuzzy-searched/filtered themselves by that string, or the palette's
"jobs, candidates" search promise requires a live backend query that didn't resolve for this
input in the captured session.

> UNVERIFIED: whether typing a job title or candidate name returns real search results (the
> placeholder explicitly promises `jobs, candidates` search scope) — only the literal string
> `des` was tested and it returned empty. Needs a follow-up test with a known job/candidate name.

Notably, **`Jobs` itself is not in the default command list** (Marketplace, People, and Settings
are, but not Jobs or Reports/Control) — presumably because the palette treats "you're already in
Jobs" as implicit, or because Jobs is reached by the persistent top nav instead.

## Notifications bell

Badge shows **`17`** (also read by the harness as `Notifications · 17 unread` via `aria-label`).
Clicking opens a dropdown panel, not a full page:

**Header:** `Notifications` `17 NEW` — with `MARK ALL READ` action top-right.
**Section label:** `EARLIER`

### Observed notification types (all carried an `Action needed` pill)

| Entry | Type | Sub-detail |
|---|---|---|
| `Amazon registered and is...` | org/company registration | `Review it in Control Tower to acti...` · `14D AGO` |
| `Parth Test registered and...` | org/company registration | `Review it in Control Tower to acti...` · `16D AGO` |
| `TEST-LT lt-0814a org 0 re...` | org/company registration | `Review it in Control Tower to acti...` · `21D AGO` |
| `Karyarth requested acces...` | access request | `Requested by Ankit` · `UI/UX DESIGNER` · `2D AGO` |
| `Startus alliance private li...` | access request | `Requested by Sakshi Maheshwari` |

Every visible row is truncated with `...` (fixed-width panel) and every one carries the same
`Action needed` pill — i.e. **the `17` badge appears to count only actionable items**, not a mix
of actionable + informational notifications. All rows point at **`Control Tower`** (a `/platform`
surface, out of scope for this audit) as the place to actually resolve them.

> UNVERIFIED: whether a non-"Action needed" notification type exists at all, and whether `MARK ALL
> READ` clears the `17` badge without visiting Control Tower.

## Job switcher

Left-rail button, rendered as:

```
┌───────────────────────────┐
│ 🔽 ACTIVE JOB              │
│    Full-Stack Engineer  ▾ │
│    OPEN · BENGALURU, INDIA │
└───────────────────────────┘
```

Clicking opens a dropdown panel to its right:

```
┌──────────────────────────────┐
│ 🔍 Search jobs...             │
├──────────────────────────────┤
│ ⏱ RECENTLY VIEWED             │
│  Full-Stack Engineer          │
│  OPEN · BENGALURU, INDIA       │  ← highlighted (current job)
├──────────────────────────────┤
│ ⏱ ALL JOBS                    │
│  Draft Job        DRAFT · –   │
│  UI/UX Designer   OPEN · UK   │
│  Draft Job        DRAFT · –   │
│  ...                          │
├──────────────────────────────┤
│ + New job                     │
└──────────────────────────────┘
```

| Element | Detail |
|---|---|
| Search box | Placeholder `Search jobs…`. Typing a non-matching string (tested: `zzz`) shows `No jobs match.` — a clean empty state, with `+ New job` remaining available below it even in the empty state |
| `RECENTLY VIEWED` | Held **exactly 1 entry** in every capture in this audit's evidence — the current/active job itself, highlighted in a rose background. > UNVERIFIED whether it grows to more than one entry after navigating between multiple jobs in one session — not tested live in the fresh pass either; all captures showed just the current job |
| `ALL JOBS` | A scrollable flat list, unfiltered by status, showing every job with an abbreviated status (`DRAFT`, `OPEN`) and a truncated location field (`–` for drafts with no location) |
| `+ New job` | Pinned at the bottom, opens the job-creation wizard — see `01-Job-Creation-Flow.md` |

The switcher button itself shows: kicker `ACTIVE JOB`, the current job's title in bold, and a
second line `<STATUS> · <LOCATION>` in the switcher's own abbreviated vocabulary (`OPEN`, not
`Active` — see status reconciliation in `README.md`).

## Account / avatar menu (`DR`)

Avatar button (`aria-label: Account · Demo Recruiter`), initials `DR` in a rose circle. Opens a
small dropdown:

```
┌───────────────────────────┐
│ Demo Recruiter             │
│ DEMO@CAREERPASSPORT.AI     │
├───────────────────────────┤
│ ⚙ Settings                 │
│ ⏎ Sign out       (coral)   │
└───────────────────────────┘
```

| Row | Detail |
|---|---|
| Name + email (header, non-interactive) | `Demo Recruiter` / `DEMO@CAREERPASSPORT.AI` (rendered upper-case) |
| `Settings` | gear icon, links to `/settings` |
| `Sign out` | coral/destructive-styled text, presumably logs out |

## `/settings`

Confirmed reachable from **three** places in the chrome: the account/avatar menu, the Command-K
palette, and (confirmed live) the **gear icon on the `/jobs` index page header** — all three land
on the same page.

**H1:** `Your` `settings`(italic coral) — kicker `ACCOUNT` — subtitle `Personal details, the
organization this account belongs to, and the clients you hire for.`

Four tabs: `Personal` (default) · `Organization` · `Clients` · `Team`.

The `Personal` tab (only one opened in this audit) shows:

| Field | Type | Value observed |
|---|---|---|
| `FULL NAME` | text | `Demo Recruiter` |
| `EMAIL` | text, disabled | `demo@careerpassport.ai`, with helper text `Sign-in email is managed by your account provider.` |
| `PHONE` | text | placeholder `+91 98765 43210` (empty) |
| `ROLE` | text, disabled | placeholder `Admin` |

A small badge under the avatar reads `ADMIN · RECRUITER` — i.e. this demo account carries two
role labels at once. Footer actions: `Save changes` (solid dark-green) and `Discard` (plain
text).

> UNVERIFIED: contents of the `Organization`, `Clients`, and `Team` tabs — not opened in this
> audit; out of scope beyond confirming the settings page's existence and its `Personal` tab.

## Nuances & Gotchas

- **Nav labels and routes don't match**: `Reports` → `/reporting`, `Control` → `/platform`. Don't
  assume the URL slug from the label when linking or testing.
- **`Settings` is reachable from three confirmed places**: the account/avatar menu, the Command-K
  palette, and the gear icon on the `/jobs` list header — all three land on the identical
  `/settings` page (`Personal` tab by default).
- **The Command-K default list omits `Jobs` and `Reports`/`Control`** — only `New job`,
  `Marketplace`, `People`, `Settings` show with an empty query. Don't assume every top-nav
  destination has a matching palette command.
- **Every visible notification in this audit's evidence carried an `Action needed` pill** and
  routed to Control Tower — treat the `17` badge as an actionable-items count, not an
  all-notifications count, until a counterexample is found.
- **The job switcher's `RECENTLY VIEWED` section held only the current job in every capture** —
  don't assume it's a multi-item MRU list without further live testing across a multi-job
  session.
- **The switcher and the jobs list use different status vocabularies for the same state**
  (`OPEN` vs `Active`) — see the full reconciliation table in `README.md`.
- **The switcher's empty search state still offers `+ New job`** — search-with-no-results never
  dead-ends the user; creation is always one click away from that panel.
