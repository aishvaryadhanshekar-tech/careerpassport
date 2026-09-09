# Jobs → Prospects (`/jobs/<jobId>/prospects`)

**Section label:** `01 / PROSPECTS`
**H1:** `The private candidate pool`
**Subtitle:** `Recruiter-sourced candidates for this job. Review, enrich, and move qualified prospects into the pipeline.`

**Purpose in one sentence:** the per-job, recruiter-private holding area where sourced candidates sit *before* they exist as pipeline candidates — you review them, fill the gaps in their six signals, complete the job's application form on their behalf, and only then can you push them across the `MOVE TO PIPELINE →` boundary.

Verified on job `a6bb5e69-b2e5-4ee2-9280-ba4a830c7c84` ("Full-Stack Engineer", ACTIVE) which has 2 prospects, plus empty/error variants on 12 other job ids.

## Sub-pages

| File | Covers |
|---|---|
| [01-entry-paths.md](./01-entry-paths.md) | Every way a person becomes a prospect on a job; every field of every intake form |
| [02-prospect-detail-drawer.md](./02-prospect-detail-drawer.md) | The 6-tab drawer: all data blocks, resume, comms, outreach log |
| [03-review-enrich-move.md](./03-review-enrich-move.md) | The three verbs in the subtitle, and the promotion boundary in detail |

---

## Layout

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│ Career Passport  [Jobs] Marketplace People Reports Control          🔔17   (DR)       │
├──┬────────────────────────────────────────────────────────────────────────────────────┤
│  │ 01 / PROSPECTS                                                                    │
│L │ The private candidate pool                                                        │
│e │ Recruiter-sourced candidates for this job. Review, enrich, and move qualified      │
│f │ prospects into the pipeline.                                                      │
│t │                                                                                   │
│  │  ┌ My leads ┐  Team leads            <- tab strip (?leads=team)                   │
│r │  ─────────────────────────────────────────────────────────────────────────────    │
│a │  ┌──────────────────────────────────────────┐  ┌ FILTERS ┐  ┌ COLUMNS ┐           │
│i │  │ 🔍 Search by name, skill, company — or   │                                     │
│l │  │    describe who you're looking for…      │                                     │
│  │  └──────────────────────────────────────────┘                                     │
│(1│  ▓▓ 1 selected  [Email] [WhatsApp] [AI call]                              (x) ▓▓  │
│0 │  ┌───────────────────────────────────────────────────────────────────────────┐    │
│i │  │ ◯ CANDIDATE  HEADLINE  SOURCE  EXPERIENCE  STATUS  LOCATION  TOP SKILLS   │    │
│c │  │              ALMAMATER  COMMUNICATION                                     │    │
│o │  ├───────────────────────────────────────────────────────────────────────────┤    │
│n │  │ ◯ (IS) Ishita Sharma      Full-Stack Eng.  Not      5y  ● Application     │    │
│s │  │        CP-MF4DFW3G76 ☎ ✉  — · Noida        submitted    not submitted ... │    │
│) │  └───────────────────────────────────────────────────────────────────────────┘    │
└──┴────────────────────────────────────────────────────────────────────────────────────┘
     clicking a row  ->  full-height right-side drawer (see 02-prospect-detail-drawer.md)
```

The left rail is the 10-item per-job nav: `Job overview`, `Prospects`, `Pipeline`, `Communications`, `Trips`, `Action on you`, `Activity`, `Client coordination`, `Manage team`, `Job setup`. Prospects is the 2nd item.

---

## Lead-scope tabs

| Tab | URL | Extra column | Notes |
|---|---|---|---|
| `My leads` | `/jobs/<id>/prospects` (default) | — | Only prospects **you** own |
| `Team leads` | `/jobs/<id>/prospects?leads=team` | `OWNER` inserted after `SOURCE` | Prospects owned by other job collaborators |

- These are the **only** two views. There is no saved-view switcher on this screen; "views" are approximated by the `QUICK-SAVE` named filter (see below).
- On job `a6bb5e69…`, `My leads` = 2 rows and `Team leads` = 0 rows. The two tabs are **disjoint populations**, not a superset relationship.
- Neither tab shows a count badge. There is no total-count / pagination footer on this screen at all (contrast: global `/people` shows `1–20 OF 50` and `Page 1 of 3`).

---

## The prospect list

### Columns

11 columns exist; 8 are on by default. Order is fixed — there is no column reorder or drag handle.

| # | Column | Category tag | Default | Cell contents (observed) |
|---|---|---|---|---|
| 1 | `Candidate` | `DEMOGRAPHIC` | **On, locked** (toggle greyed out) | Initials avatar + name + public candidate code (`CP-MF4DFW3G76`) + phone icon + email icon |
| 2 | `Headline` | `EXPERIENCE` | On | Title on line 1, `<company> · <location>` on line 2 (`— · Noida, India` when company unknown) |
| 3 | `Source` | `META` | On | Pill. Observed value: `Not submitted` |
| 4 | `Experience` | `EXPERIENCE` | On | `5y`, `4y` |
| 5 | `Status` | `INTENT` | On | Coloured dot + text. Observed: `Application not submitted` |
| 6 | `Compensation` | `MONETARY` | **Off** | not observed populated |
| 7 | `Location` | `DEMOGRAPHIC` | On | `Noida, India` (truncates: `Bengaluru, Ind…`) |
| 8 | `Top skills` | `SKILL` | On | Max 2 skill chips shown |
| 9 | `Intent` | `INTENT` | **Off** | not observed populated |
| 10 | `Almamater` | `ALMAMATER` | On | `JIIT Noida · 2017` |
| 11 | `Communication` | `META` | On | 3 channel icons (AI call / Email / WhatsApp) each with tooltip `<channel>: never used`, plus a footer line `Not contacted` |

`COLUMNS` popover copy: title `Visible columns`, subtitle `PICK WHAT SHOWS IN THE LIST — YOUR VIEW, ONLY.` Each row is a toggle switch plus the category tag from the table above. **The `Candidate` toggle is disabled** — you cannot hide the identity column.

### Sorting

> UNVERIFIED: no sort affordance was found on the prospects table — headers are not buttons and no sort caret renders. (The global `/people` pool *does* have sortable headers with carets; the per-job prospects table does not.)

### Search

| Property | Value |
|---|---|
| Control | Single text input, full width of the toolbar |
| Placeholder | `Search by name, skill, company — or describe who you're looking for…` |
| Behaviour | Filters client-side as you type; no submit button, no debounce indicator |
| Zero-result copy | `No candidates match — try clearing the search or removing filters.` |

The "or describe who you're looking for" half of the placeholder implies natural-language matching. > UNVERIFIED: typing a descriptive phrase (rather than a literal name/skill) was not confirmed to return semantic matches.

### Row interactions

| Target | Effect |
|---|---|
| Anywhere on the row (name, headline, most cells) | Opens the prospect drawer. Does **not** navigate — URL stays `/jobs/<id>/prospects` |
| The leading circle (`role="checkbox"`, aria `Select <name>`) | Selects the row, reveals the bulk bar |
| Phone icon (aria `Phone · <name>`) | contact action — not fired (guardrail) |
| Email icon (aria `Email · <name>`) | contact action — not fired (guardrail) |
| `STATUS` cell (class `outreach-cell`, aria `Outreach for <name>: <status>. Open the log to add an outcome.`) | Opens the standalone **Outreach** modal: `Outreach — <name>` / `Every call, email and WhatsApp attempt logged for this prospect.` |
| The 3 `COMMUNICATION` channel icons | Not interactive as buttons (`cursor-default`); they are status indicators only |

---

## `FILTERS` — the "Refine the pool" modal

Kicker `REFINE`, title `Refine the pool`. Full-screen overlay; **Escape does not close it** — use the `✕`, `Cancel`, or `Apply`.

Nine quick filters in a 3-column grid. Every one is a **custom dropdown** (not a native `<select>`) rendering a `dd-multi-panel` list, so options are multi-selectable.

| Label | Default / empty text | Options (complete) |
|---|---|---|
| `CREATED AT` | `Any time` | `Last upload batch`, `Last 24 hours`, `Last 7 days`, `Last 30 days`, `Last 90 days`, `Custom range` |
| `OWNER` | `Anyone` | `Demo Recruiter` (the job's collaborator list — 1 entry on this job) |
| `SOURCE` | `Any source` | `LinkedIn`, `CSV`, `CV`, `Referral`, `Sign-up` |
| `INTENT` | `Any intent` | `Open`, `Active`, `Passive` |
| `EXPERIENCE` | `Any experience` | `0–2y`, `3–5y`, `6–9y`, `10+y` |
| `SALARY` | `Any range` | `<₹30 L`, `₹30–50 L`, `₹50–75 L`, `₹75–100 L`, `₹100+ L` |
| `LOCATION` | `Anywhere` | `Bangalore`, `Hyderabad`, `Pune`, `Mumbai`, `Delhi NCR`, `Chennai`, `Remote · India`, `Silicon Valley`, `New York`, `London`, `Singapore`, `Remote · Global` |
| `OUTREACH OUTCOME` | `Any outcome` | `Pending review`, `Email sent`, `Reminder email 1`, `Reminder email 2`, `WhatsApp sent`, `WhatsApp 1`, `WhatsApp 2`, `DNP`, `Connected`, `Interested`, `Call back`, `Not interested`, `Rejected` |
| `EMAIL` | toggle, off | Single switch labelled `Has an email address` |

### `QUICK-SAVE`

| Field | Control | Notes |
|---|---|---|
| (unlabelled) | Text input, placeholder `Name this filter` | no maxlength attribute |
| `Save` | Button | **Disabled until the name input has content.** Saves the current filter set as a named filter |

> UNVERIFIED: where saved filters subsequently appear (no saved-filter chips were present on this job — none had been saved).

### `ADVANCED` condition builder

Copy: `Build a condition on any field — including columns you have hidden.` Button `+ Add condition`.

Each condition row is `WHERE  [field ▾]  [operator ▾]  [Value…]` plus a per-row `✕` (aria `Clear this filter`) and a section-level `CLEAR`.

Field dropdown (16 options, complete, in order):
`Candidate`, `Headline`, `Company`, `Location`, `Source`, `Experience (years)`, `Application status`, `Outreach outcome`, `Compensation (₹ lakhs)`, `Top skills`, `Intent`, `Almamater`, `Email`, `Phone`, `Outreach emails`, `Created at`

- Defaults are field=`Candidate`, operator=`Contains`, value empty.
- The field list includes `Company`, `Email`, `Phone` and `Outreach emails` which have **no column** in the table at all — hence the "including columns you have hidden" copy.
- > UNVERIFIED: the full operator list (the `Contains` dropdown did not open in the automated pass). `Contains` is the confirmed default.

### Modal footer

| Element | Behaviour |
|---|---|
| `0 FILTERS SELECTED` | Live count of active filters, bottom-left |
| `Reset` | Clears all filters (stays in modal) |
| `Cancel` | Discards changes, closes |
| `Apply` | Primary, always enabled — applying with 0 filters is allowed |

---

## Bulk selection & bulk actions

Selecting one or more rows swaps the toolbar area for a dark bulk bar:

```
▓ 1 selected   [ ✉ Email ]  [ 💬 WhatsApp ]  [ ☎ AI call ]                        (✕) ▓
```

| Action | Class | Notes |
|---|---|---|
| `Email` | `bulk-action bulk-primary` | Primary (red). Outbound — not fired |
| `WhatsApp` | `bulk-action` | Outbound — not fired |
| `AI call` | `bulk-action` | Outbound, consumes AI calling — not fired |
| `✕` | `bulk-close`, aria `Clear selection` | Deselects all |

- **There is no bulk promote, bulk tag, bulk assign-owner, bulk export or bulk delete on this screen.** The only bulk verbs are the three outbound channels. (The global `/people` pool has a different bulk bar: `Add to Pipeline`, `Hotlist`, `Export`, `Remove`.)
- Header select-all aria label states its own scope exactly: **`Select all visible, excluding rejected and not interested`** — so select-all silently skips prospects whose outreach outcome is `Rejected — not a fit` or `Not interested — declined`.
- Counter copy is `N selected`.

---

## States and literal copy

| State | Literal copy | When |
|---|---|---|
| Zero rows after filter/search | `No candidates match — try clearing the search or removing filters.` | Toolbar + column headers still render |
| Load failure / no access | `COULD NOT LOAD PROSPECTS` + `Could not load candidates. Please refresh.` | Toolbar and column headers are **absent**; only the tab strip renders. Seen on 8 of 14 job ids probed |
| Loading | > UNVERIFIED: no skeleton or spinner copy was captured | |
| Prospect with an uploaded CV but no submitted application | Red banner across the top of the drawer: `Resume uploaded — application not submitted.` `This candidate used autofill but hasn't completed the form yet.` | |
| Drawer footer, always | `IN PRIVATE POOL · ONLY VISIBLE TO YOU` | |

---

## Counts and badges — what each number covers

| Badge | Counts |
|---|---|
| `N selected` in bulk bar | Currently checked rows in the **active lead tab only** |
| `0 FILTERS SELECTED` | Quick filters + advanced conditions with a non-default value |
| Drawer `CANDIDATE PROPERTY 6` | The number of **signal cards** rendered (Demographic, Experience, Skill, Intent, Monetary, Almamater) — it is *not* a completeness score. It reads `6` even when Monetary is entirely `—` |
| Drawer `OUTREACH 0` | Logged outreach outcomes for this prospect on this job |
| Drawer `RESUME 0` | Attached resume files — **but it renders `0` until you open the RESUME tab, then flips to `1`.** The badge is lazily hydrated and is not trustworthy before the tab is visited |
| Drawer `APPLICATION FORM · 8 QUESTIONS` | Questions on this job's application form |
| Drawer header `1/2` | Position within the currently filtered prospect list, used by the ←/→ arrows |
| `🔔 17` top-right | Global unread notifications, not prospect-related |

---

## Cross-links out of this screen

| To | Via |
|---|---|
| `/people` (global pool) | Where prospects originate. Top nav `People`. Its H1 is *also* `The private candidate pool` |
| `/jobs/<id>/pipeline` | `MOVE TO PIPELINE →` in the drawer's `APPLICATION` tab |
| `/jobs/<id>/communications` | Templates and calling agents that the Email / WhatsApp / AI call actions draw from |
| `mailto:` | The envelope in the drawer header is a plain `<a href="mailto:…">`, aria `Email <name>` — it leaves the app entirely |
| `/marketplace` | Job-level sourcing surface; not wired directly into this list |

## Nuances & Gotchas

- There is **no "Add prospect" button on this screen at all.** Every entry path starts in `/people` or an upload flow; prospects are pushed *into* a job, never created from inside it.
- The header select-all checkbox is scoped: aria `Select all visible, excluding rejected and not interested`. Two statuses are silently excluded from select-all.
- Bulk actions are only the three outbound channels (`Email`, `WhatsApp`, `AI call`). No bulk promote, no bulk delete, no bulk export from the job prospects list.
- `Candidate` is the one column you cannot hide — its toggle is disabled in the `COLUMNS` popover.
- Escape does **not** close the `FILTERS` modal (it does close the drawer and the dropdown popovers). Use `✕` / `Cancel`.
- `QUICK-SAVE`'s `Save` button is disabled until you type a filter name.
- The advanced builder can filter on `Company`, `Email`, `Phone`, `Outreach emails` — fields with no column in the table.
- `RESUME` badge lies until you click the tab: shows `0`, then `1` after the tab loads.
- `My leads` and `Team leads` are disjoint owner-scoped sets, not nested; `Team leads` adds an `OWNER` column.
- No pagination, no total count, no sort on the prospects table — the global `/people` pool has all three.
- `COULD NOT LOAD PROSPECTS` / `Could not load candidates. Please refresh.` is the same copy shown whether the job is inaccessible or the request failed; the toolbar disappears entirely in that state.
- The prospects list and the pipeline list for the same job are disjoint: job `a6bb5e69…` has prospects Ishita Sharma + Rohan Verma and pipeline candidates Neha Joshi + Aditya Kulkarni.
