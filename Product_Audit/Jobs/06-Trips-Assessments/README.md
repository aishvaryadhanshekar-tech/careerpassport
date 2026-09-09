# Trips / Assessments — `/jobs/<id>/trips`

**H1:** `Assessments`
**Subtitle:** `Trips generated for this role. Publish one to start assigning it to candidates.`
**Sidebar label:** `Trips`

A **Trip** is a role-specific assessment made of ordered **cards** (also called **levers** or **steps** —
see the vocabulary warning below). Candidates receive a link, work through the cards, and their
responses come back for review.

---

## ⚠️ Vocabulary: one concept, three names

The product uses **three different words for the same object**, depending on which screen you are on:

| Word | Where it appears |
|---|---|
| **card** | Trip editor and viewer — `CARD 01 OF 03`, the `CARDS` rail |
| **step** | The editor's add panel — `ADD STEP` |
| **lever** | The `Generate AI Trip` dialog — `It's given top priority for every lever.` |

They are interchangeable. This documentation uses **lever** when talking about the *type*
(Rapid Fire / Pick & Defend / Demo) and **card** when talking about an *instance inside a trip*,
which matches how the UI is weighted.

---

## Trip anatomy

```
Trip  ("b2b-saas-product-engineering / full-stack-engineer")
│
├── SPINE                       ← trip-level framing, shared by all cards
│   ├── scenario sentence       "You're a full-stack engineer at a Series B fintech platform"
│   ├── DOMAIN                  b2b-saas-product-engineering
│   ├── ROLE                    full-stack-engineer
│   ├── SOURCE                  generated
│   └── persona                 Maya Chen · Product Manager
│
└── CARDS (ordered, 1..n)
    ├── 01  Rapid Fire     ⏱ 120s
    ├── 02  Pick & Defend  ⏱ 300s
    └── 03  Demo           ⏱ 180s
```

The **spine** is the shared fiction: one scenario, one domain, one role, and one named persona
(a stakeholder the candidate is notionally working with). Every card inherits it, which is why
cards reference the persona by name (`Tell Maya you need three sprints…`).

`SOURCE: generated` marks the trip as AI-produced rather than hand-built.

---

## Two modes: builder vs viewer

The same trip renders differently depending on status.

| | Draft | Published |
|---|---|---|
| Kicker | `TRIP EDITOR` | `TRIP VIEWER` |
| H1 | `Assessment builder` | `Assessment view` |
| Status pill | `○ Draft` | `✓ Published` |
| Primary action | `✨ Publish and assign` | — |
| Cards | fully editable | carry a `VIEW ONLY` badge |
| `ADD STEP` panel | present | absent |
| Candidate Invite Roster | absent | present |

**Publishing is a one-way door for content.** Once published, every card shows `VIEW ONLY` and the
`ADD STEP` panel disappears — you can no longer edit the assessment, only assign it.

> UNVERIFIED: whether a published trip can be reverted to draft, or must be regenerated.

---

## Trips list (section landing page)

Columns / counters observed: `TRIP`, a count, `Published`, `Generated`, `Applied`.

A trip row shows: name (`b2b-saas-product-engineering`), sub-line (`full-stack-engineer`),
a `View` link, a date (`7/30/2026`), a card count (`3 CARDS`), and a `Delete trip` button.
The page action is `Generate AI Trip`.

> UNVERIFIED: whether `Published` / `Generated` / `Applied` are trip *statuses* or *candidate counts
> per state*. The header layout is ambiguous and this was not resolved before exploration ended.
> Resolving this is the top open item for this section.

---

## Trip-level header (inside a trip)

```
← Trips    b2b-saas-product-engineering / full-stack-engineer
           [🔗 https://app.careerpassport.ai/gt/…]  [Copy]  [Responses]
```

- The trip has a **public candidate URL** on a different host: `app.careerpassport.ai/gt/…`
  (the recruiter app is `hire.careerpassport.ai`).
- `Copy` copies that link.
- `Responses` opens candidate submissions.

---

## Section contents

| Doc | Covers |
|---|---|
| [01-Lever-Reference.md](./01-Lever-Reference.md) | **The master constraint table for all 3 lever types** |
| [Levers/01-Rapid-Fire.md](./Levers/01-Rapid-Fire.md) | Rapid Fire in full |
| [Levers/02-Pick-And-Defend.md](./Levers/02-Pick-And-Defend.md) | Pick & Defend in full |
| [Levers/03-Demo.md](./Levers/03-Demo.md) | Demo in full |
| [02-Generate-AI-Trip.md](./02-Generate-AI-Trip.md) | The AI generation dialog |
| [03-Publishing-And-Assignment.md](./03-Publishing-And-Assignment.md) | Publishing, invite roster, link expiry |

## Nuances & Gotchas

- **Three names, one thing**: lever = card = step. The `Generate AI Trip` dialog is the only place
  that says "lever"; the editor says "card"; the add panel says "step".
- There are exactly **3 lever types**, and the set is closed — the `ADD STEP` panel offers only
  `Rapid Fire`, `Pick & Defend`, `Demo`.
- **Publishing freezes content.** Draft = editable, Published = `VIEW ONLY`. Assign-only after that.
- Time limits are **per card**, set in the card header (`SECONDS 120`). Sub-items never carry their
  own timers — Rapid Fire states this explicitly: `Individual statements do not carry separate timers.`
- Every lever type has an **answer key that is hidden from candidates**, but its *shape differs by
  type* (inline labels / stronger-option / rubric anchors). There is no single unified rubric model.
- The candidate-facing link lives on `app.careerpassport.ai/gt/…`, a different host from the
  recruiter app.
- The trip name is a compound of `domain / role`, not a free-text title.
- The `Delete trip` button sits directly on the trips list row, adjacent to `View`.
