# Setup › Requirements

**Subtitle:** `Must-haves vs. nice-to-haves. Used by sourcing and screening.`

This section is explicitly consumed by two downstream systems: **sourcing** and **screening**.

| Label | Control | Helper text | Observed value |
|---|---|---|---|
| `MUST-HAVE SKILLS` | textarea | `One per line. Optional years: React · 3+ yrs` | 4 lines |
| `GOOD-TO-HAVE SKILLS` | textarea | — | 4 lines |
| `EDUCATION` | text | — | *(empty)* |
| `TRAINING / CERTIFICATIONS` | text | — | *(empty)* |
| `YOE MIN` | number | — | `3` |
| `YOE MAX` | number | — | `7` |
| `PROSPECT COMPANIES` | textarea | `Where the strongest candidates likely come from. One per line.` | 2 lines |

### Observed content (reference job)

`MUST-HAVE SKILLS`:
```
3+ years shipping production web applications with React and Node.js backend
strong TypeScript fundamentals
comfortable designing relational schemas and writing efficient PostgreSQL queries
experience with Next.js or a comparable server-rendered React framework
```

`GOOD-TO-HAVE SKILLS`:
```
Ship full-stack features from design to production
Build typed TypeScript across React and Node.js
Design relational schemas and optimize PostgreSQL queries
Collaborate with design and product on scope refinement
```

`PROSPECT COMPANIES`:
```
Vercel, Stripe, Notion, Linear
Series A–C startups with React+Node stacks
```

## Nuances & Gotchas

- Skills are **free-text, one per line** — not a tag picker and not a controlled vocabulary. There is
  no autocomplete or canonical skill list.
- `MUST-HAVE SKILLS` supports an **optional inline years suffix** using a middot: `React · 3+ yrs`.
  This is a parsing convention embedded in helper text, not a separate field.
- `YOE MIN`/`YOE MAX` duplicate experience information that also exists as `EXPERIENCE LEVEL` in
  `Role & comp`. Two independent representations of seniority, neither derived from the other.
- `PROSPECT COMPANIES` is one-per-line, but the reference data puts **four companies on one line**
  (`Vercel, Stripe, Notion, Linear`) — so the one-per-line convention is not enforced.
- `GOOD-TO-HAVE SKILLS` on the reference job contains responsibility statements ("Ship full-stack
  features…"), not skills — the field does not validate its own semantics.
