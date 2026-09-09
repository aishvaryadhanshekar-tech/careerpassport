# Note composer, tags, and skill feedback

All three live together on the drawer's right pane, `Feedback` tab (the default tab). This is the
one panel that is **identical regardless of which stage/status the candidate is in** — it does not
change shape between `Applied` and `Offered`.

```
ADD A NOTE
Type a note or record one — it posts to the Notes tab.
┌──────────────────────────────────────────────────────┐
│ Leave a note… type @ to assign a task                 │
└──────────────────────────────────────────────────────┘
 🎙 Voice   ⏱ Schedule ⌄        ⏎ POST · ⇧⏎ NEW LINE   [ Post ]

TAGS                                              0 SELECTED
Tap to select the tags that apply.
[Strong communicator] [Culture add] [Fast ramp] [High ownership]
[Needs coaching] [Client ready] [React] [TypeScript] [Node.js]
[Next.js] [PostgreSQL] [+ Add tag]

SKILL FEEDBACK                                        0 / 5 RATED
Tap to rate what you saw in this candidate.
3+ years shipping production web applic…      1 2 3 4 5
strong TypeScript fundamentals                1 2 3 4 5
comfortable designing relational schema…      1 2 3 4 5
experience with Next.js or a comparable …     1 2 3 4 5
good eye for UI detail and willingness to …   1 2 3 4 5
```

---

## 1. Note composer

| Element | Behavior |
|---|---|
| Placeholder | `Leave a note… type @ to assign a task` |
| Autogrow | The textarea **grows with content** rather than scrolling internally — confirmed by pasting a long block of text and watching the box expand to ~9 visible lines |
| `@` mention | Typing `@` alone immediately opens a people-picker popover, e.g. `Demo Recruiter` tagged `JOB OWNER` |
| Keyboard hint | `⏎ POST · ⇧⏎ NEW LINE` printed inline next to the button — `Enter` submits, `Shift+Enter` inserts a newline |
| `Post` button | Green, disabled-looking until text exists (not confirmed disabled state, but visually recedes when empty) |
| `Voice` | Opens the platform mic-record affordance; if mic permission was previously blocked, fires a toast: `Microphone access was blocked. Allow it and try again.` |
| `Schedule` | Dropdown with exactly 2 options: `Schedule a follow-up`, `Schedule a meeting` |

> UNVERIFIED: what the `@`-mention popover offers beyond the job owner (e.g. other recruiters on
> the job's team) — only one suggestion (`Demo Recruiter`) was observed, likely because this is a
> single-seat demo tenant.

> UNVERIFIED: the exact scheduling flow after picking `Schedule a follow-up` / `Schedule a
> meeting` — not opened further to avoid triggering a real schedule action.

### The note composer is duplicated, not shared, between tabs

The `Notes` tab (right-pane, third tab) repeats the **exact same composer** at the bottom of its
own layout, below three read-only summary blocks (`RECRUITER NOTES`, `SKILL FEEDBACK GIVEN`,
`NOTES LEFT`). It is not a single shared component visually pinned across tabs — switching to
`Notes` shows a second, independent instance of the same input.

---

## 2. Tags

- Header format: `TAGS` with a live counter, `<n> SELECTED`.
- 11 tags observed on the reference job, rendered as toggle pills in a flat wrapping list —
  **no grouping** between soft-skill tags (`Strong communicator`, `Culture add`, `Fast ramp`,
  `High ownership`, `Needs coaching`, `Client ready`) and tech tags (`React`, `TypeScript`,
  `Node.js`, `Next.js`, `PostgreSQL`).
- `+ Add tag` turns into an inline text input (`New tag…`) with a green ✓ confirm button — new
  tags are authored inline, not through a separate modal.
- Tags are per-application state, not per-job: `0 SELECTED` on every observed candidate.
- The tech-tag set (`React`, `TypeScript`, `Node.js`, `Next.js`, `PostgreSQL`) mirrors the job's
  required-skill chips shown on the card (`REACT` `TYPESCRIPT` etc.) — tags appear to be seeded
  from the job's skill list plus a fixed set of soft-skill labels, not free-standing per-candidate
  vocabulary.

> UNVERIFIED: whether the tag list is job-specific (seeded from that job's requirements) or a
> tenant-wide fixed list — only one job was available to compare.

---

## 3. Skill feedback

- Header format: `SKILL FEEDBACK` with `<rated> / <total> RATED`.
- Exactly **5 criteria** on the reference job, one row per criterion, each with a `1 2 3 4 5`
  rating control (plain numbered buttons, not stars).
- The 5 criteria read as truncated prose lifted directly from the job's Requirements section
  (`3+ years shipping production web applic…`, `strong TypeScript fundamentals`, …) — this is the
  same rubric surfaced (empty) on the drawer's `Evaluation` tab as `Objective`/`Subjective` groups.
- `0 / 5 RATED` on every observed candidate — never exercised during this audit (guardrail: rating
  is harmless to try, but no criterion was clicked to avoid mutating shared-tenant data).

> UNVERIFIED: whether clicking a number is a single-select per row (pick one score, 1–5) or
> supports changing your mind after selection; not exercised.

---

## Nuances & Gotchas

- The note composer **autogrows vertically**; it does not become an internally-scrolling box, so a
  very long note pushes `TAGS` and `SKILL FEEDBACK` further down the pane rather than clipping.
- Typing `@` alone is enough to trigger the mention popover — no need to type a name first.
- `Schedule` is a plain 2-item menu (`Schedule a follow-up` / `Schedule a meeting`), not a calendar
  picker inline — picking either almost certainly opens a further step, not observed.
- Tags and skill-feedback ratings are **fully decoupled from the stage/status mover** — see
  `01-stage-and-status-model.md`: neither is required to `Advance` or `Reject`.
- The `Notes` tab's composer is a second, separately-rendered copy of the `Feedback` tab's
  composer — not a single component that just relocates.
- Skill-feedback criteria count (5) matches the `Evaluation` tab's rubric exactly — both are driven
  by the same job Requirements, just rendered as two different UI patterns (numbered rating rows
  here vs. `Objective`/`Subjective` AI-scored groups there).
- Tags mix two different vocabularies in one flat list — job-derived tech skills and fixed
  soft-skill labels — with no visual separation between them.
