# Lever › Demo 🎥

**Card badge:** `🎥 DEMO` · **Observed time cap:** `SECONDS 180`

**Editor description (verbatim):**
> `Candidate records a short demo. The cue should be direct, inspectable, and specific enough to make the recording useful for review.`

A recorded-performance lever: the candidate records themselves presenting, guided by a teleprompter.

## Fields

| Field | Control | Notes |
|---|---|---|
| card title | inline-editable text | `Demo` |
| `SECONDS` | number, card header | `180` observed |
| `✎ CUE SHOWN TO CANDIDATE` | textarea | The prompt/scenario the candidate performs against |
| `CAPTURES` | 3 chip toggles | See constraint below |
| `MAX SECONDS` | read-out box | `180`, helper `Uses the card-level timer.` |
| `TELEPROMPTER BEATS` | repeating rows + `+ Add beat` | 3 observed |
| `RESEARCH TIME` | checkbox | unchecked by default |
| `FILE UPLOAD` | checkbox + sub-fields | **checked** on the reference card |
| `ANSWER KEY` | block | See below |

### CAPTURES — a real hard constraint

Three independent chip toggles, all enabled on the reference card:

- `Screen capture`
- `Audio capture`
- `Face capture`

Helper text states the rule verbatim:

> `Pick any combination — at least one of Screen or Face.`

So: free combination, **except** that `Screen` and `Face` cannot both be off. `Audio capture` is
unconstrained — an audio-only demo is therefore **not** a legal configuration.

> UNVERIFIED: whether the UI blocks the illegal combination live or only errors on save.

### Teleprompter beats

Each beat row carries a **time offset in seconds** plus the cue text:

| Offset | Beat |
|---|---|
| `0` | Introduce the tension: ship fast vs. user clarity. State the core decision and why it matters to YouTu… |
| `35` | Walk through the simplified flow in Figma. Show what creators see, where confusion happens, and … |
| `75` | Walk through the guided flow. Highlight the key interaction changes and how user research quotes … |

Beats are **timestamped**, not merely ordered — they drive a teleprompter that advances during the
recording. Offsets are authored manually, so they can exceed the card's `MAX SECONDS` if mis-set.

### Research time

| Control | Copy |
|---|---|
| checkbox | `Give the candidate prep time before recording` |
| helper | `Shown on the demo-question screen. The candidate can research and prepare, then the demo starts automatically when the timer ends — or they can start early.` |

Note the behaviour: prep time **auto-starts the recording** when it elapses. The candidate can start
early but cannot extend it.

> UNVERIFIED: the prep duration field — it was not visible while the checkbox was unchecked.

### File upload

| Field | Control | Observed |
|---|---|---|
| enable | checkbox | **checked** |
| `✎ UPLOAD LABEL` | textarea | `Figma prototype link or exported PDF with flows, research quotes, and cost estimates` |
| `✎ INSTRUCTIONS` | textarea | long-form guidance |
| `ACCEPTED FILE TYPES` | chips | see below |

**Accepted file types (10):** `PDF`, `Word`, `PowerPoint`, `Excel`, `ZIP`, `PNG`, `JPG`, `CSV`, `Text`, `MP4`

> UNVERIFIED: whether these chips are individually toggleable or a fixed display of what the
> uploader accepts. No size limit is stated on the card.

### Answer key

Two lists, both hidden from candidates:

**`EXPECTED BEATS`** — 5 checkmarked expectations, e.g.
`Clearly articulates the ship-date vs. user-clarity tension and why it matters at YouTube Shopping scale`

**`RUBRIC ANCHORS`** — 6 named, question-form criteria:

| Anchor | Probe |
|---|---|
| Design Rationale Clarity | Does the candidate frame the decision as risk mitigation, not scope creep? |
| Prototype Fluency | Can they navigate and explain both flows with confidence? |
| Data-Driven Advocacy | Are user research quotes and cost estimates woven into the narrative? |
| Cross-Functional Thinking | Does the candidate acknowledge engineering and product constraints? |
| Shipping Mindset | Do they balance design rigor with velocity? |
| Creator-Economy Domain | Does the candidate demonstrate understanding of creator pain points…? |

Demo has the **richest answer key** of the three levers — named rubric dimensions rather than a
single correct answer.

## Nuances & Gotchas

- **`CAPTURES` has a genuine hard rule: at least one of `Screen` or `Face` must stay on.** Audio-only
  is not a valid Demo configuration.
- `Audio capture` can be turned off entirely — a silent screen recording is legal.
- Teleprompter beats are **timestamped in seconds**, authored by hand. Nothing appears to validate a
  beat offset against the card's `MAX SECONDS`, so a beat can be scheduled past the end of the recording.
- `RESEARCH TIME`, when enabled, **auto-starts the recording** when the prep timer expires. The
  candidate cannot extend prep, only start early.
- `MAX SECONDS` is a read-out, not an independent field — it mirrors the card-level timer.
- File upload is **optional per card** but was enabled on the reference card; the accepted-types list
  includes `MP4`, so a candidate can attach video *in addition to* the recorded demo.
- The rubric is 6 named anchors with no weights or scores attached — reviewer judgement, not a computed score.
