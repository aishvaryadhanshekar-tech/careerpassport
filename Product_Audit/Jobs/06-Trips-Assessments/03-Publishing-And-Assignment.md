# Publishing & Assignment

How a trip goes from draft to in front of a candidate.

## Lifecycle

```
   Generate AI Trip
          │
          ▼
   ┌─────────────┐    "Publish and assign"     ┌───────────────┐
   │    Draft    │ ─────────────────────────►  │   Published   │
   │  editable   │                             │  VIEW ONLY    │
   └─────────────┘                             └───────┬───────┘
          ▲                                            │
          └──────────── ? unverified ──────────         │ invite roster
                                                        ▼
                                              candidate receives emailed link
                                                        │
                                                        ▼
                                                   Responses
```

| Status | Pill | Editing | Assignment |
|---|---|---|---|
| `Draft` | `○ Draft` | full — `ADD STEP` panel present, all cards editable | not possible |
| `Published` | `✓ Published` | **none** — every card shows `VIEW ONLY`, `ADD STEP` gone | Candidate Invite Roster appears |

The draft action button is `✨ Publish and assign` — publishing and assigning are presented as one
step, though the roster is a separate control once published.

> UNVERIFIED: whether Published can revert to Draft.

## Candidate Invite Roster (published trips only)

**Description:**
> `Select who in the target stage gets sent this trip. The link is never shared with the whole stage automatically. Invites are emailed immediately.`

```
┌──────────────────────────────────────────────────────────────────┐
│ Candidate Invite Roster                                          │
│ Select who in the target stage gets sent this trip. …            │
│                                                                  │
│ LINK EXPIRES                                                     │
│ [ Sep 11, 2026 📅 ]  [ 07:30 PM 🕐 ]   [ ➤ Send to Candidates ] │
│ Must be at least 1 hour from now                                 │
│                                                                  │
│ ELIGIBLE IN TARGET STAGE (0)      │  ROSTER (0)                  │
│ No un-selected applications       │  No candidates selected yet. │
│ currently sit in this trip's      │                              │
│ target stage.                     │                              │
│ [ + Add to roster ]               │                              │
└──────────────────────────────────────────────────────────────────┘
```

| Element | Control | Notes |
|---|---|---|
| `LINK EXPIRES` — date | date picker | `Sep 11, 2026` observed |
| `LINK EXPIRES` — time | time picker | `07:30 PM` observed |
| expiry rule | helper | **`Must be at least 1 hour from now`** |
| `Send to Candidates` | button | rendered disabled while `ROSTER (0)` |
| `ELIGIBLE IN TARGET STAGE (n)` | list | candidates in the trip's target stage not yet rostered |
| `ROSTER (n)` | list | the selected send list |
| `+ Add to roster` | button | moves an eligible candidate onto the roster |

### Empty-state copy (verbatim)

- Eligible: `No un-selected applications currently sit in this trip's target stage.`
- Roster: `No candidates selected yet.`

The eligible-list wording is precise: it excludes candidates **already rostered** ("un-selected"),
so the two panels partition the stage rather than duplicating it.

## The candidate link

The trip header exposes a link on a **different host** from the recruiter app:

```
https://app.careerpassport.ai/gt/…        ← candidate-facing
https://hire.careerpassport.ai/…          ← recruiter app
```

Header controls: `Copy` (copies the link) and `Responses` (opens submissions).

## Nuances & Gotchas

- **Publishing freezes the assessment.** There is no edit-after-publish; cards become `VIEW ONLY`.
  Proofread before publishing.
- **A trip is bound to one pipeline stage**, chosen back in the `Trip Builder`. The roster can only
  draw from that stage. If `ELIGIBLE IN TARGET STAGE` reads `(0)`, the usual cause is a stage
  mismatch chosen at generation time, not an empty pipeline.
- **Nothing is ever sent automatically.** The description states the link `is never shared with the
  whole stage automatically` — every recipient is hand-picked onto the roster.
- **Invites are emailed immediately** on `Send to Candidates` — there is no scheduling and no
  preview/confirm step documented.
- `LINK EXPIRES` enforces a **minimum of 1 hour from now**; both a date and a time must be set.
- `Send to Candidates` is disabled while the roster is empty, so the roster must be built first.
- The candidate link is on `app.careerpassport.ai`, a separate host — relevant for allowlisting,
  email deliverability and link-scanner false positives.
- The trips list carries `Delete trip` directly on the row, with no observed intermediate step.
