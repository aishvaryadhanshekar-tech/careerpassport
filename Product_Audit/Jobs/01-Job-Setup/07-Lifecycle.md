# Setup › Lifecycle

**Subtitle:** `Status, deadlines, and headcount tracking. Status drives the badge everywhere else.`

This section owns job status for the entire module.

| Label | Control | Observed value |
|---|---|---|
| `STATUS` | select | `active` |
| `TARGET CLOSE DATE` | date (`dd/mm/yyyy`) | *(empty)* |
| `HEADCOUNT FILLED` | text/number | *(empty)* |
| `CLOSED AT` | date (`dd/mm/yyyy`) | *(empty)* |

> UNVERIFIED: the full `STATUS` option list. Only `active` was captured in the control. Values seen
> elsewhere in the product: `Active`, `Draft`, `OPEN`, `PUBLISHED`, and a `closed` state produced by
> the `Close job` button.

## Actions

Two buttons sit **above** the `Save section` divider — they are immediate actions, not form edits:

| Button | Style | Behaviour |
|---|---|---|
| `Pause job` | plain text button | — |
| `Close job` | solid coral (destructive-styled) | sets the job to closed |

**Both apply immediately with no confirmation dialog.** This was verified accidentally during
exploration: a single click on `Close job` transitioned the live job from `active` to closed with no
intervening prompt, and the change appeared in `/activity` as `closed Full-Stack Engineer`.

The transition is **reversible** — setting `STATUS` back to `active` restores the job, and produces a
second `/activity` entry reading `changed status on <job>`.

## Nuances & Gotchas

- **`Pause job` and `Close job` fire instantly, with no confirmation step.** There is no undo affordance
  in the UI; recovery is by manually re-selecting the previous `STATUS`. Treat both buttons as live.
- The `STATUS` select renders lowercase (`active`) while every badge elsewhere renders title-case
  (`Active`) — same value, two presentations.
- `STATUS` is the canonical source: the section's own subtitle says it `drives the badge everywhere
  else`. There is no way to change status from the jobs list or the job header.
- There are **two routes to the same state change**: the `STATUS` dropdown (a form edit, requiring
  `Save section`) and the `Close job` button (immediate, no save). The button bypasses the save model
  that governs the rest of setup.
- `CLOSED AT` is a manual date field, not auto-stamped by `Close job` — closing the reference job left
  `CLOSED AT` empty.
- `HEADCOUNT FILLED` is free-form and unrelated to `OPEN POSITIONS` in `Role & comp`; nothing
  reconciles the two.
- This section counts as **complete** with three of its four fields empty.
