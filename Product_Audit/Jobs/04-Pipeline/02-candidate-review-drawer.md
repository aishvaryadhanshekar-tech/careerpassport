# Candidate review drawer

The drawer is a **full-screen two-pane modal**, opened by clicking any card (or via
`?application=<uuid>`). It is the literal "one candidate at a time" surface the section is named
for.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ NJ  Neha Joshi                              ✉ 📞  [⇧ Update CV]      ✕  │
│     neha.joshi@example.com                                                │
│ (● Application submitted ⌄)   (⚑ Submitted by Demo Recruiter)             │
│ ┌Résumé│Application form│Trip│Evaluation│Communications┐ │┌Feedback│Timeline│Notes┐
│ │                                                        │ │                       │
│ │            (tab content — left pane)                   │ │  (tab content — right)│
│ │                                                        │ │                       │
└─┴────────────────────────────────────────────────────────┴─┴───────────────────────┘
  ◀ prev              ⃠ reject (R)                              advance (A) ✓   ▶ next
```

- Left pane header: avatar-initials chip, name, email, an inline **status pill** (opens the same
  `MOVE TO` menu as the card), a `Submitted by <name>` provenance badge, `✉` and `📞` icons that
  open the same phone/email popovers as the card, and `⇧ Update CV`.
- A confidence badge (`Insufficient`, and elsewhere `Unverified`/`Verified` in the table's
  `VERIFIED` column) appears next to the name when present.
- Right pane header: three tabs — `Feedback` / `Timeline` / `Notes` — plus the drawer's own `✕`
  close control.
- Four floating circular buttons hug the modal's outer edges, independent of both panes:
  `◀ Previous candidate`, `⃠ Reject` (red, key `R`), `✓ Advance` (green, key `A`), `▶ Next candidate`.

---

## Left pane — 5 tabs

| Tab | Icon | Content when populated | Empty-state copy |
|---|---|---|---|
| `Résumé` | 📄 | PDF filename + `Open CV ↗`; the file body renders inline | `Resume with id '<uuid>' was not found` (raw backend error, monospace) — every demo candidate hit this |
| `Application form` | 📋 | Rendered Q&A from the job's application form | `No form answers recorded.` |
| `Trip` | 📍 | Trip result/score if the candidate was sent one | `No trip assigned` / `This candidate has not been sent a trip.` |
| `Evaluation` | 📄 | AI rubric scoring — see below | `Evaluating candidate…` / `Scoring against the job's rubric. This can take a moment.` while running |
| `Communications` | ⤴ | 3 sub-tabs: `Email`, `WhatsApp`, `AI calling` | per-channel empty states below |

### Evaluation tab, when loaded

```
Candidate summary
Riya is an experienced full-stack engineer with 8 years in SaaS… (free-text AI summary)

[Insufficient · 0–0%]  0 of 0 assessed         Evaluated 5m ago         [Re-evaluate]

Objective        [Insufficient · 0–0%]   0 of 0 assessed
  No criteria in this group.

Subjective        [Insufficient · 0–0%]   0 of 0 assessed
  No criteria in this group.
```

- The rubric is split into exactly two groups: `Objective` and `Subjective`.
- Every score badge is `<Band> · <low>–<high>%` plus a raw `x of y assessed` count.
- `Insufficient` is one confidence band observed; the badge format implies others exist at
  different `%` ranges.
- `Re-evaluate` re-runs the AI scoring on demand — **not clicked** (guardrail: avoid triggering
  AI runs).
- > UNVERIFIED: the full list of confidence bands beyond `Insufficient`, and what `Objective` vs
  `Subjective` criteria look like when a job actually has rubric criteria populated (every observed
  candidate showed `0 of 0 assessed` in both groups, i.e. this job's rubric was effectively empty
  despite skill-feedback criteria existing on the right pane).

### Communications tab — 3 channel sub-tabs

| Sub-tab | Icon | Count badge | Empty copy |
|---|---|---|---|
| `Email` | ✉ | `0` | `No emails with <Name> yet.` |
| `WhatsApp` | 💬 | — | (opens a message composer; see popover below) |
| `AI calling` | 📞 | — | `No calling agent is provisioned for this job yet.` + `Create an agent` |

The count badge next to `Email` (`Email 0`) is the only channel with a visible counter inline on
the tab itself.

---

## Right pane — 3 tabs

| Tab | Header | Content |
|---|---|---|
| `Feedback` (default) | `ADD A NOTE` | Note composer + `TAGS` + `SKILL FEEDBACK` — see `03-note-composer-and-feedback.md` |
| `Timeline` | `Action timeline`, legend `● CANDIDATE  ● YOUR TEAM` | Chronological event cards, e.g. `Demo Recruiter — 30 JUL 2026 — Added as prospect` |
| `Notes` | `RECRUITER NOTES` | Three read-only summary blocks — `SKILL FEEDBACK GIVEN`, `NOTES LEFT` — plus the same note composer repeated at the bottom |

`Notes` tab empty copy: `No skill feedback logged yet.` and `No notes yet — leave the first one
below.` Every demo candidate showed both empty, confirming notes/feedback are per-application, not
seeded.

`Timeline` legend uses two colored dots (candidate vs. your team) to distinguish who performed an
action; every demo candidate's timeline opens with the same `Added as prospect` event by
`Demo Recruiter`, confirming every application here originated as a promoted prospect.

---

## Card-level and drawer-level communication icons (✉ 📞 🎙)

Both the card and the drawer header expose three quick-action icons. Clicking each opens a small
**popover**, not a full modal, scoped to that one candidate:

| Icon | Popover title | Content | Notes |
|---|---|---|---|
| ✉ (card only, card-grid) | `Outreach to 1 candidate` | Full bulk-outreach UI (channel tabs `Email`/`WhatsApp`/`AI calling`, `PICK A TEMPLATE`, live `PREVIEW`, footer `Will run for 1 of 1` and `Run · send 1`) scoped to a single candidate | This is the **same modal used for bulk outreach** on multiple selected rows — the single-candidate case is not a separate simpler compose window |
| ✉ (drawer header) | `EMAIL` | Just the address + `COPY` | Lightweight — different from the card's ✉ |
| 📞 (card and drawer) | `PHONE` | Number (e.g. `+91 90000 22104`) + `COPY` | Same lightweight popover both places |
| 💬 WhatsApp reply icon (card) | `Message <Name>` | `WhatsApp requires an approved template until the candidate replies.` — empty thread + `No approved message fits this stage yet.` + `Cancel` / `Send template` | WhatsApp is template-gated even for a 1:1 reply |
| 🎙 (card, next to status pill) | — | `Microphone access was blocked. Allow it and try again.` toast fired when clicked without mic permission | Same voice-note affordance as the note composer's `Voice` button, but triggered from the card directly |

**The card's ✉ icon is not a simple "email this person" button** — it opens the full bulk-outreach
composer (template picker + live preview + `Run` button) pre-scoped to one candidate. This is the
single most surprising control on the card.

---

## Nuances & Gotchas

- Every demo candidate's `Résumé` tab failed with the same raw backend string
  `Resume with id '<uuid>' was not found` — résumé rendering appears broken for every seeded
  applicant, not just an edge case.
- The card's ✉ icon and the drawer header's ✉ icon are **different components**: the card opens
  the full bulk-outreach modal (template + preview + `Run`); the drawer header opens a tiny
  address-and-copy popover. Same icon, two different affordances depending on where you click it.
- WhatsApp is **template-gated in both directions** — bulk and single-candidate flows both show
  `WhatsApp requires an approved template until the candidate replies`, and this job had none
  approved (`No approved message fits this stage yet.`).
- `AI calling` is **unprovisioned by default** — every candidate showed
  `No calling agent is provisioned for this job yet.` with a `Create an agent` CTA, meaning AI
  calling is an opt-in per-job setup step, not a standing capability.
- The `Evaluation` tab always splits into exactly two fixed groups, `Objective` and `Subjective` —
  even when both are empty (`0 of 0 assessed`), the two-group structure still renders.
- `Timeline` always opens with `Added as prospect`, confirming every pipeline candidate in this
  tenant is prospect-sourced, not a raw inbound-only funnel.
- The floating `◀ ▶ ⃠ ✓` buttons belong to the *drawer frame*, not either pane — they stay fixed
  regardless of which left/right tab is active.
