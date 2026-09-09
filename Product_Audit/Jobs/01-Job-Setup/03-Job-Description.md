# Setup › Job description

**Subtitle:** `What recruiters and the careers page show. Internal notes stay private.`

Two cards: the JD itself, then `Company context`.

## JD document bar

Sits at the top of the section:

> `No JD document attached — upload one, or draft it from this role's details.`

| Action | Type |
|---|---|
| `Upload JD` | upload — accepts a JD document |
| `Generate JD with AI` | AI generation from the role's other setup fields |
| `Preview & edit` | opens the rendered JD for review |

## Fields

| Label | Control | Helper text | Observed value |
|---|---|---|---|
| `JOB TITLE` | text | — | `Full-Stack Engineer` |
| `RESPONSIBILITIES` | textarea | `One per line.` | populated |
| `QUALIFICATIONS` | textarea | `One per line.` | 5 lines |
| `BENEFITS` | textarea | `Comma- or line-separated.` | *(empty)* |
| `TAGS` | textarea | `Comma- or line-separated.` | `React, TypeScript, Node.js, Next.js, PostgreSQL` |
| `INTERNAL NOTES` | textarea | `Visible to your team only.` | populated |

## Company context (second card)

| Label | Control | Observed value |
|---|---|---|
| `INDUSTRY` | text | *(empty)* |
| `COMPANY SIZE` | text | *(empty)* |
| `BUSINESS MODEL` | text | *(empty)* |
| `REPORTING HIERARCHY` | text | *(empty)* |
| `COMPANY BRIEF` | textarea | populated |

## Nuances & Gotchas

- **`JOB TITLE` lives here, not in `Role & comp`** — the most counter-intuitive placement in setup.
- `INTERNAL NOTES` is the only field in the section marked team-only; everything else on this section
  is candidate-facing via the careers page.
- `QUALIFICATIONS` here **duplicates `MUST-HAVE SKILLS`** from the Requirements section almost verbatim
  on the reference job — the two are separate stores, not one field shown twice, so they can drift.
- `RESPONSIBILITIES` says `One per line.` but the reference value contains a prose paragraph followed
  by a single line packing many semicolon-separated duties — the convention is not enforced.
- A JD **document** and the JD **fields** are independent: the bar reports `No JD document attached`
  while every JD field is populated. Attaching a document is optional.
- `BENEFITS` and the entire `Company context` card are empty yet this section still counts as
  **complete** in the 4/7 counter — proof that completion uses a required subset, not all fields.
- `TAGS` and `BENEFITS` accept either commas or newlines as separators.
