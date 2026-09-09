# Generate AI Trip — the `Trip Builder` dialog

Entry point: the `Generate AI Trip` button on `/jobs/<id>/trips`.

**Dialog title:** `Trip Builder`
**Subtitle:** `Configure the levers, difficulty, and scenario for this trip. Once published, its link is only sent to candidates you select from the target stage.`

This dialog does not ask for questions — it asks for a **specification**, and the AI writes the
content. You choose lever types, counts and timings; the AI produces the spine, statements, options,
briefs, answer keys and rubrics.

## Layout

```
┌────────────────────────────────────────────────────────────────┐
│ ✳  Trip Builder                                            ✕  │
│ Configure the levers, difficulty, and scenario for this trip…  │
│                                                                │
│ PIPELINE STAGE                                                 │
│ [ Select a stage                                          ▾ ]  │
│                                                                │
│ LEVERS        [+ ⚡Rapid Fire] [+ ⚖Pick & Defend] [+ 🎥Demo]   │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ ⋮⋮ ⚡ RAPID FIRE · SLOT 1                              🗑  │ │
│ │    TIME CAP (SECONDS)  QUESTIONS   DIFFICULTY OVERRIDE     │ │
│ │    [ 120 ]             [ 8 ]       [ Use trip default ▾ ]  │ │
│ └────────────────────────────────────────────────────────────┘ │
│ … one block per slot …                                         │
│                                          ⊞ Save as template    │
│                                                                │
│ DIFFICULTY   [ Intermediate ▾ ]                                │
│ ⟳ Suggesting a difficulty from this job's evaluation framework…│
│                                                                │
│ STORYLINE (OPTIONAL)              [ ⟳ Suggest storylines ]     │
│ INSTRUCTIONS (OPTIONAL)                                  🎤    │
└────────────────────────────────────────────────────────────────┘
```

## Fields

| Field | Control | Default | Notes |
|---|---|---|---|
| `PIPELINE STAGE` | select | *(unset — `Select a stage`)* | The **target stage**. Only candidates in this stage become eligible for the invite roster. |
| `LEVERS` | slot list | 3 slots pre-filled | Add via the three `+` buttons; reorder by drag handle; remove by trash |
| `DIFFICULTY` | select | `Intermediate`, then AI-suggested | Trip-level default |
| `STORYLINE (OPTIONAL)` | text + `⟳ Suggest storylines` | `No suggestions yet — the AI will choose freely for this trip.` | |
| `INSTRUCTIONS (OPTIONAL)` | textarea + 🎤 mic | empty | Highest-priority steer, see below |
| `Save as template` | button | — | Persists the slot configuration for reuse |

## The lever slot list

Slots are numbered `SLOT 1`, `SLOT 2`, … and each carries three settings:

| Setting | Control | Rapid Fire default | Pick & Defend default | Demo default |
|---|---|---|---|---|
| `TIME CAP (SECONDS)` | number | `120` | `300` | `180` |
| `QUESTIONS` | number | `8` | `3` | `3` |
| `DIFFICULTY OVERRIDE` | select | `Use trip default` | `Use trip default` | `Use trip default` |

The default trip is one of each lever type, in the order Rapid Fire → Pick & Defend → Demo.

### `QUESTIONS` means something different per lever type

This is the highest-value mapping in the dialog. The field is named `QUESTIONS` for all three lever
types, but it generates a **different repeating sub-item** in each:

| Lever | `QUESTIONS` generates | Confirmed on the built card |
|---|---|---|
| `Rapid Fire` | **statements** | `QUESTIONS 8` → 8 statements |
| `Pick & Defend` | **defense questions** | `QUESTIONS 3` → 3 defense questions |
| `Demo` | **teleprompter beats** | `QUESTIONS 3` → 3 beats |

Note what `QUESTIONS` does **not** control: for `Pick & Defend` it does not set the number of
**options** (4 were generated with `QUESTIONS: 3`). Option count is not exposed in this dialog at all.

Duplicate lever types are allowed — exploration reached `RAPID FIRE · SLOT 15`, i.e. many slots of
the same type stacked in one trip.

> UNVERIFIED: the maximum number of slots, and any min/max on `TIME CAP` or `QUESTIONS`. At least 15
> slots were accepted.

## Difficulty

`DIFFICULTY` starts at `Intermediate` and is then **auto-suggested from the job itself**:

- While computing: `⟳ Suggesting a difficulty from this job's evaluation framework…`
- Resolved: `Based on 4 evaluation framework rows (1 at Advanced depth) — suggested "advanced".`
  and the select flips to `Advanced`.

So difficulty is derived from a job-level **evaluation framework** — a concept that lives outside this
section.

> UNVERIFIED: where the "evaluation framework" is authored. It was not located in `/setup`'s
> 7 sections. Confirmed values for `DIFFICULTY`: `Intermediate`, `Advanced`.

Per-slot `DIFFICULTY OVERRIDE` defaults to `Use trip default`, allowing one lever to run harder or
easier than the trip.

## Storyline and instructions

`STORYLINE (OPTIONAL)` — with a `⟳ Suggest storylines` button. Empty state:
`No suggestions yet — the AI will choose freely for this trip.` Left blank, the AI invents the spine.

`INSTRUCTIONS (OPTIONAL)` — free text with a **microphone** for dictation:

> `Type or tap the mic to tell the AI what matters most for this trip — storyline, the kinds of questions to ask, what to focus on. It's given top priority for every lever.`

Placeholder: `e.g. Center every question on debugging a live outage under time pressure; keep the tone calm and senior.`

This is the field that says **"lever"** — the only place in the product that uses the word.

## Nuances & Gotchas

- **`PIPELINE STAGE` is chosen at generation time, not at assignment time.** The trip is bound to a
  target stage up front, and that binding is what later populates `ELIGIBLE IN TARGET STAGE` on the
  published trip. Pick the wrong stage and the invite roster comes up empty.
- **`QUESTIONS` is a polymorphic field**: statements for Rapid Fire, defense questions for
  Pick & Defend, teleprompter beats for Demo. Same label, three meanings.
- `QUESTIONS` does **not** control Pick & Defend's option count — 4 options were generated from
  `QUESTIONS: 3`. Option count is not configurable pre-generation.
- The same lever type can be added many times; slots are not one-per-type.
- `DIFFICULTY` is inferred from a job-level **evaluation framework** that is not part of the 7
  `/setup` sections — so trip difficulty depends on data authored somewhere this audit has not yet located.
- `INSTRUCTIONS` is documented as taking **top priority for every lever**, making it the strongest
  lever over AI output — stronger than `STORYLINE`.
- `Save as template` saves the **slot configuration**, not the generated content.
- Generation produces a **Draft**; nothing is sent to candidates at this point.
