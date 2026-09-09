# Communications › Templates

Covers the `Email` and `WhatsApp` tabs of `How you reach out on this job`. See
`03-Calling-Agents.md` for the third tab, `AI calling`.

```
┌────────────────────────────────────────────────────────────────┐
│  ✉ Email    💬 WhatsApp    📞 AI calling                          │
├────────────────────────────────────────────────────────────────┤
│  🔍 Search templates...        1 of 1 template     [New template]│
├───────────────────────────────┬──────────────────────────────────┤
│ Meeting invite   [warm][Org-wide]│                                │
│ Meeting invite: {{job_title}}    │        + New template          │
│  at {{company_name}}             │       (dashed add-card)        │
│ Hi {{candidate_name}},            │                                │
│ You've been invited to a meeting…│                                │
│ job_title company_name            │                                │
│ candidate_name +3                 │                                │
│ Any stage · used 0× · by Demo Rec.│                                │
│        Set default Duplicate Delete Edit│                          │
└───────────────────────────────┴──────────────────────────────────┘
```

The **only email template observed** on this job is `Meeting invite`. It carries two tag chips —
`warm` (tone) and `Org-wide` (scope) — plus, once made the default, a third chip: `Default`.

---

## 1. Email templates

### 1.1 The template card (list view)

| Element | Content |
|---|---|
| Title | `Meeting invite` |
| Tag chips | `warm` (tone), `Org-wide` (scope), `Default` (only if set) |
| Subject preview | `Meeting invite: {{job_title}} at {{company_name}}` |
| Body preview | First lines, truncated: `Hi {{candidate_name}}, You've been invited to a meeting for the {{job_title}} role at …` |
| Token chips | Coloured pills for the first 3 tokens used (`job_title`, `company_name`, `candidate_name`), then a `+3` overflow chip |
| Meta line | `Any stage · used 0× · by Demo Recruiter` — pipeline-stage scope, usage counter, author |
| Actions | `Set default` (hidden once already default) · `Duplicate` · `Delete` · `Edit` |

`1 of 1 template` in the search bar is a live counter: `N of M template(s)` — `N` shrinks as the
search filters. Typing a non-matching query (`zzzznomatch`) collapses the whole grid to a single
line: `No template matches "zzzznomatch".` with a `Clear filters` link — there is no illustration
or empty-state graphic for a no-results search, only for a genuinely empty list.

### 1.2 The template editor (`New template` / `Edit`)

Opens as a modal, **New email template** or **Edit email template**, with the identical layout:
a left form column and a right `LIVE PREVIEW` column. Subtitle: `Type {{ in the subject or body to
insert a variable.`

| Field | Control | Observed values | Notes |
|---|---|---|---|
| `TEMPLATE NAME` | text input | `Meeting invite` | Free text |
| `TONE` | select | `Warm` | > UNVERIFIED: the full option list — dropdown not expanded. This is the field that carries the colour-coded chip (`warm`) on the card — **"tone" is this product's name for what the brief calls "intent."** |
| `USE FOR STAGE` | select | `Any stage` | Pipeline-stage scope for the template |
| `AVAILABLE ON` | select | `Every job in the org` (existing template) / `This job only` (new template default) | Job-scope control — see §1.4 |
| `SUBJECT` | single-line rich text, supports `{{` autocomplete | `Meeting invite: {{job_title}} at {{company_name}}` | |
| `MESSAGE BODY` | multi-line rich text, supports `{{` autocomplete | full body incl. `{{meeting_date_time}}`, `{{meeting_link}}`, `{{sender_name}}` | |
| `DETECTED VARIABLES` | read-only computed list | e.g. `JOB_TITLE, COMPANY_NAME, CANDIDATE_NAME, MEETING_DATE_TIME, MEETING_LINK, SENDER_NAME` | Recomputed live as you type; reads `NONE` on a blank template |
| `Make this the default email template` | radio/checkbox | off by default | |
| `Draft with AI` | button, bottom-left | — | > UNVERIFIED: what it opens; not exercised (guardrail) |
| `Cancel` / `Save changes` (edit) or `Create template` (new) | buttons | — | |

Both `SUBJECT` and `MESSAGE BODY` carry their own `{}Variables` link (top-right of the field) —
opens the same token-autocomplete dropdown as typing `{{`. See `02-Merge-Tokens.md`.

### 1.3 Live preview

The right column, headed `LIVE PREVIEW`, is a **per-candidate rendering**, not a generic sample:
`PREVIEW — ISHITA SHARMA` — it resolves against a real (demo) candidate record. It shows the
resolved `SUBJECT` and body with all tokens substituted, and a caption naming exactly which tokens
were filled: `Filled per candidate at send time: candidate_name, meeting_date_time, meeting_link`.

On a brand-new, still-blank template the preview instead reads `Write the message body to see it
here.` and the subject line shows a dash (`—`).

### 1.4 Scope: job-level vs org-wide

`AVAILABLE ON` is the override axis:

| Value | Meaning |
|---|---|
| `This job only` | Template is private to this job (default for a newly created template) |
| `Every job in the org` | Template is shared workspace/org-wide — this is the state the `Meeting invite` reference template is in, shown as the `Org-wide` chip |

> UNVERIFIED: whether a job can start from an org-wide template and then fork/override just its
> copy — no such "override" or "make a local copy of this org template" action was observed. The
> only related actions are `Duplicate` (makes a second independent template) and the `AVAILABLE ON`
> selector itself.

### 1.5 Setting default, duplicating, deleting

- `Set default` fires immediately (no confirmation) and produces a toast: `Default updated`. The
  card gains a `Default` chip and its `Set default` action disappears (replaced implicitly — only
  one default template can exist at a time, à la radio-button semantics).
- `Delete` opens a confirmation modal: **`Delete template?`** — `This permanently deletes "Meeting
  invite". Recruiters will no longer be able to pick it when emailing candidates. This can't be
  undone.` Buttons: `Cancel` / `Delete template` (destructive red).
- `Duplicate` — not exercised beyond the label; presumed to clone the template as an independent
  editable copy (consistent with the delete-copy naming pattern elsewhere in the product).

---

## 2. WhatsApp templates — a completely different ownership model

The WhatsApp tab's header banner is explicit about the constraint:

> `CAREER PASSPORT APPROVED TEMPLATES · 3` `Read-only`
> `Approved with the provider at platform level — you can't create or submit one. Need another?
> Request a template.`

| | Email | WhatsApp |
|---|---|---|
| Who authors the template | This workspace/job (recruiter) | The **platform**, submitted to and approved by **Meta** |
| Can a recruiter create one from this screen | Yes (`New template`) | **No** — only `Request a template` (see §2.3) |
| Can a recruiter edit wording | Yes, freely | **No** — wording, buttons and language are fixed by the approval |
| What a recruiter *can* configure | Everything | Only the **placeholder values**, per message |

### 2.1 The 3 approved templates (this workspace)

| Name | Category · Locale | Placeholders | Sample body |
|---|---|---|---|
| `demo_temp` | `utility · en_US` | **0** | `No placeholders — this template sends exactly as approved.` |
| `uri_cai` | `utility · en_US` | **3** | `hello aman` / `Your order 2131 has been delivered. Hope you received it in proper co…` / `Can you please confirm whether you received it?` |
| `uti_temp1` | `utility · en_US` | **4** | `Hello Aman, Order Update – Your order has been delivered.` / `✅ Order ID: #2211144 ✅ Delivery Time: Today 5 pm` / `✅ Balaji Courier / Ram Shah` / `Did you receive your order in good condition? Please confirm` |

All 3 templates carry an `Approved` chip. Each card footer reads `N placeholders · 0 of your
messages use it` — a per-template usage counter, separate from the per-message counters below.

### 2.2 Building a WhatsApp *message* on top of an approved template

Below the 3 read-only template cards sits the actual working list: **WhatsApp messages** (recruiter
objects), governed by the strapline `Every message is built on a template WhatsApp already
approved — you fill the placeholders, never the wording.`

`New message` opens **`New WhatsApp message`**:

| Field | Control | Notes |
|---|---|---|
| `TEMPLATE NAME` | text input, placeholder `e.g. Warm intro — senior IC` | This names *your message*, not the underlying WhatsApp template |
| `USE FOR STAGE` | select, `Any stage` | Same stage-scope pattern as email |
| `AVAILABLE ON` | select, `This job only` | Same job/org scope pattern as email |
| `APPROVED TEMPLATE` | select | Choose from the 3 approved templates, e.g. `uti_temp1 · 4 placeholders` |
| Template body box | read-only, numbered lines | Shows the fixed approved wording verbatim, tagged `🔒 FIXED WORDING · UTILITY · EN_US` |
| `FILL THE PLACEHOLDERS` | one text input **+ `Insert variable` dropdown** per placeholder | Each placeholder is validated independently |
| `Make this the default for this channel` | toggle | |

Live preview mirrors the email pattern: `PREVIEW — ISHITA SHARMA`, with a caption: `Template
uti_temp1 · wording and language fixed by approval, bold parts are filled per candidate.` Before
any placeholder is filled the preview box reads `Nothing to send yet` in a highlighted/pending
outline.

**Validation is per-placeholder and blocks on blank.** Each of the 4 `uti_temp1` placeholder rows
shows its own inline error until filled: `Required — a blank placeholder is rejected on send.`
Typing free text (e.g. `Test name`, `X1`, `X2`, `X3`) clears the error and the live preview updates
token-by-token, live, one field at a time.

Footer state while unsaved reads `Draft — not saved yet`. Buttons: `Cancel` / `Create message`.

### 2.3 Requesting a new WhatsApp template

`Request a template` opens **`Request a WhatsApp template`** — subtitle: `Build it the way you
want it to land. We submit it to Meta for approval, and it shows up in your templates once it's
live.` This is a from-scratch **Meta template builder**, distinct from the message-builder above:

| Field | Control | Observed value |
|---|---|---|
| `WHAT IS IT FOR?` | text input | `Interview reminder for scheduled candidates` — captioned `Internal only — we use it to name the template.` |
| `LANGUAGE` | select | `English (US)` |
| `CATEGORY` | select | `Utility` — captioned `Reminders and updates about something already in motion.` |
| `HEADER` | select, default `Text` | header type |
| Header text | text input | `Interview with {{1}}` |
| (second header-adjacent field) | text input | `Career Passport` |
| `MESSAGE` | multi-line text | `Hi {{1}}, your interview for the {{2}} role is confirmed for {{3}}. Please join 5 minutes early and keep a photo ID handy.` |
| `EXAMPLE VALUES` | one input per `{{n}}` token | `{{1}} → Priya`, `{{2}} → Backend Engineer`, `{{3}} → Tuesday 26 Aug, 4:00 PM` |
| `BUTTONS` | repeatable, typed | see below |

Body copy: `Type {{1}}, {{2}} … wherever the value changes per candidate.` — **WhatsApp's own
placeholder syntax is positional numbers, not named tokens** (`{{1}}`, `{{2}}`, `{{3}}`), unlike
the email editor's named tokens (`{{candidate_name}}`).

**Button types** available under `BUTTONS` (each is `Remove`-able, and the form supports adding
several of the *same* type — observed stacking up to 7 `QUICK REPLY` rows):

| Button type | Fields |
|---|---|
| `WEBSITE LINK` | label (`Join interview`) + URL with a token (`https://careerpassport.ai/i/{{1}}`) + a third field (`a7f39c`, likely a tracking/slug value) |
| `QUICK REPLY` | button label only (`Reschedule`) |
| `CALL NUMBER` | button label + phone number (`919876543210`) |
| `COPY CODE` | sample code (`e.g. CP25OFF`) |
| `WHATSAPP CALL` | button label |
| `OPEN A FORM` | button label + `Flow ID` + `First screen` |

Live preview renders the message as an actual WhatsApp bubble: sender name `Interview with Career
Passport`, body with tokens resolved to the example values, a `↗ Join interview` link row, a
`Reply STOP to opt out of updates` compliance line, a timestamp, and the `Reschedule` quick-reply
chip below the bubble. Caption warns: `Example values stand in for the real ones. WhatsApp shows
only two buttons when a template has more than three.`

---

## Nuances & Gotchas

- **"Tone" is the intent taxonomy.** The brief's expected "intent" concept (advance/reject/offer)
  surfaces in this build as the `TONE` field, with only `Warm` observed and confirmed as a
  colour-coded chip on the card. > UNVERIFIED: the remaining tone/intent values — dropdown not
  expanded during capture.
- Email and WhatsApp are **opposite ownership models on the same screen**: email templates are
  fully recruiter-authored; WhatsApp templates are Meta/provider-approved and read-only — the
  recruiter's only write surface on an approved WhatsApp template is filling numbered placeholders.
- WhatsApp's merge-token syntax is **positional** (`{{1}}`, `{{2}}`…), resolved via per-request
  `EXAMPLE VALUES`; email's is **named** (`{{candidate_name}}`). These are two different token
  systems — do not assume they're interchangeable.
- A WhatsApp placeholder is **required** — an empty placeholder is explicitly rejected at send,
  per-field, not just on submit.
- WhatsApp template cards show a **per-template usage counter** (`0 of your messages use it`)
  separate from the per-message counter on the message list (`0 of 0 messages on 0 templates ·
  0 default`) — two different denominators, don't conflate them.
- `Set default` has no confirmation step; `Delete` does, with explicit destructive copy stating
  the action is permanent and irreversible.
- The email search box's "no results" state is text-only (`No template matches "…"` + `Clear
  filters`) — there's no graphic, unlike the genuine empty-list state (`No WhatsApp messages yet`)
  which does get an illustrated empty state with its own `New message` CTA.
- WhatsApp shows **only two buttons in the live preview** once a template defines more than three
  — an explicit WhatsApp platform constraint the builder surfaces directly in its caption.
