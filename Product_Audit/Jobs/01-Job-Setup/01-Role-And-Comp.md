# Setup › Role & comp

**Subtitle:** `The shape of the seat. Title, level, location, and what the role pays.`

Two-column field grid.

| Label | Control | Observed value | Notes |
|---|---|---|---|
| `CLIENT` | select | `No client` | Helper: `THE COMPANY THIS ROLE IS BEING FILLED FOR.` plus a `MANAGE CLIENTS` link |
| `DEPARTMENT` | text | *(empty)* | |
| `TEAM` | text | *(empty)* | |
| `EMPLOYMENT TYPE` | select | `full time` | |
| `EXPERIENCE LEVEL` | select | *(unset — shows placeholder `Select level`)* | |
| `OPEN POSITIONS` | number | *(empty)* | |
| `LOCATION` | text | `Bengaluru, India` | placeholder `e.g. Bangalore` |
| `LOCATION TYPE` | select | `hybrid` | |
| `CURRENCY` | select | *(empty)* | |
| `SALARY PERIOD` | select | `Per year` | |
| `CTC MIN ()` | number | `1800000` | label interpolates currency — see gotcha |
| `CTC MAX ()` | number | `3200000` | label interpolates currency — see gotcha |
| `NOTICE PERIOD (DAYS)` | number | *(empty)* | |

Note there is **no job title field in this section** — `JOB TITLE` lives in `Job description`.

## Option lists

> UNVERIFIED: full option lists for `CLIENT`, `EMPLOYMENT TYPE`, `EXPERIENCE LEVEL`, `LOCATION TYPE`,
> `CURRENCY` and `SALARY PERIOD`. Only the currently-selected values were captured
> (`No client`, `full time`, `hybrid`, `Per year`). Enumerating these is the top open item for this section.

## Nuances & Gotchas

- **`CTC MIN ()` / `CTC MAX ()` render with empty parentheses** when `CURRENCY` is unset. The label
  interpolates the selected currency code and degrades to bare `()` rather than hiding the parens —
  so a blank currency is visible as a cosmetic defect in the label.
- Compensation is stored as raw integers with no thousands separators in the input (`1800000`), while
  the candidate-facing application preview formats the same class of value Indian-style (`20,00,000`).
- `EXPERIENCE LEVEL` is a select with placeholder `Select level`; on the reference job it is unset even
  though the job is Active, so **experience level is not required to publish**.
- Salary is a min/max pair plus a separate period and currency — four fields must agree for comp to
  read correctly downstream.
- Job title is *not* here despite this section being named "Role" — look in `Job description`.
