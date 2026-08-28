# Stylesheets

`src/index.css` is a **barrel** — an ordered `@import` list and nothing else. Every rule lives in a
module here. This replaced a single 4007-line `index.css` that was touched by ~85% of commits and was
the main reason two UI changes could not be made independently.

## Which file do I edit?

| Module | Owns | Rough size |
|---|---|---|
| `base.css` | Reset, `html`/`body`, base typography, `a`, form-control font inheritance | 33 |
| `shell.css` | `.layout`, sidenav (incl. collapsed state), wizard header, `.app-shell`, `.stepper` | 522 |
| `jobs.css` | JobsPage: header, search, table view, card view, `.job-menu`, delete dialog, `.status-loz` | 502 |
| `collect-job.css` | Step 1: page typography (`.page-title`/`.page-sub`), composer, hints popover, follow-up | 350 |
| `controls.css` | **Shared primitives**: `.btn` + variants, `.build-loading` + keyframes, `.chip`, `.pill-input`, `.pill-select`, `.salary-input`, `.tag-input`, `.point-list`, `.choice-row` | 598 |
| `footer-responsive.css` | `.footer`/`.footer-actions` + the app-wide `max-width: 720px` block | 161 |
| `application.css` | ApplicationPage layout, `.app-card`, `.tab-edit-*`, `.context-block`, `.switch`, standard fields | 294 |
| `question-editor.css` | Question block editor: options, grids, scale/rating/file editors, section breaks | 275 |
| `application-preview.css` | Live preview: phone chrome, desktop frame, preview body/fields/submit | 553 |
| `role-detail.css` | Shared role-detail shell used by JobDetailsPage **and** Step3Page: `.preview-layout`, `.preview-sidebar`, publish destinations, `.tabs`, `.jd-cards`, `.req-table` | 323 |
| `role-profile.css` | Role Profile: summary card, `.role-profile-fields`, `.editable-field-*`, `.importance-*`, `.criterion-*` | 386 |

Component-scoped sheets that are imported directly by their component (not via the barrel):
`JobDetailsPage.css`, `ShareComposeModal.css`, `trips/trips.css`.

## Rules

1. **Order in `index.css` is load-bearing.** The modules are contiguous slices of the original file,
   so importing them in listed order reproduces the original stylesheet exactly. Several selectors are
   overridden later at *equal specificity* — reordering changes rendering. Known cases:
   - `.preview-req` — set in the `.preview-job p` group, then fully overridden later, both inside
     `application-preview.css` (keep that file contiguous).
   - `.hints-btn`, `.composer-canvas-mirror` — grouped rule then a narrower override
     (`collect-job.css`).
   - `.type-select` — grouped with `.add-field select`, then overridden; used by *both*
     QuestionEditor and RoleProfilePage.
   - Every rule in `footer-responsive.css`'s 720px block overrides an earlier base rule.
2. **Add new modules at the end** of the barrel unless you have checked the cascade.
3. **Never add rules to `index.css`.**
4. Shared primitives belong in `controls.css`, not in a page module — `.btn` alone is used by 9 files.

## Known cleanup (not done — would change output)

- **No design tokens.** There is no `:root` block and zero `var(--*)`; every color is a literal.
  Recurring: `#1f1b16` (text), `#667085` (muted), `#d0d5dd` (border), `#0f766e` (accent), `#f4f5f7`
  (page bg). A token pass is the natural next step.
- **Dead rules** with no `.tsx` reference: `.capture`/`.canvas` and `.coverage`/`.cov-head`/`.counter`/
  `.pills`/`.analyse-row` (`collect-job.css`, `controls.css`), `.step2` (`footer-responsive.css`),
  `.topbar` (`shell.css`).
- **Misfiled by ownership** (kept in place to preserve source order): `.card` and `.jobs-head` sit in
  `jobs.css` but are used only by SettingsPage; `.lab` is in `controls.css`, also SettingsPage-only.
