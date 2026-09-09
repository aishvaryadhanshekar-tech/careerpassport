# Jobs — Module Architecture

> Verified by direct exploration of `hire.careerpassport.ai` on 2026-09-04.
> Anything not directly observed is marked `> UNVERIFIED:`.

## What a "job" is

A job (also called a **role**) is the central record. Everything else in the module hangs off it:
candidates, assessments, outbound messaging, tasks and the audit trail are all scoped to one job.

Workspace observed: **33 jobs**, owner `Demo Recruiter / demo@careerpassport.ai` (role `ADMIN`).

## Route map

Every job section lives under `/jobs/<jobId>/<section>`. `jobId` is a UUID.

| # | Route | Sidebar label | Page H1 | Purpose (product's own words) |
|---|---|---|---|---|
| 1 | `/overview` | `Job overview` | `The brief, in one place` | `Everything not covered elsewhere — context, expectations, fitment notes.` |
| 2 | `/prospects` | `Prospects` | `The private candidate pool` | `Recruiter-sourced candidates for this job. Review, enrich, and move qualified prospects into the pipeline.` |
| 3 | `/pipeline` | `Pipeline` | `One candidate at a time` | `Move with intent — review each candidate, capture a note, and shift them along.` |
| 4 | `/communications` | `Communications` | `How you reach out on this job` | `Templates and calling agents for this job.` |
| 5 | `/trips` | `Trips` | `Assessments` | `Trips generated for this role. Publish one to start assigning it to candidates.` |
| 6 | `/action-on-you` | `Action on you` | `N items waiting on you` | `Pipeline moments, partner access requests, and note-assigned tasks routed to you on this job.` |
| 7 | `/activity` | `Activity` | `Activity log` | `Who did what, and when — on this job.` |
| 8 | `/client` | `Client coordination` | — | **Dark-launched.** Sidebar entry is `aria-disabled` with `title="Client coordination (coming soon)"` tenant-wide, but the route is built and reachable directly. See `08-Client-Coordination/`. |
| 9 | `/team` | `Manage team` | `The people on this job` | `Who is doing what. Add or remove collaborators and rotate roles.` |
| 10 | `/setup` | `Job setup` | `The source of truth` | `Everything captured at intake. Edit here — overview, candidate-facing surfaces, and routing all read from this.` |

Sidebar order is exactly the order above. `Client coordination` sits between `Activity` and `Manage team`.

## Data flow between sections

`/setup` is the origin. Its own subtitle states that **overview, candidate-facing surfaces, and routing
all read from it** — so setup is authored once and the rest of the module renders from it.

```
                    ┌──────────────┐
                    │   /setup     │  source of truth (7 sections)
                    └──────┬───────┘
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
       /overview   candidate-facing   routing
       (the brief)   job posting      (who sees it)

  sourcing ──► /prospects ──promote──► /pipeline ──► outcome
                                          ▲
                                          │ results
                                     /trips (assessments)

  /communications  ──► outbound touchpoints used from /pipeline
  /action-on-you   ──► work queue aggregating moments from the above
  /activity        ──► append-only audit trail of all of the above
  /team            ──► who may do any of it
```

## Global chrome (present on every job page)

| Element | Observed value / behaviour |
|---|---|
| Top nav | `Jobs` → `/jobs`, `Marketplace` → `/marketplace`, `People` → `/people`, `Reports` → `/reporting`, `Control` → `/platform` |
| Command palette | App prints `Press Command-K to open the command palette.` |
| Notifications | Bell with badge `17` |
| Account | Avatar `DR` (initials of `Demo Recruiter`) |
| Job context | On `/setup` the breadcrumb reads `JOB SETUP · FULL-STACK ENGINEER → [Active]`; other sections show a `THIS JOB` / `ACTIVE JOB` kicker |
| Settings | `/settings` exists in the DOM link set |

## Status vocabulary

Confirmed job statuses seen across the list and job headers: **`Active`**, **`Draft`**, plus list-card
renderings `OPEN` and `PUBLISHED`. A `Close` action exists on the `Lifecycle` setup section and produces
a `closed` state, and a `Pause` action is also present.

**Verified transition:** `Active → closed` fires **immediately with no confirmation dialog**, and is
reversible by changing status back. Both moves are recorded in `/activity`.

> UNVERIFIED: whether `OPEN`/`PUBLISHED` are distinct states or alternate renderings of `Active`.

## Routing rule — a job card's destination encodes its status

On `/jobs`, cards deep-link differently by status:

- **Draft** jobs → `/jobs/<id>/setup` (you land in the editor, because intake is incomplete)
- **Active** jobs → `/jobs/<id>/overview` (you land on the brief)

Confirmed across ~35 harvested hrefs.

## Section index

| Folder | Covers |
|---|---|
| `00-Jobs-List-And-Creation/` | `/jobs` index, job creation, global chrome |
| `01-Job-Setup/` | `/setup` — all 7 intake sections |
| `02-Job-Overview/` | `/overview` |
| `03-Prospects/` | `/prospects` |
| `04-Pipeline/` | `/pipeline` |
| `05-Communications/` | `/communications` — templates + calling agents |
| `06-Trips-Assessments/` | `/trips` — trips, cards, levers |
| `07-Action-On-You/` | `/action-on-you` |
| `08-Client-Coordination/` | unresolved sidebar section |
| `09-Activity/` | `/activity` |
| `10-Manage-Team/` | `/team` |

## Nuances & Gotchas

- `/setup` is not "settings" — it is the intake record that every other surface reads from. Editing a job means editing `/setup`.
- A job card's link target tells you its status without reading the badge: `/setup` means draft, `/overview` means active.
- `Close` on a job applies instantly, with **no confirmation step**. It is recoverable, but there is no "are you sure" guard.
- `Client coordination` is **unreleased**: its sidebar entry is disabled tenant-wide (`coming soon`), yet the page exists and works at `/jobs/<id>/client`. A greyed-out nav item here is not proof a feature is unbuilt.
- The `Action on you` page's H1 is dynamic (`4 items waiting on you`), so the section name in the sidebar and the page title never match.
- `/activity` entries are **not expandable** — they name the fields that changed (`changed experience level and 2 more`) but do not show before/after values, so it cannot be used to reconstruct prior state.
