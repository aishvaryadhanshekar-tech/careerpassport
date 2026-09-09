# Job Setup — `/jobs/<id>/setup`

**H1:** `The source of truth`
**Subtitle:** `Everything captured at intake. Edit here — overview, candidate-facing surfaces, and routing all read from this.`
**Breadcrumb:** `JOB SETUP · FULL-STACK ENGINEER → [Active]`

This is the intake record. It is not a settings page — it is the authoring surface that every other
section of the module renders from. If a value appears anywhere else in the product, it was almost
certainly typed here.

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ JOB SETUP · FULL-STACK ENGINEER → (Active)        [4/7 sections complete]    │
│ The source of truth                                                          │
│ Everything captured at intake. Edit here — …                                 │
│                                                                              │
│ ┌────────────────────┐  ┌──────────────────────────────────────────────────┐ │
│ │ ▸ Role & comp    ○ │  │ <Section title>                                  │ │
│ │ ▸ Requirements   ○ │  │ <section subtitle>                               │ │
│ │ ▸ Job description ⊘│  │ ┌──────────────────────────────────────────────┐ │ │
│ │ ▸ Application form⊘│  │ │  two-column field grid                       │ │ │
│ │ ▸ Sourcing brief ○ │  │ │  (single column for long textareas)          │ │ │
│ │ ▸ Visibility     ⊘ │  │ └──────────────────────────────────────────────┘ │ │
│ │ ▸ Lifecycle      ⊘ │  │                                  [Save section]  │ │
│ └────────────────────┘  └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
     ○ = incomplete      ⊘ = complete (check-in-circle)
```

Left rail = section switcher. Right pane = one section's fields at a time. One `Save section`
button per section, bottom-right.

## The 7 sections

| # | Section | Subtitle | Doc |
|---|---|---|---|
| 1 | `Role & comp` | `The shape of the seat. Title, level, location, and what the role pays.` | [01](./01-Role-And-Comp.md) |
| 2 | `Requirements` | `Must-haves vs. nice-to-haves. Used by sourcing and screening.` | [02](./02-Requirements.md) |
| 3 | `Job description` | `What recruiters and the careers page show. Internal notes stay private.` | [03](./03-Job-Description.md) |
| 4 | `Application form` | `What every applicant fills before entering the funnel.` | [04](./04-Application-Form.md) |
| 5 | `Sourcing brief` | `Where to look, where not to, and how to talk to candidates.` | [05](./05-Sourcing-Brief.md) |
| 6 | `Visibility & posting` | `Where the role is published and who can see it.` | [06](./06-Visibility-And-Posting.md) |
| 7 | `Lifecycle` | `Status, deadlines, and headcount tracking. Status drives the badge everywhere else.` | [07](./07-Lifecycle.md) |

Section order in the rail is fixed and matches the table above.

## Completion model

A badge top-right reads `4/7 sections complete`. Each rail item carries a completion glyph:
a hollow circle (incomplete) or a check-in-circle (complete).

Observed on the reference job (`Full-Stack Engineer`, Active):

| Section | Glyph | Empty fields present |
|---|---|---|
| Role & comp | ○ incomplete | Department, Team, Experience level, Open positions, Currency, Notice period |
| Requirements | ○ incomplete | Education, Training / certifications |
| Job description | ⊘ complete | Benefits, and all of Company context |
| Application form | ⊘ complete | — |
| Sourcing brief | ○ incomplete | Channels, Diversity preference, Voice note from HM |
| Visibility & posting | ⊘ complete | — |
| Lifecycle | ⊘ complete | Target close date, Headcount filled, Closed at |

The glyphs reconcile exactly to the `4/7` counter.

> UNVERIFIED: the precise completeness rule. Note it is **not** "all fields filled" — `Job description`
> and `Lifecycle` are marked complete while still holding empty fields. So each section has its own
> required subset, and Role & comp / Requirements / Sourcing brief are each missing at least one
> field from their own subset.

## Save model

- Each section saves independently via its own `Save section` button.
- `Save section` renders **disabled** (pale coral) when the form is clean, and enables on edit.
  There is no autosave.
- A dirty-state guard exists when switching sections with unsaved edits.
  > UNVERIFIED: the exact copy of the dirty-state prompt.

## Active vs Draft

Draft jobs deep-link here from the jobs list (active jobs go to `/overview` instead), because a draft's
intake is by definition unfinished. The same 7 sections are present in both states.

> UNVERIFIED: whether any field becomes read-only once a job is Active.

## Nuances & Gotchas

- Setup is the **only** place job data is authored. `/overview`, the candidate-facing posting and
  routing are all read-views over these fields.
- `Save section` is per-section, not per-page. Editing two sections requires two saves.
- The completion counter does **not** mean "all fields filled" — two sections count as complete while
  holding empty fields.
- A section's own completion glyph is masked while that section is selected (the glyph turns coral to
  indicate selection), so read a section's state from a screenshot of a *different* section.
- `Status` lives in `Lifecycle`, and its own subtitle states it `drives the badge everywhere else` —
  so job status is authored here and mirrored everywhere, never set from the list view.
- The `Lifecycle` section carries `Pause job` and `Close job` buttons that act **immediately, with no
  confirmation dialog**. See [07-Lifecycle](./07-Lifecycle.md).
