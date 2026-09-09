# Setup › Application form

**Subtitle:** `What every applicant fills before entering the funnel.`

The only setup section with a **split editor/preview layout**. Left column authors the form; right
column is a live candidate-facing preview labelled `PREVIEW` with an `⇱ EXPAND` control.

```
┌─────────────────────────────┬──────────────────────────────────┐
│ Context shown to candidates │  PREVIEW              ⇱ EXPAND   │
│   Company        [Shown ●]  │  APPLY FOR                       │
│   Role           [Shown ●]  │  Full-Stack Engineer             │
├─────────────────────────────┤  <company blurb>                 │
│ STANDARD FIELDS 6 MANDATORY │  <role blurb>                    │
│   Resume       MANDATORY ●  │  Tell us a bit about yourself.   │
│   Cover letter  OPTIONAL ○  │  Fields marked * are required.   │
│   … 11 total                │                                  │
├─────────────────────────────┤  About you                       │
│ CUSTOM QUESTIONS      [+Add]│   Resume *          [drop zone]  │
│   ⋮⋮ Q01 [Long answer] ●REQ │   Cover letter      [textarea]   │
│   ⋮⋮ Q02 [Long answer] ●REQ │   … all 11 fields, * if required │
│   ⋮⋮ Q03 [Multiselect] ●REQ │                                  │
│        ○ React        🗑     │  A few questions                 │
│        ○ Node.js      🗑     │   <8 questions rendered>         │
│        + ADD OPTION         │                                  │
│   … Q08                     │  [Submit application]            │
│   + Add another             │                                  │
└─────────────────────────────┴──────────────────────────────────┘
```

---

## 1. Context shown to candidates

A collapsible card with two blocks. Each has a label, a description, a `Shown` label and a toggle.

| Block | Description | Toggle | Body |
|---|---|---|---|
| `Company` | `Who the hiring company is.` | `Shown` — on | editable textarea |
| `Role` | `The role, location, work mode, and compensation.` | `Shown` — on | editable textarea |

These two blocks render as the two intro paragraphs above `Tell us a bit about yourself.` in the preview.

---

## 2. Standard fields

Header reads `STANDARD FIELDS` with a right-aligned counter `6 MANDATORY`.

Eleven fixed fields. Each row carries a sub-label, a state label (`MANDATORY` / `OPTIONAL`) and a toggle.

| # | Field | Sub-label | Toggle | Candidate-side hint | Preview placeholder |
|---|---|---|---|---|---|
| 1 | `Resume` | `PDF or DOCX, up to 10MB` | **on → MANDATORY** | `PDF OR DOCX, UP TO 10MB` | `Drop your file here` / `or browse` |
| 2 | `Cover letter` | `Free-form note to the team` | off → OPTIONAL | `FREE-FORM NOTE TO THE TEAM` | `Tell us why this role…` |
| 3 | `LinkedIn URL` | `Public profile link` | **on → MANDATORY** | `PUBLIC PROFILE LINK` | `linkedin.com/in/…` |
| 4 | `Portfolio URL` | `Personal site or work sample` | off → OPTIONAL | `PERSONAL SITE OR WORK SAMPLE` | `yoursite.com` |
| 5 | `Current company` | `Where you work today` | off → OPTIONAL | `WHERE YOU WORK TODAY` | `Razorpay` |
| 6 | `Expected CTC` | `Annual, currency picked by applicant` | **on → MANDATORY** | `ANNUAL, CURRENCY PICKED BY APPLICANT` | `e.g. 20,00,000` |
| 7 | `Notice period` | `Days from offer accept` | **on → MANDATORY** | `DAYS FROM OFFER ACCEPT` | dropdown `Select notice period` |
| 8 | `Current CTC` | `Annual, currency picked by applicant` | off → OPTIONAL | `ANNUAL, CURRENCY PICKED BY APPLICANT` | `32,00,000` |
| 9 | `Available start date` | `Earliest possible join` | off → OPTIONAL | `EARLIEST POSSIBLE JOIN` | `May 15, 2026` |
| 10 | `Current location` | `City, country` | **on → MANDATORY** | `CITY, COUNTRY` | `Bengaluru, IN` |
| 11 | `Years of experience` | `Total professional` | **on → MANDATORY** | `TOTAL PROFESSIONAL` | `7` |

The 6 toggled-on fields reconcile exactly to the `6 MANDATORY` counter.

### The toggle means required, not visible

This is the most important mechanic in the section. The toggle switches the row between
`MANDATORY` and `OPTIONAL` — it does **not** add or remove the field from the form.

Proof from the preview: `Cover letter`, `Portfolio URL`, `Current company`, `Current CTC` and
`Available start date` all have their toggles **off**, and all five still appear in the candidate
preview — just without an asterisk. Every one of the 11 standard fields is always shown; the toggle
only controls the `*` and its validation.

The standard field list is **closed** — there is no "add a standard field" control.

---

## 3. Custom questions

Header `CUSTOM QUESTIONS` with an `+ Add` button; an `+ Add another` button repeats at the bottom.
Questions are numbered `Q01`…`Q08` on the reference job.

### Per-question controls

| Control | Type | Notes |
|---|---|---|
| drag handle (`⋮⋮`) | reorder | left of each question |
| question text | text input | the prompt shown to candidates |
| answer type | select | observed values: `Long answer`, `Multiselect` |
| `REQUIRED` | toggle | drives the `*` in the preview |
| delete | trash icon | removes the question |
| `+ ADD OPTION` | button | **only present on `Multiselect`** — adds an option row |
| option row | text input + trash icon | one per choice |

> UNVERIFIED: the complete answer-type option list. Only `Long answer` and `Multiselect` were observed
> as selected values; the dropdown was not expanded.

### The 8 questions on the reference job

| Q | Answer type | Required | Options | Full prompt (from preview) |
|---|---|---|---|---|
| Q01 | `Long answer` | ✅ | — | `Years of production web application experience?` |
| Q02 | `Long answer` | ✅ | — | `Describe a complete feature you shipped end-to-end (React frontend to Node.js backend). What was the scope, and how did you handle the database layer?` |
| Q03 | `Multiselect` | ✅ | **5** | `Which of these have you used in production for 1+ year? (Select all that apply)` |
| Q04 | `Multiselect` | ✅ | **3** | `How would you describe your TypeScript proficiency?` |
| Q05 | `Long answer` | ✅ | — | `Describe a PostgreSQL schema you designed for a production feature. What tables did you create, and why did you structure it that way?` |
| Q06 | `Long answer` | ✅ | — | `Tell us about a time you translated a design spec (e.g., Figma) into production React code. How did you handle scope refinement or technical constraints?` |
| Q07 | `Long answer` | ❌ **off** | — | `How do you approach testing in your full-stack work? (e.g., unit tests, integration tests, E2E tests)` |
| Q08 | `Multiselect` | ✅ | **3** | `This role is on-site. Are you able and willing to work on-site?` |

Q07 is the control case that proves the required-toggle mapping: it is the only question with
`REQUIRED` off, and the only question rendered **without** an asterisk in the preview.

### Option sets

`Q03` (5 options):
```
React
Node.js
TypeScript
PostgreSQL
Next.js or similar server-rendered framework
```

`Q04` (3 options):
```
Beginner—I use basic types and interfaces
Intermediate—I write generics, unions, and utility types; I'm comfortable with type inference
Advanced—I design complex type systems, leverage conditional types, and mentor others on TypeScript patterns
```

`Q08` (3 options):
```
Yes, I'm available for on-site work
No, I require remote or hybrid work
I need to discuss flexibility
```

`Multiselect` options render candidate-side as **wrapping pill/chip buttons**, not checkboxes or a
dropdown. Long options wrap to multiple lines inside the pill (see Q04).

---

## 4. Candidate-facing preview

Rendered order:

1. `APPLY FOR` kicker + job title (`Full-Stack Engineer`)
2. Company blurb paragraph (from `Context shown to candidates › Company`)
3. Role blurb paragraph (from `Context shown to candidates › Role`)
4. `Tell us a bit about yourself. Fields marked * are required.`
5. **`About you`** — `Basics every recruiter wants to see first.` → the 11 standard fields
6. **`A few questions`** — `Specific to this role — answer in your own voice.` → the custom questions
7. `By submitting, you agree to share these details with the hiring team.`
8. `Submit application` button

Long-answer questions all share one placeholder: `Share your approach, examples, or key steps…`

---

## Nuances & Gotchas

- **The standard-field toggle is a required switch, not a visibility switch.** All 11 standard fields
  always appear to the candidate; the toggle only controls `MANDATORY` vs `OPTIONAL` and the `*`.
  There is no way to remove a standard field from the form.
- The `6 MANDATORY` counter counts toggled-on standard fields only — it **excludes** required custom
  questions (7 of the 8 custom questions are required, so the form actually has 13 required inputs).
- The standard field set is **fixed at 11**. Extending the form is only possible through custom questions.
- **Application-form custom questions are not the same system as Trips levers.** Here, `Multiselect`
  is supported and `Q03` carries **5 options** with an always-available `+ ADD OPTION`. Do not carry
  Trips lever constraints (e.g. single-select, two-option caps) across to this section — they are
  separate question engines with separate limits. See `../06-Trips-Assessments/`.
- `+ ADD OPTION` only renders for `Multiselect`; `Long answer` questions have no option rows.
- Both `Expected CTC` and `Current CTC` are labelled `currency picked by applicant` — the candidate
  chooses the currency, so the recruiter's `CURRENCY` field in `Role & comp` does not constrain it.
- `Notice period` is a **dropdown** candidate-side (`Select notice period`) but a free number field
  recruiter-side in `Role & comp` (`NOTICE PERIOD (DAYS)`) — two different control types for the
  same concept on opposite sides of the funnel.
- Preview placeholders are illustrative sample data, not defaults — e.g. `Razorpay`, `Bengaluru, IN`,
  `May 15, 2026`, `32,00,000`. They will mislead if read as configured values.
- Questions are reorderable by drag handle, and the `Q01…Q08` numbering is positional — reordering
  renumbers them, so never cite a question by its `Q0n` label in durable references.
- This section counts as **complete** in the 4/7 counter.
