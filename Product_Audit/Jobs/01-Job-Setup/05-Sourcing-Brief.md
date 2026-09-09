# Setup › Sourcing brief

**Subtitle:** `Where to look, where not to, and how to talk to candidates.`

Single-column card, four fields.

| Label | Control | Helper text | Observed value |
|---|---|---|---|
| `CHANNELS` | textarea | `One per line.` | *(empty)* |
| `NO-GO COMPANIES` | textarea | `Sourcing will exclude these. One per line.` | 2 lines |
| `DIVERSITY PREFERENCE` | textarea | — | *(empty)* |
| `VOICE NOTE FROM HM` | url text | `Optional audio brief from the hiring manager.` | *(empty)*, placeholder `https://…` |

### Observed content

`NO-GO COMPANIES`:
```
Mobile-first shops (React Native teams)
Data engineering or backend-only orgs
```

## Nuances & Gotchas

- `NO-GO COMPANIES` is **functionally active, not documentation** — the helper text states
  `Sourcing will exclude these`, so entries here filter sourcing results.
- The no-go entries on the reference job are **company *categories*, not company names**
  (`Mobile-first shops (React Native teams)`). Whether the exclusion engine can act on a category
  string is unclear.
  > UNVERIFIED: how free-text no-go entries are matched against real companies.
- `VOICE NOTE FROM HM` stores a **URL to externally-hosted audio** — it is not an in-app recorder or
  uploader.
- `DIVERSITY PREFERENCE` is unstructured free text with no helper guidance.
- This section is marked incomplete on the reference job with 3 of 4 fields empty.
