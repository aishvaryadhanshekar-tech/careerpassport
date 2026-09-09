# Manage team — `/jobs/<id>/team`

**Eyebrow:** `MANAGE TEAM`
**H1:** `The people on this job`
**Subtitle:** `Who is doing what. Add or remove collaborators and rotate roles.`
**Page action:** `+ Add member` (solid red, top-right, always visible)

Roles on this page are **job-scoped**, not workspace-scoped (see §4). The page distinguishes exactly
two membership classes: a single **job owner** and any number of **collaborators**, each carrying one
of three job-scoped roles.

---

## 1. Layout — ASCII sketch

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Career Passport   Jobs  Marketplace  People  Reports  Control   🔔17  DR │
├──┬───────────────────────────────────────────────────────────────────────┤
│  │ MANAGE TEAM                                          [+ Add member]  │
│  │ The people on this job                                                │
│  │ Who is doing what. Add or remove collaborators and rotate roles.      │
│  │                                                                        │
│  │ ┌────────────────────────────────────────────────────────────────┐   │
│  │ │ [DR]  👑 JOB OWNER                        [Transfer ownership] │   │
│  │ │       Demo Recruiter                                            │   │
│  │ │       demo@careerpassport.ai                                    │   │
│  │ │       ADMIN                                                     │   │
│  │ └────────────────────────────────────────────────────────────────┘   │
│  │                                                                        │
│  │ COLLABORATORS                                                         │
│  │ ┌────────────────────────────────────────────────────────────────┐   │
│  │ │  No collaborators assigned yet.                                 │   │
│  │ └────────────────────────────────────────────────────────────────┘   │
└──┴───────────────────────────────────────────────────────────────────────┘
```

The job-owner card is visually distinct from the (empty) collaborators panel: it's a bordered card of
its own, with an avatar-initials chip, a red crown icon + `JOB OWNER` eyebrow, name, email, an
`ADMIN` role tag, and its own `Transfer ownership` button. Collaborators, when present, would render
in the panel below under the `COLLABORATORS` eyebrow — confirmed empty on both jobs sampled
(`No collaborators assigned yet.`), so no populated collaborator row was directly observed here.

---

## 2. `+ Add member` — enumerated without inviting anyone

Opens a modal titled **`Add to job team`**:

| Field | Control | Observed state |
|---|---|---|
| `TEAMMATE` | Dropdown/combobox | Placeholder `No eligible teammates for this role` — empty in this tenant for every role tried |
| `JOB ROLE` | Dropdown, single-select | Defaults to `Sourcing`. Options: `Sourcing`, `Screening`, `HM rep` (checkmark shown next to the currently-selected option) |

Footer: `Cancel` (plain) / `Add member` (solid, sage-green — rendered **disabled/greyed** the entire
time, because `TEAMMATE` never had an eligible option to select in this tenant).

**The complete job role vocabulary for collaborators is therefore exactly three roles:**

1. `Sourcing`
2. `Screening`
3. `HM rep`

`HM rep` stands out — "HM" = hiring manager. This is the most likely candidate for the role that would
be able to see/use `Client coordination` threads (see `../08-Client-Coordination/README.md`), i.e. a
seat that represents the hiring-manager side of the conversation, distinct from the recruiting-side
`Sourcing`/`Screening` roles. This link is inferred from naming, not confirmed by testing an `HM rep`
collaborator's actual page access.

> UNVERIFIED: the `TEAMMATE` dropdown's real behavior when eligible teammates exist (it never
> populated in this tenant — could be organization-membership-scoped, i.e. only people already in the
> same recruiter-agency org show up as eligible); what specifically makes a person "eligible" per
> role (e.g. maybe `HM rep` requires a different account type than `Sourcing`/`Screening`); the toast
> or resulting row style once a member is actually added.

---

## 3. `Transfer ownership` — enumerated, backed out

Opens a second, similarly-shaped modal titled **`Transfer ownership`**:

| Field | Control | Observed state |
|---|---|---|
| `NEW JOB OWNER` | Dropdown/combobox | Placeholder `No eligible teammates available` |

Body copy (all-caps, warning-styled): `THE NEW OWNER'S OTHER ROLES ON THIS JOB WILL BE REMOVED WHEN
OWNERSHIP TRANSFERS.`

Footer: `Cancel` / `Transfer` — `Transfer` rendered disabled throughout (no eligible candidate to
select). No confirmation step beyond this modal was reachable (disabled button blocks it).

**Key semantic finding:** ownership transfer is framed as **exclusive** — the incoming owner's
existing collaborator role (`Sourcing`/`Screening`/`HM rep`) on this same job is explicitly stated to
be **wiped** the moment they become owner. There is no "keep both" option surfaced in this dialog.
This implies **`JOB OWNER` + `ADMIN` is a role slot separate from, and mutually exclusive with, the
three collaborator roles** — you can't be owner and also carry a `Sourcing` tag simultaneously.

> UNVERIFIED: whether the outgoing owner (after transfer) automatically becomes a collaborator (and in
> which role), or drops off the job team entirely, or keeps some residual access.

---

## 4. Job-scoped vs. workspace-scoped — resolved

**Job roles are job-scoped**, not workspace-scoped. Evidence:

- The `Manage team` page itself is namespaced under `/jobs/<id>/team` and every role tag observed
  (`ADMIN` on the owner, `Sourcing`/`Screening`/`HM rep` in the Add-member picker) is described in
  the modal as a **`JOB ROLE`** — the field label is literally `JOB ROLE`, not "workspace role" or
  "organization role."
- A separate, higher-level **`Control` → Control Tower → "Every organization"** surface exists in the
  top nav, listing 282 **organizations** (each tagged `RECRUITER AGENCY`, `Active`/`Pending`/
  `Suspended`, with a person-count) — this is the workspace/tenant-management layer, and it is
  entirely distinct from any individual job's team roster. Organizations are the entities that request
  partner/sub-vendor access to individual jobs (see `../07-Action-On-You/README.md` §2); people inside
  those organizations are not shown with the same `Sourcing`/`Screening`/`HM rep` vocabulary at the
  organization level.
- The `ADMIN` tag under `Demo Recruiter` on the job-owner card is most plausibly **this job's**
  owner-tier permission label (paired 1:1 with the crown/`JOB OWNER` badge) rather than a
  workspace-wide admin flag — no workspace-level "you are an admin of this organization" surface was
  found to cross-check this against.

> UNVERIFIED: whether the exact same person holds different roles across two different jobs
  simultaneously (would conclusively prove job-scoping) — not testable without a second real
  collaborator account in this tenant, which the guardrails' "never invite" rule prevented setting up.

---

## 5. External/partner collaborator type — none distinct found here

No collaborator role in the `Add to job team` picker is labelled as "external," "partner," or
"agency." The three roles (`Sourcing`, `Screening`, `HM rep`) all read as **internal-recruiting-team**
roles. The product's external-party concept for jobs is handled through a **completely separate
mechanism** — the sub-vendor/partner access flow on `Action on you` (`../07-Action-On-You/README.md`),
which grants a whole external **organization** access to source against the job, not an individual
named "team member" with a role from this picker.

So: **there is exactly one path for internal collaborators (this page, 3 roles) and a completely
separate path for external organizations (partner-access approve/decline, no individual role
picker observed)** — they don't share a role vocabulary.

---

## 6. Role × capability matrix

Built from observed UI gating (buttons present/absent, modal copy) plus one inference (`HM rep` ↔
Client coordination). Cells marked `?` are `> UNVERIFIED` — not directly exercised.

| Capability | `JOB OWNER` / `ADMIN` | `Sourcing` | `Screening` | `HM rep` |
|---|---|---|---|---|
| Appears on `Manage team` roster | ✓ (the single owner card) | ✓ (collaborator) | ✓ (collaborator) | ✓ (collaborator) |
| Has `Transfer ownership` button | ✓ | ✗ | ✗ | ✗ |
| Can be targeted by `Transfer ownership` (becomes new owner) | n/a | `?` (dropdown never populated — inferred yes, since the picker doesn't filter by role name) | `?` | `?` |
| Loses prior job role automatically on becoming owner | n/a | ✓ (per modal copy, applies to any incoming owner) | ✓ | ✓ |
| Can open `+ Add member` | `?` (only owner account tested; likely yes) | `?` | `?` | `?` |
| Primary association | Overall job admin | Sourcing-stage work (per Action-on-you's `Outreach`/pipeline "Sourced" status labels) | Screening-stage work (per Action-on-you's `Feedback`/HM-review framing) | Hiring-manager-side representation — plausible bridge to `Client coordination` threads | 
| Can access `Client coordination` threads | `?` (owner account's job had the item greyed out — inconclusive) | `?` | `?` | `?` — **inferred candidate role**, not confirmed |
| Distinct from partner/sub-vendor org access | ✓ — internal role, unrelated to the Action-on-you partner-approval flow | ✓ | ✓ | ✓ |

---

## Nuances & Gotchas

- The job-owner card and the collaborators panel are **structurally different components** — the owner
  is a fixed, always-present single card with its own `Transfer ownership` button; collaborators are a
  separate list panel that can be empty (`No collaborators assigned yet.`) and is where `+ Add member`
  rows would land.
- **`JOB ROLE` has exactly three values: `Sourcing`, `Screening`, `HM rep`.** This is a closed set in
  the `Add to job team` dropdown — no `+ Add role` or custom-role affordance exists.
- Ownership and collaborator role are **mutually exclusive by design**: the `Transfer ownership` modal
  states outright that the incoming owner's other job roles are removed on transfer.
- Roles are **job-scoped** (`JOB ROLE` label, page namespaced to `/jobs/<id>/team`), and sit one level
  below the workspace/organization layer exposed via `Control` → Control Tower, which manages
  **organizations** (recruiter agencies), not individual per-job roles.
- Neither the `Add to job team` teammate picker nor the `Transfer ownership` picker ever populated an
  eligible option in this tenant — both are empty-state-only in the evidence gathered; treat "what
  happens once someone is actually added/transferred" as unverified.
- `HM rep` is the standout role name and the best available lead connecting `Manage team` to
  `Client coordination` — but that connection is an inference from naming, not confirmed by testing.
- Guardrails were respected throughout: no invite was sent, no ownership transfer was completed, no
  member was removed. Every modal here was opened, enumerated, and backed out via `Cancel`.
