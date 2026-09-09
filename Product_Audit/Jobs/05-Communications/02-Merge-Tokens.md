# Communications › Merge-token reference

This is the exhaustive list of tokens observed across every merge-token surface in
Communications: the email template editor, the AI-calling call script editor, and the WhatsApp
platform-template builder. **There are two separate, incompatible token syntaxes in this product**
— read the split below before using either list.

## The split: named tokens vs positional tokens

| Surface | Syntax | Example |
|---|---|---|
| Email (subject + body) | **named**, `{{snake_case_name}}` | `{{candidate_name}}` |
| AI calling (call script) | **named**, `{{snake_case_name}}` | `{{job_title}}` |
| WhatsApp platform template (request-a-template builder) | **positional**, `{{n}}` | `{{1}}`, `{{2}}`, `{{3}}` |
| WhatsApp message (fill-in-the-approved-template screen) | none exposed — you type plain values into numbered placeholder rows; the underlying template's positional tokens are opaque to the recruiter | — |

Email and AI-calling share the same named vocabulary style (and 3 literal token names in common:
`candidate_name`, `company_name`, `job_title`), but they are configured on different screens and
there is no evidence the two lists are identical end to end — treat them as two separate,
overlapping vocabularies, not one shared list.

---

## A. Email named tokens

Trigger: type `{{` in the `SUBJECT` or `MESSAGE BODY` field of the email template editor, or click
the `{}Variables` link above either field.

Observed in the autocomplete dropdown (6 entries visible, dropdown not scrolled further):

| Token | Resolves to (inferred from label + live preview) |
|---|---|
| `{{first_name}}` | Candidate's first name only |
| `{{candidate_name}}` | Candidate's full name (preview showed `Ishita Sharma`) |
| `{{job_title}}` | The job's title (preview showed `Full-Stack Engineer`) |
| `{{company_name}}` | The hiring company's name (preview showed `Career Passport`) |
| `{{location}}` | Job or candidate location — not resolved in any preview observed |
| `{{comp_range}}` | The job's compensation range — not resolved in any preview observed |

Additionally **detected inside the one authored template body** (not from the autocomplete list,
but confirmed live via the editor's `DETECTED VARIABLES` readout and the live-preview resolution):

| Token | Resolves to |
|---|---|
| `{{meeting_date_time}}` | The invited meeting's date/time |
| `{{meeting_link}}` | The invited meeting's join URL |
| `{{sender_name}}` | The sending recruiter's name (preview showed `Demo Recruiter`) |

So the confirmed email vocabulary is **9 named tokens**: `first_name`, `candidate_name`,
`job_title`, `company_name`, `location`, `comp_range`, `meeting_date_time`, `meeting_link`,
`sender_name`.

> UNVERIFIED: the autocomplete dropdown was not scrolled past its 6th visible entry, and only one
> authored template body was available to mine for additional in-body tokens. The true ceiling of
> the email vocabulary is very likely larger than 9 — this list is a floor, not a proven maximum.

The editor's `DETECTED VARIABLES` line is itself a good verification device: it recomputes live as
you type and lists every `{{...}}` token actually present in Subject+Body, upper-cased
(`JOB_TITLE, COMPANY_NAME, CANDIDATE_NAME, MEETING_DATE_TIME, MEETING_LINK, SENDER_NAME`), and
reads `NONE` on an empty template.

The live preview's caption additionally states, per template, exactly which of its tokens are
**resolved per-candidate at send time** rather than at authoring time — for `Meeting invite`:
`Filled per candidate at send time: candidate_name, meeting_date_time, meeting_link`. This implies
`job_title`, `company_name` and `sender_name` on that same template resolve from **job/sender
context**, not per-candidate — a distinction worth preserving if this list is ever turned into a
"which tokens need which data source" spec.

---

## B. AI-calling named tokens

Trigger: the `{}Variables` link above the `CALL SCRIPT` field on a calling-agent card.

The dropdown showed exactly 6 tokens:

| Token | Resolves to |
|---|---|
| `{{candidate_name}}` | Candidate's full name |
| `{{company_name}}` | The hiring company's name |
| `{{job_title}}` | The job's title |
| `{{current_date}}` | Today's date at call time |
| `{{current_day}}` | Today's day-of-week (or day-of-month — not disambiguated) |
| `{{current_month}}` | Today's month |

The card's own caption below the script box restates this as the closed set actually filled per
call: `Variables filled in per call: {{candidate_name}} {{company_name}} {{job_title}}
{{current_date}} {{current_day}} {{current_month}}` — this is the one place in the product where a
token list is asserted as complete, not just "observed so far." Treat this 6-token list as
**closed** for AI calling, unlike the email list above.

---

## C. WhatsApp positional tokens

Two different WhatsApp surfaces use `{{n}}`, with different jobs:

1. **Requesting a new template** (`Request a WhatsApp template`) — the recruiter writes
   `{{1}}`, `{{2}}`, `{{3}}`… directly into the header/body text wherever a value should vary per
   candidate, then supplies one `EXAMPLE VALUES` string per number (e.g. `{{1}} → Priya`,
   `{{2}} → Backend Engineer`, `{{3}} → Tuesday 26 Aug, 4:00 PM`) purely so Meta's reviewers can see
   a realistic rendering. These numbers carry **no semantic name** — `{{1}}` doesn't mean
   "candidate_name," it just means "the first variable slot in this template."
2. **Filling an approved template into a message** (`New WhatsApp message`) — the positional
   tokens are already baked into the approved template and are not shown as `{{n}}` to the
   recruiter at all; instead each slot renders as a numbered `FILL THE PLACEHOLDERS` row (`1`, `2`,
   `3`, `4`) with its own text input and its own `Insert variable` dropdown. > UNVERIFIED: what
   options the message-screen `Insert variable` dropdown offers — not expanded during capture; it
   may re-expose named tokens (candidate_name etc.) as a convenience for filling the positional
   slot, but this was not confirmed.

## Nuances & Gotchas

- **Two incompatible token syntaxes exist side by side**: named `{{candidate_name}}` (email, AI
  calling) vs positional `{{1}}` (WhatsApp template authoring). Copy-pasting a snippet from one
  editor into another will not resolve.
- The AI-calling token list is explicitly closed at **6** (the card states it outright). The email
  token list is **not** asserted as closed anywhere in the UI — 9 is a floor from what was
  observed, not a documented ceiling.
- `candidate_name`, `company_name`, and `job_title` are the **only three tokens confirmed shared**
  between the email and AI-calling vocabularies.
- On WhatsApp, the recruiter never sees or writes a named token at message-fill time — only at
  template-request time, and even there it's a bare number, not a name.
- A WhatsApp requested-template placeholder's `EXAMPLE VALUES` are cosmetic/for-Meta's-review only
  — they are not the same thing as the real values a recruiter will later type into
  `FILL THE PLACEHOLDERS` for an actual candidate.
