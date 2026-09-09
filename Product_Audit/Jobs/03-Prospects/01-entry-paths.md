# Prospects — Entry paths

**The single most important structural fact:** you cannot create a prospect from inside `/jobs/<id>/prospects`. That screen has no `Add`, `Upload`, `Import` or `Source` button. Every candidate is created in the **global private pool** first, and is then *attached* to a job as a prospect.

The intake modal states this literally, on every one of its four tabs:

> `ALL CANDIDATES LAND IN THE GLOBAL POOL FIRST.`

and the upload landing page repeats it:

> `Four doors into the pool - one at a time, bulk upload, a folder of CVs, or a CSV. Every entry is yours and yours alone, in the private pool.`

## Two-step model

```
   ┌──────────── STEP 1: get the person into the GLOBAL POOL ─────────────┐
   │  /people  ·  "Add candidates" modal  ·  /people?view=upload          │
   │   ┌──────────┬─────────────┬──────────────┬──────────────┐           │
   │   │ Single   │ Bulk paste  │ Upload CV    │ CSV import   │           │
   │   └──────────┴─────────────┴──────────────┴──────────────┘           │
   │  (also: candidate Sign-up, Referral, LinkedIn — source values)       │
   └──────────────────────────────┬───────────────────────────────────────┘
                                  │  "Add to job" dialog  (pick 1 job)
                                  ▼
   ┌──────────── STEP 2: person becomes a PROSPECT on one job ────────────┐
   │  /jobs/<jobId>/prospects      status: Application not submitted      │
   └──────────────────────────────┬───────────────────────────────────────┘
                                  │  MOVE TO PIPELINE →  (form-gated)
                                  ▼
                        /jobs/<jobId>/pipeline
```

---

## Step 1 — the four intake doors

Reached from `/people` → `Add candidates` button, or `/people?view=upload` (page `02 / UPLOAD`, H1 `Bring people in`) which links to the same modal with a tab preselected.

**Modal chrome:** kicker `ADD CANDIDATE`, title `Bring talent in`, subtitle `Hand-enter, paste a list, drop CVs, or import a spreadsheet.` Tabs: `Single` · `Bulk paste` · `Upload CV` · `CSV import`. Footer note `ALL CANDIDATES LAND IN THE GLOBAL POOL FIRST.` plus `Cancel` and a tab-specific primary button.

### Door 1 — `Single` ("01 / INDIVIDUAL — One at a time")

Card copy: `Manually add a single candidate with full control over headline, current company, and location.` → `ADD CANDIDATE ->`
Modal helper: `Add one candidate by hand.`

| Label | Control | Required | Placeholder | Limits / options |
|---|---|---|---|---|
| `FULL NAME *` | text | **Yes** | `Aryan Mehta` | no maxlength attribute |
| `HEADLINE *` | text | **Yes** | `Senior Backend Engineer · Payments` | no maxlength |
| `CURRENT COMPANY` | text | No | `Razorpay` | — |
| `LOCATION` | text | No | `Bangalore` | free text, not a picker |
| `EMAIL` | `input[type=email]` | No | `aryan@example.com` | browser email validation only |
| `RESUME (OPTIONAL)` | file drop zone | No | `Drop a CV here or click to browse` | Hint: `PDF, PNG, JPG, OR WEBP · UP TO 20 MB`. `accept=".pdf,.png,.jpg,.jpeg,.webp"`, single file (`multiple` not set) |

Primary button: `Add candidate` — **always enabled**, even with both required fields empty. Validation is *post-submit inline*: clicking it with an empty form replaces the placeholders with error text in place:

- `FULL NAME *` → `Enter the candidate's name`
- `HEADLINE *` → `Add a short headline`

No toast, no summary banner, no field outline changes captured; the modal stays open.

### Door 2 — `Bulk paste` ("02 / BULK — Paste a batch")

Card copy: `Add multiple candidates from a structured list. Best when you already have names, emails, roles, companies, and locations ready.` → `OPEN BULK UPLOAD ->`
Modal helper: `Paste a list — one per line.`

| Label | Control | Required | Notes |
|---|---|---|---|
| `PASTE CANDIDATES — ONE PER LINE` | textarea, 5 rows | Yes (implicitly) | Placeholder shows two example lines: `Aryan Mehta, aryan@example.com, Senior Backend, Razorpay, Bangalore` / `Ishita Bose, ishita@example.com, Staff Frontend, Swiggy, Bangalore` |
| `FORMAT` (static text) | — | — | `name, email, headline, company, location — extra columns ignored.` |

Primary button: `Add list` — enabled even when the textarea is empty.

**Hard constraint:** the paste format is **positional, comma-separated, exactly these five fields in this order**; anything beyond the 5th comma is discarded (`extra columns ignored`). No header row, no column mapping step.

### Door 3 — `Upload CV` ("03 / CVS — Drop a folder")

Card copy: `Drag and drop multiple resumes - PDF, DOCX, RTF - and let the parser shape them into structured candidates with all 6 signals.` → `OPEN CV UPLOADER ->`
Modal helper: `Drop PDFs or images — we parse them.`

| Label | Control | Required | Notes |
|---|---|---|---|
| (drop zone) | `input[type=file]`, `multiple` | Yes | `Drop CVs here or click to browse` |
| (hint line) | — | — | **`PDF, PNG, JPG, OR WEBP · UP TO 20 MB EACH · 100 FILES MAX`** |
| `accept` attribute | — | — | `.pdf,.png,.jpg,.jpeg,.webp` |

Primary button: `Parse & add` — **disabled until at least one file is attached.**

**Contradiction to know:** the Upload-page card advertises `PDF, DOCX, RTF`; the actual uploader accepts `PDF, PNG, JPG, WEBP` and the `accept` attribute has no `.docx` or `.rtf`. DOCX/RTF will not be selectable.

### Door 4 — `CSV import` ("04 / CSV — Use our template")

Card copy: `Download the predefined CSV format, fill it in, add custom columns as needed, and re-upload. Best for migrating an existing list.` → `DOWNLOAD & UPLOAD ->`
Modal helper: `Import from a spreadsheet.`

| Label | Control | Required | Notes |
|---|---|---|---|
| (drop zone) | `input[type=file]`, `accept=".csv"`, single | Yes | `Drop a CSV here or click to browse` |
| (hint line) | — | — | `ANY SPREADSHEET WORKS — COLUMNS ARE DETECTED AUTOMATICALLY` |
| `HOW IT WORKS` | static | — | `No template needed — we detect Name, Email, Phone, Role, Company, Location, Experience and Skills from your columns, and you confirm the mapping before anything is imported. Only Name is required.` |

Primary button: `Import CSV` — **disabled until a file is attached.**

**Second contradiction:** the Upload-page card says `Download the predefined CSV format` / `Use our template`, while the modal says `No template needed`. There is no template download button in the modal. The 8 auto-detected columns are: Name, Email, Phone, Role, Company, Location, Experience, Skills — **only `Name` is required**. A mapping-confirmation step is promised before import commits.
> UNVERIFIED: the mapping-confirmation screen itself (no CSV was uploaded — guardrail).

### Recent ingestion feed

`/people?view=upload` ends with a `RECENT INGESTION` list, one row per file: `<slug>.pdf` / `Parsed resume · Enriched N signals` / status pill `DONE`. Observed `N` values ranged **5 to 10**. This is the only visible audit trail of parsing + enrichment. Only `DONE` was observed as a status.

---

## Other source values (paths not driven from the Add modal)

The prospects `SOURCE` filter enumerates exactly five source values, which is the authoritative list of how a person can arrive:

| `SOURCE` value | Meaning |
|---|---|
| `LinkedIn` | Sourced from LinkedIn. > UNVERIFIED: no browser-extension or LinkedIn-connect UI was found in the recruiter app; the value exists but its producer was not located |
| `CSV` | Door 4 |
| `CV` | Door 3 (or the `RESUME (OPTIONAL)` field of Door 1) — the dominant value in the demo pool |
| `Referral` | `/people?view=community` describes `Referral lanes — Track who introduced a candidate and route follow-ups cleanly.` > UNVERIFIED: no referral-capture form was reachable |
| `Sign-up` | Candidate self-registers and lands in the pool. `/people` subtitle: `Every professional who touches the platform - uploaded, signed-up, or sourced - lands here first.` |

A sixth, job-scoped state exists as a *source* value on the prospect record itself: `Not submitted` (shown as `SRC Not submitted` in the drawer chip and in the `SOURCE` column) — this is what a prospect reads when it was attached to the job before any application existed.

There is **no browser-extension entry path visible** anywhere in the recruiter app. > UNVERIFIED as absent rather than confirmed-absent.

---

## Step 2 — attaching a pool candidate to a job as a prospect

Two triggers, **one shared dialog**:

| Trigger | Where |
|---|---|
| `Add as prospect →` | Footer of the candidate drawer in `/people` (next to `Add to hotlist`) |
| `Add to Pipeline` | Bulk bar in `/people` after selecting rows (bar reads `N selected  [Add to Pipeline] [Hotlist] [Export] [Remove]`) |

**The dialog (identical for both):**

| Element | Copy / control |
|---|---|
| Title | `Add to job` |
| Subtitle | `N candidate will be added as prospect` (literal singular observed: `1 candidate will be added as prospect`) |
| `JOB` | Single-select dropdown of every job the recruiter can see, rendered as `<title> · <partner-or-owner> · <client>`, e.g. `Strategic & Planning Manager Recruitment · Partner · CP`. Defaults to the **first job in the list**, not to any current job |
| Cancel | `Cancel` |
| Primary | `Add N as prospect` |

Job options observed in the picker (17 entries, one job per line, includes duplicates and junk titles from the demo tenant): `Strategic & Planning Manager Recruitment · Partner · CP`, `Full-Stack Engineer`, `Interaction Designer / UX Designer`, `UI/UX Designer`, `Mechanical Design Engineer (XR/Consumer Electronics)`, `Senior Backend Engineer`, `DevOps / Platform Engineer`, `Mechanical Design Engineer (XR/Consumer Electronics)`, `Product Designer`, `5`, `UX Designer`, `w`, `Product Manager`, `Product Designer`, `Engineering Manager`, `Data Analyst`, `Frontend Engineer`.

**The naming trap:** the bulk button says `Add to Pipeline` but the dialog it opens says `will be added as prospect` and `Add N as prospect`. It does **not** put anyone in the pipeline — it puts them in the job's *prospects* pool. The label is wrong relative to the product's own prospect/pipeline vocabulary.

Also note the dialog picks **exactly one job**. There is no multi-job attach.

> UNVERIFIED: dedupe behaviour. No "already a prospect on this job" or "already a candidate elsewhere" warning appeared in the dialog before the primary button, and the primary action was not fired (guardrail). The dialog offers no visible duplicate check, no merge prompt, and no per-candidate skip list.

---

## What the prospect record looks like immediately after attach

Based on the two prospects on job `a6bb5e69…`:

| Field | Value at attach |
|---|---|
| `SOURCE` column / `SRC` chip | `Not submitted` |
| `ADDED` chip | `Not submitted` |
| `STATUS` | `Application not submitted` |
| `COMMUNICATION` | `AI call: never used`, `Email: never used`, `WhatsApp: never used`, footer `Not contacted` |
| `OUTREACH` badge | `0` |
| Drawer banner | `Resume uploaded — application not submitted.` `This candidate used autofill but hasn't completed the form yet.` |
| Drawer tabs gained vs pool | Pool drawer has 3 tabs (`CANDIDATE PROPERTY`, `APPLICATION PROPERTY`, `RESUME`). Job-prospect drawer has 6 (adds `APPLICATION`, `COMMUNICATION`, `OUTREACH`) |

## Nuances & Gotchas

- No prospect can be created from the job's Prospects screen. Zero create affordances there.
- `ALL CANDIDATES LAND IN THE GLOBAL POOL FIRST.` is printed on all four intake tabs — the global pool is mandatory, not optional.
- `Upload CV` hard limits: **20 MB per file, 100 files max**, and `PDF, PNG, JPG, WEBP` only. `DOCX` and `RTF` are advertised on the Upload page but are **not** in the `accept` list.
- `CSV import` says `No template needed` while the Upload page says `Download the predefined CSV format` — the two surfaces disagree and there is no template download button.
- CSV auto-detects 8 columns (Name, Email, Phone, Role, Company, Location, Experience, Skills); **only `Name` is required**; a mapping confirmation precedes import.
- `Bulk paste` is positional CSV in a fixed 5-field order — `name, email, headline, company, location` — and `extra columns ignored`.
- `Single` requires `FULL NAME` and `HEADLINE` only; its `Add candidate` button never greys out, so validation is discovered only after clicking (`Enter the candidate's name`, `Add a short headline`).
- `Parse & add` and `Import CSV` **are** disabled until a file is attached; `Add candidate` and `Add list` are not.
- The `/people` bulk button `Add to Pipeline` is mislabelled — it opens `Add to job` and adds people as **prospects**.
- The `Add to job` dialog attaches to exactly one job and defaults to the first job in the list, not the job you came from.
- No dedupe / duplicate warning is surfaced in the attach dialog.
- `LinkedIn` and `Referral` exist as `SOURCE` filter values but no UI producing them was found in the recruiter app.
