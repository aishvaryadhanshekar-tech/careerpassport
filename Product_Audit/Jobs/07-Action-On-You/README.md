# Action on you — `/jobs/<id>/action-on-you`

**Eyebrow:** `ACTION ON YOU`
**H1 (dynamic):** `{N} items waiting on you` — N is computed, not a static label (see §4).
**Subtitle:** `Pipeline moments, partner access requests, and note-assigned tasks routed to you on this job.`
**Default URL:** carries `?tab=needs_outreach` (the `Outreach` tab, i.e. "Needs initial outreach").

This is a per-job **inbox/queue** page, not a report. It aggregates three unrelated source systems
into one feed: pipeline-stage moments, partner (sub-vendor) access requests, and note-assigned
tasks/meetings. It renders differently depending on:

1. **The `On you` / `By me` toggle** (top right) — this is not a simple filter flip. It swaps the
   entire page: H1, subtitle, and even the *set of tabs available* change (§3).
2. **Whether this job has agency/sub-vendor activity** — a 7th tab, `Sub-vendors`, and a
   `PARTNER INTEREST REQUESTS` banner only appear on jobs that have at least one partner
   relationship in play (§2, §4).

---

## 1. Layout — ASCII sketch (`On you`, with partner requests present)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Career Passport   Jobs  Marketplace  People  Reports  Control   🔔17  DR │
├──┬───────────────────────────────────────────────────────────────────────┤
│  │ ACTION ON YOU                                                         │
│  │ 3 items waiting on you                                                │
│  │ Pipeline moments, partner access requests, and note-assigned          │
│  │ tasks routed to you on this job.                                      │
│  │                                                                        │
│  │ 🏛 PARTNER INTEREST REQUESTS  3        ← only when partners pending   │
│  │ ┌────────────────────────────────────────────────────────────────┐   │
│  │ │ [KA] Karyarth                                Decline   Approve │   │
│  │ │      Requested sub-vendor access · 2d ago                      │   │
│  │ │      INDUSTRY: consulting                                      │   │
│  │ │      ✉ ankit.dw@karyarth.com  🌐 www.karyarth.com  📍 Lucknow   │   │
│  │ │      ── Ankit · ankit.dw@karyarth.com   REQUESTED BY           │   │
│  │ └────────────────────────────────────────────────────────────────┘   │
│  │ … one card per pending requester …                                    │
│  │                                                                        │
│  │ [Outreach 2][Follow-up 0][Feedback 0][Client 2][Assigned 0]           │
│  │ [Meetings 0][Sub-vendors 0]                       [On you] [By me]    │
│  │                                                                        │
│  │ Needs initial outreach                                    2 items    │
│  │ ┌───────────────────┐ ┌───────────────────┐                          │
│  │ │ Full-Stack Engineer│ │ Full-Stack Engineer│  ← candidate cards       │
│  │ │ 5Y  ✉ 📞           │ │ 4Y  ✉ 📞           │                          │
│  │ │ SUBMITTED BY ...   │ │ SUBMITTED BY ...   │                          │
│  │ │ REACT TYPESCRIPT   │ │ REACT TYPESCRIPT   │                          │
│  │ │ ● Sourced  ISHITA  │ │ ● Sourced  ROHAN   │                          │
│  │ └───────────────────┘ └───────────────────┘                          │
│  │ Refresh                                                               │
└──┴───────────────────────────────────────────────────────────────────────┘
```

`Refresh` is a plain text link under the item grid on every tab — manual re-fetch, no visible spinner
captured.

---

## 2. The `PARTNER INTEREST REQUESTS` banner (partner access requests, defined)

**Partner access requests** = sub-vendor / agency partners asking to be granted access to this job so
they can source or refer candidates against it. This is the literal "partner access requests" clause
in the subtitle.

- Header: `🏛 PARTNER INTEREST REQUESTS` with a count badge (observed `1` and `3` across two jobs).
- Renders **above the tab bar**, full width, one card per pending organization — **not inside any tab**.
- Card anatomy: avatar-initials chip, org name, `Requested sub-vendor access · {age}` timestamp,
  `Decline` (outline) / `Approve` (solid red) buttons top-right; body shows `INDUSTRY`, `ABOUT` (when
  the org filled a profile), contact links (✉ email, 🌐 site, 📍 city), and a `REQUESTED BY` line
  naming the individual + their email.
- Observed requester profiles vary a lot in completeness — some cards are 3 lines (name + email only,
  e.g. `Startus alliance private limited`), others are 8+ lines with a full `ABOUT` blurb and address
  (e.g. `Alvineient consultant pvt ltd`). The card only renders fields the partner actually supplied.
- This banner is the **feeder** for the `Sub-vendors` tab: `Approve` here is what would populate
  `Sub-vendors with access` (see §5). Guardrails prohibited actually clicking Approve/Decline.

> UNVERIFIED: exact wording of any confirmation dialog behind `Approve` / `Decline`; whether declining
> a request removes the card immediately or moves it to a "declined" state; whether a partner can
> re-request after decline.

---

## 3. The `On you` / `By me` toggle — a page swap, not a filter

Clicking `By me` does **not** just re-filter the current tab. It replaces:

| | `On you` (default) | `By me` |
|---|---|---|
| **H1** | `{N} items waiting on you` | `{N} tasks you handed over` |
| **Subtitle** | `Pipeline moments, partner access requests, and note-assigned tasks routed to you on this job.` | `Tasks and meetings you assigned to someone else on this job.` |
| **Tabs shown** | `Outreach`, `Follow-up`, `Feedback`, `Client`, `Assigned`, `Meetings` (+ `Sub-vendors` conditionally) | **Only** `Assigned`, `Meetings` |
| **`PARTNER INTEREST REQUESTS` banner** | Shown when pending | Not observed in `By me` |

So `By me` is scoped to *only* the delegation-shaped tabs (things you handed to someone else); the
outreach/follow-up/feedback/client tabs — which are about pipeline moments assigned *to* you by the
system — have no "by me" equivalent and disappear entirely rather than showing empty.

Screenshots taken by scripting a click on e.g. `Outreach` while in `By me` mode landed on the same
`Assigned` panel (the tab doesn't exist, so the click silently no-ops onto whatever's already active).

> UNVERIFIED: whether a job with active delegated meetings/tasks shows non-zero counts on `By me` —
> both sampled jobs showed `0` on every `By me` tab. Row anatomy for a populated `By me` state was not
> observed.

---

## 4. Every legal `?tab=` value

**Confirmed live** by scripting a click on each tab and reading `location.href` back from the
browser (not inferred):

| Tab label | `?tab=` value (confirmed) | Section header | Empty-state copy |
|---|---|---|---|
| `Outreach` | `needs_outreach` — the **default** landing tab | `Needs initial outreach` | *"Nothing here."* / `Nobody on this job is waiting on a first message.` |
| `Follow-up` | `follow_up` | `Due for follow-up` | `No follow-ups are due on this job right now.` |
| `Feedback` | `review_feedback` | `Review HM feedback` | `No hiring-manager feedback is waiting on your review.` |
| `Client` | `client_pending` | `Client awaiting your response` | (not empty in sample — see §6) |
| `Assigned` | `assigned_task` | `Assigned to you` (On you) / same header under `By me`, "tasks you handed over" framing | `No note-assigned tasks are open on this job.` |
| `Meetings` | `meeting` | `Upcoming meetings` | `No meetings are scheduled on this job.` |
| `Sub-vendors` | `sub_vendors` — confirmed on jobs `5595d0b1…` and `9b2e60c2…` | `Sub-vendors with access` | `No sub-vendors yet.` / `Partners you approve for this job appear here, and you can take their access back from the same place.` |

None of these follow a single naming pattern (`needs_outreach`, `review_feedback`, `client_pending`,
`assigned_task`, `meeting` — singular — and `follow_up` are all shaped differently), so don't try to
guess one from another; treat this table as the exhaustive list.

### The conditional 7th tab — `Sub-vendors`

**Confirmed conditional.** It does **not** appear on every job:

- **Job `a6bb5e69…` (default `JOB_ID`)** — 6 tabs only: `Outreach, Follow-up, Feedback, Client,
  Assigned, Meetings`. No `Sub-vendors` tab, no `PARTNER INTEREST REQUESTS` banner.
- **Jobs `…5595d0b1` and `…9b2e60c2`** — 7 tabs, `Sub-vendors` appended last, **and** a
  `PARTNER INTEREST REQUESTS` banner is present above the tab bar.

The pattern: `Sub-vendors` (and the partner-requests banner) appear together, and only on jobs that
have at least one partner/agency relationship (pending request or approved access) in play. A job
with zero partner engagement never shows the tab at all — it isn't a `0`-count tab, it's absent from
the DOM.

> UNVERIFIED: the precise trigger — "job has ≥1 pending request OR ≥1 approved sub-vendor" is the most
> likely rule given the evidence, but it wasn't isolated by testing a job with an *approved* sub-vendor
> and zero pending requests.

---

## 5. Per-tab row anatomy

### Candidate-moment tabs (`Outreach`, `Follow-up`, `Feedback`, `Client`)

All four render the same **candidate card** shape in a responsive grid (2-up in the 1600px capture):

```
┌───────────────────────────────┐
│ Full-Stack Engineer      ✉  📞│   ← role title + quick actions (email, call)
│ 5Y                             │   ← years-of-experience chip, red
│ 🧑 SUBMITTED BY DEMO RECRUITER │   ← provenance pill
│ [REACT] [TYPESCRIPT]           │   ← skill tags
│ ─────────────────────────────  │
│ ● Sourced      ISHITA SHARMA   │   ← stage-status dot + label, candidate name
└───────────────────────────────┘
```

- **Per-row quick actions:** ✉ (email) and 📞 (call) icons in the card header — icon-only, no visible
  label; not exercised beyond hover (guardrails).
- **Clicking the card body** opens the **candidate detail modal** (same drawer used from Pipeline): a
  two-pane dialog — left pane header (name, email, `Submitted by …` pill, `Update CV`, ✉/📞), tabs
  `Résumé | Application form | Trip | Evaluation | Communications`; right pane tabs
  `Feedback | Timeline | Notes`; `‹ ›` circular prev/next-candidate arrows outside the modal; `✕` close
  top-right. This is a **read/queue** surface, not a dismiss action — closing it does not remove the
  item from the tab.
- The stage-status label at the card foot differs per tab and mirrors the candidate's actual pipeline
  stage (`Sourced`, `Submitted to Client`, etc.) — i.e. **the tab a candidate appears under is derived
  from their current pipeline stage/status**, not a separately-set flag.
- No inline dismiss/snooze/reassign control was found on the card itself. The only way to make a card
  leave a tab, based on the stage-status label shown, is to **advance the candidate's pipeline stage**
  (e.g. moving a `Sourced` candidate out of "needs outreach" once they're actually contacted). This
  matches the subtitle's framing — these are "pipeline moments," not standalone tasks.

### `Assigned` and `Meetings` (note-assigned tasks)

**Note-assigned tasks** = a task or meeting that was created from a **note** and assigned to a specific
person, tracked separately from pipeline moments and partner requests. Both tabs were empty in every
sample (`0 items`); no row anatomy was observed. Empty-state copy differs by mode:

- `On you` → "Assigned to you" / "No note-assigned tasks are open on this job." and "Upcoming
  meetings" / "No meetings are scheduled on this job."
- `By me` → same section headers, but the page-level framing is "tasks you handed over."

> UNVERIFIED: row anatomy, per-row actions (very likely includes a way to mark done, snooze, or
> reassign, given the "handed over" framing implies a reassignment already happened once), for a
> populated `Assigned`/`Meetings` tab.

### `Sub-vendors` (partner access, approved side)

- Section header `Sub-vendors with access`, right-aligned `{N} partners` counter.
- Empty state: *"No sub-vendors yet."* / `Partners you approve for this job appear here, and you can
  take their access back from the same place.` — confirms that **revoking access happens from this
  same tab**, once occupied.

> UNVERIFIED: populated row anatomy and the revoke control's exact label/confirmation copy — no job
> in the sample had an approved sub-vendor yet.

---

## 6. Header count — how it's computed, and why it does NOT reconcile with the tab sum

**Formula (derived from two jobs' data):**

> `header count = Σ(candidate/task tab counts)  +  (count of pending PARTNER INTEREST REQUESTS)`

Evidence:

| Job | Tab sum (`Outreach+Follow-up+Feedback+Client+Assigned+Meetings[+Sub-vendors]`) | Pending partner requests | Header says |
|---|---|---|---|
| `a6bb5e69…` (no partner banner) | `2+0+0+2+0+0 = 4` | 0 (no banner) | `4 items waiting on you` |
| `…9b2e60c2` | `0+0+0+0+0+0+0 = 0` | 1 | `1 item waiting on you` |
| `…5595d0b1` | `0+0+0+0+0+0+0 = 0` | 3 | `3 items waiting on you` |

**The reconciliation failure:** the visible **tab bar** never includes the partner-requests count in
any of its own badges — no tab is labelled "Partner requests {n}." The tabs sum to the candidate/task
total only. So **"does the header equal the sum of the tab badges?" is only true on a job with zero
pending partner requests.** Any job with a live `PARTNER INTEREST REQUESTS` banner will show a header
number strictly larger than what a reader adding up the visible tab badges would compute — by exactly
the number of pending partner cards, which are rendered nowhere as a number next to a tab.

Put differently: **the page has two independent counters — a candidate/task counter (sum of six/seven
tab badges) and a partner-request counter (the banner badge) — and only the H1 adds them together.**
A user scanning just the tab row will under-count by the partner-request total whenever any are pending.

---

## 7. Sources, precisely defined

| Subtitle term | Definition | Where it surfaces |
|---|---|---|
| **Pipeline moments** | A candidate currently sitting in a pipeline stage/status that maps to one of `Outreach / Follow-up / Feedback / Client`. The tab a card lands in is derived live from the candidate's stage-status, not a manually-set flag. | `Outreach`, `Follow-up`, `Feedback`, `Client` tabs |
| **Partner access requests** | An external recruiter/agency ("sub-vendor") organization requesting to be granted access to source against this specific job. Carries requester identity, org profile fields, and an Approve/Decline action. | `PARTNER INTEREST REQUESTS` banner (pending) → `Sub-vendors` tab (approved) |
| **Note-assigned tasks** | A task or meeting that originated from a note and was assigned to a specific person on the job team; tracked with its own "handed over" framing when viewed from the assigner's side. | `Assigned`, `Meetings` tabs |

---

## Nuances & Gotchas

- The default URL always opens on `?tab=needs_outreach` (`Outreach`), never on whichever tab has the
  most items — a job with 0 outreach items and 5 client items still lands you on an empty `Outreach`
  panel first.
- `By me` is not a filter — it is a **different page**: different H1, different subtitle, and only
  2 of the 6–7 tabs survive the switch (`Assigned`, `Meetings`). Scripting a click on a tab that
  doesn't exist under `By me` silently no-ops rather than erroring.
- The `Sub-vendors` tab and the `PARTNER INTEREST REQUESTS` banner are a matched pair — both appear
  together, gated by whether the job has any partner/agency engagement, never independently.
- **The header count does not reconcile with the sum of the tab badges** whenever partner requests are
  pending — the banner's count is folded into the H1 but has no corresponding tab badge of its own.
- All four candidate-moment tabs (`Outreach/Follow-up/Feedback/Client`) render the *same* card
  component; only the section header, empty-state copy, and the stage-status pill at the card foot
  differ. There is one card component driving four distinct queues.
- Clicking a candidate card opens the full Pipeline-style review drawer (Résumé/Application
  form/Trip/Evaluation/Communications + Feedback/Timeline/Notes) — it is a **read surface with
  prev/next navigation**, not a per-item dismiss/snooze action. No dismiss/snooze/reassign control
  was found anywhere on this page for candidate-moment items.
- `Assigned` and `Meetings` were empty on every job sampled — their row anatomy, and the actual
  reassign/snooze mechanics implied by "tasks you handed over," remain unverified.
