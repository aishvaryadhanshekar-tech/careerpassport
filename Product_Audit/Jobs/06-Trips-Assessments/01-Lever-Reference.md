# Lever (Card) Type Reference — the master constraint table

There are exactly **3 lever types**. The set is closed: the editor's `ADD STEP` panel offers only these three.

## At a glance

| | `Rapid Fire` ⚡ | `Pick & Defend` ⚖ | `Demo` 🎥 |
|---|---|---|---|
| **Candidate task** | Binary call on a stream of statements | Choose one option, then justify it | Record a screen/video demo |
| **Answer format** | **Single select, exactly 2 options** | **Single select, N options** | Media recording + optional file |
| **Option count** | **Fixed at 2 — not configurable** | Variable; 4 observed, `+ Add option` available | n/a |
| **Options authored by** | Nobody — the pair is built into the type | Recruiter (title + description each) | n/a |
| **Repeating sub-items** | `STATEMENTS` (8 observed), `+ Add statement` | `DEFENSE QUESTIONS` (3 observed), `+ Add question` | `TELEPROMPTER BEATS` (3 observed), `+ Add beat` |
| **Observed time cap** | `120` s | `300` s | `180` s |
| **Answer key shape** | Inline `SERIOUS`/`JOKING` label per statement | `STRONGER OPTION` + `WHY IT'S STRONGER` + `TRADEOFF AXIS` | `EXPECTED BEATS` + `RUBRIC ANCHORS` |
| **Voice note support** | ✗ | ✓ `Preview AI voice` / `Record voice note` | ✗ (has teleprompter instead) |
| **Resources attachment** | ✗ | ✓ `+ Add resource` | ✓ via `FILE UPLOAD` |
| **Candidate file upload** | ✗ | ✗ | ✓ optional, 10 file types |

---

## ✅ The Rapid Fire claim — confirmed, with the precise wording

The claim under test:

> "Rapid Fire Lever in Trips only supports Single select and only supports two options."

**Confirmed.** The editor's own description says the candidate
`sees a fast stream of statements and makes a binary call`. The two options are **`SERIOUS`** and
**`JOKING`**, and they are **structural to the lever type** — there is no `+ Add option` control
anywhere on a Rapid Fire card, unlike Pick & Defend which has one.

**But state it carefully, because "two options" is easy to misread:**

| What is fixed at 2 | What is *not* fixed at 2 |
|---|---|
| The **answer choices** per statement: `SERIOUS` / `JOKING` | The **number of statements** — 8 on the reference card, with `+ Add statement` freely available |

So a Rapid Fire card is *"N statements × a fixed binary"*, not *"a card with only 2 items"*.
Saying "Rapid Fire only supports two options" to someone unfamiliar will usually be heard as the
second, wrong thing. Prefer:

> **Rapid Fire is a fixed binary: every statement is answered `SERIOUS` or `JOKING`. The two labels
> cannot be changed or added to. The statement count is variable.**

One further subtlety: the `SERIOUS`/`JOKING` badges shown in the editor are the **reviewer's answer
key**, not the candidate's choices. The editor states:
`Reviewer labels are edited inline and stay hidden from candidates.`

> UNVERIFIED: whether the two label strings can be renamed per card, and whether the statement count
> has an upper bound. No `+ Add option` control exists, and no cap was reached during exploration.

---

## Where this constraint does *not* apply

Do not generalise Rapid Fire's binary to other question surfaces in the product:

| Surface | Answer model | Option limit |
|---|---|---|
| Trips › `Rapid Fire` | single select | **exactly 2, fixed** |
| Trips › `Pick & Defend` | single select | variable — 4 observed, extensible |
| Job setup › Application form › custom questions | `Long answer` or `Multiselect` | variable — **5 observed**, extensible |

The application form and Trips are **separate question engines with separate limits**. See
`../01-Job-Setup/04-Application-Form.md`.

## Nuances & Gotchas

- Rapid Fire's "two options" = the fixed `SERIOUS`/`JOKING` answer pair, **not** a cap on statements.
- Rapid Fire is the only lever with **no author-defined options** — the answer set ships with the type.
- Pick & Defend is also single-select, but with recruiter-authored options and no 2-option cap —
  so "single select" alone does not distinguish the two levers.
- Only `Demo` accepts a candidate **file upload**; only `Pick & Defend` supports a **voice note**.
- Answer-key structure is per-type. Nothing in the product presents a unified rubric across levers.
- All three levers carry a **card-level timer only**. Sub-items never have their own.
