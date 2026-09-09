# Communications › AI calling

Covers the `AI calling` tab of `How you reach out on this job`. This build's calling-agent model
is much thinner than the brief's checklist implies — most of the "expected" config surface
(voice, language, retry policy, call window/timezone, fallback, recording toggle) was **not
present** in this build. What follows is what actually exists, verified against 5 screenshots
across both provisioned and unprovisioned states.

## The model: one agent per pipeline stage, not per job

The `AI calling` tab renders **one card per pipeline stage**, not a flat list of agents:

```
┌─────────────────────────────────────────────────────────┐
│ Prospects                              [Not provisioned] │
│ No calling agent for this stage yet. Candidates in       │
│ Prospects cannot be called until one exists.             │
│                                          [Create agent]   │
├─────────────────────────────────────────────────────────┤
│ Applied                                [Not provisioned] │
│ No calling agent for this stage yet. Candidates in       │
│ Applied cannot be called until one exists.               │
│                                          [Create agent]   │
└─────────────────────────────────────────────────────────┘
```

Only 2 stage cards were observed (`Prospects`, `Applied`) — the pipeline itself has 6 stages (per
the Pipeline screen's `6 stages` counter), so > UNVERIFIED whether every stage gets an AI-calling
card or only some.

Each card's status chip is one of:

| Chip | Meaning |
|---|---|
| `Not provisioned` | No agent exists for this stage yet — calling is blocked |
| `New agent` | The card is mid-creation (form open, unsaved) |

> UNVERIFIED: the chip text once an agent is actually saved/live (neither reference job's agents
> were saved during capture — only the creation form was opened and then left/cancelled per the
> no-save guardrail).

The blocking language is explicit and literal: **`Candidates in Prospects cannot be called until
one exists.`** — a calling agent is a hard gate on that stage's calling capability, not a
convenience layer over manual calling.

## Creating an agent (`Create agent`)

Clicking `Create agent` expands the stage's card in place (no modal) into an edit form:

| Field | Control | Observed value | Notes |
|---|---|---|---|
| `AGENT TITLE` | text input | `Full-Stack Engineer` | Free text |
| (caption) | — | `Shown to the provider as Prospects — Full-Stack Engineer` | The **stage name is prepended automatically** when the agent is registered with the calling provider — the recruiter only edits the second half |
| `CALL SCRIPT` | multi-line rich text, `{{` autocomplete | see below | The entire agent "personality"/objective/flow is authored as one free-text script, not as separate structured fields |
| `{}Variables` link | opens token dropdown | 6 tokens — see `02-Merge-Tokens.md` §B | |
| (caption under script) | — | `Variables filled in per call: {{candidate_name}} {{company_name}} {{job_title}} {{current_date}} {{current_day}} {{current_month}}` | Restates the closed token set |
| `Create agent` | button | — | Primary save action |
| `Set default` | button | — | > UNVERIFIED semantics — likely mirrors the email/WhatsApp "default template" pattern, scoped per stage or per job |
| `Cancel` | button | — | Collapses the form without saving |

### The observed call script, in full

This is the entire configuration surface for agent behaviour — there is no separate "objective,"
"max duration," "voice," or "retry policy" field anywhere in this build. Everything below lives in
one textarea:

```
You are calling about the {{job_title}} role at {{company_name}}.

Ask one at a time. After each, stop and wait for the answer. Acknowledge it
briefly, then move on.

Ask these four, in order:
1. Are they interested in the {{job_title}} role at {{company_name}}?
2. What is their current notice period?
3. What are they earning now, and what are they expecting?
4. What relevant experience do they have for this role?

Keep it under 3 minutes, be polite, confirm the best time for a follow-up.
```

Notable in this one script: a **soft duration cap is authored in prose** (`Keep it under 3
minutes`) rather than enforced by a structured `max duration` field — if the product has a hard
timeout, it isn't exposed here; the recruiter's only lever is asking the script to self-limit.

### What is conspicuously absent

None of the following config surfaces were found anywhere in the `AI calling` tab, the agent
creation form, or any modal reachable from it:

- Voice selection (gender/accent/persona)
- Language selection
- A structured "objective" field separate from the script prose
- A structured max-call-duration field or hard cap
- Retry policy / max attempts
- Call window or timezone restriction
- Fallback behaviour (e.g. hand off to human, leave voicemail)
- Recording or transcript-retention toggles

> UNVERIFIED: whether any of these exist behind a settings surface not reached during this audit
> (e.g. a workspace-level `Control` section, visible in the top nav, was not explored as part of
> this job-scoped task). Do not assume they don't exist anywhere in the product — only that they
> don't exist **on this screen**.

## Triggering a call / attaching to the pipeline

No explicit "trigger" control (manual button, stage-change automation toggle, or schedule picker)
was found on the `AI calling` tab itself. The tab's own copy states the mechanism indirectly: an
agent is a **prerequisite gate** per stage (`cannot be called until one exists`), and the actual
call action lives elsewhere — on the candidate/pipeline surfaces (see below), not here.

> UNVERIFIED: whether advancing a candidate to a stage automatically fires that stage's agent
> (an implicit "on stage change" trigger), or whether the recruiter must manually place the call
> from the candidate record after the agent exists. No stage-change action was tested against a
> live agent during this audit.

## Where call outcomes land

### The Outreach log (per-candidate)

Each candidate record exposes an `OUTREACH` tab (seen on the candidate detail drawer, alongside
`CANDIDATE PROPERTY`, `APPLICATION PROPERTY`, `APPLICATION`, `COMMUNICATION`, `RESUME`), and a
dedicated **`Outreach — <candidate name>`** modal reachable from the Prospects list, subtitled:
`Every call, email and WhatsApp attempt logged for this prospect.` — i.e. outreach logging is
**unified across all three channels**, not a calling-only concept.

The modal has three parts:

| Section | Control | Notes |
|---|---|---|
| `OUTCOME` | select, placeholder `Pick an outcome` | The disposition list — see below |
| `NOTE (OPTIONAL)` | multi-line text, placeholder e.g. `Switched off — try after 6pm` | Free-text context for the outcome |
| `HISTORY` | read-only log | Empty state: `Nothing logged yet. The first outcome you save appears here.` |

`Log outcome` is the save action (disabled/muted until an outcome is picked).

### The disposition value list

The `OUTCOME` dropdown is **grouped by channel**, confirming outreach outcomes are channel-scoped
values, not a single flat list:

| Group | Values |
|---|---|
| `Email` | `Pending review` · `Email sent` · `Reminder email 1` · `Reminder email 2` |
| `WhatsApp` | `WhatsApp message sent` · `WhatsApp message 1` · `WhatsApp message 2` |
| `Call` | `DNP — did not pick` · `Connected — call answered` · `Interested` · `Call back — wants a callback` · `Not interested — declined` |
| `Decision` | `Rejected — not a fit` (list scrolled off-screen below this point) |

**Call-specific dispositions (5 confirmed):** `DNP — did not pick`, `Connected — call answered`,
`Interested`, `Call back — wants a callback`, `Not interested — declined`.

> UNVERIFIED: the `Decision` group almost certainly has more values than the single
> `Rejected — not a fit` captured — the dropdown was scroll-clipped in the source screenshot.
> Likely candidates (unconfirmed) include an "advanced"/"accepted" counterpart, given `Rejected`
> exists as one pole. Do not treat 1 value as the full `Decision` group.

No separate "transcript" or "summary" artifact was observed anywhere in this flow — outcomes are
logged as a **structured disposition + free-text note**, not a call recording/transcript pane.
> UNVERIFIED: whether a transcript or recording exists elsewhere (e.g. inside the candidate's
> `COMMUNICATION` tab, not opened during this audit).

## Nuances & Gotchas

- A calling agent is scoped **per pipeline stage**, not per job or per template — this is the
  single biggest structural difference from Email/WhatsApp, which are scoped per job/org and per
  message respectively.
- `Not provisioned` is a **hard block**, stated in the card's own copy — candidates literally
  cannot be called from a stage with no agent.
- The agent's entire behaviour — objective, question order, tone, and even its duration cap — is
  authored as **one free-text script**, not structured fields. There is no separate voice,
  language, retry, or call-window control in this build.
- The stage name (`Prospects`, `Applied`) is **automatically prefixed** to whatever the recruiter
  types in `AGENT TITLE` when shown to the calling provider — the recruiter's title field is only
  the second half of the provider-facing label.
- The AI-calling merge-token list is **closed at 6** and explicitly stated as complete on the card
  itself (contrast with email's token list, which is open-ended/unconfirmed as closed).
- Outreach-outcome logging is **shared infrastructure across Email, WhatsApp, and Call** — the
  same modal and the same `HISTORY` log handle all three channels, just with channel-scoped
  dispositions.
- No transcript, recording, or AI-generated call summary surface was found in the AI-calling flow
  itself — only a manually-picked disposition plus an optional free-text note.
