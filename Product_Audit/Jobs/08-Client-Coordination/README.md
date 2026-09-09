# Client coordination — the sidebar's unresolved item, resolved

Sidebar order (confirmed): `Job overview`, `Prospects`, `Pipeline`, `Communications`, `Trips`,
`Action on you`, `Activity`, **`Client coordination`**, `Manage team`, `Job setup`.

## Verdict

**It is a feature-flagged nav item pointing at a real, fully built page.** The sidebar entry itself is
**globally disabled** — confirmed via DOM inspection, not just visual impression — on every job tested
(3 different job IDs, including two with active partner/client data). But the page it would link to,
at the route `/jobs/<id>/client`, is fully implemented and renders rich content when navigated to
directly. This is a **dark-launched / soft-gated feature**: built, wired to real data, and
deliberately hidden from normal navigation behind a "coming soon" label.

---

## 1. The gate — hard evidence

Inspecting the sidebar `<span>` for this item (via `page.evaluate`) on the default demo job returns:

```html
<span aria-label="Client coordination (coming soon)"
      aria-disabled="true"
      title="Client coordination (coming soon)"
      class="group flex items-center rounded-md p-1 transition-colors duration-150
             gap-2 cursor-not-allowed opacity-45">
  …
  <span class="text-sm font-medium … text-ink-400">Client coordination</span>
</span>
```

- **`aria-disabled="true"`** and **`cursor-not-allowed`** — a genuine disabled control, not a styling
  accident.
- **Literal copy, both as `title` (hover tooltip) and `aria-label`:** `Client coordination (coming
  soon)`.
- **This is not job-specific.** The identical `aria-disabled="true"` / `title="Client coordination
  (coming soon)"` was reproduced on **three separate jobs**: the default demo job
  (`a6bb5e69-b2e5-4ee2-9280-ba4a830c7c84`) and two jobs with active partner-request/client data
  (`5595d0b1-0bb9-4027-a32a-78a55b051132`, `9b2e60c2-f8c0-4cf9-ac1c-05e02ea4ae4b`). A `force`-clicked
  attempt on the disabled span does not navigate anywhere on any of the three.
- **Conclusion: this is a blanket "coming soon" flag on the sidebar entry, applied to every job in
  the tenant — it is not role-gated or data-gated.** The earlier working hypothesis (gated by whether
  the job has client-thread data) is **wrong**; two of the three jobs tested *do* have live partner
  data and the item is still disabled identically.

---

## 2. The real route — found by brute force, fully functional

The disabled sidebar item carries no visible `href`. The underlying page was located by trying
candidate slugs directly in the URL bar (`client-coordination`, `clients`, `client`, `coordination`,
`client-portal`, `partners`) against the job base path. **`/jobs/<id>/client` resolves** and renders a
complete page — the other candidates 404 or redirect.

**Eyebrow:** `CLIENT COORDINATION`
**H1:** `One thread per candidate`
**Subtitle:** `Stay aligned with the hiring manager. Sorted by latest activity.`

So the feature exists, has its own eyebrow/H1/subtitle matching the sidebar label, and is reachable —
just not through the sidebar link a user would actually click.

> UNVERIFIED: whether typing this URL directly is a "leak" (an oversight that will eventually be
> blocked) or an intentional preview path; whether any account type sees this sidebar item enabled.

---

## 3. Layout — ASCII sketch (the page, reached via direct URL)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Career Passport   Jobs  Marketplace  People  Reports  Control   🔔17  DR │
├──┬───────────────────────────────────────────────────────────────────────┤
│  │ CLIENT COORDINATION                                                   │
│  │ One thread per candidate                                              │
│  │ Stay aligned with the hiring manager. Sorted by latest activity.      │
│  │                                                                        │
│  │ ┌─────────────────────┐ ┌────────────────────────────────────────┐  │
│  │ │ Aditya Rao           │ │ Communication: Aditya Rao          ⋮   │  │
│  │ │ [UPCOMING INTERV...] │ │ CLIENT: ACME CORP HM                    │  │
│  │ │ Senior Backend Eng.   │ ├──────────────────────────────────────── │
│  │ │ 9h ago · Cloud        │ │            YOU · 2 DAYS AGO             │
│  │ ├─────────────────────┤ │ ┌──────────────────────────────────┐    │
│  │ │ Meera Gupta           │ │ │ Hi David, sharing this profile.   │    │
│  │ │ [FEEDBACK PENDING]    │ │ │ Exact match based on the brief.   │    │
│  │ │ Staff Frontend Eng.   │ │ │ Sent standard dossier.            │    │
│  │ │ 10h ago · Web         │ │ └──────────────────────────────────┘    │
│  │ ├─────────────────────┤ │ HM (DAVID) · 1 DAY AGO                   │
│  │ │ Sanjay Kulkarni       │ │ ┌──────────────────────────────────┐    │
│  │ │ [TRIP NOT COMPLE...]  │ │ │ Looks solid. Can we schedule a    │    │
│  │ │ Data Engineer         │ │ │ 30-min screening this week? I     │    │
│  │ │ 11h ago · ML          │ │ │ have blocks on Tue/Thu morning.   │    │
│  │ ├─────────────────────┤ │ └──────────────────────────────────┘    │
│  │ │ Lakshmi Iyer          │ │                        YOU · 10M AGO   │
│  │ │ [AWAITING OFFER]      │ │            ┌──────────────────────┐    │
│  │ ├─────────────────────┤ │            │ Checking with the       │
│  │ │ Devendra Pal          │ │            │ candidate. Will confirm│
│  │ │ [REQUESTED RE-SC...]  │ │            │ shortly.               │
│  │ ├─────────────────────┤ │            └──────────────────────┘    │
│  │ │ Ananya Bhat           │ │                                        │
│  │ │ [UPCOMING INTERV...]  │ │ [SCHEDULE][REJECT][ON HOLD]            │
│  │ └─────────────────────┘ │ ┌────────────────────────────────────┐  │
│  │                          │ │ Type your message to the client…  │  │
│  │                          │ │ 📎                          [Send]│  │
│  │                          │ └────────────────────────────────────┘  │
└──┴───────────────────────────────────────────────────────────────────────┘
```

---

## 4. Thread list (left rail)

- No section header beyond the page H1/subtitle — cards start immediately, **sorted by latest
  activity** (per the subtitle), not alphabetically.
- Six threads observed, one per candidate. Card anatomy:
  - Candidate name (bold, serif)
  - A **status chip**, top-right of the card — six distinct values observed, truncated with `…` at
    this width: `UPCOMING INTERV…` (×2, different candidates), `FEEDBACK PENDING`,
    `TRIP NOT COMPLE…`, `AWAITING OFFER`, `REQUESTED RE-SC…` (Requested re-schedule)
  - Role title + a tag (e.g. `SENIOR BACKEND ENGINEER` / `CLOUD`)
  - A relative timestamp + the same tag on the second line (`🕐 9H AGO · CLOUD`)
- The **active thread** is outlined (teal-green border in the capture); `Aditya Rao` is selected by
  default on load. Clicking `Meera Gupta` swaps the right pane header to `Communication: Meera Gupta`
  and re-selects that card's outline — the thread switch itself works correctly.

> ⚠️ **Flag, not a confirmed bug:** the message bubbles shown in the right pane were **identical in
> content** across the `Aditya Rao` and `Meera Gupta` captures (same "Hi David, sharing this
> profile…" / "Looks solid. Can we schedule…" / "Checking with the candidate…" text, same relative
> timestamps). Consistent with either shared seed/demo data reused per thread, or the pane not
> actually refetching per-candidate content — not independently confirmed either way.

---

## 5. Thread detail (right pane)

- Header: `Communication: {Candidate name}` with `CLIENT: {Client org} {contact role}` beneath (e.g.
  `CLIENT: ACME CORP HM` — `HM` = hiring manager) and a `⋮` overflow menu top-right (opened once; its
  contents were not captured before dismissal).
- Message thread: alternating bubbles — right-aligned dark-green for `YOU`, left-aligned light for the
  `HM (David)` contact, each labelled `{sender} · {relative time}`.
- **Action row** above the composer: `SCHEDULE`, `REJECT`, `ON HOLD` pill buttons — the recruiter's
  client-facing decision controls for *this candidate*, distinct from Pipeline's own stage-move UI.
  `REJECT` renders in the product's red/destructive style.
- **Composer:** placeholder `Type your message to the client…`, 📎 attach icon, `Send` button. Typing
  `"test draft"` did not visibly change `Send`'s enabled styling — no obvious empty-guard observed.

> UNVERIFIED: `⋮` menu contents; whether `Send` truly has no empty-guard; confirmation copy behind
> `SCHEDULE` / `REJECT` / `ON HOLD`; attachment picker behavior.

---

## 6. Relation to "partner access requests" (Section A)

`Client coordination` and the `PARTNER INTEREST REQUESTS` banner on **Action on you**
(`../07-Action-On-You/README.md` §2) model two distinct external relationships:

| | Client coordination | Partner access requests |
|---|---|---|
| Counterparty | The **hiring manager / client** the job is being filled for | A **sub-vendor / recruiter agency** asking to source *for* this job |
| Direction | You (recruiter) ⇄ client, per-candidate | External org → you, requesting access; you approve/decline |
| Nav status | **Sidebar entry disabled tenant-wide**; page reachable only via direct URL | Fully live — banner + `Sub-vendors` tab both render normally, confirmed on the same two non-demo jobs |
| Granted via | (no "invite client" flow found) | `Approve` on the request card → populates `Sub-vendors` tab |

The important contrast: **the partner-access surface is fully shipped and navigable**, while the
client-coordination surface is **built to the same maturity but deliberately withheld from normal
navigation** on every job checked, including the same two jobs where partner access is fully live.
This rules out "both gated by the same external-engagement condition" — they clearly ship on
independent timelines.

---

## Nuances & Gotchas

- **The sidebar item is disabled tenant-wide, not job-specific.** Confirmed identical
  `aria-disabled="true"` + `title="Client coordination (coming soon)"` on three different jobs,
  two of which have live partner/client data elsewhere on the same job.
- **The literal tooltip/aria-label copy is `Client coordination (coming soon)`** — read directly off
  the DOM, not inferred.
- **The underlying page is real and complete**, at `/jobs/<id>/client` (found by brute-forcing
  candidate route slugs — `client-coordination`, `clients`, `coordination`, `client-portal`, and
  `partners` all fail; only `client` resolves). Its eyebrow/H1/subtitle match the sidebar label
  exactly, so this is clearly the intended destination, just not yet wired to the nav.
- Mental model: explicitly **"one thread per candidate"** — no aggregate/broadcast client thread;
  every candidate gets an isolated conversation, the list sorted by recency across the whole job.
  Three client-facing decision actions (`SCHEDULE`, `REJECT`, `ON HOLD`) live here, separate from
  whatever stage-move actions exist in Pipeline — this is a second place a candidate's status can
  change from.
- The two captured threads showed byte-for-byte identical message content — worth re-checking with a
  wider thread sample before citing this page as proof of independent per-candidate message logs.
- No "invite a client contact" flow was found anywhere in the product; the HM identity (`ACME CORP
  HM` / "David") appears to already exist before this page is ever opened.
- Practical implication for anyone building on top of this: **don't treat "disabled in the sidebar"
  as "the feature doesn't exist."** Always brute-force a couple of route-slug candidates before
  writing off a greyed-out nav item as a dead end.
