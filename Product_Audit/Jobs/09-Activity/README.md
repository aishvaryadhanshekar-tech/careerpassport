# Activity log — `/jobs/<id>/activity`

**H1:** `Activity log`
**Subtitle:** `Who did what, and when — on this job.`
**Breadcrumb kicker:** `THIS JOB`

A reverse-chronological (default) event feed scoped to one job. Reached from the job's left rail
(clock/history icon) as the `Activity` item. The same feed exists **organisation-wide** at a separate,
un-scoped URL (breadcrumb kicker `ORGANISATION`, subtitle `Who did what, and when — across every job in
your organisation.`) — reachable from the same rail icon when no job is selected, or from a global nav
entry. The per-job page is a filtered view of the org-wide log, pre-locked to one job.

## Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│ THIS JOB                                                                  │
│ Activity log                                                              │
│ Who did what, and when — on this job.                                    │
│                                                                            │
│ [Last 30 days ▾]                                            3 EVENTS  [⇅ Newest first] │
│ All  •Candidates  •Jobs                                                  │
│ ────────────────────────────────────────────────────────────────────────│
│ TODAY                                                          3 EVENTS  │
│  DR  Demo Recruiter changed status on Full-Stack Engineer      7:47 PM  │
│      • JOBS                                                              │
│  DR  Demo Recruiter closed Full-Stack Engineer                 7:46 PM  │
│      • JOBS                                                              │
│  DR  Demo Recruiter changed experience level and 2 more on     7:46 PM  │
│      Full-Stack Engineer  • JOBS                                         │
│                                                                            │
│                        END OF THE RANGE                                  │
└──────────────────────────────────────────────────────────────────────────┘
```

The org-wide version adds an actor chip (`★ All` / `DR Demo Recruiter`) to the left of the date-range
control and two more category tabs (`Clients`, `Team`, `Settings`) beyond `Candidates`/`Jobs`. The
per-job page's tab row is a subset: only `All` / `Candidates` / `Jobs` — there is no actor chip on the
per-job page in the observed state (only one recruiter exists in this tenant, so the distinction may be
moot rather than absent by design).

## Controls

| Control | Location | Values / behaviour |
|---|---|---|
| Date-range dropdown | top-left | `Last 24 hours`, `Last 7 days`, `Last 30 days`, `Custom range` |
| Custom range | appears when `Custom range` selected | two date fields (`Sep 3, 2026` / `Sep 4, 2026`) each opening its own month calendar popover; no time-of-day picker, only whole days |
| Sort toggle | top-right | pill button that swaps label + icon: `↓ Newest first` ⇄ `↑ Oldest first`. No separate menu — one click flips it. |
| Category tabs | below the controls row | `All` (default, selected pill filled dark), `• Candidates`, `• Jobs` — each non-`All` tab is prefixed with a small coloured dot. Org-wide adds `• Clients`, `• Team`, `• Settings`. |
| Actor filter | org-wide page only, left of the date control | `★ All` / `DR Demo Recruiter` chips; selecting an actor outlines the chip in coral |
| Event count badge | top-right, left of the sort toggle | `N EVENTS` — reflects the current filter + range combination, updates live |

Empty states carry the exact range spoken back to the user, e.g.:
`No activity between Sep 3, 7:28 PM and Sep 4, 7:28 PM. Widen the range to look further back.`
— headline above it is italic serif `Nothing yet` for an empty range, or `Nothing in this filter` when
the range has events but the selected category tab excludes all of them (confirmed: filtering this job's
3 events down to `Candidates` returns `Nothing in this filter` because none of the 3 are candidate-tagged).

## Grouping, pagination, end marker

- Entries are grouped under date headers: `TODAY`, `FRI, AUG 28`, etc. Each date header carries its own
  `N EVENT(S)` count, independent of the page-level badge.
- A left-hand vertical connecting line joins entries within the same day, avatar-to-avatar (visual
  timeline thread).
- The list terminates with a centred, small-caps `END OF THE RANGE` marker once the selected range has
  been fully rendered. No infinite scroll or `Load more` was observed within a 3–5 event range; behaviour
  under large volumes is unverified.

> UNVERIFIED: pagination/virtualization behaviour once event count is large (tens or hundreds of
> events). Only 3–5 events were ever available to observe in this tenant.

## Anatomy of one entry

```
 DR  Demo Recruiter changed experience level and 2 more on Full-Stack Engineer   7:46 PM
     • JOBS
```

| Part | Notes |
|---|---|
| Avatar | initials in a circle (`DR`), coloured — same avatar used in top-nav |
| Actor name | bold, always a human name in the observed data (`Demo Recruiter`) |
| Sentence | actor + verb phrase + target entity name (bold) — see taxonomy below |
| Category tag | small dot + small-caps label (`JOBS`, presumably `CANDIDATES` elsewhere) directly under the sentence |
| Timestamp | right-aligned, `h:mm AM/PM` — no date shown per-row (the date header above already carries it) |

> UNVERIFIED: whether entries are clickable through to the referenced entity (e.g. clicking
> `Full-Stack Engineer` in the sentence navigating to that job, or clicking a candidate-category row
> navigating to the candidate). No hover/pointer affordance was observed on the entry text during this
> pass — treat as **not clickable** pending a direct click test.

## The event taxonomy (all types observed)

Only `JOBS`-category events were observed in this tenant (no candidate/client/team/settings events
existed within any reachable range). Five distinct sentence templates were confirmed:

| # | Sentence template | Trigger observed | Category |
|---|---|---|---|
| 1 | `<Actor> changed status on <Job title>` | Recruiter re-opened the job from Closed back to Active via `Lifecycle` status control | `JOBS` |
| 2 | `<Actor> closed <Job title>` | Recruiter clicked `Close job` in Setup › Lifecycle | `JOBS` |
| 3 | `<Actor> changed <field> and N more on <Job title>` | A multi-field save in Setup (e.g. `Role & comp`) where 3 fields changed in one `Save section` — names the first changed field, folds the rest into `and 2 more` | `JOBS` |
| 4 | `<Actor> changed <field> and N more on <Job title>` (variant, N=6) | A larger multi-field save (`changed job title and 6 more on UI/UX Designer`) — same template, different N and first-field | `JOBS` |
| 5 | `<Actor> launched <Job title>` | The job transitioned from Draft to Active for the first time (first-ever publish) | `JOBS` |

**The "and N more" pattern:** one save that touches multiple fields in a single section collapses to
one activity entry naming only the *first* changed field, plus a count of the rest. The log never lists
which other fields were part of that same save — see limitation below.

> UNVERIFIED: the complete taxonomy. Candidate-category events (e.g. "moved to stage", "added a note",
> "sent a message") were never produced in this tenant during the observed window — inferred to exist
> from the `Candidates` tab's presence, but no literal sentence was captured. Likewise `Clients`, `Team`,
> and `Settings` category events (org-wide tabs) were never observed. Do not invent their wording.

## Confirmed limitation — no before/after values

**Activity entries do not expose old/new field values.** Every multi-field entry (templates 3 and 4
above) names only *which* fields changed (first one, by name, then a count) — never the previous value,
the new value, or even the complete list of changed field names beyond the first. There is no expand
affordance, no tooltip, and no click-through observed that reveals a diff. Clicking directly on an entry
was not confirmed to navigate anywhere (see above), and even if it did, the destination would be the
*current* record, not a point-in-time snapshot.

**Practical consequence:** the activity log cannot be used to reconstruct any prior state of a job. It
can only prove *that* something changed, *who* changed it, *roughly what category of field* was first
touched, and *when* — never the value it changed from or to. Anyone auditing "what did Role & comp look
like last Tuesday" has no tool here; they would need an external export/snapshot process, which this
product does not appear to expose.

## Nuances & Gotchas

- **No before/after values anywhere.** Confirmed exhaustively across every entry produced in this
  tenant — see above. This is the single most important limitation of the whole screen.
- **The accidental `Close job` click is itself just another log line.** A prior exploration pass
  clicked `Close job` (which the setup lifecycle button applies instantly, no confirmation) and it
  surfaced here as `Demo Recruiter closed Full-Stack Engineer`; the subsequent status change back to
  Active is a *separate* `changed status on` entry, not a reversal or deletion of the `closed` entry.
  **The log is append-only — nothing is ever edited or removed once written**, including logging your
  own mistakes.
- **`and N more` hides the other fields' identities, not just their values.** You get the name of the
  first field changed and a bare count — you cannot even learn the names of the rest without going to
  Setup and comparing current values against memory/exports.
- The per-job page's category tabs (`All`/`Candidates`/`Jobs`) are a strict subset of the org-wide
  page's tabs (adds `Clients`/`Team`/`Settings`) — the per-job page cannot surface client/team/settings
  events even though those categories exist at the org level.
- The date-range control speaks the exact boundary back in the empty state (`No activity between X and
  Y`), down to the minute — useful for confirming exactly what window was queried, since the dropdown
  label alone (`Last 30 days`) doesn't show absolute dates.
- Sort is a single toggle button, not a dropdown — `Newest first` and `Oldest first` are the only two
  states, flipped by one click, and the icon direction flips with it.
- Event count badge (`N EVENTS`) and the per-day header count are computed independently and should
  reconcile (badge = sum of all visible day headers) — a mismatch would indicate a rendering bug.
- `Custom range` restricts to whole calendar days (no time-of-day inputs on the two date fields) even
  though the underlying data is timestamped to the minute.
