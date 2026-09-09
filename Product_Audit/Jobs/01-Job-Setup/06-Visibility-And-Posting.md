# Setup › Visibility & posting

**Subtitle:** `Where the role is published and who can see it.`

| Label | Control | Observed value |
|---|---|---|
| `VISIBILITY` | select | `Internal` |
| `CAREERS-PAGE SLUG` | text | `cp-demo-full-stack-engineer` |

> UNVERIFIED: the full `VISIBILITY` option list. Only `Internal` was captured.

## Syndication

Four independent toggles. **All four are OFF** on the reference job.

| Board | Toggle state |
|---|---|
| `Linkedin` | off |
| `Naukri` | off |
| `Indeed` | off |
| `Instahyre` | off |

The board list is fixed — there is no "add a board" affordance in this section.

## Nuances & Gotchas

- **`Active` status does not mean publicly visible.** The reference job is `Active` while
  `VISIBILITY` is `Internal` and all four syndication toggles are off. Job status (from `Lifecycle`)
  and job reach (from this section) are fully independent axes. This is the single most
  misinterpretable pair of settings in the module.
- Syndication is per-board and per-job, toggled here rather than at a workspace level.
- The syndication board set is closed: `Linkedin`, `Naukri`, `Indeed`, `Instahyre`. Two of the four are
  India-market boards, consistent with the product's INR/Bengaluru defaults.
- `CAREERS-PAGE SLUG` is editable free text, so the public URL of a role can be changed after
  publishing — with the usual link-rot consequence.
  > UNVERIFIED: whether the slug is uniqueness-validated.
- This section counts as **complete** while `VISIBILITY` is `Internal` and nothing is syndicated —
  completeness measures "filled in", not "reachable by candidates".
