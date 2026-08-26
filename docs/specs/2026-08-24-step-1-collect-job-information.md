# Step 1 — Collect job information

**Product:** CareerPassport · Create a job  
**Screen:** Step 1 of 3  
**Audience for this doc:** Cursor (implementation)  
**Fidelity:** Working prototype — real microphone + live browser transcription; real file picker; mocked AI analysis  
**Layout:** One page. Capture is the hero. Missing fields appear inline below after Analyse.

Give this file to Cursor as the source of truth for Step 1. Do not invent Steps 2 or 3. Do not call a real LLM.

---

## 0. Locked decisions

| # | Decision |
|---|----------|
| 1 | After Analyse, **only missing fields** render below the composer. Extracted fields stay off-screen. Coverage lives in a **Hint** popover on the composer (not an always-visible pill row). |
| 2 | Analysis runs only on an explicit **Analyse** action. |
| 3 | **All 12 coverage fields** must have a value before Continue unlocks. |
| 4 | **Select to apply** appears only when the AI detected **none** of those flags. It is optional. Unticked = none apply. Continue does not wait on it. |
| 5 | User can reveal extracted values via **Show what we captured** and edit them on this page. |
| 6 | Re-Analyse **only fills still-empty fields**. Manual edits and already-captured values are never overwritten. |
| 7 | Prototype stack: `getUserMedia` + `MediaRecorder` (audio) + Web Speech API (live transcript) + file picker. Analysis is a local heuristic over the transcript text. |
| 8 | Visual: composer-style capture card (Hint, Upload, and Record share outlined labelled buttons). Form fields stay pill inputs with small caps labels. Select to apply keeps the teal section title. Coverage is a labelled Hint button, not a 12-pill wall. |

### Prototype limits (do not fake these)

- Uploaded **documents and audio files are not parsed**. They attach as chips only. Mock analysis reads **transcript text** (typed + live-transcribed) only.
- If the user uploads a voice note and does not speak/type, analysis will not “hear” that file. Show the helper under attachments (copy below).
- No backend. Persist Step 1 payload in `sessionStorage` under `cp.jobDraft.v1` so a placeholder Step 2 can read it later.

---

## 1. What this page does

The hiring manager dumps everything they know about the role — by talking, typing, and attaching files. When they say they are done, they hit Analyse. The system extracts what it can into 12 fields, ticks those on the coverage checklist, and asks only for what is still missing. When all 12 have values, they Continue to Step 2.

They can keep adding voice, text, and files after the first Analyse, then Analyse again. Empty fields may fill. Filled fields stay as the user left them.

---

## 2. Page frame

**Route:** `/create-job` is Step 1. Vite + React. `/step-2` is the placeholder only.

**Background:** `#F4F5F7`. On `/create-job` and `/step-2`, the main column starts with `← Jobs` (or `← Back to Step 1` on Step 2). The three-segment stepper sits directly underneath that back link, left-aligned, about 220px wide — not in a full-width toolbar. Title and composer follow on the grey canvas.

**Page title (above the composer):**  
`Create a job` / prompt `Who are you hiring?`

**Page subtitle:**  
`Talk it through, paste notes, or attach files. We’ll pull out the role details and only ask for what’s missing.`

**Footer:** sticky to the bottom of the viewport. White bar, top 1px `#E2E6E9`.

- Left, after first Analyse: `{n}/12 covered` (same `n` as the checklist)
- Right: `Continue` (disabled until all 12 coverage fields are covered, including salary currency)

Do not add a fake “save draft” control.

---

## 3. Information model

### 3.1 Coverage fields (12) — all required to Continue

IDs are stable. Use these keys in state and `sessionStorage`.

| id | Label (UI) | Input | Required to Continue | Screenshot asterisk (ignore for gate) |
|----|------------|--------|----------------------|----------------------------------------|
| `designation` | Designation | single-line text | yes | yes |
| `experienceYears` | Experience (in yrs) | single-line text (ranges allowed, e.g. `5–8`) | yes | yes |
| `location` | Location | single-line text | yes | yes |
| `workMode` | WFO/WFH | single-line text | yes | yes |
| `salary` | Salary | single-line text | yes | yes |
| `industryType` | Industry type | single-line text | yes | no |
| `companyType` | Company type | single-line text | yes | no |
| `experienceType` | Experience type | single-line text | yes | no |
| `mustHaves` | Must haves | single-line text (allow wrap) | yes | no |
| `disqualifier` | Disqualifier | single-line text | yes | no |
| `redFlags` | Red flags | single-line text | yes | no |
| `searchStrategy` | Thoughts on search strategy | single-line text | yes | no |

**Salary extras** (not separate coverage items; they belong to `salary`):

| id | Label | Control | Default | Completeness rule |
|----|-------|---------|---------|-------------------|
| `salaryCurrency` | Salary currency | select | placeholder `Select` | **Required** whenever `salary` is non-empty. Continue treats salary as incomplete until currency is chosen. |
| `salaryPeriod` | Salary period | select | `Per year` | Not a blocker (has default). |

**Currency options:** `INR` · `USD` · `EUR` · `GBP` · `SGD`  
**Period options:** `Per year` · `Per month` · `Per hour`

A coverage field is **covered** iff `trim(value) !== ''`. For `salary`, also require `salaryCurrency` selected.

When a missing field is shown, mark its label with a red `*`. All 12 use `*` when they appear as missing, even though the screenshot only starred five. The Continue gate is “all 12 covered,” not the screenshot asterisks.

### 3.2 Select to apply (flags) — optional, one group

| id | Label |
|----|--------|
| `confidential` | Confidential |
| `noUpperSalaryCap` | No upper salary cap |
| `newPosition` | New position |
| `replacementHiring` | Replacement hiring |
| `firstPrinciplesThinker` | 1st principle thinker |
| `aiToolPowerUser` | AI tool power user |
| `anyExperienceWorks` | Any experience works |

All boolean, default `false`. Multiple may be true, including `newPosition` and `replacementHiring` together — do not add mutual exclusion unless product asks later.

**Group is “detected”** if the mock extractor set **at least one** flag to true.  
**Group is “missing”** if Analyse has run and zero flags are true. On that first Analyse, set `flagsPromptShown = true` and render the list. The list then stays for the rest of the visit, even if every box stays unticked (that means none apply). Do not hide it again. If the extractor detected ≥1 flag, never show this block; those flags are edited under Show what we captured.

### 3.3 Capture objects

```ts
type RecordingClip = {
  id: string;
  createdAt: number;
  durationMs: number;
  blobUrl: string; // object URL of audio/webm or audio/mp4
};

type Attachment = {
  id: string;
  name: string;
  mime: string;
  sizeBytes: number;
  kind: "document" | "image" | "audio" | "other";
  blobUrl: string;
};

type FieldState = {
  value: string;
  source: "empty" | "extracted" | "user"; // see rules in §8
};

type JobDraft = {
  transcript: string;
  clips: RecordingClip[];
  attachments: Attachment[];
  fields: Record<CoverageId, FieldState>;
  salaryCurrency: string | null;
  salaryPeriod: "Per year" | "Per month" | "Per hour";
  flags: Record<FlagId, boolean>;
  flagsPromptShown: boolean;
  analysedOnce: boolean;
};
```

`source: "extracted"` = last filled by Analyse while the field was empty.  
`source: "user"` = last changed by the hiring manager (type, clear, or edit in Show captured).  
Re-Analyse never writes a field whose `source` is `"user"` **or** whose value is non-empty.

---

## 4. Layout (top → bottom)

One column on the grey canvas.

1. Title + subtitle (on the grey canvas)  
2. **Composer / capture card** (§5) — the hero  
3. **Hint** (§6) — labelled button on the composer header, not a permanent pill row  
4. **Analyse** — not in the composer; Continue in the page footer runs analysis  
5. **Missing fields** (§8) — only after Analyse, only uncovered fields, in a quieter panel  
6. **Select to apply** (§9) — only if group missing after Analyse  
7. **Show what we captured** (§10) — only after Analyse, only if ≥1 field covered  
8. Continue row  

On viewports `< 720px`: missing-field grid becomes 1 column; composer footer wraps.

---

## 5. Capture block

This is the hero. Everything else recedes until Analyse.

### 5.1 Transcript canvas

- Large textarea, min-height ~140px, same rounded field style as the screenshots (`border-radius` ~999px is **wrong** for this box — use ~12px radius; reserve pills for the 12 small fields).
- Placeholder (exact):  
  `Example: Senior backend engineer, 5–8 years, Bangalore hybrid, ₹45–60L, ownership of payments services, on-call OK...`
- Value = `transcript`. Always editable, including while recording (edits apply to the live buffer; see recording rules).
- No character counter. Soft max for prototype: 20,000 characters; ignore further input with a quiet inline note `Transcript limit reached`.

### 5.2 Composer chrome

The capture surface is a **composer card**: white, 16px radius, 1px `#E2E6E9` border, light shadow. No nested dashed box. The card is the drop target; dashed highlight only while dragging files.

**Header:** left = status (`Talk it through`, or red pulse + timer while recording). Right = **Hint** — bulb icon plus the word `Hint`, outlined 8px-radius button. Thin rule under the row.

**Body:** clips and attachments render as chips at the top of the card, directly above a borderless textarea, min-height ~240px. File errors sit with those chips.

**Footer:** right-aligned **Upload** (paperclip) then **Record** (mic). Same outlined 8px-radius labelled buttons as Hint. While recording, Record becomes **Stop** with a red treatment. `aria-label` is Start / Stop / Continue recording.

### 5.3 Recording behavior (must implement both streams)

On Start / Continue recording:

1. `navigator.mediaDevices.getUserMedia({ audio: true })`  
2. `MediaRecorder` on that stream → chunks  
3. `webkitSpeechRecognition` / `SpeechRecognition` with `continuous: true`, `interimResults: true`, `lang: "en-IN"`  
4. **Interim results** render in the textarea as a grey suffix after the committed transcript (not written to `transcript` yet).  
5. **Final results** append to `transcript` with a leading space if needed.  
6. Timer counts up from 0 for this clip only.

On Stop:

1. Stop recognition and recorder.  
2. Commit any last finals. Drop leftover interim.  
3. Build a `RecordingClip` from the blob. Append to `clips`.  
4. Release the mic track.

**Continue recording** appends to `transcript` (does not wipe). Adds another clip. Insert a newline before the first final of the new clip if transcript does not already end with a newline.

**Typing while recording is allowed.** If the user types, they are editing committed `transcript` only; do not put the caret inside the interim suffix. After a final arrives, append after the current committed text (user edits win if they deleted the tail).

### 5.4 Clips strip

Above the textarea, if `clips.length > 0`:

- Horizontal chips: `Recording 1 · 0:42` with play/pause and a remove `×`  
- Play uses `<audio>` + the blob URL  
- Remove clip: delete chip and revoke object URL. **Do not** auto-delete transcript text (there is no reliable mapping). Optional confirm: `Remove this recording? The transcript text will stay.`

### 5.5 Attachments strip

Accepted `accept`:  
`.pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.mp3,.wav,.m4a,.webm,.ogg`

Max 10 files, 25 MB each. Oversize: toast/inline `“{name}” is over 25 MB.` Skip that file.

Duplicate names: allow; id is unique.

Chip: file name (truncated), size (`1.2 MB`), kind icon, play if audio, `×` to remove.

Helper text always visible once the strip exists (and under the upload button even when empty, in muted 12px):  
`Files are attached to the job. In this prototype they are not read by Analyse — put anything important in the transcript too.`

Drag-and-drop onto the capture block is required. Same validation as the picker. Highlight the canvas border while dragging files.

### 5.6 Capture error states

| Situation | UI |
|-----------|-----|
| Mic permission denied | Banner: `Microphone is blocked. Allow it in the browser, or type instead.` Start recording stays available (retry). |
| No SpeechRecognition in this browser | Banner: `Live transcription isn’t available in this browser. You can still record audio and type the notes.` MediaRecorder may still run. If SpeechRecognition is missing, recording still saves a clip; transcript is manual. |
| Recognition `onerror` (network/no-speech) | Do not wipe transcript. If `no-speech`, stay recording. If fatal (`not-allowed`, `service-not-allowed`), Stop and show the permission banner. |
| getUserMedia fails | Banner: `Couldn’t reach the microphone. Type or attach a file instead.` |

Empty capture is valid until they try Analyse (§7).

---

## 6. Coverage hints

Not a permanent 12-pill row. Coverage is a **Hint** control on the composer header (bulb icon plus the word Hint).

**Before Analyse:** no `0/12 covered` on the page. Opening Hint lists the 12 topics as speaking prompts, not a scoreboard. Clicking an uncovered item is a no-op.

**After Analyse:** the same control shows `{n}/12`. Opening it lists items with covered/missing state. Click a covered item → expand Show what we captured and focus that field. Click a missing item → focus that missing field. Counter also stays in the sticky footer.

Progress after first Analyse still appears in the footer. Missing fields below the composer remain the real checklist.

**Topics (same 12 labels, shown inside Hint):**

1. Designation  
2. Experience (in yrs)  
3. Location  
4. WFO/WFH  
5. Salary  
6. Industry type  
7. Company type  
8. Experience type  
9. Must haves  
10. Disqualifier  
11. Red flags  
12. Thoughts on search strategy  

**Pill states:**

| State | Look (match screenshot) | When |
|-------|-------------------------|------|
| Uncovered | Thin light-grey border, light-grey text, white fill | value empty |
| Covered | Thick near-black border, bold near-black text | value non-empty (and currency if salary) |

Pills are **not** a substitute for filling fields before Analyse — they stay uncovered until Analyse runs **or** the user later fills a missing field.

**Click a covered pill:** expands Show what we captured if collapsed, scrolls to and focuses that field.  
**Click an uncovered pill after Analyse:** scrolls to that missing field and focuses it.  
**Click an uncovered pill before Analyse:** no-op (cursor default).

Do not tick pills live from the transcript while the user is still talking. Ticks happen on Analyse and on subsequent manual input.

---

## 7. Analyse

**Button:** `Analyse`  
Place it in the composer footer, to the left of Record. Quiet outline/text style — Record is the visual primary. Disabled while recording.

**Enabled when:** `trim(transcript) !== ''` **or** `clips.length > 0` **or** `attachments.length > 0`.

If enabled only because of files/clips with empty transcript, still run Analyse; extraction will likely return nothing and all 12 missing fields appear. That is correct.

**Disabled tooltip / title:** `Add a recording, some text, or a file first.`

**On click:**

1. If currently recording, ignore click (button disabled while recording).  
2. Enter `analysing` for **900–1400ms** (fake think time). Button label `Analysing…`, spinner, capture controls disabled.  
3. Run mock extractor (§11) against `transcript` only.  
4. For each coverage field: if `trim(current) === ''` and extractor returned a string, set value and `source: "extracted"`.  
5. For salary extras: if `salary` was empty and extractor found amount, fill `salary`; if `salaryCurrency` is null and extractor found a currency, set it; never overwrite a selected currency. `salaryPeriod` — only set if still default and extractor found a period.  
6. For flags: only set a flag to `true` if currently `false` and extractor detected it. Never set a flag back to `false`.  
7. Set `analysedOnce = true`.  
8. If zero flags are true and `flagsPromptShown` is false, set `flagsPromptShown = true` and render Select to apply.  
9. Exit analysing. Move focus to the first missing field, or to Continue if none missing.

**Analyse with empty transcript but files:** skip extraction, treat all 12 as missing (unless already filled from a previous run).

Do not auto-run Analyse on Stop.

---

## 8. Missing fields (post-Analyse)

Render **only uncovered** coverage fields, in the table order in §3.1.

**Layout:** CSS grid, 3 columns, gap ~12–16px. Below 720px: 1 column.  
Match screenshot: small caps muted labels above pill-shaped inputs (`border-radius` ~999px for these small fields), light grey border, white fill.

`salary` row: the salary text field sits in the grid. Directly **under the whole grid**, left-aligned: `Salary currency` + `Salary period` selects. Show those two selects whenever the salary text field is visible in the missing grid **or** in Show what we captured. If salary has a value but currency is empty, Continue stays disabled and currency is shown.

**Helper above the grid (one line):**  
`We still need the following.`

As the user types a missing field to non-empty:

- That field’s coverage pill flips to covered immediately.  
- The input **stays visible** (do not remove it from under them mid-edit).  
- Set `source: "user"`.  
- If they later clear it, pill flips back to uncovered; field stays in the missing grid.

`Continue` re-checks all 12 on every change.

If after Analyse there are **zero** missing fields:

- Do not render the missing grid.  
- Show success line: `All 12 covered. Review them below if you want, then continue.`

---

## 9. Select to apply

**Show when:** `analysedOnce && flagsPromptShown`.  
Once shown, **stay shown** for this session (user may tick later).

**Do not show when:** Analyse detected ≥1 flag (group not missing). Those flags still live in state and appear under Show what we captured as checked boxes, read/write.

**Look (match screenshot):**

- Title small caps teal/green: `SELECT TO APPLY`  
- Hairline  
- Vertical list, rounded-square checkboxes, labels as in §3.2  
- All start unchecked if the extractor found none

Optional. Continue ignores this block.

---

## 10. Show what we captured

**Show the toggle when:** `analysedOnce && coveredCount >= 1`

**Collapsed (default):** text button, not a primary:  
`Show what we captured ({n})`  
where `n` = covered count.

**Expanded:** button becomes `Hide what we captured`  
Below it, render **covered** fields in the same 3-col pill grid. Include salary extras if salary is covered. Include Select-to-apply checkboxes (all seven, current boolean state) in a compact row under that grid if **any** flag is true **or** the list is already shown in §9 (if §9 is already visible, do not duplicate the list here).

Editing a captured field:

- Updates value live, `source: "user"`.  
- If they clear it: field becomes uncovered, **moves into the missing grid**, disappears from this section on next render, pill goes grey.

---

## 11. Mock extractor (deterministic)

Implement as a pure function:

```ts
extractFromTranscript(text: string) => {
  fields: Partial<Record<CoverageId, string>>;
  salaryCurrency?: "INR" | "USD" | "EUR" | "GBP" | "SGD";
  salaryPeriod?: "Per year" | "Per month" | "Per hour";
  flags: Partial<Record<FlagId, true>>;
}
```

Case-insensitive. First matching rule wins per field. Do not use a network model.

### 11.1 Field rules (apply independently)

**designation**  
- Phrase before the first comma if it contains a role word: `engineer`, `manager`, `designer`, `product`, `lead`, `director`, `recruiter`, `analyst`, `founder`, `scientist`, `consultant`.  
- Else regex: `(senior|staff|principal|junior|lead)?\s*[\w+/ -]*(engineer|manager|designer|recruiter|analyst)`.  
- Example: `Senior backend engineer, 5–8 years...` → `Senior backend engineer`

**experienceYears**  
- `(\d+\s*[–-]\s*\d+)\s*(years|yrs|yr)` → keep the range as spoken, e.g. `5–8`  
- or `(\d+)\s*\+?\s*(years|yrs|yr)`  
- or `(\d+)\s*to\s*(\d+)\s*(years|yrs)`

**location**  
Known list (substring): `Bangalore`, `Bengaluru`, `Mumbai`, `Delhi`, `NCR`, `Hyderabad`, `Pune`, `Chennai`, `Gurgaon`, `Gurugram`, `Remote`, `India`, `Singapore`, `London`, `New York`. Use the first hit, preserving the user’s spelling from the transcript when possible.

**workMode**  
- `hybrid` → `Hybrid`  
- `wfh` / `work from home` / `remote` → `WFH`  
- `wfo` / `work from office` / `on[- ]site` / `office` → `WFO`

**salary**  
- `₹\s*[\d.,]+(?:\s*[–-]\s*[\d.,]+)?\s*(l|lpa|lakh|lakhs)?`  
- `$[\d.,]+k?`  
- `[\d.,]+\s*[–-]\s*[\d.,]+\s*(l|lpa|lakh|lakhs|k)`  
Keep the matched amount string as the value (e.g. `₹45–60L`).

**salaryCurrency**  
- `₹` or `inr` or `lakh` or `lpa` → `INR`  
- `$` or `usd` → `USD`  
- `€` or `eur` → `EUR`  
- `£` or `gbp` → `GBP`  
- `sgd` → `SGD`

**salaryPeriod**  
- `per month` / `monthly` / `/mo` → `Per month`  
- `per hour` / `hourly` → `Per hour`  
- `per year` / `lpa` / `annual` → `Per year`

**industryType**  
Keywords → value:  
`fintech|payments|banking` → `Fintech`  
`saas|b2b` → `B2B SaaS`  
`hr tech|hrtech|recruit` → `HR tech`  
`health` → `Healthcare`  
`e-?commerce` → `E-commerce`  
`ai|llm|machine learning` → `AI`

**companyType**  
`startup|early[- ]stage` → `Startup`  
`mnc|enterprise|large` → `Enterprise`  
`agency|consultancy` → `Agency`  
`product company` → `Product`

**experienceType**  
`full[- ]time` → `Full-time`  
`contract|consultant` → `Contract`  
`intern` → `Internship`  
`founding` → `Founding`

**mustHaves**  
If the transcript contains `must have` / `must-have` / `need someone who` / `ownership of` / `on-call`: take the sentence containing the first hit, trimmed, max 180 chars.  
Example ramble should yield something like `ownership of payments services, on-call OK`.

**disqualifier**  
Sentence containing `disqualify` / `don’t want` / `do not want` / `avoid` / `no one who`.

**redFlags**  
Sentence containing `red flag` / `deal[- ]breaker` / `worried if`.

**searchStrategy**  
Sentence containing `search` / `source` / `look for them` / `boolean` / `linkedin` / `where to find`.

If a rule finds nothing, omit the key (field stays empty).

### 11.2 Flag rules (set `true` only)

| Flag | Triggers (substring) |
|------|----------------------|
| `confidential` | `confidential`, `do not post`, `don't post`, `stealth` |
| `noUpperSalaryCap` | `no upper cap`, `no cap`, `uncapped`, `open salary` |
| `newPosition` | `new position`, `new role`, `net new`, `headcount add` |
| `replacementHiring` | `replacement`, `backfill` |
| `firstPrinciplesThinker` | `first principle`, `1st principle`, `first-principles` |
| `aiToolPowerUser` | `ai tool`, `power user`, `copilot`, `cursor user` |
| `anyExperienceWorks` | `any experience`, `experience flexible`, `years don't matter` |

### 11.3 Golden mock (must pass)

Input transcript:

`Senior backend engineer, 5–8 years, Bangalore hybrid, ₹45–60L, ownership of payments services, on-call OK`

Expected extract:

- designation: `Senior backend engineer`  
- experienceYears: `5–8`  
- location: `Bangalore`  
- workMode: `Hybrid`  
- salary: contains `45` and `60` and rupee or `L`  
- salaryCurrency: `INR`  
- salaryPeriod: `Per year` (via L/LPA heuristic if present; if not detected, leave default)  
- mustHaves: non-empty, includes `payments` or `on-call`  
- flags: none  
- Remaining fields empty  

After this Analyse: missing grid shows the 7 empty fields; coverage `5/12` or `6/12` depending on mustHaves; Select to apply **visible**; Show what we captured **available**.

---

## 12. Continue

**Label:** `Continue`  
**Enabled:** all 12 coverage fields covered (salary includes currency). Flags ignored.

**On click:**

1. Write `cp.jobDraft.v1` to `sessionStorage` (JSON; skip blob URLs or they will break — store clip/attachment **names, durations, mime, sizes** only, plus `transcript`, `fields`, `flags`, salary extras).  
2. Navigate to a **placeholder Step 2** page: title `Step 2`, body `Step 2 is not in scope.`, and a `<pre>` of the JSON payload so QA can inspect. Back link returns to Step 1 and restores non-blob state from sessionStorage (clips/attachments empty after refresh — acceptable).

Do not validate flags. Do not freeze the transcript.

---

## 13. State machine (page)

```
idle_empty
  → (user types | records | uploads) → idle_dirty
idle_dirty
  → Analyse → analysing → reviewed
analysing (controls locked)
reviewed
  → user fills missing / edits captured / continues recording / uploads
  → Analyse → analysing → reviewed
reviewed + all 12 covered → Continue enabled
recording is a parallel flag; cannot Analyse or Continue while recording
```

Reload: if `cp.jobDraft.v1` exists, restore text fields/flags/transcript. Do not restore audio blobs.

---

## 14. Copy sheet (exact strings)

| Place | Copy |
|-------|------|
| Title | Who are you hiring? |
| Subtitle | Talk it through, paste notes, or attach files. We’ll pull out the role details and only ask for what’s missing. |
| Textarea placeholder | Example: Senior backend engineer, 5–8 years, Bangalore hybrid, ₹45–60L, ownership of payments services, on-call OK... |
| Start recording | Start recording (aria-label on the record icon) |
| Stop | Stop recording |
| Continue recording | Continue recording |
| Upload | Upload |
| Attachment helper | Files are attached to the job. In this prototype they are not read by Analyse — put anything important in the transcript too. |
| Coverage control | Hint |
| Counter | {n}/12 (on Hint after Analyse; also in the footer) |
| Analyse | Analyse |
| Analysing | Analysing… |
| Missing helper | We still need the following. |
| All covered | All 12 covered. Review them below if you want, then continue. |
| Select header | SELECT TO APPLY |
| Show captured | Show what we captured ({n}) |
| Hide captured | Hide what we captured |
| Continue | Continue |
| Mic blocked | Microphone is blocked. Allow it in the browser, or type instead. |
| No speech API | Live transcription isn’t available in this browser. You can still record audio and type the notes. |
| Remove clip | Remove this recording? The transcript text will stay. |

Errors: sentence case, what happened + what to do. No “Oops.” No generic “Something went wrong.”

---

## 15. Visual (match the three screenshots)

- Font: Inter (or system UI). Labels: 10–11px, uppercase, tracking, color `#9AA0A6` / `#9A9082`.  
- Body: ~14px, `#1F1B16` or `#14181B`.  
- Composer: white card, 16px radius, 1px `#E2E6E9`, light shadow. Header and footer separated by hairlines. Hint, Upload, and Record share outlined labelled buttons; recording state `#C9372C`. Attachment chips sit above the textarea on `#F4F5F7` pills.  
- Hint items after Analyse: covered = weight 600; missing = muted.  
- Select to apply title: teal `#2C6E6B`.  
- Required asterisk: `#C9372C`.  
- Continue: near-black `#1F1B16`, white text. Analyse is secondary.  
- Do not use Jira blue as the primary action. Page background is `#F4F5F7`.  
- Wizard header: white bar, 1px bottom `#E2E6E9`, 1px vertical rule after the sidenav toggle.  
- Spacing: 8pt grid.

---

## 16. Accessibility

- All icon buttons have `aria-label`.  
- Recording: `aria-live="polite"` on the timer; textarea labelled `Role notes`.  
- Coverage `{n}/12` on Hint is `aria-live="polite"` after Analyse.  
- Esc closes Hint and also stops recording if recording.  
- Analyse/Continue disabled state announced via `aria-disabled`.  
- Focus: after Analyse, first missing field. After Continue, Step 2 heading.  
- Checkboxes are real `<input type="checkbox">`, not click-only divs.  
- File remove and clip remove are keyboard reachable.  
- Do not trap focus. Esc stops recording if recording.

---

## 17. Edge cases (handle all)

| Case | Handling |
|------|----------|
| Analyse during recording | Impossible — Analyse disabled. |
| Stop with 0 seconds / no-speech | Save no clip (or a 0-length clip — prefer **no clip**). Keep any committed transcript. |
| Second Analyse after filling some missing fields | Fill only remaining empty fields from new transcript. Do not overwrite filled ones. Missing grid shrinks. |
| User reveals captured, clears designation | Designation becomes missing; appears in missing grid; pill grey; Continue disables if it was enabled. |
| User edits transcript after Analyse but does not re-Analyse | Captured values unchanged. Expected. |
| User deletes entire transcript after Analyse | Captured values remain. They can still Continue if 12 are filled. Clips may remain. |
| Only files, no text, Analyse | All 12 missing fields appear. Helper about files still visible. |
| Browser is Firefox (weak SpeechRecognition) | No-speech-API banner; recording via MediaRecorder still attempted; typing works. |
| Two tabs | Last `sessionStorage` write wins. Ignore. |
| `newPosition` and `replacementHiring` both ticked | Allowed. |
| `anyExperienceWorks` vs required `experienceYears` | Both allowed. Do not auto-skip experienceYears. |
| `noUpperSalaryCap` vs required salary | Both allowed. Salary can be a minimum or range. |
| Paste huge JD into textarea | Allowed up to 20,000 chars. Analyse runs on that text. |
| Drop folder | Ignore directories; only files. |
| Continue with flags all false | Allowed. |
| Refresh mid-recording | Audio clip in progress is lost. Debounce-save `transcript`, field values, flags, and salary extras to `sessionStorage` every 2s, and also on Analyse and Continue. Restore that text state on load. Clips and attachments do not survive refresh. |
| Object URLs | `revokeObjectURL` on clip/attachment remove and on page unload. |

---

## 18. Out of scope

- Step 2 / Step 3 UI (except the placeholder dump page)  
- Real LLM, embeddings, or document OCR  
- Transcribing uploaded audio files  
- Posting context (my org vs client) — not part of Step 1  
- Inference cards, trip builder, communication tab  
- Auth, notifications, left nav job list  
- Dark mode  

---

## 19. Acceptance checks (QA)

1. Load page: empty composer, placeholder, Hint with no 0/12 badge, Continue disabled, no missing fields.  
2. Type the golden sentence. Analyse. See ~5–6 pills go covered. Missing fields = the rest. Select to apply visible. Continue still disabled.  
3. Fill every missing field including currency. Continue enables.  
4. Expand Show what we captured. Change designation. Value persists. Re-Analyse does not revert it.  
5. Clear location in captured. Location appears under missing; Continue disables.  
6. Start recording (Chrome). Speak. See interim then final text. Stop. Clip plays back. Continue recording appends text and a second clip.  
7. Deny mic. Banner. Typing still works.  
8. Attach a PDF. Chip shows. Analyse still uses transcript only.  
9. Drag-drop a `.txt`. Chip shows.  
10. File >25MB rejected with named message.  
11. Click covered pill → focuses captured field (expand if needed).  
12. Continue → Step 2 placeholder shows JSON with all 12 values and flags.  
13. All 12 extracted on a long custom transcript (type a paragraph covering every field + “confidential”). Missing grid absent; Select to apply **hidden**; Show what we captured shows fields; confidential checked there; Continue enabled.  
14. Keyboard: tab from textarea → record → upload → Analyse → missing fields → Continue.  
15. Mobile width 390px: one column, no horizontal page scroll.

---

## 20. Implementation notes for Cursor

- Scaffold a Vite + React + TypeScript app in the project root (`src/`). Do not add a backend.  
- Speech types: use `window.SpeechRecognition || window.webkitSpeechRecognition`.  
- Keep extractor in `src/extractJobFields.ts` with a vitest or node test for the golden sentence.  
- Do not add a backend.  
- Do not implement Step 2 beyond the placeholder.  
- Match screenshot density; do not invent extra settings, tags, or JD preview panes.

---

## 21. Reference files in this repo

- `reference-materials/saved_resource.html` — vibe boards (do not copy Control Tower chrome; use screenshot language in §15)  
- Screenshots supplied in chat: job fields grid, Select to apply, Coverage checklist  

---

End of spec.
