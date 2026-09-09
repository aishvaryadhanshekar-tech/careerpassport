# Communications

**H1:** `How you reach out on this job`

**Subtitle (full):** `Templates and calling agents for this job. Recruiters pick from these when
they contact candidates — nothing is written at send time.`

That last clause is the section's whole design principle: recruiters never free-type a message to
a candidate. They pick a pre-built **template** (email/WhatsApp) or dispatch a **calling agent**
(AI voice), and the product fills in the blanks.

The screen is one page with a **3-way pill toggle**, left-aligned under the subtitle:

```
┌───────────────────────────────────┐
│  ✉ Email   💬 WhatsApp   📞 AI calling  │
└───────────────────────────────────┘
```

| Tab | What it holds |
|---|---|
| `Email` | Job's own rich-text templates — recruiter-authored, editable, one is job-scoped |
| `WhatsApp` | Platform-approved (Meta/BSP) message templates — **read-only**, recruiter can only fill placeholders |
| `AI calling` | Per-pipeline-stage calling agents — voice AI that phones candidates |

Sidebar left-nav icon for this section is a red mail/envelope glyph — Communications is filed under
the mail icon, not a distinct "comms" icon.

## Files in this folder

| File | Covers |
|---|---|
| `01-Templates.md` | Email template list, intent/scope tags, editor, WhatsApp approved-template model |
| `02-Merge-Tokens.md` | Full merge-token vocabulary (`{{candidate_name}}` etc.) |
| `03-Calling-Agents.md` | AI calling agent config, attach/trigger model, outcomes/dispositions |

## Nuances & Gotchas

- The subtitle's "nothing is written at send time" is literal for **all three channels**: Email
  templates are pre-authored (not composed per-send), WhatsApp is locked to provider-approved
  templates, and AI calling is a scripted agent, not a live human call.
- Email and WhatsApp are architecturally opposite: Email templates are **owned and edited by this
  workspace/job**; WhatsApp templates are **owned by the platform/provider** and shown read-only —
  recruiters cannot create or submit one from CareerPassport (a `Request a template` link is the
  only lever).
- AI calling is scoped **per pipeline stage** (`Prospects`, `Applied`, ...), not per template —
  each stage independently shows `Not provisioned` until a `Create agent` action is taken for it.
