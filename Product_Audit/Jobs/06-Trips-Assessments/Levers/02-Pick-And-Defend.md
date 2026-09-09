# Lever › Pick & Defend ⚖

**Card badge:** `⚖ PICK & DEFEND` · **Observed time cap:** `SECONDS 300`

**Editor description (verbatim):**
> `Candidate picks one option from the list, then defends their choice by answering the defense questions.`

A two-phase lever: a single-select decision, then free-text justification.

## Fields

| Field | Control | Notes |
|---|---|---|
| card title | inline-editable text | `Pick & Defend` |
| `SECONDS` | number, card header | `300` observed |
| `✎ BRIEF` | textarea | The scenario / situation |
| `✎ CONSTRAINT` | textarea | The non-negotiable the candidate must respect |
| `VOICE NOTE` | — | See below |
| `RESOURCES` | list + `+ Add resource` | `Files and images the candidate can open while they work through this card.` Observed: `No resources added yet.` |
| `OPTIONS` | repeating rows + `+ Add option` | 4 observed, labelled `A`–`D` |
| `DEFENSE QUESTIONS` | repeating textareas + `+ Add question` | 3 observed, numbered `01`–`03` |
| `ANSWER KEY` | block | See below |

### Voice note

> `AI voice ready — this script is read aloud to the candidate. Record your own voice note to play it instead.`

| Action | Effect |
|---|---|
| `▷ Preview AI voice` | plays the AI narration of the script |
| `🎤 Record voice note` | replaces the AI voice with a recruiter recording |

The AI voice is the **default** — it is "ready" without any setup. Recording is an override.

### Options

Each option row has:

| Element | Control |
|---|---|
| letter | auto `A`, `B`, `C`, `D` |
| option title | text input |
| option rationale | secondary text line (a short consequence summary) |
| delete | trash icon |

`+ Add option` is always available — **no 2-option cap** here, unlike Rapid Fire.

Observed options (draft trip):

| | Title | Rationale line |
|---|---|---|
| A | Ship the simplified flow on schedule; plan guided onboarding as a post-launch iteration | Minimize scope, gather real usage data, improve based on actual creator behavior |
| B | Invest the 2 extra weeks in guided onboarding; slip the ship date | Reduce creator friction upfront, lower post-launch support burden, but miss Q2 deadline |
| C | Ship simplified flow now; allocate engineering capacity to a lightweight in-app tutorial instead of post-launch support tooling | Hybrid approach—keep timeline, add guidance without full onboarding redesign, trade support tooling for creator education |
| D | Request a 1-week extension to ship a minimal-viable guided experience | Negotiate a compressed timeline between full redesign and no guidance; present it to execs as a risk-mitigation trade |

### Answer key

An orange-bordered block, hidden from candidates:

| Sub-field | Content |
|---|---|
| `STRONGER OPTION` | a single option letter — `C` observed |
| `WHY IT'S STRONGER` | long-form rationale |
| `TRADEOFF AXIS` | the dimensions being traded — observed: `timeline adherence vs. upfront friction reduction vs. engineering resource allocation` |

`STRONGER OPTION` designates **one** preferred answer, so the lever is scored against a single
best choice rather than a ranking.

## Nuances & Gotchas

- Single select, but **no option cap** — `+ Add option` is always present. Do not carry Rapid Fire's
  2-option limit across to this lever.
- Options carry **two** text layers: a title and a rationale line. The rationale is candidate-visible
  and effectively pre-reveals each option's trade-off.
- The answer key names exactly **one** `STRONGER OPTION` — there is no partial credit model or ranking.
- The **AI voice is on by default** (`AI voice ready`), so a candidate hears narration unless the
  recruiter deliberately does nothing about it. Recording a voice note *replaces* it.
- `BRIEF` and `CONSTRAINT` are separate fields — the constraint is what makes the options non-trivial,
  and an empty constraint would make most option sets answerable by elimination.
- This is the only lever with a `RESOURCES` attachment area for reference material.
- `TRADEOFF AXIS` is free text, not a structured dimension list.
