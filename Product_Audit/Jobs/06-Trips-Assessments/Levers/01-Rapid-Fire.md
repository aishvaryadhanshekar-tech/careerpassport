# Lever › Rapid Fire ⚡

**Card badge:** `⚡ RAPID FIRE` · **Observed time cap:** `SECONDS 120`

**Editor description (verbatim):**
> `Candidate sees a fast stream of statements and makes a binary call. Reviewer labels are edited inline and stay hidden from candidates.`

## Fields

| Field | Control | Notes |
|---|---|---|
| card title | inline-editable text (pencil icon) | `Rapid Fire` by default |
| `SECONDS` | number, in card header | `120` observed |
| `✎ INTRO LINE` | textarea | Observed: `Serious or joking? Tap fast.` — this is what frames the binary for the candidate |
| `STATEMENTS` | repeating rows | 8 observed. Helper: `Card-level time is set in the header. Individual statements do not carry separate timers.` |
| `+ Add statement` | button | always available — statement count is not capped in the UI |

### Per-statement row

| Element | Control |
|---|---|
| index | auto number `01`…`08` |
| statement text | textarea |
| reviewer label | badge toggle — **`SERIOUS`** (green) or **`JOKING`** (coral) |
| delete | trash icon |

## The binary

Exactly two answer values, **fixed by the lever type**:

- **`SERIOUS`** — rendered green
- **`JOKING`** — rendered coral/red

There is **no `+ Add option` control on a Rapid Fire card.** The pair is structural.

The badges in the editor are the **reviewer's key**, hidden from the candidate. The candidate sees the
statement plus the framing from `INTRO LINE` and taps one of the two.

### Observed statements (draft trip, interaction-design role)

| # | Statement | Key |
|---|---|---|
| 01 | Skip user research on inventory management; engineering says the simplified flow is technically easier, so ship that instead. | `JOKING` |
| 02 | Build the guided onboarding flow as a separate prototype to show post-launch support cost savings against the 2-week investment upfront. | `SERIOUS` |
| 03 | When engineering pushes back on interaction complexity, add more micro-interactions and animations to show them the design is worth the effort. | `JOKING` |
| 04 | Use the user research quotes directly in your design rationale deck to frame clarity as risk mitigation, not scope creep. | `SERIOUS` |
| 05 | Test both flows with 3–5 real creators in a live prototype session before the final prioritization call. | `SERIOUS` |
| 06 | If product wants minimal features to hit the timeline, propose a phased launch: ship the simplified flow now, add guided onboarding in week 2 post-launch. | `SERIOUS` |
| 07 | Document the wireframes in Figma but avoid high-fidelity mockups until all stakeholders agree on the interaction model. | `JOKING` |
| 08 | Present the 40% creator friction reduction metric alongside estimated post-launch support tickets to quantify the business case for the 2-week investment. | `SERIOUS` |

Note the mix is deliberately unbalanced (5 `SERIOUS`, 3 `JOKING`) — there is no enforced ratio.

## Nuances & Gotchas

- **Exactly 2 answer options, fixed by the type.** No `+ Add option` exists. This is the constraint
  people mean when they say "Rapid Fire only supports two options".
- **The statement count is *not* limited to 2.** 8 statements observed; `+ Add statement` always available.
  Conflating these two facts is the most common misreading of this lever.
- The `SERIOUS`/`JOKING` badges are the **answer key**, not candidate-facing choices. They are
  explicitly `hidden from candidates`.
- Statements carry **no individual timer** — the card-level `SECONDS` covers the whole stream. Stated
  in the UI: `Individual statements do not carry separate timers.`
- The `INTRO LINE` is what tells the candidate what the binary *means*. Change the intro and the two
  labels stop making sense, because the labels themselves are not editable alongside it.
- There is no enforced balance between `SERIOUS` and `JOKING` counts.
- Rapid Fire has **no** voice note, no resources, and no file upload — it is the leanest lever.
