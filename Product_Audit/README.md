# Product Audit — CareerPassport

A knowledge base of verified product behaviour, built by driving the live recruiter app at
`hire.careerpassport.ai` with Playwright and documenting what was actually observed.

**Purpose:** so nobody has to explain a nuance twice. Constraints like *"Rapid Fire only supports
single select with exactly two options"* live here, stated precisely, with the misreadings called out.

## Evidence standard

- Everything stated as fact was **directly observed** in the running product.
- Anything not confirmed is marked `> UNVERIFIED:` inline. Guesses are never presented as facts.
- Literal UI copy is quoted in backticks so it can be searched for in the product.
- Every doc ends with `## Nuances & Gotchas` — the terse, high-value facts.

## Modules

### [Jobs](./Jobs/README.md)
The core module. Ten sections per job. Start with
[Jobs/README.md](./Jobs/README.md) for the route map and data-flow architecture.

| Section | Status | Lines |
|---|---|---|
| [Job Setup](./Jobs/01-Job-Setup/) — all 7 intake sections | ✅ complete | 554 |
| [Trips / Assessments](./Jobs/06-Trips-Assessments/) — incl. full lever reference | ✅ complete | 694 |
| [Jobs list & creation](./Jobs/00-Jobs-List-And-Creation/) | ⬜ pending | — |
| [Job overview](./Jobs/02-Job-Overview/) | ⬜ pending | — |
| [Prospects](./Jobs/03-Prospects/) — list, filters, 4 intake doors | ✅ complete | 426 |
| [Pipeline](./Jobs/04-Pipeline/) — stage model, review drawer | 🟡 core done | 180 |
| [Communications](./Jobs/05-Communications/) | ⬜ pending | — |
| [Action on you](./Jobs/07-Action-On-You/) | ⬜ pending | — |
| [Client coordination](./Jobs/08-Client-Coordination/) | ⬜ pending | — |
| [Activity](./Jobs/09-Activity/) | ⬜ pending | — |
| [Manage team](./Jobs/10-Manage-Team/) | ⬜ pending | — |

Out of scope so far: `Marketplace`, `People`, `Reports`, `Control`.

## Start here for common questions

| Question | Doc |
|---|---|
| What are the lever types and their limits? | [Jobs/06-Trips-Assessments/01-Lever-Reference.md](./Jobs/06-Trips-Assessments/01-Lever-Reference.md) |
| Where is a job's data authored? | [Jobs/01-Job-Setup/README.md](./Jobs/01-Job-Setup/README.md) |
| What does a candidate actually fill in? | [Jobs/01-Job-Setup/04-Application-Form.md](./Jobs/01-Job-Setup/04-Application-Form.md) |
| How does a job's status work? | [Jobs/01-Job-Setup/07-Lifecycle.md](./Jobs/01-Job-Setup/07-Lifecycle.md) |
| How does an assessment reach a candidate? | [Jobs/06-Trips-Assessments/03-Publishing-And-Assignment.md](./Jobs/06-Trips-Assessments/03-Publishing-And-Assignment.md) |
| What are the routes / overall shape? | [Jobs/README.md](./Jobs/README.md) |

Last updated: 2026-09-04
